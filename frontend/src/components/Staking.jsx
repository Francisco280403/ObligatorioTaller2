import React, { useState } from "react";
import { API_BASE } from "../constants";
import { ethers } from "ethers";

function Staking({ address }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Permitir elegir tipo de staking: para votar o para proponer
  const [stakeType, setStakeType] = useState("vote");

  const handleStake = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const endpoint = stakeType === "vote" ? "stake/vote" : "stake/propose";
      // Convertir a wei
      const amountWei = ethers.utils.parseUnits(amount, 18).toString();
      const res = await fetch(`${API_BASE}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, amount: amountWei }),
      });
      if (!res.ok) throw new Error("Error en el staking");
      setSuccess("Staking exitoso");
      setAmount("");
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleUnstake = async (type) => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const endpoint = type === "vote" ? "unstake/vote" : "unstake/propose";
      const res = await fetch(`${API_BASE}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      if (!res.ok) throw new Error("Error al quitar stake");
      setSuccess("Stake quitado exitosamente");
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 shadow-lg border border-white/20">
      <h2 className="text-xl font-bold text-white mb-2">Staking</h2>
      <form className="flex flex-col gap-3" onSubmit={handleStake}>
        <select
          className="rounded-lg px-4 py-2 bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
          value={stakeType}
          onChange={(e) => setStakeType(e.target.value)}
          disabled={loading}
        >
          <option value="vote">Staking para Votar</option>
          <option value="propose">Staking para Proponer</option>
        </select>
        <input
          type="number"
          min="0.0001"
          step="any"
          placeholder="Tokens a stakear"
          className="rounded-lg px-4 py-2 bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="py-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold shadow hover:scale-105 transition-transform"
          disabled={loading || !amount}
        >
          {loading ? "Stakeando..." : "Stakear"}
        </button>
        {error && <div className="text-red-400 text-center">{error}</div>}
        {success && <div className="text-green-400 text-center">{success}</div>}
      </form>
      <div className="flex gap-2 mt-4">
        <button
          className="flex-1 py-2 rounded-lg bg-red-500 text-white font-semibold shadow hover:scale-105 transition-transform disabled:opacity-50"
          disabled={loading}
          onClick={() => handleUnstake("vote")}
        >
          Quitar stake para votar
        </button>
        <button
          className="flex-1 py-2 rounded-lg bg-red-700 text-white font-semibold shadow hover:scale-105 transition-transform disabled:opacity-50"
          disabled={loading}
          onClick={() => handleUnstake("propose")}
        >
          Quitar stake para proponer
        </button>
      </div>
    </div>
  );
}

export default Staking;
