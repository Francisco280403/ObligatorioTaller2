import React, { useCallback, useState } from "react";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers } from "ethers";

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      rpc: {
        31337: process.env.REACT_APP_RPC_URL,
      },
      chainId: 31337,
    },
  },
};

const web3Modal = new Web3Modal({ providerOptions, cacheProvider: true });

function WalletConnector({ onConnect }) {
  const [error, setError] = useState("");

  const connectWallet = useCallback(async () => {
    try {
      const instance = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(instance);
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
        Conectar Wallet (MetaMask / WalletConnect)
      </button>
      {error && <div className="text-red-400 mt-2 text-center">{error}</div>}
    </div>
  );
}

export default WalletConnector;
