import React, { useEffect, useState } from "react";
import { DAO_ADDRESS, DAO_ABI } from "../constants";
import { ethers } from "ethers";

function ProposalsList({ provider }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!provider) return;
    const fetchProposals = async () => {
      setLoading(true);
      setError("");
      try {
        const dao = new ethers.Contract(DAO_ADDRESS, DAO_ABI, provider);
        const count = await dao._proposalCount();
        const arr = [];
        for (let i = 1; i <= count; i++) {
          const p = await dao.proposals(i);
          arr.push({ id: p.id.toString(), title: p.title });
        }
        setProposals(arr);
      } catch (e) {
        setError("Error al cargar propuestas");
      }
      setLoading(false);
    };
    fetchProposals();
  }, [provider]);

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
