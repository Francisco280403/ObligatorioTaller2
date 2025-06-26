// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../IVotingStrategy.sol";

/// @dev Acepta la propuesta si forVotes > againstVotes
contract DummyStrategy is IVotingStrategy {
    function isAccepted(
        uint256 forVotes,
        uint256 againstVotes,
        uint256 /* totalVotingPower */
    ) external pure returns (bool) {
        return forVotes > againstVotes;
    }
}
