// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title VotingToken
/// @notice ERC-20 mintable solo por el contrato DAO
contract VotingToken is ERC20 {
    address public dao;
    address public owner;
    constructor(string memory name, string memory symbol, address _dao, address _owner) ERC20(name, symbol) {
        dao = _dao;
        owner = _owner;
    }

    /// @notice Minta nuevos tokens a `to`
    /// @dev Solo el contrato DAO o el owner pueden llamar
    function mint(address to, uint256 amount) external {
        require(msg.sender == dao || msg.sender == owner, "Only DAO or owner can mint");
        _mint(to, amount);
    }
}