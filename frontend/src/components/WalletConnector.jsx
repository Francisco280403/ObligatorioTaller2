import React, { useCallback, useState } from "react";
import { ethers } from "ethers";

function WalletConnector({ onConnect }) {
  const [error, setError] = useState("");

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask no está instalado");
      return;
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      onConnect && onConnect(address, provider);
    } catch (err) {
      setError("Error al conectar la wallet");
    }
  }, [onConnect]);

  return (
    <div>
      <button
        className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:scale-105 transition-transform"
        onClick={connectWallet}
      >
        Conectar Wallet (MetaMask)
      </button>
      {error && <div className="text-red-400 mt-2 text-center">{error}</div>}
    </div>
  );
}

export default WalletConnector;
