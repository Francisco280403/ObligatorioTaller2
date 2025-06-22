// copyAbis.mjs - Script cross-platform para copiar los ABIs del backend al frontend
import { copyFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname);

const contracts = [
  {
    name: 'DaoGovernance',
    src: join(projectRoot, 'backend/artifacts/contracts/DaoGovernance.sol/DaoGovernance.json'),
    dest: join(projectRoot, 'frontend/src/artifacts/DaoGovernance.json'),
  },
  {
    name: 'VotingToken',
    src: join(projectRoot, 'backend/artifacts/contracts/VotingToken.sol/VotingToken.json'),
    dest: join(projectRoot, 'frontend/src/artifacts/VotingToken.json'),
  },
];

for (const contract of contracts) {
  if (!existsSync(contract.src)) {
    console.error(`No se encontró el archivo fuente: ${contract.src}`);
    continue;
  }
  try {
    copyFileSync(contract.src, contract.dest);
    console.log(`Copied ${contract.name} ABI to artifacts.`);
  } catch (err) {
    console.error(`Error copiando ${contract.name}:`, err);
  }
}
