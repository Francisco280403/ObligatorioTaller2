const express = require("express");
const { ethers } = require("ethers");
require("dotenv").config();

const app = express();
app.use(express.json());

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const daoAbi = require("../artifacts/contracts/DaoGovernance.sol/DaoGovernance.json").abi;
const tokenAbi = require("../artifacts/contracts/VotingToken.sol/VotingToken.json").abi;

const dao = new ethers.Contract(process.env.DAO_CONTRACT_ADDRESS, daoAbi, wallet);
const token = new ethers.Contract(process.env.TOKEN_CONTRACT_ADDRESS, tokenAbi, wallet);

// Rutas: buy, stake, unstake, proposals, balance, staking
app.post("/buy", async (req, res) => {
  try {
    const tx = await dao.buyTokens({ value: ethers.utils.parseEther(req.body.amount) });
    await tx.wait();
    res.json({ tx: tx.hash });
  } catch (e) {
    res.status(400).json({ error: e.reason || e.message });
  }
});

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
    const { title, description } = req.body;
    const tx = await dao.createProposal(title, description);
    await tx.wait();
    res.json({ tx: tx.hash });
  } catch (e) {
    res.status(400).json({ error: e.reason || e.message });
  }
});

app.post("/proposals/:id/vote", async (req, res) => {
  try {
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
    const count = (await dao._proposalCount()).toNumber();
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
    res.status(400).json({ error: e.message });
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
    res.json({
      id,
      title: p.title,
      description: p.description,
      for: p.forVotes.toString(),
      against: p.againstVotes.toString(),
      executed: p.executed,
      accepted: finals.length ? finals[0].args.accepted : null,
      votes
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/balance/:address", async (req, res) => {
  try {
    const b = await token.balanceOf(req.params.address);
    res.json({ balance: b.toString() });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/staking/:address", async (req, res) => {
  try {
    const sv = await dao.stakeVotes(req.params.address);
    const sp = await dao.stakeProposals(req.params.address);
    res.json({ stakeVotes: sv.toString(), stakeProposals: sp.toString() });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
