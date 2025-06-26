const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingToken", function () {
  let votingToken, owner, dao, addr1, addr2;

  beforeEach(async function () {
    [owner, dao, addr1, addr2] = await ethers.getSigners();
    const TV = await ethers.getContractFactory("VotingToken");
    votingToken = await TV.deploy("VoteToken", "VT", dao.address, owner.address);
    await votingToken.deployed();
  });

  it("deploys with correct dao and owner", async function () {
    expect(await votingToken.dao()).to.equal(dao.address);
    expect(await votingToken.owner()).to.equal(owner.address);
  });

  it("owner can mint and increases balance", async function () {
    await votingToken.connect(owner).mint(addr1.address, ethers.utils.parseEther("100"));
    expect(await votingToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("100"));
  });

  it("dao can mint and increases balance", async function () {
    await votingToken.connect(dao).mint(addr2.address, ethers.utils.parseEther("50"));
    expect(await votingToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseEther("50"));
  });

  it("reverts if caller is neither dao nor owner", async function () {
    await expect(
      votingToken.connect(addr1).mint(addr1.address, ethers.utils.parseEther("1"))
    ).to.be.revertedWith("Only DAO or owner can mint");
  });
});
