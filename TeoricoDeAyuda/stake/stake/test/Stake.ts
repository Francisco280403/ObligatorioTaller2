import { expect } from "chai";
import { ethers } from "hardhat";
import type { Contract, Signer } from "ethers";

describe("Stake", function () {
    let OrtToken: any;
    let Stake: any;
    let ort: any;
    let stake: any;
    let owner: Signer;
    let addr1: Signer;
    let ortAddress: string;
    let stakeAddress: string;

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();

        OrtToken = await ethers.getContractFactory("OrtToken");
        ort = await OrtToken.deploy(1000000);
        await ort.waitForDeployment();
        ortAddress = await ort.getAddress();

        Stake = await ethers.getContractFactory("Stake");
        stake = await Stake.deploy(ortAddress);
        await stake.waitForDeployment();
        stakeAddress = await stake.getAddress();

        await ort.transfer(await addr1.getAddress(), 1000);
    });

    it("should set token address correctly", async function () {
        expect(await stake.token()).to.equal(ortAddress);
    });

    it("should revert staking zero amount", async function () {
        await expect(
            stake.connect(addr1).stake(0)
        ).to.be.revertedWith("El monto debe ser mayor a 0");
    });

    it("should allow staking tokens and update records", async function () {
        await ort.connect(addr1).approve(stakeAddress, 100);

        await expect(
            stake.connect(addr1).stake(100)
        )
            .to.emit(stake, "Staked")
            .withArgs(await addr1.getAddress(), 100);

        const record = await stake.stakes(await addr1.getAddress());
        expect(record.balance).to.equal(100);
    });

    it("should revert unstake before 5 days", async function () {
        await ort.connect(addr1).approve(stakeAddress, 50);
        await stake.connect(addr1).stake(50);
        await expect(
            stake.connect(addr1).unstake()
        ).to.be.revertedWith("No se puede unstake antes de 5 dias del ultimo deposito");
    });

    it("should allow unstake after 5 days and emit event", async function () {
        await ort.connect(addr1).approve(stakeAddress, 200);
        await stake.connect(addr1).stake(200);

        // fast-forward 5 days
        await ethers.provider.send("evm_increaseTime", [5 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine", []);

        const initialBalance = await ort.balanceOf(await addr1.getAddress());
        await expect(
            stake.connect(addr1).unstake()
        )
            .to.emit(stake, "Unstaked")
            .withArgs(await addr1.getAddress(), 200);

        const finalBalance = await ort.balanceOf(await addr1.getAddress());
        const diff = finalBalance - initialBalance;
        expect(diff).to.equal(200n).to.equal(200);

        const record = await stake.stakes(await addr1.getAddress());
        expect(record.balance).to.equal(0);
        expect(record.lastDeposit).to.equal(0);
    });
});
