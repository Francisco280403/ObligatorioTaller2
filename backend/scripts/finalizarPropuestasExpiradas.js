const hre = require("hardhat");
require("dotenv").config();

async function main() {
  // Dirección del contrato DAO
  const daoAddress = process.env.DAO_CONTRACT_ADDRESS || "DIRECCION_DEL_CONTRATO_DAO";
  const DaoGovernance = await hre.ethers.getContractFactory("DaoGovernance");
  const dao = DaoGovernance.attach(daoAddress);
  const [owner] = await hre.ethers.getSigners();

  // Obtener cantidad de propuestas
  const count = await dao.proposalCount();
  let finalizadas = 0;

  for (let i = 1; i <= count; i++) {
    const p = await dao.proposals(i);
    // Si ya está ejecutada, saltar
    if (p.executed) continue;
    // Si ya expiró el tiempo
    const now = Math.floor(Date.now() / 1000);
    if (p.end.toNumber() < now) {
      try {
        console.log(`Finalizando propuesta #${i}...`);
        const tx = await dao.connect(owner).finalizeProposal(i);
        await tx.wait();
        console.log(`Propuesta #${i} finalizada.`);
        finalizadas++;
      } catch (e) {
        console.error(`Error al finalizar propuesta #${i}:`, e.message);
      }
    }
  }
  if (finalizadas === 0) {
    console.log("No hay propuestas expiradas para finalizar.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
