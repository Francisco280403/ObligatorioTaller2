import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther } from "ethers";
import type { Signer } from "ethers";
import type { OrtToken } from "../typechain-types";

describe("OrtToken", function () {
    let ort: OrtToken;
    let owner: Signer;
    let addr1: Signer;
    let addr2: Signer;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const OrtToken = await ethers.getContractFactory("OrtToken");
        ort = await OrtToken.deploy("1000000");
    });

    it("should have correct name, symbol, and decimals", async function () {
        expect(await ort.name()).to.equal("OrtToken");
        expect(await ort.symbol()).to.equal("ORT");
        expect(await ort.decimals()).to.equal(18);
    });

    it("should assign the initial supply to the deployer", async function () {
        const ownerAddress = await owner.getAddress();
        const ownerBalance = await ort.balanceOf(ownerAddress);
        expect(await ort.totalSupply()).to.equal(ownerBalance);
    });

    it("should allow transfers between accounts", async function () {
        const ownerAddress = await owner.getAddress();
        const addr1Address = await addr1.getAddress();
        const addr2Address = await addr2.getAddress();

        await ort.transfer(addr1Address, 100);
        expect(await ort.balanceOf(addr1Address)).to.equal(100);

        await ort.connect(addr1).transfer(addr2Address, 50);
        expect(await ort.balanceOf(addr2Address)).to.equal(50);
        expect(await ort.balanceOf(addr1Address)).to.equal(50);
    });

    it("should fail if sender doesn’t have enough balance", async function () {
        const ownerAddress = await owner.getAddress();
        const addr1Address = await addr1.getAddress();

        const initialOwnerBalance = await ort.balanceOf(ownerAddress);
        await expect(
            ort.connect(addr1).transfer(ownerAddress, 1)
        ).to.be.reverted;

        expect(await ort.balanceOf(ownerAddress)).to.equal(initialOwnerBalance);
    });

    it("should allow approve and transferFrom", async function () {
        const ownerAddress = await owner.getAddress();
        const addr1Address = await addr1.getAddress();
        const addr2Address = await addr2.getAddress();

        await ort.approve(addr1Address, 200);
        const allowance = await ort.allowance(ownerAddress, addr1Address);
        expect(allowance).to.equal(200);

        await ort.connect(addr1).transferFrom(ownerAddress, addr2Address, 150);
        expect(await ort.balanceOf(addr2Address)).to.equal(150);
        expect(await ort.allowance(ownerAddress, addr1Address)).to.equal(50);
    });

    it("should emit Transfer events", async function () {
        const ownerAddress = await owner.getAddress();
        const addr1Address = await addr1.getAddress();

        await expect(ort.transfer(addr1Address, 10))
            .to.emit(ort, "Transfer")
            .withArgs(ownerAddress, addr1Address, 10);
    });

    it("should emit Approval events", async function () {
        const ownerAddress = await owner.getAddress();
        const addr1Address = await addr1.getAddress();

        await expect(ort.approve(addr1Address, 20))
            .to.emit(ort, "Approval")
            .withArgs(ownerAddress, addr1Address, 20);
    });
});
