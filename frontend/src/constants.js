import daoAbi from './artifacts/DaoGovernance.json';
import tokenAbi from './artifacts/VotingToken.json';

export const DAO_ADDRESS = process.env.REACT_APP_DAO_ADDRESS;
export const TOKEN_ADDRESS = process.env.REACT_APP_TOKEN_ADDRESS;
export const DAO_ABI = daoAbi.abi;
export const TOKEN_ABI = tokenAbi.abi;
