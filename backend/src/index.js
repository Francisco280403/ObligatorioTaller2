const express = require("express");
const cors    = require("cors");
const { ethers } = require("ethers");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

console.log("DAO_CONTRACT_ADDRESS:", process.env.DAO_CONTRACT_ADDRESS);
console.log("VOTING_TOKEN_ADDRESS:", process.env.VOTING_TOKEN_ADDRESS);
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.slice(0, 10) + '...' : undefined);
console.log("RPC_URL:", process.env.RPC_URL);

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const daoAbi = require("../artifacts/contracts/DaoGovernance.sol/DaoGovernance.json").abi;
const tokenAbi = require("../artifacts/contracts/VotingToken.sol/VotingToken.json").abi;

const dao = new ethers.Contract(process.env.DAO_CONTRACT_ADDRESS, daoAbi, wallet);
const token = new ethers.Contract(process.env.VOTING_TOKEN_ADDRESS, tokenAbi, wallet);

// Rutas: stake, unstake, proposals, balance, staking
// NOTA: El endpoint /buy fue eliminado porque la compra de tokens ahora se realiza desde el frontend usando MetaMask.

app.post("/stake/vote", async (req, res) => {
  try {
    await (await token.approve(dao.address, req.body.amount)).wait();
    const tx = await dao.stakeForVote(req.body.amount);
    await tx.wait();
    res.json({ tx: tx.hash });
  } catch (e) {
    res.status(400).json({ error: e.reason || e.message });
  }
});

app.post("/stake/propose", async (req, res) => {
  try {
    await (await token.approve(dao.address, req.body.amount)).wait();
    const tx = await dao.stakeForProposal(req.body.amount);
    await tx.wait();
    res.json({ tx: tx.hash });
  } catch (e) {
    res.status(400).json({ error: e.reason || e.message });
  }
});

app.post("/unstake/vote", async (req, res) => {
  try {
    const tx = await dao.unstakeVotes();
    await tx.wait();
    res.json({ tx: tx.hash });
  } catch (e) {
    res.status(400).json({ error: e.reason || e.message });
  }
});

app.post("/unstake/propose", async (req, res) => {
  try {
    const tx = await dao.unstakeProposals();
    await tx.wait();
    res.json({ tx: tx.hash });
  } catch (e) {
    res.status(400).json({ error: e.reason || e.message });
  }
});

app.post("/proposals", async (req, res) => {
  try {
    console.log("/proposals endpoint called with:", req.body);
    const { title, description, address } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Faltan título o descripción" });
    }
    // Verificar stake para proponer antes de llamar al contrato
    const minStake = await dao.minStakePropose();
    const stake = await dao.stakePropose(address);
    if (stake.lt(minStake)) {
      const minTokens = ethers.utils.formatUnits(minStake, 18);
      const userTokens = ethers.utils.formatUnits(stake, 18);
      return res.status(400).json({ error: `No tenés suficiente stake para proponer. Necesitás al menos ${minTokens} tokens en stake y tenés ${userTokens}.` });
    }
    const tx = await dao.createProposal(title, description);
    await tx.wait();
    // Log para depuración: obtener la última propuesta creada
    const count = await dao.proposalCount();
    const p = await dao.proposals(count);
    console.log("Propuesta creada:", {
      id: p.id?.toString?.() || p.id,
      title: p.title,
      description: p.description,
      start: p.start,
      end: p.end,
      forVotes: p.forVotes,
      againstVotes: p.againstVotes,
      executed: p.executed
    });
    res.json({ tx: tx.hash });
  } catch (e) {
    console.error("/proposals error:", e);
    res.status(400).json({ error: e.reason || e.message, full: e });
  }
});

app.post("/proposals/:id/vote", async (req, res) => {
  try {
    const { address } = req.body;
    // Verificar stake para votar antes de llamar al contrato
    const minStake = await dao.minStakeVote();
    const stake = await dao.stakeVotes(address);
    if (stake.lt(minStake)) {
      const minTokens = ethers.utils.formatUnits(minStake, 18);
      const userTokens = ethers.utils.formatUnits(stake, 18);
      return res.status(400).json({ error: `No tenés suficiente stake para votar. Necesitás al menos ${minTokens} tokens en stake y tenés ${userTokens}.` });
    }
    const tx = await dao.vote(req.params.id, req.body.support);
    await tx.wait();
    res.json({ tx: tx.hash });
  } catch (e) {
    res.status(400).json({ error: e.reason || e.message });
  }
});

app.post("/proposals/:id/finalize", async (req, res) => {
  try {
    const tx = await dao.finalizeProposal(req.params.id);
    await tx.wait();
    res.json({ tx: tx.hash });
  } catch (e) {
    res.status(400).json({ error: e.reason || e.message });
  }
});

app.get("/proposals", async (req, res) => {
  try {
    // Cambiado _proposalCount por proposalCount
    const count = (await dao.proposalCount()).toNumber();
    const block = await provider.getBlock("latest");
    const finals = await dao.queryFilter(dao.filters.Finalized());
    const accepted = {};
    finals.forEach(ev => { accepted[ev.args.id.toNumber()] = ev.args.accepted; });
    const out = [];
    for (let i = 1; i <= count; i++) {
      const p = await dao.proposals(i);
      const state = !p.executed && block.timestamp < p.end.toNumber()
        ? "ACTIVA"
        : (accepted[i] ? "ACEPTADA" : "RECHAZADA");
      if (req.query.state && req.query.state.toUpperCase() !== state) continue;
      out.push({ id: i, title: p.title, state });
    }
    res.json(out);
  } catch (e) {
    console.error("/proposals error:", e);
    res.status(400).json({ error: e.message, stack: e.stack });
  }
});

app.get("/proposals/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await dao.proposals(id);
    const votes = (await dao.queryFilter(dao.filters.Voted(id))).map(ev => ({
      voter: ev.args.voter,
      support: ev.args.support,
      weight: ev.args.weight.toString()
    }));
    const finals = await dao.queryFilter(dao.filters.Finalized(id));
    // Conversión robusta de BigNumber a number o string a number
    const { BigNumber } = require("ethers");
    const toNum = v => {
      try {
        if (v && typeof v.toNumber === 'function') return v.toNumber();
        if (typeof v === 'string') return Number(v);
        if (typeof v === 'number') return v;
        if (v && v._hex) return BigNumber.from(v._hex).toNumber();
        return null;
      } catch { return null; }
    };
    res.json({
      id,
      title: p.title,
      description: p.description,
      for: p.forVotes.toString(),
      against: p.againstVotes.toString(),
      executed: p.executed,
      accepted: finals.length ? finals[0].args.accepted : null,
      votes,
      start: toNum(p.start),
      end: toNum(p.end)
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/admin/mint", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ error: "Faltan parámetros" });
    // Solo el owner puede mintear
    if (wallet.address.toLowerCase() !== process.env.OWNER_ADDRESS.toLowerCase()) {
      return res.status(403).json({ error: "Solo el owner puede mintear" });
    }
    const tx = await dao.mintTokens(amount);
    await tx.wait();
    res.json({ tx: tx.hash });
  } catch (e) {
    res.status(400).json({ error: e.reason || e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API REST escuchando en http://localhost:${PORT}`);
});
