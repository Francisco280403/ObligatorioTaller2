// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title VotingToken
/// @notice ERC-20 mintable solo por el contrato DAO
contract VotingToken is ERC20 {
    address public dao;
    constructor(string memory name, string memory symbol, address _dao) ERC20(name, symbol) {
        dao = _dao;
    }

    /// @notice Minta nuevos tokens a `to`
    /// @dev Solo el contrato DAO puede llamar
    function mint(address to, uint256 amount) external {
        require(msg.sender == dao, "Only DAO can mint");
        _mint(to, amount);
    }
}