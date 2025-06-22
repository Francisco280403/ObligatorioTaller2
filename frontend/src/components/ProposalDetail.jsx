import React, { useEffect, useState } from "react";
import { API_BASE } from "../constants";

function ProposalDetail({ address, proposalId }) {
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [voteMsg, setVoteMsg] = useState("");

  useEffect(() => {
    if (!proposalId) return;
    setLoading(true);
    setError("");
    fetch(`${API_BASE}/proposals/${proposalId}`)
      .then((res) => res.json())
      .then((data) => setProposal(data))
      .catch(() => setError("Error al cargar propuesta"))
      .finally(() => setLoading(false));
  }, [proposalId]);

  const handleVote = async (support) => {
    setVoteMsg("");
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/proposals/${proposalId}/vote`, {
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
          setError(data.error);
        } else {
          const text = await res.text();
          setError(text || "Error al votar");
        }
        setLoading(false);
        return;
      }
      setVoteMsg("Voto registrado correctamente");
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  if (!proposalId) return null;

  // Mostrar error en la UI
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 shadow-lg border border-white/20">
      <h2 className="text-xl font-bold text-white mb-2">Detalle de Propuesta</h2>
      {loading && <div className="text-white">Cargando...</div>}
      {error && <div className="text-red-400">{error}</div>}
      {proposal && (
        <>
          {console.log("DEBUG proposal:", proposal)}
          <div className="text-white font-bold mb-2">{proposal.title}</div>
          <div className="text-gray-200 mb-4">{proposal.description}</div>
          <div className="mb-4 text-white">
            A favor: {proposal.for} | En contra: {proposal.against}
          </div>
          <div className="flex gap-2">
            <button
              className="flex-1 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition"
              onClick={() => handleVote(true)}
              disabled={loading}
            >
              Votar Sí
            </button>
            <button
              className="flex-1 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition"
              onClick={() => handleVote(false)}
              disabled={loading}
            >
              Votar No
            </button>
          </div>
          {voteMsg && (
            <div className="text-green-400 text-center mt-2">{voteMsg}</div>
          )}
        </>
      )}
    </div>
  );
}

export default ProposalDetail;
