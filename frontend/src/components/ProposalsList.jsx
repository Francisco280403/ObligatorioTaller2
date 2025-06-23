import React, { useEffect, useState } from "react";
import { API_BASE } from "../constants";

function ProposalsList({ address, isPanicked }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [voteMsg, setVoteMsg] = useState("");
  const [voteLoading, setVoteLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`${API_BASE}/proposals`)
      .then(async res => {
        let data;
        try { data = await res.json(); } catch { data = {}; }
        if (res.ok && Array.isArray(data)) {
          setProposals(data);
        } else {
          setError(data.error || `Error inesperado: ${JSON.stringify(data)}`);
          setProposals([]);
        }
      })
      .catch((err) => {
        setError("Error al cargar propuestas: " + err.message);
        setProposals([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch detalle de propuesta al seleccionar
  useEffect(() => {
    if (!selected) return setSelectedDetail(null);
    setSelectedDetail(null);
    fetch(`${API_BASE}/proposals/${selected.id}`)
      .then(res => res.json())
      .then(data => setSelectedDetail(data))
      .catch(() => setSelectedDetail(null));
  }, [selected]);

  const handleVote = async (support) => {
    if (!selected) return;
    setVoteMsg("");
    setVoteLoading(true);
    try {
      const res = await fetch(`${API_BASE}/proposals/${selected.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, support }),
      });
      let data = {};
      let isJson = false;
      try {
        data = await res.clone().json();
        isJson = true;
      } catch { isJson = false; }
      if (!res.ok) {
        if (isJson && data.error) {
          setVoteMsg(data.error);
        } else {
          setVoteMsg("Error al votar");
        }
        setVoteLoading(false);
        return;
      }
      setVoteMsg("Voto registrado correctamente");
    } catch (e) {
      setVoteMsg(e.message);
    }
    setVoteLoading(false);
  };

  // --- Filtrado de propuestas ---
  const now = Date.now();
  // Solo considerar finalizadas las ejecutadas
  const finalizadas = proposals.filter(p => p.executed);
  const activas = proposals.filter(p => !p.executed && (p.end * 1000 >= now));
  const expiradas = proposals.filter(p => !p.executed && (p.end * 1000 < now));

  // Determinar aceptadas/rechazadas (mayoría simple)
  const aceptadas = finalizadas.filter(p => p.accepted === true);
  const rechazadas = finalizadas.filter(p => p.accepted === false);

  // Handler para finalizar propuesta expirada
  const handleFinalize = async (p) => {
    try {
      setLoading(true);
      setError("");
      // Llamar al backend para finalizar (puedes ajustar la ruta según tu API)
      const res = await fetch(`${API_BASE}/proposals/${p.id}/finalize`, { method: "POST" });
      if (!res.ok) throw new Error("Error al finalizar propuesta");
      // Refrescar propuestas
      const updated = await fetch(`${API_BASE}/proposals`).then(r => r.json());
      setProposals(updated);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  if (isPanicked) {
    return <div className="bg-white/10 rounded-xl p-6 shadow-lg border border-white/20 text-center text-red-400 font-bold">La DAO está en pánico. No se pueden ver ni votar propuestas.</div>;
  }

  // --- Adaptación: Si no hay datos de votos/estado, solo mostrar lista simple ---
  const hasAdvancedFields = proposals.length > 0 && proposals[0].hasOwnProperty("forVotes") && proposals[0].hasOwnProperty("againstVotes") && proposals[0].hasOwnProperty("executed") && proposals[0].hasOwnProperty("end");

  if (!hasAdvancedFields) {
    return (
      <div className="bg-white/10 backdrop-blur rounded-xl p-6 shadow-lg border border-white/20">
        <h2 className="text-xl font-bold text-white mb-2">Propuestas</h2>
        {loading && <div className="text-white">Cargando...</div>}
        {error && <div className="text-red-400">{error}</div>}
        <ul className="divide-y divide-white/20 mb-4">
          {proposals.length === 0 && <li className="text-gray-300">No hay propuestas.</li>}
          {proposals.map((p) => (
            <li key={p.id} className="py-2 flex justify-between items-center">
              <span className="text-white font-semibold">{p.title}</span>
              <span className="text-xs text-gray-400 ml-2">{p.state || ""}</span>
              <button className="text-blue-400 underline ml-4" onClick={() => setSelected(p)}>Ver detalle</button>
            </li>
          ))}
        </ul>
        {/* Detalle de propuesta seleccionada (si el backend lo soporta) */}
        {selectedDetail && (
          <div className="mt-6 p-4 bg-white/10 rounded-lg border border-white/20">
            <h3 className="text-lg font-bold text-white mb-1">{selectedDetail.title}</h3>
            <div className="text-gray-200 mb-2">{selectedDetail.description}</div>
            {/* Aquí podrías mostrar más detalles si el backend los provee */}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 shadow-lg border border-white/20">
      <h2 className="text-xl font-bold text-white mb-2">Propuestas</h2>
      {loading && <div className="text-white">Cargando...</div>}
      {error && <div className="text-red-400">{error}</div>}
      {/* Propuestas activas */}
      <h3 className="text-lg text-green-400 font-bold mt-4 mb-1">Activas</h3>
      <ul className="divide-y divide-white/20 mb-4">
        {activas.length === 0 && <li className="text-gray-300">No hay propuestas activas.</li>}
        {activas.map((p) => (
          <li key={p.id} className="py-2 flex justify-between items-center">
            <span className="text-white font-semibold">{p.title}</span>
            <button className="text-blue-400 underline" onClick={() => setSelected(p)}>Ver detalle</button>
          </li>
        ))}
      </ul>
      {/* Propuestas expiradas sin finalizar */}
      {expiradas.length > 0 && <>
        <h3 className="text-lg text-yellow-400 font-bold mt-4 mb-1">Expiradas (finalizar)</h3>
        <ul className="divide-y divide-white/20 mb-4">
          {expiradas.map((p) => (
            <li key={p.id} className="py-2 flex justify-between items-center">
              <span className="text-white font-semibold">{p.title}</span>
              <button className="text-orange-400 underline ml-2" onClick={() => handleFinalize(p)} disabled={loading}>Finalizar</button>
              <button className="text-blue-400 underline ml-4" onClick={() => setSelected(p)}>Ver detalle</button>
            </li>
          ))}
        </ul>
      </>}
      {/* Propuestas aceptadas */}
      <h3 className="text-lg text-blue-400 font-bold mt-4 mb-1">Finalizadas - Aceptadas</h3>
      <ul className="divide-y divide-white/20 mb-4">
        {aceptadas.length === 0 && <li className="text-gray-300">No hay propuestas aceptadas.</li>}
        {aceptadas.map((p) => (
          <li key={p.id} className="py-2 flex justify-between items-center">
            <span className="text-white font-semibold">{p.title}</span>
            <button className="text-blue-400 underline" onClick={() => setSelected(p)}>Ver detalle</button>
          </li>
        ))}
      </ul>
      {/* Propuestas rechazadas */}
      <h3 className="text-lg text-pink-400 font-bold mt-4 mb-1">Finalizadas - Rechazadas</h3>
      <ul className="divide-y divide-white/20 mb-4">
        {rechazadas.length === 0 && <li className="text-gray-300">No hay propuestas rechazadas.</li>}
        {rechazadas.map((p) => (
          <li key={p.id} className="py-2 flex justify-between items-center">
            <span className="text-white font-semibold">{p.title}</span>
            <button className="text-blue-400 underline" onClick={() => setSelected(p)}>Ver detalle</button>
          </li>
        ))}
      </ul>
      {/* Detalle de propuesta seleccionada */}
      {selectedDetail && (
        <div className="mt-6 p-4 bg-white/10 rounded-lg border border-white/20">
          <h3 className="text-lg font-bold text-white mb-1">{selectedDetail.title}</h3>
          <div className="text-gray-200 mb-2">{selectedDetail.description}</div>
          {/* Estado y tiempo restante */}
          <div className="mb-2">
            {(!selectedDetail.executed && selectedDetail.end * 1000 > Date.now()) ? (
              <span className="text-green-400 font-semibold">Activa</span>
            ) : selectedDetail.executed ? (
              selectedDetail.accepted ? <span className="text-blue-400 font-semibold">Aceptada</span> : <span className="text-pink-400 font-semibold">Rechazada</span>
            ) : (
              <span className="text-yellow-400 font-semibold">Expirada (finalizar)</span>
            )}
            {(!selectedDetail.executed && selectedDetail.end && selectedDetail.end * 1000 > Date.now()) && (
              <span className="text-gray-300 ml-2 text-sm">
                (Tiempo restante: {Math.max(0, Math.floor((selectedDetail.end * 1000 - Date.now()) / 60000))} min)
              </span>
            )}
          </div>
          {/* Botón para finalizar si está expirada y no ejecutada */}
          {(!selectedDetail.executed && selectedDetail.end * 1000 < Date.now()) && (
            <button className="py-2 px-4 rounded-lg bg-orange-400 text-white font-semibold shadow hover:scale-105 transition-transform" onClick={() => handleFinalize(selectedDetail)} disabled={loading}>Finalizar propuesta</button>
          )}
          {/* Botones para votar o mensaje de voto */}
          {(!selectedDetail.executed && selectedDetail.end * 1000 > Date.now()) && (
            (() => {
              const myVote = selectedDetail.votes && selectedDetail.votes.find && address ? selectedDetail.votes.find(v => v.voter.toLowerCase() === address?.toLowerCase()) : null;
              if (myVote) {
                return (
                  <button className={`w-full py-2 rounded-lg font-semibold ${myVote.support ? 'bg-green-700 text-white' : 'bg-red-700 text-white'}`} disabled>
                    {myVote.support ? 'Votado a favor' : 'Votado en contra'}
                  </button>
                );
              }
              return (
                <div className="flex gap-2 mb-2">
                  <button
                    className="flex-1 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition"
                    onClick={() => handleVote(true)}
                    disabled={voteLoading}
                  >
                    Votar Sí
                  </button>
                  <button
                    className="flex-1 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition"
                    onClick={() => handleVote(false)}
                    disabled={voteLoading}
                  >
                    Votar No
                  </button>
                </div>
              );
            })()
          )}
          {voteMsg && (
            <div className="text-green-400 text-center mt-2">{voteMsg}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProposalsList;
