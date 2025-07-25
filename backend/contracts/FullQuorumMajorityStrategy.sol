// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title IVotingStrategy
interface IVotingStrategy {
    function isAccepted(
        uint256 forVotes,
        uint256 againstVotes,
        uint256 totalVotingPower
    ) external view returns (bool);
}

/// @title FullQuorumMajorityStrategy
/// @notice Acepta si votos a favor > 50% del total de poder
contract FullQuorumMajorityStrategy is IVotingStrategy {
    function isAccepted(
        uint256 forVotes,
        uint256,
        uint256 totalVotingPower
    ) external pure override returns (bool) {
        return forVotes * 2 > totalVotingPower;
    }
}
