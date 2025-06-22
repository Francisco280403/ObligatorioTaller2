const hre = require("hardhat");

async function main() {
  // Usa la dirección del contrato desde .env o ponla manualmente si hace falta
  const daoAddress = process.env.DAO_CONTRACT_ADDRESS || "DIRECCION_DEL_CONTRATO";
  const DaoGovernance = await hre.ethers.getContractAt("DaoGovernance", daoAddress);

  // Usa la cuenta 0 (el owner por defecto en Hardhat)
  const [owner] = await hre.ethers.getSigners();

  console.log("Owner:", owner.address);

  // Llama a la función panico()
  const tx = await DaoGovernance.connect(owner).panico();
  await tx.wait();

  console.log("¡DAO en pánico activado!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
