# ObligatorioTaller2

## Pasos para levantar el sistema

1. Clona el repositorio:

   git clone https://github.com/dao-governance-ort/obligatorio-2025
   cd obligatorio-2025

2. Instala dependencias del backend:

   npm install

3. Compila los contratos:

   npx hardhat compile

4. (Opcional) Ejecuta los tests y cobertura:

   npx hardhat test
   npx hardhat coverage

5. Levanta un nodo local de Hardhat:

   npx hardhat node

6. En otra terminal, desplega los contratos en la red local:

   npx hardhat run scripts/deploy.js --network localhost

7. Parate en el frontend e instala dependencias:

   cd frontend
   npm install

8. Levanta el frontend:

   npm run dev

9. Abri http://localhost:3000 para interactuar con la DAO.

Asegurate tener los archivos `.env` correctamente configurados antes de levantar.