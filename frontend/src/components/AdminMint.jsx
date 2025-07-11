import React, { useState, useEffect } from "react";
import { API_BASE, DAO_ADDRESS, DAO_ABI } from "../constants";
import { ethers } from "ethers";

function AdminMint({ address, provider, onMint }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentOwner, setCurrentOwner] = useState("");

  // Consultar el owner real del contrato
  useEffect(() => {
    if (!provider) return;
    const fetchOwner = async () => {
      try {
        const dao = new ethers.Contract(DAO_ADDRESS, DAO_ABI, provider);
        const ownerAddr = await dao.owner();
        setCurrentOwner(ownerAddr.toLowerCase());
      } catch (e) {
        setCurrentOwner("");
      }
    };
    fetchOwner();
  }, [provider]);

  // Solo mostrar si el address es el owner actual
  if (!address || !currentOwner || (typeof address !== "string") || address.toLowerCase() !== currentOwner) return null;

  const handleMint = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      // Convertir a unidades correctas (18 decimales)
      const amountParsed = ethers.utils.parseUnits(amount, 18).toString();
      const res = await fetch(`${API_BASE}/admin/mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountParsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al mintear");
      setSuccess("Tokens minteados correctamente");
      setAmount("");
      // Refrescar el supply dos veces para asegurar actualización
      setTimeout(() => { if (onMint) onMint(); }, 1000);
      setTimeout(() => { if (onMint) onMint(); }, 2000);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white/10 rounded-xl p-6 shadow-lg border border-white/20 mt-6">
      <h2 className="text-xl font-bold text-white mb-2">Mintear tokens a la DAO (Owner)</h2>
      <form className="flex flex-col gap-3" onSubmit={handleMint}>
        <input
          type="text"
          value={DAO_ADDRESS}
          disabled
          className="rounded-lg px-4 py-2 bg-white/20 text-white placeholder-gray-300 focus:outline-none"
        />
        <input
          type="number"
          min="0.0001"
          step="any"
          placeholder="Cantidad de tokens a mintear"
          className="rounded-lg px-4 py-2 bg-white/20 text-white placeholder-gray-300 focus:outline-none"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold shadow hover:scale-105 transition-transform"
          disabled={loading || !amount}
        >
          {loading ? "Minteando..." : "Mintear"}
        </button>
        {error && <div className="text-red-400 mt-2 text-center">{error}</div>}
        {success && <div className="text-green-400 mt-2 text-center">{success}</div>}
      </form>
    </div>
  );
}

export default AdminMint;
