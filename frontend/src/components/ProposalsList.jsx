import React, { useEffect, useState } from "react";
import { API_BASE } from "../constants";

function ProposalsList({ address }) {
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
          const text = await res.text();
          setVoteMsg(text || "Error al votar");
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

  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 shadow-lg border border-white/20">
      <h2 className="text-xl font-bold text-white mb-2">Propuestas</h2>
      {loading && <div className="text-white">Cargando...</div>}
      {error && <div className="text-red-400">{error}</div>}
      <ul className="divide-y divide-white/10">
        {proposals.map(p => (
          <li
            key={p.id}
            className={`py-2 flex justify-between items-center hover:bg-white/5 rounded transition cursor-pointer ${selected && selected.id === p.id ? 'bg-white/10' : ''}`}
            onClick={() => setSelected(p)}
          >
            <span className="text-white">{p.title}</span>
          </li>
        ))}
      </ul>
      {selectedDetail && (
        <div className="mt-6 p-4 bg-white/10 rounded-lg border border-white/20">
          <h3 className="text-lg font-bold text-white mb-1">{selectedDetail.title}</h3>
          <div className="text-gray-200 mb-2">{selectedDetail.description}</div>
          {/* Estado y tiempo restante */}
          <div className="mb-2">
            {(!selectedDetail.executed && selectedDetail.end * 1000 > Date.now()) ? (
              <span className="text-green-400 font-semibold">Activa</span>
            ) : (
              <span className="text-red-400 font-semibold">Finalizada</span>
            )}
            {(!selectedDetail.executed && selectedDetail.end && selectedDetail.end * 1000 > Date.now()) && (
              <span className="text-gray-300 ml-2 text-sm">
                (Tiempo restante: {Math.max(0, Math.floor((selectedDetail.end * 1000 - Date.now()) / 60000))} min)
              </span>
            )}
          </div>
          {/* Botones para votar o mensaje de voto */}
          {(!selectedDetail.executed && selectedDetail.end * 1000 > Date.now()) && (
            (() => {
              const myVote = selectedDetail.votes.find(v => v.voter.toLowerCase() === address?.toLowerCase());
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
