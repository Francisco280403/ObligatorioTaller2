import React, { useState } from "react";
import { ethers } from "ethers";
import daoAbi from "../artifacts/DaoGovernance.json";

function BuyTokens({ provider, onBuy }) {
  const [amount, setAmount] = useState(""); // tokens a comprar
  const [ethToSend, setEthToSend] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Calcula el valor en ETH cada vez que cambia la cantidad
  const handleAmountChange = async (e) => {
    const value = e.target.value;
    setAmount(value);
    setError("");
    setSuccess("");
    setEthToSend("");
    if (!value || isNaN(value) || Number(value) <= 0) return;
    try {
      if (!provider) return;
      const daoAddress = process.env.REACT_APP_DAO_CONTRACT_ADDRESS;
      const abi = daoAbi.abi || daoAbi;
      const dao = new ethers.Contract(daoAddress, abi, provider);
      const tokenPriceWei = await dao.tokenPriceWei();
      // ETH a enviar = tokens * precio / 1e18
      const totalWei = ethers.BigNumber.from(tokenPriceWei).mul(
        ethers.BigNumber.from(Math.floor(Number(value)))
      );
      setEthToSend(ethers.utils.formatEther(totalWei));
    } catch (e) {
      setEthToSend("");
    }
  };

  const handleBuy = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (!provider) throw new Error("Conectá tu wallet primero");
      const signer = provider.getSigner();
      const daoAddress = process.env.REACT_APP_DAO_CONTRACT_ADDRESS;
      if (!daoAddress || !ethers.utils.isAddress(daoAddress)) {
        throw new Error("Dirección del contrato DAO no definida o inválida");
      }
      const abi = daoAbi.abi || daoAbi;
      const dao = new ethers.Contract(daoAddress, abi, signer);
      const tokenPriceWei = await dao.tokenPriceWei();
      if (!amount || isNaN(amount) || Number(amount) <= 0) {
        throw new Error("Cantidad inválida");
      }
      const totalValue = ethers.BigNumber.from(tokenPriceWei).mul(
        ethers.BigNumber.from(Math.floor(Number(amount)))
      );
      try {
        const tx = await dao.buyTokens({ value: totalValue });
        await tx.wait();
        setSuccess("Compra exitosa");
        // Esperar 1 segundo antes de refrescar el supply
        setTimeout(() => { if (onBuy) onBuy(); }, 1000);
        setAmount("");
        setEthToSend("");
      } catch (err) {
        if (err && err.message && err.message.includes("No hay tokens disponibles para comprar")) {
          setError("No hay tokens disponibles en la DAO");
        } else {
          setError(err.message || "Error al comprar tokens");
        }
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 shadow-lg border border-white/20">
      <h2 className="text-xl font-bold text-white mb-2">Comprar Tokens</h2>
      <form className="flex flex-col gap-3" onSubmit={handleBuy}>
        <input
          type="number"
          min="1"
          step="1"
          placeholder="Tokens a comprar"
          className="rounded-lg px-4 py-2 bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={amount}
          onChange={handleAmountChange}
          disabled={loading}
        />
        {ethToSend && (
          <div className="text-sm text-gray-200 text-center">
            Vas a pagar: <b>{ethToSend}</b> ETH ({amount} tokens)
          </div>
        )}
        <button
          type="submit"
          className="py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow hover:scale-105 transition-transform"
          disabled={loading || !amount}
        >
          {loading ? "Comprando..." : "Comprar"}
        </button>
        {error && <div className="text-red-400 text-center">{error}</div>}
        {success && <div className="text-green-400 text-center">{success}</div>}
      </form>
    </div>
  );
}

export default BuyTokens;
