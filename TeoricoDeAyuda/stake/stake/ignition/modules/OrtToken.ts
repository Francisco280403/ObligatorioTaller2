import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TOTAL_SUPPLY = 1000000000;

const TokenModule = buildModule("TokenModule", (m) => {
    const totalSupply = m.getParameter("totalSupply", TOTAL_SUPPLY);
    const ortToken = m.contract("OrtToken", [totalSupply]);
    return { ortToken };
});

export default TokenModule;
