const hre = require("hardhat");

async function main() {
  // Cambia esta dirección por la de tu cuenta de Metamask
  const destino = "0x4014a907f200C502896Cd6c3A6a5eE14C760FbE0";
  const [owner] = await hre.ethers.getSigners();

  console.log("Enviando 10 ETH de test a:", destino);
  const tx = await owner.sendTransaction({
    to: destino,
    value: hre.ethers.utils.parseEther("10.0")
  });
  await tx.wait();
  console.log("ETH enviado!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
