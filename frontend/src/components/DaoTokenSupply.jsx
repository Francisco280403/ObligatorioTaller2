import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import tokenAbi from "../artifacts/VotingToken.json";
import { DAO_ADDRESS } from "../constants";

function DaoTokenSupply({ provider, refresh, isPanicked }) {
  const [supply, setSupply] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!provider) return;
    const fetchSupply = async () => {
      setLoading(true);
      setError("");
      try {
        const tokenAddress = process.env.REACT_APP_VOTING_TOKEN_ADDRESS;
        const abi = tokenAbi.abi || tokenAbi;
        const token = new ethers.Contract(tokenAddress, abi, provider);
        const bal = await token.balanceOf(DAO_ADDRESS);
        setSupply(ethers.utils.formatUnits(bal, 18));
      } catch (e) {
        setSupply("-");
        setError(e.message || String(e));
      }
      setLoading(false);
    };
    fetchSupply();
  }, [provider, refresh]);

  if (isPanicked) {
    return (
      <div className="bg-white/10 rounded-lg px-4 py-2 text-white text-center border border-white/20 mb-4 text-red-400 font-bold">
        La DAO está en pánico. No se puede consultar el supply.
      </div>
    );
  }

  return (
    <div className="bg-white/10 rounded-lg px-4 py-2 text-white text-center border border-white/20 mb-4">
      <span className="font-semibold">Tokens disponibles para comprar: </span>
      {loading ? "Actualizando..." : supply !== null ? supply : "-"}
      {error && (
        <div className="text-red-400 text-xs mt-2">Error: {error}</div>
      )}
    </div>
  );
}

export default DaoTokenSupply;
