import React, { useState, useEffect } from "react";
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

// Define el componente principal de la aplicación segun la situacion 
function App() {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [refreshBalances, setRefreshBalances] = useState(0);
  const [refreshDaoSupply, setRefreshDaoSupply] = useState(0);
  const [currentOwner, setCurrentOwner] = useState("");
  // ---Estas son las funciones de Panico ---
  const [isPanicked, setIsPanicked] = useState(false);
  const [panicWallet, setPanicWallet] = useState("");

  // Funciones para refrescar componentes cuando cambian los datos
  const handleStakeChange = () => setRefreshBalances(r => r + 1);
  const handleMint = () => setRefreshDaoSupply(r => r + 1);
  const handleBuy = () => {
    setRefreshBalances(r => r + 1);
    setRefreshDaoSupply(r => r + 1);
  };

  React.useEffect(() => {
    if (!provider) return;
    const fetchOwnerAndPanic = async () => {
      try {
        const dao = new ethers.Contract(DAO_ADDRESS, DAO_ABI, provider);
        const ownerAddr = await dao.owner();
        setCurrentOwner(ownerAddr);
        setIsPanicked(await dao.isPanicked());
        setPanicWallet((await dao.panicWallet()).toLowerCase());
      } catch {
        setCurrentOwner("");
        setIsPanicked(false);
        setPanicWallet("");
      }
    };
    fetchOwnerAndPanic();
  }, [provider, address]);

  React.useEffect(() => {
    window.provider = provider;
    window.DAO_ADDRESS = DAO_ADDRESS;
    window.DAO_ABI = DAO_ABI;
    window.address = address;
    window.ethers = ethers;
  }, [provider, address]);

    // Si no hay wallet conectada o proveedor entonces muesta la pantalla de conexión
  if (!address || !provider) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900">
      <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-2xl p-8 max-w-md w-full border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-6 text-center drop-shadow-lg">DAO Governance App</h1>
        <WalletConnector onConnect={(addr, prov) => { setAddress(addr); setProvider(prov); }} />
      </div>
    </div>
  );

  // Si está en pánico, solo mostrar mensaje y botón de tranquilidad si corresponde
  if (isPanicked) {
    const isPanicWallet = address && panicWallet && address.toLowerCase() === panicWallet;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900">
        <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-2xl p-8 max-w-md w-full border border-white/20 text-center">
          <h1 className="text-3xl font-bold text-red-400 mb-6">DAO en estado de PÁNICO</h1>
          <p className="text-white mb-4">Todas las operaciones están bloqueadas.<br/>Solo la <b>panic wallet</b> puede reactivar la DAO.</p>
          <div className="mb-2 text-white"><b>Panic wallet:</b> <span className="font-mono">{panicWallet}</span></div>
          {isPanicWallet && <AdminDaoParams provider={provider} address={address} />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 py-10 px-2">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col items-center mb-8">
          <h1 className="text-4xl font-extrabold text-white drop-shadow-lg tracking-tight mb-2">DAO Governance Platform</h1>
          <p className="text-lg text-gray-200">Gestioná tu DAO de forma simple, segura y moderna</p>
          {/* Debug: Mostrar address conectada y owner esperado */}
          <div className="mt-4 p-2 rounded bg-white/10 border border-white/20 text-white text-sm">
            <div><span className="font-semibold">Wallet conectada:</span> {address}</div>
            <div><span className="font-semibold">Owner actual:</span> {currentOwner}</div>
          </div>
        </header>
        <DaoTokenSupply provider={provider} refresh={refreshDaoSupply} isPanicked={isPanicked} />
        <TokenBalance provider={provider} address={address} refresh={refreshBalances} isPanicked={isPanicked} />
        <BuyTokens provider={provider} onBuy={handleBuy} isPanicked={isPanicked} />
        <Staking address={address} onStakeChange={handleStakeChange} isPanicked={isPanicked} />
        <ProposalForm address={address} isPanicked={isPanicked} />
        <ProposalsList address={address} isPanicked={isPanicked} />
        <AdminMint provider={provider} address={address} onMint={handleMint} />
        <AdminDaoParams provider={provider} address={address} />
      </div>
    </div>
  );
}

export default App;
