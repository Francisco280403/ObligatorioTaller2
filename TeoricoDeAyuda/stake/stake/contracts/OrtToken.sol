// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract OrtToken is ERC20 {

    /**
     * @dev Se asignan todos los tokens a msg.sender
     * @param initialSupply El initialSupply a utilizar por los tokens en Weis
     */
    constructor(uint256 initialSupply) ERC20("OrtToken", "ORT") {
        _mint(msg.sender, initialSupply);
    }

}
