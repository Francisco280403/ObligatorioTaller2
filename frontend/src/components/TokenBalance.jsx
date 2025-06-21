import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import tokenAbi from "../artifacts/VotingToken.json";
import daoAbi from "../artifacts/DaoGovernance.json";
import { DAO_ADDRESS } from "../constants";

function TokenBalance({ provider, address }) {
  const [balance, setBalance] = useState(null);
  const [stakeVote, setStakeVote] = useState(null);
  const [stakePropose, setStakePropose] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
  }, [provider, address]);

  return (
    <div className="bg-white/10 rounded-lg px-4 py-2 text-white text-center border border-white/20">
      <span className="font-semibold">Tus tokens disponibles: </span>
      {loading ? "Cargando..." : balance !== null ? balance : "-"}
      <br />
      <span className="font-semibold">Stake para votar: </span>
      {loading ? "Cargando..." : stakeVote !== null ? stakeVote : "-"}
      <br />
      <span className="font-semibold">Stake para proponer: </span>
      {loading ? "Cargando..." : stakePropose !== null ? stakePropose : "-"}
      {error && (
        <div className="text-red-400 text-xs mt-2">Error: {error}</div>
      )}
    </div>
  );
}

export default TokenBalance;
