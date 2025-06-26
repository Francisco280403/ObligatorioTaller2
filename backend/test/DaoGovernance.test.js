const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DaoGovernance + Strategies", function () {
  let owner, dao, user1, user2;
  const TOKEN_PRICE = ethers.utils.parseEther("0.1"); // 0.1 ETH
  const LOCK = 60 * 60 * 24; // 1 día
  const DURATION = 60 * 60 * 24 * 2; // 2 días
  const VOTE_UNIT = ethers.utils.parseEther("1"); // 1 token

  // Helper para desplegar fresh DaoGovernance + token y setear panicWallet
  async function deployGov() {
    const Dummy = await ethers.getContractFactory("DummyStrategy");
    const strat = await Dummy.deploy();
    await strat.deployed();

    const Gov = await ethers.getContractFactory("DaoGovernance");
    const gov = await Gov.deploy(
      "VoteToken",
      "VT",
      TOKEN_PRICE,
      LOCK,
      DURATION,
      VOTE_UNIT,
      strat.address,
      owner.address
    );
    await gov.deployed();
    await gov.connect(owner).setPanicWallet(user1.address);

    const tokenAddr = await gov.token();
    const token = await ethers.getContractAt("VotingToken", tokenAddr);
    return { gov, token };
  }

  beforeEach(async function () {
    [owner, dao, user1, user2] = await ethers.getSigners();
  });

  it("owner can mint into DAO y buyTokens cubre ambas ramas", async function () {
    // ---- Rama A: amount <= daoBalance ----
    let { gov, token } = await deployGov();
    await gov.connect(owner).mintTokens(ethers.utils.parseEther("100"));
    await gov.connect(user1).buyTokens({ value: ethers.utils.parseEther("1") });
    expect(await token.balanceOf(user1.address)).to.equal(
      ethers.utils.parseEther("10")
    );

    // ---- Rama B: amount > daoBalance ----
    ({ gov, token } = await deployGov());
    await gov.connect(owner).mintTokens(ethers.utils.parseEther("5"));
    await gov.connect(user1).buyTokens({ value: ethers.utils.parseEther("1") });
    expect(await token.balanceOf(user1.address)).to.equal(
      ethers.utils.parseEther("5")
    );
  });

  it("panic wallet y pausas", async function () {
    const { gov } = await deployGov();

    await expect(
      gov.connect(user1).setPanicWallet(user2.address)
    ).to.be.revertedWith("Only owner");

    await expect(gov.connect(owner).setPanicWallet(user2.address))
      .to.emit(gov, "DebugSender")
      .withArgs(owner.address, owner.address, user2.address, "setPanicWallet");

    await expect(gov.connect(owner).panico())
      .to.emit(gov, "DebugSender")
      .withArgs(owner.address, owner.address, user2.address, "panico");

    await expect(
      gov.connect(user1).buyTokens({ value: ethers.utils.parseEther("1") })
    ).to.be.revertedWith("DAO en panico");

    await expect(gov.connect(user1).tranquilidad()).to.be.revertedWith(
      "Solo la panic wallet puede tranquilizar"
    );

    await gov.connect(user2).tranquilidad();
    expect(await gov.isPanicked()).to.equal(false);
  });

  it("staking para votar y des-stake con unlock", async function () {
    const { gov, token } = await deployGov();
    await gov.connect(owner).mintTokens(ethers.utils.parseEther("5"));
    await gov.connect(user1).buyTokens({ value: ethers.utils.parseEther("1") });

    await expect(
      gov.connect(user1).stakeForVote(ethers.utils.parseEther("1"))
    ).to.be.revertedWith("ERC20InsufficientAllowance");

    await token
      .connect(user1)
      .approve(gov.address, ethers.utils.parseEther("2"));
    await gov.connect(user1).stakeForVote(ethers.utils.parseEther("2"));
    expect(await gov.stakeVotes(user1.address)).to.equal(
      ethers.utils.parseEther("2")
    );

    await expect(gov.connect(user1).unstakeVotes()).to.be.revertedWith(
      "Lock period not passed"
    );

    await ethers.provider.send("evm_increaseTime", [LOCK + 1]);
    await ethers.provider.send("evm_mine");

    await gov.connect(user1).unstakeVotes();
    expect(await token.balanceOf(user1.address)).to.equal(
      ethers.utils.parseEther("5")
    );
  });

  it("staking para proponer, crear proposal, votar y finalizar", async function () {
    const { gov, token } = await deployGov();
    await gov.connect(owner).mintTokens(ethers.utils.parseEther("20"));
    await gov.connect(user1).buyTokens({ value: ethers.utils.parseEther("2") });

    await token
      .connect(user1)
      .approve(gov.address, ethers.utils.parseEther("15"));
    await gov.connect(user1).stakeForProposal(ethers.utils.parseEther("15"));
    expect(await gov.stakePropose(user1.address)).to.equal(
      ethers.utils.parseEther("15")
    );

    await gov.connect(user1).createProposal("T1", "Desc");
    expect(await gov.proposalCount()).to.equal(1);
    await expect(gov.connect(user1).createProposal("T2", "D2"))
      .to.emit(gov, "ProposalCreated")
      .withArgs(2, user1.address);

    await token
      .connect(user1)
      .approve(gov.address, ethers.utils.parseEther("1"));
    await gov.connect(user1).stakeForVote(ethers.utils.parseEther("1"));
    await gov.connect(user1).vote(2, true);
    await expect(gov.connect(user1).vote(2, false)).to.be.revertedWith(
      "Already voted"
    );

    await ethers.provider.send("evm_increaseTime", [DURATION + 1]);
    await ethers.provider.send("evm_mine");

    await expect(gov.connect(user1).finalizeProposal(2))
      .to.emit(gov, "Finalized")
      .withArgs(2, true);
  });

  it("setters de parámetros y transferencia de ownership", async function () {
    const { gov } = await deployGov();

    await expect(gov.connect(user1).setTokenPriceWei(1)).to.be.revertedWith(
      "Only owner"
    );
    await gov.connect(owner).setTokenPriceWei(123);
    expect(await gov.tokenPriceWei()).to.equal(123);

    await expect(gov.connect(user1).setLockPeriod(999)).to.be.revertedWith(
      "Only owner"
    );
    await gov.connect(owner).setLockPeriod(999);
    expect(await gov.lockPeriod()).to.equal(999);

    await expect(
      gov.connect(user1).setProposalDuration(888)
    ).to.be.revertedWith("Only owner");
    await gov.connect(owner).setProposalDuration(888);
    expect(await gov.proposalDuration()).to.equal(888);

    await expect(gov.connect(user1).setVoteUnit(777)).to.be.revertedWith(
      "Only owner"
    );
    await gov.connect(owner).setVoteUnit(777);
    expect(await gov.voteUnit()).to.equal(777);

    await expect(gov.connect(user1).setMinStakeVote(666)).to.be.revertedWith(
      "Only owner"
    );
    await gov.connect(owner).setMinStakeVote(666);
    expect(await gov.minStakeVote()).to.equal(666);

    await expect(gov.connect(user1).setMinStakePropose(555)).to.be.revertedWith(
      "Only owner"
    );
    await gov.connect(owner).setMinStakePropose(555);
    expect(await gov.minStakePropose()).to.equal(555);

    await expect(
      gov.connect(owner).transferOwnership(ethers.constants.AddressZero)
    ).to.be.revertedWith("Nuevo owner invalido");
    await gov.connect(owner).transferOwnership(user2.address);
    expect(await gov.owner()).to.equal(user2.address);
  });

  // -----------------------------
  // Cobertura extra en DaoGovernance
  // -----------------------------
  it("unstakeProposals: revert y success", async function () {
    const { gov, token } = await deployGov();
    // Preparo stake para proponer
    await gov.connect(owner).mintTokens(ethers.utils.parseEther("20"));
    await gov.connect(user1).buyTokens({ value: ethers.utils.parseEther("2") });
    await token
      .connect(user1)
      .approve(gov.address, ethers.utils.parseEther("10"));
    await gov.connect(user1).stakeForProposal(ethers.utils.parseEther("10"));

    // antes de tiempo: revert
    await expect(gov.connect(user1).unstakeProposals()).to.be.revertedWith(
      "Lock period not passed"
    );

    // avanzo tiempo y ejecuto
    await ethers.provider.send("evm_increaseTime", [LOCK + 1]);
    await ethers.provider.send("evm_mine");

    await gov.connect(user1).unstakeProposals();
    expect(await token.balanceOf(user1.address)).to.equal(
      ethers.utils.parseEther("20")
    );
  });

  it("vote(false) incrementa againstVotes y emite Voted", async function () {
    const { gov, token } = await deployGov();
    // Preparo DAO con suficientes tokens
    await gov.connect(owner).mintTokens(ethers.utils.parseEther("20"));
    await gov.connect(user1).buyTokens({ value: ethers.utils.parseEther("2") }); // 20 tokens

    // Stake para votar
    await token
      .connect(user1)
      .approve(gov.address, ethers.utils.parseEther("2"));
    await gov.connect(user1).stakeForVote(ethers.utils.parseEther("2"));

    // Stake para proponer y crear propuesta
    await token
      .connect(user1)
      .approve(gov.address, ethers.utils.parseEther("10"));
    await gov.connect(user1).stakeForProposal(ethers.utils.parseEther("10"));
    await gov.connect(user1).createProposal("T", "D");

    // Voto en contra
    await expect(gov.connect(user1).vote(1, false))
      .to.emit(gov, "Voted")
      .withArgs(1, user1.address, false, ethers.BigNumber.from("2"));
  });

  it("setVotingStrategy emite StrategyChanged", async function () {
    const { gov } = await deployGov();
    const NewStrat = await ethers.getContractFactory("DummyStrategy");
    const newS = await NewStrat.deploy();
    await newS.deployed();

    await expect(gov.connect(user1).setVotingStrategy(newS.address))
      .to.emit(gov, "StrategyChanged")
      .withArgs(newS.address);

    expect(await gov.votingStrategy()).to.equal(newS.address);
  });

  describe("SimpleMajorityStrategy", function () {
    let simple;
    before(async () => {
      const S = await ethers.getContractFactory("SimpleMajorityStrategy");
      simple = await S.deploy();
      await simple.deployed();
    });
    it("true if for > against", async () => {
      expect(await simple.isAccepted(10, 5, 0)).to.equal(true);
    });
    it("false if for <= against", async () => {
      expect(await simple.isAccepted(5, 5, 0)).to.equal(false);
      expect(await simple.isAccepted(2, 7, 0)).to.equal(false);
    });
  });

  describe("FullQuorumMajorityStrategy", function () {
    let full;
    before(async () => {
      const F = await ethers.getContractFactory("FullQuorumMajorityStrategy");
      full = await F.deploy();
      await full.deployed();
    });
    it("true if for*2 > totalVotingPower", async () => {
      expect(await full.isAccepted(6, 3, 10)).to.equal(true);
    });
    it("false if for*2 <= totalVotingPower", async () => {
      expect(await full.isAccepted(5, 2, 10)).to.equal(false);
    });
  });

  describe("Cobertura de ramas y casos borde DaoGovernance", function () {
    let owner, user1, user2, gov, token, strat;
    const TOKEN_PRICE = ethers.utils.parseEther("0.1");
    const LOCK = 60 * 60 * 24;
    const DURATION = 60 * 60 * 24 * 2;
    const VOTE_UNIT = ethers.utils.parseEther("1");

    beforeEach(async function () {
      [owner, , user1, user2] = await ethers.getSigners();
      const Dummy = await ethers.getContractFactory("DummyStrategy");
      strat = await Dummy.deploy();
      await strat.deployed();
      const Gov = await ethers.getContractFactory("DaoGovernance");
      gov = await Gov.deploy(
        "VoteToken",
        "VT",
        TOKEN_PRICE,
        LOCK,
        DURATION,
        VOTE_UNIT,
        strat.address,
        owner.address
      );
      await gov.deployed();
      await gov.connect(owner).setPanicWallet(user1.address);
      token = await ethers.getContractAt("VotingToken", await gov.token());
    });

    it("buyTokens: reverts si msg.value < tokenPriceWei", async function () {
      await expect(
        gov.connect(user1).buyTokens({ value: ethers.utils.parseEther("0.01") })
      ).to.be.revertedWith("Insufficient ETH");
    });

    it("buyTokens: reverts si no hay tokens disponibles para comprar", async function () {
      // No hay tokens en el contrato
      await expect(
        gov.connect(user1).buyTokens({ value: ethers.utils.parseEther("1") })
      ).to.be.revertedWith("No hay tokens disponibles para comprar");
    });

    it("mintTokens: soloOwner y panico", async function () {
      await gov.connect(owner).panico();
      await expect(gov.connect(owner).mintTokens(1)).to.be.revertedWith(
        "DAO en panico"
      );
      await gov.connect(user1).tranquilidad();
      await expect(gov.connect(user1).mintTokens(1)).to.be.revertedWith(
        "Only owner"
      );
    });

    it("stakeForVote: reverts si amount < minStakeVote", async function () {
      await expect(gov.connect(user1).stakeForVote(0)).to.be.revertedWith(
        "Minimo para votar"
      );
    });

    it("stakeForProposal: reverts si amount < minStakePropose", async function () {
      await expect(gov.connect(user1).stakeForProposal(0)).to.be.revertedWith(
        "Minimo para proponer"
      );
    });

    it("unstakeVotes: reverts si lock period no pasó", async function () {
      await gov.connect(owner).mintTokens(ethers.utils.parseEther("10"));
      await gov
        .connect(user1)
        .buyTokens({ value: ethers.utils.parseEther("1") });
      await token
        .connect(user1)
        .approve(gov.address, ethers.utils.parseEther("1"));
      await gov.connect(user1).stakeForVote(ethers.utils.parseEther("1"));
      await expect(gov.connect(user1).unstakeVotes()).to.be.revertedWith(
        "Lock period not passed"
      );
    });

    it("unstakeProposals: reverts si lock period no pasó", async function () {
      await gov.connect(owner).mintTokens(ethers.utils.parseEther("10"));
      await gov
        .connect(user1)
        .buyTokens({ value: ethers.utils.parseEther("1") });
      await token
        .connect(user1)
        .approve(gov.address, ethers.utils.parseEther("10"));
      await gov.connect(user1).stakeForProposal(ethers.utils.parseEther("10"));
      await expect(gov.connect(user1).unstakeProposals()).to.be.revertedWith(
        "Lock period not passed"
      );
    });

    it("createProposal: reverts si no hay suficiente stake", async function () {
      await expect(
        gov.connect(user1).createProposal("T", "D")
      ).to.be.revertedWith("Minimo para proponer");
    });

    it("vote: reverts si proposal terminó", async function () {
      await gov.connect(owner).mintTokens(ethers.utils.parseEther("20"));
      await gov
        .connect(user1)
        .buyTokens({ value: ethers.utils.parseEther("2") });
      await token
        .connect(user1)
        .approve(gov.address, ethers.utils.parseEther("10"));
      await gov.connect(user1).stakeForProposal(ethers.utils.parseEther("10"));
      await gov.connect(user1).createProposal("T", "D");
      await ethers.provider.send("evm_increaseTime", [DURATION + 1]);
      await ethers.provider.send("evm_mine");
      await expect(gov.connect(user1).vote(1, true)).to.be.revertedWith(
        "Voting period ended"
      );
    });

    it("vote: reverts si ya votó", async function () {
      await gov.connect(owner).mintTokens(ethers.utils.parseEther("20"));
      await gov
        .connect(user1)
        .buyTokens({ value: ethers.utils.parseEther("2") });
      await token
        .connect(user1)
        .approve(gov.address, ethers.utils.parseEther("10"));
      await gov.connect(user1).stakeForProposal(ethers.utils.parseEther("10"));
      await gov.connect(user1).createProposal("T", "D");
      await token
        .connect(user1)
        .approve(gov.address, ethers.utils.parseEther("1"));
      await gov.connect(user1).stakeForVote(ethers.utils.parseEther("1"));
      await gov.connect(user1).vote(1, true);
      await expect(gov.connect(user1).vote(1, false)).to.be.revertedWith(
        "Already voted"
      );
    });

    it("vote: reverts si no tiene stake para votar", async function () {
      await gov.connect(owner).mintTokens(ethers.utils.parseEther("20"));
      await gov
        .connect(user1)
        .buyTokens({ value: ethers.utils.parseEther("2") });
      await token
        .connect(user1)
        .approve(gov.address, ethers.utils.parseEther("10"));
      await gov.connect(user1).stakeForProposal(ethers.utils.parseEther("10"));
      await gov.connect(user1).createProposal("T", "D");
      await expect(gov.connect(user1).vote(1, true)).to.be.revertedWith(
        "No staked tokens to vote"
      );
    });

    it("finalizeProposal: reverts si voting sigue activo", async function () {
      await gov.connect(owner).mintTokens(ethers.utils.parseEther("20"));
      await gov
        .connect(user1)
        .buyTokens({ value: ethers.utils.parseEther("2") });
      await token
        .connect(user1)
        .approve(gov.address, ethers.utils.parseEther("10"));
      await gov.connect(user1).stakeForProposal(ethers.utils.parseEther("10"));
      await gov.connect(user1).createProposal("T", "D");
      await expect(gov.connect(user1).finalizeProposal(1)).to.be.revertedWith(
        "Voting still active"
      );
    });

    it("finalizeProposal: reverts si ya fue ejecutada", async function () {
      await gov.connect(owner).mintTokens(ethers.utils.parseEther("20"));
      await gov
        .connect(user1)
        .buyTokens({ value: ethers.utils.parseEther("2") });
      await token
        .connect(user1)
        .approve(gov.address, ethers.utils.parseEther("10"));
      await gov.connect(user1).stakeForProposal(ethers.utils.parseEther("10"));
      await gov.connect(user1).createProposal("T", "D");
      await token
        .connect(user1)
        .approve(gov.address, ethers.utils.parseEther("1"));
      await gov.connect(user1).stakeForVote(ethers.utils.parseEther("1"));
      await gov.connect(user1).vote(1, true);
      await ethers.provider.send("evm_increaseTime", [DURATION + 1]);
      await ethers.provider.send("evm_mine");
      await gov.connect(user1).finalizeProposal(1);
      await expect(gov.connect(user1).finalizeProposal(1)).to.be.revertedWith(
        "Already finalized"
      );
    });

    it("setPanicWallet: reverts si address(0)", async function () {
      await expect(
        gov.connect(owner).setPanicWallet(ethers.constants.AddressZero)
      ).to.be.revertedWith("Panic wallet invalida");
    });

    it("panico: reverts si panicWallet no configurada", async function () {
      // Despliego sin configurar panicWallet
      const Gov = await ethers.getContractFactory("DaoGovernance");
      const gov2 = await Gov.deploy(
        "VoteToken",
        "VT",
        TOKEN_PRICE,
        LOCK,
        DURATION,
        VOTE_UNIT,
        strat.address,
        owner.address
      );
      await gov2.deployed();
      await expect(gov2.connect(owner).panico()).to.be.revertedWith(
        "Panic wallet no configurada"
      );
    });

    it("tranquilidad: reverts si no es panicWallet", async function () {
      await expect(gov.connect(owner).tranquilidad()).to.be.revertedWith(
        "Solo la panic wallet puede tranquilizar"
      );
    });

    it("transferOwnership: reverts si address(0)", async function () {
      await expect(
        gov.connect(owner).transferOwnership(ethers.constants.AddressZero)
      ).to.be.revertedWith("Nuevo owner invalido");
    });
  });

  // Cobertura de ramas para FullQuorumMajorityStrategy
  describe("FullQuorumMajorityStrategy - cobertura total", function () {
    let full;
    before(async () => {
      const F = await ethers.getContractFactory("FullQuorumMajorityStrategy");
      full = await F.deploy();
      await full.deployed();
    });
    it("true si forVotes*2 > totalVotingPower", async () => {
      expect(await full.isAccepted(11, 0, 20)).to.equal(true);
    });
    it("false si forVotes*2 == totalVotingPower", async () => {
      expect(await full.isAccepted(10, 0, 20)).to.equal(false);
    });
    it("false si forVotes*2 < totalVotingPower", async () => {
      expect(await full.isAccepted(9, 0, 20)).to.equal(false);
    });
    it("caso borde: todo cero", async () => {
      expect(await full.isAccepted(0, 0, 0)).to.equal(false);
    });
  });

  describe("Cobertura extrema DaoGovernance", function () {
    let owner, user1, gov, token, strat;
    const TOKEN_PRICE = ethers.utils.parseEther("0.1");
    const LOCK = 60 * 60 * 24;
    const DURATION = 60 * 60 * 24 * 2;
    const VOTE_UNIT = ethers.utils.parseEther("1");

    beforeEach(async function () {
      [owner, , user1] = await ethers.getSigners();
      const Dummy = await ethers.getContractFactory("DummyStrategy");
      strat = await Dummy.deploy();
      await strat.deployed();
      const Gov = await ethers.getContractFactory("DaoGovernance");
      gov = await Gov.deploy(
        "VoteToken",
        "VT",
        TOKEN_PRICE,
        LOCK,
        DURATION,
        VOTE_UNIT,
        strat.address,
        owner.address
      );
      await gov.deployed();
      await gov.connect(owner).setPanicWallet(user1.address);
      token = await ethers.getContractAt("VotingToken", await gov.token());
    });

    it("buyTokens: amount > daoBalance ajusta amount", async function () {
      // Mint menos tokens de los que se intentan comprar
      await gov.connect(owner).mintTokens(ethers.utils.parseEther("1"));
      // Intenta comprar 10 tokens (1 ETH), pero solo hay 1 disponible
      await gov
        .connect(user1)
        .buyTokens({ value: ethers.utils.parseEther("1") });
      expect(await token.balanceOf(user1.address)).to.equal(
        ethers.utils.parseEther("1")
      );
    });

    it("setVotingStrategy cambia la estrategia y emite evento", async function () {
      const Dummy = await ethers.getContractFactory("DummyStrategy");
      const newStrat = await Dummy.deploy();
      await newStrat.deployed();
      await expect(gov.setVotingStrategy(newStrat.address))
        .to.emit(gov, "StrategyChanged")
        .withArgs(newStrat.address);
      expect(await gov.votingStrategy()).to.equal(newStrat.address);
    });

    it("finalizeProposal: ejecuta correctamente y emite eventos", async function () {
      await gov.connect(owner).mintTokens(ethers.utils.parseEther("20"));
      await gov
        .connect(user1)
        .buyTokens({ value: ethers.utils.parseEther("2") });
      await token
        .connect(user1)
        .approve(gov.address, ethers.utils.parseEther("10"));
      await gov.connect(user1).stakeForProposal(ethers.utils.parseEther("10"));
      await gov.connect(user1).createProposal("T", "D");
      await token
        .connect(user1)
        .approve(gov.address, ethers.utils.parseEther("1"));
      await gov.connect(user1).stakeForVote(ethers.utils.parseEther("1"));
      await gov.connect(user1).vote(1, true);
      await ethers.provider.send("evm_increaseTime", [DURATION + 1]);
      await ethers.provider.send("evm_mine");
      await expect(gov.connect(user1).finalizeProposal(1))
        .to.emit(gov, "Finalized")
        .withArgs(1, true);
    });

    it("unstakeVotes: si no hay tokens staked no revierte y transfiere 0", async function () {
      await ethers.provider.send("evm_increaseTime", [LOCK + 1]);
      await ethers.provider.send("evm_mine");
      // No hay stake, pero igual llama
      await expect(gov.connect(user1).unstakeVotes()).to.not.be.reverted;
    });

    it("unstakeProposals: si no hay tokens staked no revierte y transfiere 0", async function () {
      await ethers.provider.send("evm_increaseTime", [LOCK + 1]);
      await ethers.provider.send("evm_mine");
      // No hay stake, pero igual llama
      await expect(gov.connect(user1).unstakeProposals()).to.not.be.reverted;
    });
  });
});
