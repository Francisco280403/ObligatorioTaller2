// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Stake {

    IERC20 public immutable token;

    struct StakeRecord {
        uint256 balance;
        uint256 lastDeposit;
    }

    mapping(address => StakeRecord) public stakes;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);

    /// @param _tokenAddress address del token que queremos utilizar para staking
    /// @dev El token debe implementar la interfaz IERC20
    constructor(address _tokenAddress) {
        require(_tokenAddress != address(0), "La direccion del token no puede ser vacia");
        token = IERC20(_tokenAddress);
    }

    /// @notice Stake `amount` tokens. El usuario debe invocar 'approve' en el token primero
    /// @param amount numero de tokens a stakear
    function stake(uint256 amount) external {
        require(amount > 0, "El monto debe ser mayor a 0");

        // Mueve los tokens desde el sender al contrato
        bool ok = token.transferFrom(msg.sender, address(this), amount);
        require(ok, "Error en token transfer");

        // Actualizar el registro de stake
        StakeRecord storage rec = stakes[msg.sender];
        rec.balance += amount;
        rec.lastDeposit = block.timestamp;

        // Emitir evento de stake   
        emit Staked(msg.sender, amount);
    }

    /// @notice Unstake todos los tokens, solo se permite 5 días luego del ultimo deposito
    function unstake() external {
        StakeRecord storage rec = stakes[msg.sender];
        uint256 bal = rec.balance;
        require(bal > 0, "El usuario no tiene tokens staked");
        require(block.timestamp >= rec.lastDeposit + 5 days, "No se puede unstake antes de 5 dias del ultimo deposito");

        // Resetea los valores
        rec.balance = 0;
        rec.lastDeposit = 0;

        // envia los tokens al usuario
        // Nota: En un contrato real, deberías considerar usar 'safeTransfer' de OpenZeppelin para evitar problemas de seguridad
        bool ok = token.transfer(msg.sender, bal);
        require(ok, "Token transfer failed");

        // Emitir evento de unstake
        emit Unstaked(msg.sender, bal);
    }
    
}
