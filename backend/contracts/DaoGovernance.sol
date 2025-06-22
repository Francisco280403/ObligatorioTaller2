// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

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
contract DaoGovernance {
    VotingToken public token;
    IVotingStrategy public votingStrategy;

    uint256 public tokenPriceWei;
    uint256 public lockPeriod;
    uint256 public proposalDuration;
    uint256 public voteUnit;
    uint256 public minStakeVote;
    uint256 public minStakePropose;

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
    mapping(address => uint256) public voteStakeUnlock;
    mapping(address => uint256) public stakePropose;
    mapping(address => uint256) public proposeStakeUnlock;

    event StrategyChanged(address indexed newStrategy);
    event ProposalCreated(uint256 indexed id, address indexed proposer);
    event Voted(uint256 indexed id, address indexed voter, bool support, uint256 weight);
    event Finalized(uint256 indexed id, bool accepted);

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 _tokenPriceWei,
        uint256 _lockPeriod,
        uint256 _proposalDuration,
        uint256 _voteUnit,
        address initialStrategy,
        address _owner
    ) {
        token = new VotingToken(tokenName, tokenSymbol, address(this), _owner);
        tokenPriceWei = _tokenPriceWei;
        lockPeriod = _lockPeriod;
        proposalDuration = _proposalDuration;
        voteUnit = _voteUnit;
        votingStrategy = IVotingStrategy(initialStrategy);
        owner = _owner;
        minStakeVote = 1e18; // default 1 token
        minStakePropose = 10e18; // default 10 tokens
    }

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    // Estrategia dinámica
    function setVotingStrategy(address strategy) external {
        votingStrategy = IVotingStrategy(strategy);
        emit StrategyChanged(strategy);
    }

    // Venta de tokens
    function buyTokens() external payable {
        require(msg.value >= tokenPriceWei, "Insufficient ETH");
        uint256 amount = (msg.value * 1e18) / tokenPriceWei;
        uint256 daoBalance = token.balanceOf(address(this));
        if (amount > daoBalance) {
            amount = daoBalance;
        }
        require(amount > 0, "No hay tokens disponibles para comprar");
        token.transfer(msg.sender, amount);
    }

    function mintTokens(uint256 amount) external onlyOwner {
        token.mint(address(this), amount);
    }

    // Staking (opcional, solo para votar)
    function stakeForVote(uint256 amount) external {
        require(amount >= minStakeVote, "Minimo para votar");
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        stakeVotes[msg.sender] += amount;
        voteStakeUnlock[msg.sender] = block.timestamp + lockPeriod;
    }

    function unstakeVotes() external {
        require(block.timestamp >= voteStakeUnlock[msg.sender], "Lock period not passed");
        uint256 amount = stakeVotes[msg.sender];
        stakeVotes[msg.sender] = 0;
        require(token.transfer(msg.sender, amount), "Transfer failed");
    }

    // Staking para proponer
    function stakeForProposal(uint256 amount) external {
        require(amount >= minStakePropose, "Minimo para proponer");
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        stakePropose[msg.sender] += amount;
        proposeStakeUnlock[msg.sender] = block.timestamp + lockPeriod;
    }

    function unstakeProposals() external {
        require(block.timestamp >= proposeStakeUnlock[msg.sender], "Lock period not passed");
        uint256 amount = stakePropose[msg.sender];
        stakePropose[msg.sender] = 0;
        require(token.transfer(msg.sender, amount), "Transfer failed");
    }

    // Gobernanza
    function createProposal(string memory title, string memory description) external {
        require(stakePropose[msg.sender] >= minStakePropose, "Minimo para proponer");
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

    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp < p.end, "Voting period ended");
        require(!p.hasVoted[msg.sender], "Already voted");
        uint256 weight = stakeVotes[msg.sender] / voteUnit;
        require(weight > 0, "No staked tokens to vote");
        if (support) p.forVotes += weight;
        else p.againstVotes += weight;
        p.hasVoted[msg.sender] = true;
        emit Voted(proposalId, msg.sender, support, weight);
    }

    function finalizeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp >= p.end, "Voting still active");
        require(!p.executed, "Already finalized");
        uint256 totalPower = token.totalSupply() / voteUnit;
        bool accepted = votingStrategy.isAccepted(p.forVotes, p.againstVotes, totalPower);
        p.executed = true;
        emit Finalized(proposalId, accepted);
    }

    // Setters de parámetros soloOwner
    function setTokenPriceWei(uint256 _tokenPriceWei) external onlyOwner {
        tokenPriceWei = _tokenPriceWei;
    }
    function setLockPeriod(uint256 _lockPeriod) external onlyOwner {
        lockPeriod = _lockPeriod;
    }
    function setProposalDuration(uint256 _proposalDuration) external onlyOwner {
        proposalDuration = _proposalDuration;
    }
    function setVoteUnit(uint256 _voteUnit) external onlyOwner {
        voteUnit = _voteUnit;
    }
    function setMinStakeVote(uint256 _minStakeVote) external onlyOwner {
        minStakeVote = _minStakeVote;
    }
    function setMinStakePropose(uint256 _minStakePropose) external onlyOwner {
        minStakePropose = _minStakePropose;
    }
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Nuevo owner invalido");
        owner = newOwner;
    }

    // Getter público para la cantidad de propuestas
    function proposalCount() public view returns (uint256) {
        return _proposalCount;
    }
}
