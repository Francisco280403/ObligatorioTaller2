// Script para copiar los JSON de los contratos a frontend/src/artifacts
const fs = require('fs');
const path = require('path');

// Calcula la raíz del proyecto (dos niveles arriba de este script)
const projectRoot = path.resolve(__dirname, '../..');

const contracts = [
  {
    name: 'DaoGovernance',
    src: path.join(projectRoot, 'backend/artifacts/contracts/DaoGovernance.sol/DaoGovernance.json'),
    dest: path.join(projectRoot, 'frontend/src/artifacts/DaoGovernance.json'),
  },
  {
    name: 'VotingToken',
    src: path.join(projectRoot, 'backend/artifacts/contracts/VotingToken.sol/VotingToken.json'),
    dest: path.join(projectRoot, 'frontend/src/artifacts/VotingToken.json'),
  },
];

contracts.forEach(contract => {
  if (!fs.existsSync(contract.src)) {
    console.error(`No se encontró el archivo fuente: ${contract.src}`);
    return;
  }
  fs.copyFileSync(contract.src, contract.dest);
  console.log(`Copied ${contract.name} ABI to artifacts.`);
});
