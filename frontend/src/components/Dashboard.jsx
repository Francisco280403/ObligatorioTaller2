import React, { useEffect, useState } from "react";
import { TOKEN_ADDRESS, TOKEN_ABI } from "../constants";
import { ethers } from "ethers";

function Dashboard({ address, provider }) {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (!provider || !address) return;
    const fetchBalance = async () => {
      try {
        const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
        const bal = await token.balanceOf(address);
        setBalance(ethers.utils.formatEther(bal));
      } catch (e) {
        setBalance("-");
      }
    };
    fetchBalance();
  }, [provider, address]);

  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 shadow-lg border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-2">Dashboard</h2>
      <p className="text-gray-200">Bienvenido, <span className="font-mono text-blue-300">{address || "0x..."}</span></p>
      <div className="mt-4 flex gap-4">
        <div className="flex-1 bg-blue-900/60 rounded-lg p-4 text-white text-center">
          <div className="text-lg font-semibold">Tokens</div>
          <div className="text-2xl font-bold">{balance !== null ? balance : "..."}</div>
        </div>
        {/* Aquí podrías mostrar más datos reales, como cantidad de propuestas */}
      </div>
    </div>
  );
}

export default Dashboard;
