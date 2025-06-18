// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title VotingToken
/// @notice ERC-20 mintable solo por el propietario (DAO)
contract VotingToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol, address initialOwner) ERC20(name, symbol) Ownable(initialOwner) {}

    /// @notice Minta nuevos tokens a `to`
    /// @dev Solo el owner puede llamar
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}