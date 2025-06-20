import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import OrtTokenModule from "./OrtToken";

export default buildModule("StakeModule", (m) => {
    // Cuenta que realizará el despliegue
    const deployer = m.getAccount(0);

    // Obtenemos el futuro de despliegue de OrtToken
    const { ortToken } = m.useModule(OrtTokenModule);

    // Desplegamos Stake pasando el futuro del token OrtToken
    const stake = m.contract("Stake", [ortToken], {
        from: deployer,
    });

    return { stake };
});
