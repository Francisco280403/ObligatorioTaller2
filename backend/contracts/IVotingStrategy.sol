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
