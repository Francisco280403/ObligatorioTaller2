import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import tokenAbi from "../artifacts/VotingToken.json";
import daoAbi from "../artifacts/DaoGovernance.json";
import { DAO_ADDRESS } from "../constants";

function TokenBalance({ provider, address, refresh, isPanicked }) {
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

  if (isPanicked) {
    return <div className="bg-white/10 rounded-xl p-6 shadow-lg border border-white/20 text-center text-red-400 font-bold">La DAO está en pánico. No se puede consultar el balance ni el stake.</div>;
  }

  return (
    <div className="bg-white/10 rounded-xl p-6 shadow-lg border border-white/20">
      <h2 className="text-xl font-bold text-white mb-2">Tu Balance y Stake</h2>
      <div className="text-white">Balance: <b>{balance !== null ? balance : '-'}</b> tokens</div>
      <div className="text-white">Stake para votar: <b>{stakeVote !== null ? stakeVote : '-'}</b> tokens</div>
      <div className="text-white">Stake para proponer: <b>{stakePropose !== null ? stakePropose : '-'}</b> tokens</div>
      {error && <div className="text-red-400 mt-2">{error}</div>}
    </div>
  );
}

export default TokenBalance;
