import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { DAO_ADDRESS, DAO_ABI } from "../constants";

function AdminDaoParams({ provider, address }) {
  const [params, setParams] = useState({
    tokenPriceWei: "",
    lockPeriod: "",
    proposalDuration: "",
    voteUnit: "",
    minStakeVote: "",
    minStakePropose: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Solo mostrar si el address es el owner
  const owner = process.env.REACT_APP_OWNER_ADDRESS?.toLowerCase();
  if (!address || !owner || address.toLowerCase() !== owner) return null;

  // Cargar valores actuales
  useEffect(() => {
    if (!provider) return;
    const fetchParams = async () => {
      try {
        const dao = new ethers.Contract(DAO_ADDRESS, DAO_ABI, provider);
        const voteUnitRaw = await dao.voteUnit();
        setParams({
          tokenPriceWei: ethers.utils.formatUnits(await dao.tokenPriceWei(), 18),
          lockPeriod: (await dao.lockPeriod()).toString(),
          proposalDuration: (await dao.proposalDuration()).toString(),
          voteUnit: ethers.utils.formatUnits(voteUnitRaw, 18), // mostrar en formato humano
          minStakeVote: ethers.utils.formatUnits(await dao.minStakeVote(), 18),
          minStakePropose: ethers.utils.formatUnits(await dao.minStakePropose(), 18)
        });
      } catch (e) {
        setError("Error al cargar parámetros: " + (e.reason || e.message));
      }
    };
    fetchParams();
  }, [provider]);

  // Handler para actualizar parámetros
  const handleChange = (e) => {
    setParams({ ...params, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const dao = new ethers.Contract(DAO_ADDRESS, DAO_ABI, provider.getSigner());
      await dao.setTokenPriceWei(ethers.utils.parseUnits(params.tokenPriceWei, 18));
      await dao.setLockPeriod(params.lockPeriod);
      await dao.setProposalDuration(params.proposalDuration);
      await dao.setVoteUnit(ethers.utils.parseUnits(params.voteUnit, 18)); // guardar como 18 decimales
      await dao.setMinStakeVote(ethers.utils.parseUnits(params.minStakeVote, 18));
      await dao.setMinStakePropose(ethers.utils.parseUnits(params.minStakePropose, 18));
      setSuccess("Parámetros actualizados correctamente");
    } catch (e) {
      setError("Error al actualizar: " + (e.reason || e.message));
    }
    setLoading(false);
  };

  return (
    <div className="bg-white/10 rounded-xl p-6 shadow-lg border border-white/20 mt-6">
      <h2 className="text-xl font-bold text-white mb-2">Parámetros de la DAO (Owner)</h2>
      <form className="flex flex-col gap-3" onSubmit={handleUpdate}>
        <label className="text-white">Precio del token (en tokens, ej: 0.01 = 0.01 ETH)
          <input name="tokenPriceWei" type="text" value={params.tokenPriceWei} onChange={handleChange} className="rounded-lg px-4 py-2 bg-white/20 text-white w-full" disabled={loading} />
        </label>
        <label className="text-white">Lock period (segundos)
          <input name="lockPeriod" type="text" value={params.lockPeriod} onChange={handleChange} className="rounded-lg px-4 py-2 bg-white/20 text-white w-full" disabled={loading} />
        </label>
        <label className="text-white">Duración de propuesta (segundos)
          <input name="proposalDuration" type="text" value={params.proposalDuration} onChange={handleChange} className="rounded-lg px-4 py-2 bg-white/20 text-white w-full" disabled={loading} />
        </label>
        <label className="text-white">Cantidad de tokens por 1 VP (ej: 1 = 1 token)
          <input name="voteUnit" type="text" value={params.voteUnit} onChange={handleChange} className="rounded-lg px-4 py-2 bg-white/20 text-white w-full" disabled={loading} />
          <span className="text-xs text-gray-300 block mt-1">Este parámetro solo afecta el poder de voto (VP) y el resultado de la propuesta. No impide votar si tenés el mínimo stake requerido, pero si tu stake dividido este valor da 0, tu voto no sumará VP.</span>
        </label>
        <label className="text-white">Mínimo stake para votar (tokens)
          <input name="minStakeVote" type="text" value={params.minStakeVote} onChange={handleChange} className="rounded-lg px-4 py-2 bg-white/20 text-white w-full" disabled={loading} />
        </label>
        <label className="text-white">Mínimo stake para proponer (tokens)
          <input name="minStakePropose" type="text" value={params.minStakePropose} onChange={handleChange} className="rounded-lg px-4 py-2 bg-white/20 text-white w-full" disabled={loading} />
        </label>
        <button type="submit" className="py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold shadow hover:scale-105 transition-transform" disabled={loading}>Actualizar parámetros</button>
        {error && <div className="text-red-400 mt-2 text-center">{error}</div>}
        {success && <div className="text-green-400 mt-2 text-center">{success}</div>}
      </form>
    </div>
  );
}

export default AdminDaoParams;
