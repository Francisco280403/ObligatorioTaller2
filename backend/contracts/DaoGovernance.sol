// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./VotingToken.sol";

/// @title IVotingStrategy
interface IVotingStrategy {
    function isAccepted(
        uint256 forVotes,
        uint256 againstVotes,
        uint256 totalVotingPower
    ) external view returns (bool);
}

/// @title DaoGovernance
/// @notice Contrato principal de la DAO
contract DaoGovernance is Ownable {
    VotingToken public token;
    IVotingStrategy public votingStrategy;
    address public panicMultisig;
    bool public paused;

    uint256 public tokenPriceWei;
    uint256 public stakeToVote;
    uint256 public stakeToPropose;
    uint256 public lockPeriod;
    uint256 public proposalDuration;
    uint256 public voteUnit;

    uint256 private _proposalCount;

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 start;
        uint256 end;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public stakeVotes;
    mapping(address => uint256) public stakeProposals;
    mapping(address => uint256) public voteStakeUnlock;
    mapping(address => uint256) public proposeStakeUnlock;

    event PanicActivated();
    event TranquilityActivated();
    event StrategyChanged(address indexed newStrategy);
    event ProposalCreated(uint256 indexed id, address indexed proposer);
    event Voted(uint256 indexed id, address indexed voter, bool support, uint256 weight);
    event Finalized(uint256 indexed id, bool accepted);

    modifier notPaused() {
        require(!paused, "DAO is paused");
        _;
    }

    modifier onlyPanicMultisig() {
        require(msg.sender == panicMultisig, "Only panic multisig");
        _;
    }

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        address _panicMultisig,
        uint256 _tokenPriceWei,
        uint256 _stakeToVote,
        uint256 _stakeToPropose,
        uint256 _lockPeriod,
        uint256 _proposalDuration,
        uint256 _voteUnit,
        address initialStrategy
    ) Ownable(msg.sender) {
        token = new VotingToken(tokenName, tokenSymbol, address(this)); // Cambiado: el owner del token es el contrato DAO
        panicMultisig = _panicMultisig;
        tokenPriceWei = _tokenPriceWei;
        stakeToVote = _stakeToVote;
        stakeToPropose = _stakeToPropose;
        lockPeriod = _lockPeriod;
        proposalDuration = _proposalDuration;
        voteUnit = _voteUnit;
        votingStrategy = IVotingStrategy(initialStrategy);
    }

    // Panic / Tranquility
    function activatePanic() external onlyOwner {
        paused = true;
        emit PanicActivated();
    }

    function tranquility() external onlyPanicMultisig {
        paused = false;
        emit TranquilityActivated();
    }

    // Estrategia dinámica
    function setVotingStrategy(address strategy) external onlyOwner notPaused {
        votingStrategy = IVotingStrategy(strategy);
        emit StrategyChanged(strategy);
    }

    // Venta de tokens
    function buyTokens() external payable notPaused {
        require(msg.value >= tokenPriceWei, "Insufficient ETH");
        uint256 amount = msg.value / tokenPriceWei;
        token.mint(msg.sender, amount);
    }

    // Staking
    function stakeForVote(uint256 amount) external notPaused {
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        stakeVotes[msg.sender] += amount;
        voteStakeUnlock[msg.sender] = block.timestamp + lockPeriod;
    }

    function stakeForProposal(uint256 amount) external notPaused {
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        stakeProposals[msg.sender] += amount;
        proposeStakeUnlock[msg.sender] = block.timestamp + lockPeriod;
    }

    function unstakeVotes() external {
        require(block.timestamp >= voteStakeUnlock[msg.sender], "Lock period not passed");
        uint256 amount = stakeVotes[msg.sender];
        stakeVotes[msg.sender] = 0;
        require(token.transfer(msg.sender, amount), "Transfer failed");
    }

    function unstakeProposals() external {
        require(block.timestamp >= proposeStakeUnlock[msg.sender], "Lock period not passed");
        uint256 amount = stakeProposals[msg.sender];
        stakeProposals[msg.sender] = 0;
        require(token.transfer(msg.sender, amount), "Transfer failed");
    }

    // Gobernanza
    function createProposal(string memory title, string memory description) external notPaused {
        require(stakeProposals[msg.sender] >= stakeToPropose, "Insufficient stake to propose");
        _proposalCount++;
        Proposal storage p = proposals[_proposalCount];
        p.id = _proposalCount;
        p.proposer = msg.sender;
        p.title = title;
        p.description = description;
        p.start = block.timestamp;
        p.end = block.timestamp + proposalDuration;
        emit ProposalCreated(p.id, msg.sender);
    }

    function vote(uint256 proposalId, bool support) external notPaused {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp < p.end, "Voting period ended");
        require(!p.hasVoted[msg.sender], "Already voted");
        require(stakeVotes[msg.sender] >= stakeToVote, "Insufficient stake to vote");
        uint256 weight = stakeVotes[msg.sender] / voteUnit;
        if (support) p.forVotes += weight;
        else p.againstVotes += weight;
        p.hasVoted[msg.sender] = true;
        emit Voted(proposalId, msg.sender, support, weight);
    }

    function finalizeProposal(uint256 proposalId) external notPaused {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp >= p.end, "Voting still active");
        require(!p.executed, "Already finalized");
        uint256 totalPower = token.totalSupply() / voteUnit;
        bool accepted = votingStrategy.isAccepted(p.forVotes, p.againstVotes, totalPower);
        p.executed = true;
        emit Finalized(proposalId, accepted);
    }

    // Administración
    function setParameters(
        uint256 _tokenPriceWei,
        uint256 _stakeToVote,
        uint256 _stakeToPropose,
        uint256 _lockPeriod,
        uint256 _proposalDuration,
        uint256 _voteUnit
    ) external onlyOwner notPaused {
        tokenPriceWei = _tokenPriceWei;
        stakeToVote = _stakeToVote;
        stakeToPropose = _stakeToPropose;
        lockPeriod = _lockPeriod;
        proposalDuration = _proposalDuration;
        voteUnit = _voteUnit;
    }

    function transferDaoOwnership(address newOwner) external onlyOwner {
        transferOwnership(newOwner);
    }

    function setPanicMultisig(address newMultisig) external onlyOwner {
        panicMultisig = newMultisig;
    }

    // Getter público para la cantidad de propuestas
    function proposalCount() public view returns (uint256) {
        return _proposalCount;
    }
}
