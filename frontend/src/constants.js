import daoAbi from './artifacts/DaoGovernance.json';
import tokenAbi from './artifacts/VotingToken.json';

export const API_BASE = "http://localhost:3000";

export const DAO_ADDRESS = process.env.REACT_APP_DAO_CONTRACT_ADDRESS;
export const TOKEN_ADDRESS = process.env.REACT_APP_VOTING_TOKEN_ADDRESS;
export const DAO_ABI = daoAbi.abi;
export const TOKEN_ABI = tokenAbi.abi;

// Estrategias de votación (deben estar en .env)
export const SIMPLE_MAJORITY_STRATEGY = process.env.REACT_APP_SIMPLE_MAJORITY_STRATEGY;
export const FULL_QUORUM_STRATEGY = process.env.REACT_APP_FULL_QUORUM_STRATEGY;
