import React, { useState } from "react";
import { API_BASE } from "../constants";
import { ethers } from "ethers";

function Staking({ address, onStakeChange, isPanicked }) {
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
      if (onStakeChange) onStakeChange();
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
      if (onStakeChange) onStakeChange();
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  if (isPanicked) {
    return (
      <div className="bg-white/10 rounded-xl p-6 shadow-lg border border-white/20 text-center text-red-400 font-bold">
        La DAO está en pánico. No se puede hacer staking.
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 shadow-lg border border-white/20">
      <h2 className="text-xl font-bold text-white mb-2">Staking</h2>
      <form className="flex flex-col gap-3" onSubmit={handleStake}>
        <label className="text-white">
          Cantidad de tokens a stakear:
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-lg px-4 py-2 bg-white/20 text-white w-full"
            disabled={loading}
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            className={`py-2 px-4 rounded-lg ${
              stakeType === "vote" ? "bg-blue-500" : "bg-gray-500"
            } text-white font-semibold`}
            onClick={() => setStakeType("vote")}
          >
            Para votar
          </button>
          <button
            type="button"
            className={`py-2 px-4 rounded-lg ${
              stakeType === "propose" ? "bg-pink-500" : "bg-gray-500"
            } text-white font-semibold`}
            onClick={() => setStakeType("propose")}
          >
            Para proponer
          </button>
        </div>
        <button
          type="submit"
          className="py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold shadow hover:scale-105 transition-transform"
          disabled={loading || !amount}
        >
          {loading ? "Stakeando..." : "Stakear"}
        </button>
        <button
          type="button"
          className="py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold shadow hover:scale-105 transition-transform"
          onClick={() => handleUnstake(stakeType)}
          disabled={loading}
        >
          Quitar stake
        </button>
        {error && (
          <div className="text-red-400 mt-2 text-center">{error}</div>
        )}
        {success && (
          <div className="text-green-400 mt-2 text-center">{success}</div>
        )}
      </form>
    </div>
  );
}

export default Staking;
