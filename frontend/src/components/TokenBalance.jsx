import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import tokenAbi from "../artifacts/VotingToken.json";
import daoAbi from "../artifacts/DaoGovernance.json";
import { DAO_ADDRESS } from "../constants";

function TokenBalance({ provider, address, refresh }) {
  const [balance, setBalance] = useState(null);
  const [stakeVote, setStakeVote] = useState(null);
  const [stakePropose, setStakePropose] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Mostrar tiempo restante para quitar stake
  const [unlockVote, setUnlockVote] = useState(null);
  const [unlockPropose, setUnlockPropose] = useState(null);

  useEffect(() => {
    if (!provider || !address) return;
    const fetchBalance = async () => {
      setLoading(true);
      setError("");
      try {
        const tokenAddress = process.env.REACT_APP_VOTING_TOKEN_ADDRESS;
        const abi = tokenAbi.abi || tokenAbi;
        const token = new ethers.Contract(tokenAddress, abi, provider);
        const bal = await token.balanceOf(address);
        setBalance(ethers.utils.formatUnits(bal, 18));

        // Consultar stake para votar y proponer
        const dao = new ethers.Contract(DAO_ADDRESS, daoAbi.abi || daoAbi, provider);
        const stakeVoteRaw = await dao.stakeVotes(address);
        setStakeVote(ethers.utils.formatUnits(stakeVoteRaw, 18));
        const stakeProposeRaw = await dao.stakePropose(address);
        setStakePropose(ethers.utils.formatUnits(stakeProposeRaw, 18));
      } catch (e) {
        setBalance("-");
        setStakeVote("-");
        setStakePropose("-");
        setError(e.message || String(e));
        console.error("TokenBalance error:", e);
      }
      setLoading(false);
    };
    fetchBalance();
  }, [provider, address, refresh]);

  useEffect(() => {
    if (!address || !provider) return;
    const fetchUnlocks = async () => {
      try {
        const dao = new ethers.Contract(DAO_ADDRESS, daoAbi.abi || daoAbi, provider);
        const unlockVoteRaw = await dao.voteStakeUnlock(address);
        setUnlockVote(unlockVoteRaw.toNumber());
        const unlockProposeRaw = await dao.proposeStakeUnlock(address);
        setUnlockPropose(unlockProposeRaw.toNumber());
      } catch {}
    };
    fetchUnlocks();
  }, [address, provider, stakeVote, stakePropose]);

  return (
    <div className="bg-white/10 rounded-lg px-4 py-2 text-white text-center border border-white/20">
      <span className="font-semibold">Tus tokens disponibles: </span>
      {loading ? "Actualizando..." : balance !== null ? balance : "-"}
      <br />
      <span className="font-semibold">Stake para votar: </span>
      {loading ? "Actualizando..." : stakeVote !== null ? stakeVote : "-"}
      {unlockVote && unlockVote * 1000 > Date.now() && (
        <div className="text-yellow-300 text-xs">Tiempo restante para quitar stake: {Math.ceil((unlockVote * 1000 - Date.now()) / 60000)} min</div>
      )}
      <br />
      <span className="font-semibold">Stake para proponer: </span>
      {loading ? "Actualizando..." : stakePropose !== null ? stakePropose : "-"}
      {unlockPropose && unlockPropose * 1000 > Date.now() && (
        <div className="text-yellow-300 text-xs">Tiempo restante para quitar stake: {Math.ceil((unlockPropose * 1000 - Date.now()) / 60000)} min</div>
      )}
      {error && (
        <div className="text-red-400 text-xs mt-2">Error: {error}</div>
      )}
    </div>
  );
}

export default TokenBalance;
