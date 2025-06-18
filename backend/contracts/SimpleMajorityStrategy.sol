// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title IVotingStrategy
/// @notice Interfaz para estrategia de votación
interface IVotingStrategy {
    function isAccepted(
        uint256 forVotes,
        uint256 againstVotes,
        uint256 totalVotingPower
    ) external view returns (bool);
}

/// @title SimpleMajorityStrategy
/// @notice Acepta si votos a favor > votos en contra
contract SimpleMajorityStrategy is IVotingStrategy {
    function isAccepted(
        uint256 forVotes,
        uint256 againstVotes,
        uint256
    ) external pure override returns (bool) {
        return forVotes > againstVotes;
    }
}
