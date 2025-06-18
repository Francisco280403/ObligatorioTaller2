import React, { useEffect, useState } from "react";
import { DAO_ADDRESS, DAO_ABI } from "../constants";
import { ethers } from "ethers";

function ProposalDetail({ provider, proposalId }) {
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [voteMsg, setVoteMsg] = useState("");

  useEffect(() => {
    if (!provider || !proposalId) return;
    const fetchProposal = async () => {
      setLoading(true);
      setError("");
      try {
        const dao = new ethers.Contract(DAO_ADDRESS, DAO_ABI, provider);
        const p = await dao.proposals(proposalId);
        setProposal({
          id: p.id.toString(),
          title: p.title,
          description: p.description,
          forVotes: p.forVotes.toString(),
          againstVotes: p.againstVotes.toString(),
          executed: p.executed
        });
      } catch (e) {
        setError("Error al cargar propuesta");
      }
      setLoading(false);
    };
    fetchProposal();
  }, [provider, proposalId]);

  const handleVote = async (support) => {
    setVoteMsg("");
    setError("");
    setLoading(true);
    try {
      const signer = provider.getSigner();
      const dao = new ethers.Contract(DAO_ADDRESS, DAO_ABI, signer);
      const tx = await dao.vote(proposalId, support);
      await tx.wait();
      setVoteMsg("Voto registrado correctamente");
    } catch (e) {
      setError(e.reason || e.message);
    }
    setLoading(false);
  };

  if (!proposalId) return null;

  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 shadow-lg border border-white/20">
      <h2 className="text-xl font-bold text-white mb-2">Detalle de Propuesta</h2>
      {loading && <div className="text-white">Cargando...</div>}
      {error && <div className="text-red-400">{error}</div>}
      {proposal && (
        <>
          <div className="text-white font-bold mb-2">{proposal.title}</div>
          <div className="text-gray-200 mb-4">{proposal.description}</div>
          <div className="mb-4 text-white">A favor: {proposal.forVotes} | En contra: {proposal.againstVotes}</div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition" onClick={() => handleVote(true)} disabled={loading}>Votar Sí</button>
            <button className="flex-1 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition" onClick={() => handleVote(false)} disabled={loading}>Votar No</button>
          </div>
          {voteMsg && <div className="text-green-400 text-center mt-2">{voteMsg}</div>}
        </>
      )}
    </div>
  );
}

export default ProposalDetail;
