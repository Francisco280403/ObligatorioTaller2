import React, { useState } from "react";
import { API_BASE } from "../constants";

function AdminPanel({ address }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Este es el componente que permite a los usuarios crear nuevas propuestas 
  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, title, description }),
      });
      if (!res.ok) throw new Error("Error al crear propuesta");
      setSuccess("Propuesta creada correctamente");
      setTitle("");
      setDescription("");
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 shadow-lg border border-white/20">
      <h2 className="text-xl font-bold text-white mb-2">Crear Propuesta</h2>
      <form className="flex flex-col gap-3" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Título de la propuesta"
          className="rounded-lg px-4 py-2 bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
        <textarea
          placeholder="Descripción"
          className="rounded-lg px-4 py-2 bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="w-full py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold shadow hover:scale-105 transition-transform"
          disabled={loading || !title || !description}
        >
          {loading ? "Creando..." : "Crear Nueva Propuesta"}
        </button>
        {error && <div className="text-red-400 text-center">{error}</div>}
        {success && <div className="text-green-400 text-center">{success}</div>}
      </form>
    </div>
  );
}

export default AdminPanel;
