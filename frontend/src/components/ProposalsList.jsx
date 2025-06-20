import React, { useEffect, useState } from "react";
import { API_BASE } from "../constants";

function ProposalsList({ address }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 shadow-lg border border-white/20">
      <h2 className="text-xl font-bold text-white mb-2">Propuestas</h2>
      {loading && <div className="text-white">Cargando...</div>}
      {error && <div className="text-red-400">{error}</div>}
      <ul className="divide-y divide-white/10">
        {proposals.map(p => (
          <li key={p.id} className="py-2 flex justify-between items-center hover:bg-white/5 rounded transition">
            <span className="text-white">{p.title}</span>
            {/* Aquí podrías agregar lógica para seleccionar/ver detalles */}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProposalsList;
