import React, { useState } from "react";
import { DAO_ADDRESS, DAO_ABI } from "../constants";
import { ethers } from "ethers";

function BuyTokens({ provider }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleBuy = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const signer = provider.getSigner();
      const dao = new ethers.Contract(DAO_ADDRESS, DAO_ABI, signer);
      // Suponiendo que 1 token = 1 ETH (ajusta según tu lógica)
      const value = ethers.utils.parseEther(amount);
      const tx = await dao.buyTokens({ value });
      await tx.wait();
      setSuccess("Compra exitosa");
      setAmount("");
    } catch (e) {
      setError(e.reason || e.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 shadow-lg border border-white/20">
      <h2 className="text-xl font-bold text-white mb-2">Comprar Tokens</h2>
      <form className="flex flex-col gap-3" onSubmit={handleBuy}>
        <input
          type="number"
          min="0.0001"
          step="any"
          placeholder="Cantidad (ETH)"
          className="rounded-lg px-4 py-2 bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow hover:scale-105 transition-transform" disabled={loading || !amount}>
          {loading ? "Comprando..." : "Comprar"}
        </button>
        {error && <div className="text-red-400 text-center">{error}</div>}
        {success && <div className="text-green-400 text-center">{success}</div>}
      </form>
    </div>
  );
}

export default BuyTokens;
