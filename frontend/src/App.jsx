import React, { useState } from "react";
import WalletConnector from "./components/WalletConnector";
import BuyTokens       from "./components/BuyTokens";
import Staking         from "./components/Staking";
import ProposalsList   from "./components/ProposalsList";
import ProposalDetail  from "./components/ProposalDetail";
import AdminPanel      from "./components/AdminPanel";
import TokenBalance    from "./components/TokenBalance";

function App() {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);

  if (!address || !provider) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900">
      <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-2xl p-8 max-w-md w-full border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-6 text-center drop-shadow-lg">DAO Governance App</h1>
        <WalletConnector onConnect={(addr, prov) => { setAddress(addr); setProvider(prov); }} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 py-10 px-2">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col items-center mb-8">
          <h1 className="text-4xl font-extrabold text-white drop-shadow-lg tracking-tight mb-2">DAO Governance Platform</h1>
          <p className="text-lg text-gray-200">Gestioná tu DAO de forma simple, segura y moderna</p>
        </header>
        <TokenBalance provider={provider} address={address} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <BuyTokens provider={provider} />
            <Staking  provider={provider} />
          </div>
          <div className="space-y-6">
            <ProposalsList address={address} />
            <ProposalDetail address={address} />
            <AdminPanel address={address} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
