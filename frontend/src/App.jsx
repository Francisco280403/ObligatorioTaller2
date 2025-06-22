import React, { useState } from "react";
import { ethers } from "ethers";
import WalletConnector from "./components/WalletConnector";
import BuyTokens       from "./components/BuyTokens";
import Staking         from "./components/Staking";
import ProposalsList   from "./components/ProposalsList";
import ProposalDetail  from "./components/ProposalDetail";
import ProposalForm    from "./components/ProposalForm";
import TokenBalance    from "./components/TokenBalance";
import DaoTokenSupply  from "./components/DaoTokenSupply";
import AdminMint       from "./components/AdminMint";
import AdminDaoParams  from "./components/AdminDaoParams";
import { DAO_ADDRESS, DAO_ABI } from "./constants";

function App() {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [refreshBalances, setRefreshBalances] = useState(0);
  const [refreshDaoSupply, setRefreshDaoSupply] = useState(0);
  const [currentOwner, setCurrentOwner] = useState("");

  const handleStakeChange = () => setRefreshBalances(r => r + 1);
  const handleMint = () => setRefreshDaoSupply(r => r + 1);
  const handleBuy = () => {
    setRefreshBalances(r => r + 1);
    setRefreshDaoSupply(r => r + 1);
  };

  React.useEffect(() => {
    if (!provider) return;
    const fetchOwner = async () => {
      try {
        const dao = new ethers.Contract(DAO_ADDRESS, DAO_ABI, provider);
        const ownerAddr = await dao.owner();
        setCurrentOwner(ownerAddr);
      } catch {
        setCurrentOwner("");
      }
    };
    fetchOwner();
  }, [provider, address]);

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
          {/* Debug: Mostrar address conectada y owner esperado */}
          <div className="mt-4 p-2 rounded bg-white/10 border border-white/20 text-white text-sm">
            <div><span className="font-semibold">Wallet conectada:</span> {address}</div>
            <div><span className="font-semibold">Owner:</span> {currentOwner}</div>
          </div>
        </header>
        <DaoTokenSupply provider={provider} refresh={refreshDaoSupply} />
        <TokenBalance provider={provider} address={address} refresh={refreshBalances} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <BuyTokens provider={provider} onBuy={handleBuy} />
            <Staking provider={provider} address={address} onStakeChange={handleStakeChange} />
          </div>
          <div className="space-y-6">
            <ProposalsList address={address} />
            <ProposalDetail address={address} />
            <ProposalForm address={address} />
            <AdminDaoParams provider={provider} address={address} />
            <AdminMint address={address} provider={provider} onMint={handleMint} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
