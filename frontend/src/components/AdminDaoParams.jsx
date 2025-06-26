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
  const [newOwner, setNewOwner] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [transferSuccess, setTransferSuccess] = useState("");
  const [currentOwner, setCurrentOwner] = useState("");
  // --- Funciones de Panico ---
  const [panicWallet, setPanicWallet] = useState("");
  const [isPanicked, setIsPanicked] = useState(false);
  const [panicLoading, setPanicLoading] = useState(false);
  const [panicError, setPanicError] = useState("");
  const [panicSuccess, setPanicSuccess] = useState("");
  const [newPanicWallet, setNewPanicWallet] = useState("");
  // --- Funciones de estrategia de Votos ---
  const [strategy, setStrategy] = useState("");
  const [strategies, setStrategies] = useState([
    {
      name: "Mayoría simple de votantes",
      address: process.env.REACT_APP_SIMPLE_MAJORITY_STRATEGY,
      desc: "Gana si hay más votos a favor que en contra."
    },
    {
      name: "Mayoría absoluta (quórum)",
      address: process.env.REACT_APP_FULL_QUORUM_STRATEGY,
      desc: "Gana si los votos a favor superan el 50% del total de poder de voto."
    }
    // Aquí puedes agregar más estrategias en el futuro
  ]);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyError, setStrategyError] = useState("");
  const [strategySuccess, setStrategySuccess] = useState("");

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
  }, [provider, transferSuccess]);

  // Consultar estado de pánico y wallet
  useEffect(() => {
    if (!provider) return;
    const fetchPanic = async () => {
      try {
        const dao = new ethers.Contract(DAO_ADDRESS, DAO_ABI, provider);
        setPanicWallet((await dao.panicWallet()).toLowerCase());
        setIsPanicked(await dao.isPanicked());
      } catch (e) {
        setPanicWallet("");
        setIsPanicked(false);
      }
    };
    fetchPanic();
  }, [provider, panicSuccess]);

  // Consultar estrategia actual
  useEffect(() => {
    if (!provider) return;
    const fetchStrategy = async () => {
      try {
        const dao = new ethers.Contract(DAO_ADDRESS, DAO_ABI, provider);
        const addr = await dao.votingStrategy();
        setStrategy(addr);
      } catch (e) {
        setStrategy("");
      }
    };
    fetchStrategy();
  }, [provider, strategySuccess]);

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

  const handleTransferOwnership = async (e) => {
    e.preventDefault();
    setTransferError("");
    setTransferSuccess("");
    setTransferLoading(true);
    try {
      const dao = new ethers.Contract(DAO_ADDRESS, DAO_ABI, provider.getSigner());
      const tx = await dao.transferOwnership(newOwner);
      await tx.wait();
      setTransferSuccess("Ownership transferida correctamente");
      setNewOwner("");
    } catch (e) {
      setTransferError(e.reason || e.message);
    }
    setTransferLoading(false);
  };

  // ---Controladores de Panico ---
  const handleSetPanicWallet = async (e) => {
    e.preventDefault();
    setPanicError("");
    setPanicSuccess("");
    setPanicLoading(true);
    try {
      console.log("[handleSetPanicWallet] address:", address);
      console.log("[handleSetPanicWallet] provider:", provider);
      if (!provider) throw new Error("Provider no definido");
      const signer = provider.getSigner();
      const signerAddr = await signer.getAddress();
      console.log("[handleSetPanicWallet] signer address:", signerAddr);
      const dao = new ethers.Contract(DAO_ADDRESS, DAO_ABI, signer);
      const tx = await dao.setPanicWallet(newPanicWallet);
      await tx.wait();
      setPanicSuccess("Panic wallet actualizada correctamente");
      setNewPanicWallet("");
    } catch (e) {
      setPanicError(e.reason || e.message);
      console.error("[handleSetPanicWallet] error:", e);
    }
    setPanicLoading(false);
  };

   //Función para activar el estado de pánico en la DAO
  const handlePanico = async () => {
    setPanicError("");
    setPanicSuccess("");
    setPanicLoading(true);
    try {
      console.log("[handlePanico] address:", address);
      console.log("[handlePanico] provider:", provider);
      if (!provider) throw new Error("Provider no definido");
      const signer = provider.getSigner();
      const signerAddr = await signer.getAddress();
      console.log("[handlePanico] signer address:", signerAddr);
      const dao = new ethers.Contract(DAO_ADDRESS, DAO_ABI, signer);
      const tx = await dao.panico();
      await tx.wait();
      setPanicSuccess("DAO en estado de pánico");
    } catch (e) {
      setPanicError(e.reason || e.message);
      console.error("[handlePanico] error:", e);
    }
    setPanicLoading(false);
  };

  
   // Función encargada de desactivar el estado de pánico en la DAO   
  const handleTranquilidad = async () => {
    setPanicError("");
    setPanicSuccess("");
    setPanicLoading(true);
    try {
      const dao = new ethers.Contract(DAO_ADDRESS, DAO_ABI, provider.getSigner());
      const tx = await dao.tranquilidad();
      await tx.wait();
      setPanicSuccess("DAO reactivada (tranquilidad)");
    } catch (e) {
      setPanicError(e.reason || e.message);
    }
    setPanicLoading(false);
  };

  // Solo mostrar si el address es el owner actual o panicWallet
  const isOwner = address && currentOwner && address.toLowerCase() === currentOwner;
  const isPanicWallet = address && panicWallet && address.toLowerCase() === panicWallet;

  if (!(isOwner || isPanicWallet)) {
    return (
      <div className="bg-white/10 rounded-xl p-6 shadow-lg border border-white/20 mt-6 text-white text-center">
        No tienes permisos para ver esta sección.
      </div>
    );
  }

  // Mostrar el rol actual
  let rol = "";
  if (isOwner && isPanicWallet) rol = "(Admin y Panic Wallet)";
  else if (isOwner) rol = "(Admin)";
  else if (isPanicWallet) rol = "(Panic Wallet)";

  return (
    <div className="bg-white/10 rounded-xl p-6 shadow-lg border border-white/20 mt-6">
      <h2 className="text-xl font-bold text-white mb-2">Parámetros de la DAO <span className='text-sm font-normal'>{rol}</span></h2>
      <div className="mb-4 text-white">
        <div><b>Estado de pánico:</b> {isPanicked ? <span className="text-red-400 font-bold">ACTIVADO</span> : <span className="text-green-400 font-bold">Normal</span>}</div>
        <div><b>Panic wallet:</b> <span className="font-mono">{panicWallet}</span></div>
      </div>
      {isPanicked ? (
        isPanicWallet ? (
          <button onClick={handleTranquilidad} className="py-2 px-4 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold shadow hover:scale-105 transition-transform" disabled={panicLoading}>
            Reactivar DAO (tranquilidad)
          </button>
        ) : (
          <div className="text-center text-red-300 font-bold">La DAO está en pánico. Solo la panic wallet puede reactivarla.</div>
        )
      ) : (
        <>
          {isOwner && (
            <>
              <form className="flex flex-col gap-3" onSubmit={handleSetPanicWallet}>
                <label className="text-white">Setear nueva panic wallet:
                  <input type="text" value={newPanicWallet} onChange={e => setNewPanicWallet(e.target.value)} className="rounded-lg px-4 py-2 bg-white/20 text-white w-full" disabled={panicLoading} />
                </label>
                <button type="submit" className="py-2 rounded-lg bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold shadow hover:scale-105 transition-transform" disabled={panicLoading || !newPanicWallet}>Actualizar panic wallet</button>
              </form>
              <button onClick={handlePanico} className="py-2 mt-4 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold shadow hover:scale-105 transition-transform" disabled={panicLoading}>
                Activar pánico
              </button>
            </>
          )}
        </>
      )}
      {(panicError || panicSuccess) && <div className={panicError ? "text-red-400 mt-2 text-center" : "text-green-400 mt-2 text-center"}>{panicError || panicSuccess}</div>}
      <hr className="my-4 border-white/20" />
      {/* Bloquear todo si está en pánico, excepto la reactivación */}
      {!isPanicked && isOwner && (
        <>
          {/* --- Cambiar estrategia de votación --- */}
          <div className="mb-6">
            <label className="text-white font-semibold block mb-1">Estrategía de votación actual:</label>
            <div className="mb-2 text-white font-mono break-all">{strategy}</div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setStrategyError("");
              setStrategySuccess("");
              setStrategyLoading(true);
              try {
                const dao = new ethers.Contract(DAO_ADDRESS, DAO_ABI, provider.getSigner());
                await dao.setVotingStrategy(e.target.strategy.value);
                setStrategySuccess("Estrategia cambiada correctamente");
              } catch (e) {
                setStrategyError(e.reason || e.message);
              }
              setStrategyLoading(false);
            }}>
              <select name="strategy" className="rounded-lg px-4 py-2 bg-white/20 text-white w-full mb-2" defaultValue={strategy}>
                {strategies.map(s => (
                  <option key={s.address} value={s.address}>{s.name} - {s.address}</option>
                ))}
              </select>
              <button type="submit" className="py-2 rounded-lg bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold shadow hover:scale-105 transition-transform w-full" disabled={strategyLoading}>Cambiar estrategia</button>
              {strategyError && <div className="text-red-400 mt-2 text-center">{strategyError}</div>}
              {strategySuccess && <div className="text-green-400 mt-2 text-center">{strategySuccess}</div>}
            </form>
            <ul className="mt-2 text-xs text-gray-300 list-disc pl-4">
              {strategies.map(s => <li key={s.address}><b>{s.name}:</b> {s.desc}</li>)}
            </ul>
          </div>
          {/* --- Fin estrategia --- */}
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
          <hr className="my-4 border-white/20" />
          <form className="flex flex-col gap-3" onSubmit={handleTransferOwnership}>
            <label className="text-white">Transferir ownership a (dirección):
              <input type="text" value={newOwner} onChange={e => setNewOwner(e.target.value)} className="rounded-lg px-4 py-2 bg-white/20 text-white w-full" disabled={transferLoading} />
            </label>
            <button type="submit" className="py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold shadow hover:scale-105 transition-transform" disabled={transferLoading || !newOwner}>Transferir ownership</button>
            {transferError && <div className="text-red-400 mt-2 text-center">{transferError}</div>}
            {transferSuccess && <div className="text-green-400 mt-2 text-center">{transferSuccess}</div>}
          </form>
        </>
      )}
    </div>
  );
}

export default AdminDaoParams;
