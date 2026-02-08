import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { HumanLayerEscrow, HumanLayerStaking, MockUSDC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("HumanLayer Contracts", function () {
  let usdc: MockUSDC;
  let escrow: HumanLayerEscrow;
  let staking: HumanLayerStaking;
  let owner: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;
  let provider: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  const USDC_DECIMALS = 6;
  const toUSDC = (amount: number) => BigInt(amount) * 10n ** BigInt(USDC_DECIMALS);
  const MINIMUM_STAKE = toUSDC(100);

  beforeEach(async function () {
    [owner, buyer, provider, other] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    const Escrow = await ethers.getContractFactory("HumanLayerEscrow");
    escrow = await Escrow.deploy(await usdc.getAddress());
    await escrow.waitForDeployment();

    const Staking = await ethers.getContractFactory("HumanLayerStaking");
    staking = await Staking.deploy(await usdc.getAddress(), MINIMUM_STAKE);
    await staking.waitForDeployment();

    // Transfer USDC to buyer and provider for testing
    await usdc.transfer(buyer.address, toUSDC(10000));
    await usdc.transfer(provider.address, toUSDC(10000));
    await usdc.transfer(other.address, toUSDC(10000));
  });

  describe("MockUSDC", function () {
    it("should have correct name, symbol, and decimals", async function () {
      expect(await usdc.name()).to.equal("USD Coin");
      expect(await usdc.symbol()).to.equal("USDC");
      expect(await usdc.decimals()).to.equal(6);
    });

    it("should allow minting", async function () {
      const amount = toUSDC(1000);
      await usdc.mint(other.address, amount);
      expect(await usdc.balanceOf(other.address)).to.be.gte(amount);
    });
  });

  describe("HumanLayerEscrow", function () {
    const ORDER_ID = "order-123";
    const DEPOSIT_AMOUNT = toUSDC(1000);
    let deadline: number;

    beforeEach(async function () {
      deadline = (await time.latest()) + 86400; // 1 day from now
    });

    async function createEscrow(): Promise<string> {
      await usdc.connect(buyer).approve(await escrow.getAddress(), DEPOSIT_AMOUNT);
      const tx = await escrow
        .connect(buyer)
        .deposit(provider.address, ORDER_ID, DEPOSIT_AMOUNT, deadline);
      const receipt = await tx.wait();

      const event = receipt?.logs.find((log) => {
        try {
          return escrow.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name === "EscrowCreated";
        } catch {
          return false;
        }
      });

      const parsed = escrow.interface.parseLog({
        topics: event!.topics as string[],
        data: event!.data,
      });
      return parsed!.args.escrowId;
    }

    describe("deposit", function () {
      it("should create an escrow with correct state", async function () {
        const escrowId = await createEscrow();
        const data = await escrow.getEscrow(escrowId);

        expect(data.buyer).to.equal(buyer.address);
        expect(data.provider).to.equal(provider.address);
        expect(data.amount).to.equal(DEPOSIT_AMOUNT);
        expect(data.platformFee).to.equal((DEPOSIT_AMOUNT * 250n) / 10000n);
        expect(data.deadline).to.equal(deadline);
        expect(data.status).to.equal(0); // Active
      });

      it("should transfer USDC from buyer to escrow contract", async function () {
        const balanceBefore = await usdc.balanceOf(buyer.address);
        await createEscrow();
        const balanceAfter = await usdc.balanceOf(buyer.address);
        expect(balanceBefore - balanceAfter).to.equal(DEPOSIT_AMOUNT);
      });

      it("should emit EscrowCreated event", async function () {
        await usdc.connect(buyer).approve(await escrow.getAddress(), DEPOSIT_AMOUNT);
        await expect(
          escrow.connect(buyer).deposit(provider.address, ORDER_ID, DEPOSIT_AMOUNT, deadline)
        ).to.emit(escrow, "EscrowCreated");
      });

      it("should revert with zero amount", async function () {
        await usdc.connect(buyer).approve(await escrow.getAddress(), DEPOSIT_AMOUNT);
        await expect(
          escrow.connect(buyer).deposit(provider.address, ORDER_ID, 0, deadline)
        ).to.be.revertedWith("Amount must be > 0");
      });

      it("should revert with zero address provider", async function () {
        await usdc.connect(buyer).approve(await escrow.getAddress(), DEPOSIT_AMOUNT);
        await expect(
          escrow.connect(buyer).deposit(ethers.ZeroAddress, ORDER_ID, DEPOSIT_AMOUNT, deadline)
        ).to.be.revertedWith("Invalid provider");
      });

      it("should revert with past deadline", async function () {
        await usdc.connect(buyer).approve(await escrow.getAddress(), DEPOSIT_AMOUNT);
        const pastDeadline = (await time.latest()) - 1;
        await expect(
          escrow.connect(buyer).deposit(provider.address, ORDER_ID, DEPOSIT_AMOUNT, pastDeadline)
        ).to.be.revertedWith("Deadline must be in the future");
      });

      it("should revert when paused", async function () {
        await escrow.connect(owner).pause();
        await usdc.connect(buyer).approve(await escrow.getAddress(), DEPOSIT_AMOUNT);
        await expect(
          escrow.connect(buyer).deposit(provider.address, ORDER_ID, DEPOSIT_AMOUNT, deadline)
        ).to.be.revertedWith("Contract is paused");
      });
    });

    describe("release", function () {
      it("should allow buyer to release escrow", async function () {
        const escrowId = await createEscrow();
        const providerBalBefore = await usdc.balanceOf(provider.address);
        const ownerBalBefore = await usdc.balanceOf(owner.address);

        await escrow.connect(buyer).release(escrowId);

        const data = await escrow.getEscrow(escrowId);
        expect(data.status).to.equal(1); // Released

        const fee = (DEPOSIT_AMOUNT * 250n) / 10000n;
        const providerAmount = DEPOSIT_AMOUNT - fee;

        expect(await usdc.balanceOf(provider.address) - providerBalBefore).to.equal(providerAmount);
        expect(await usdc.balanceOf(owner.address) - ownerBalBefore).to.equal(fee);
      });

      it("should emit EscrowReleased event", async function () {
        const escrowId = await createEscrow();
        await expect(escrow.connect(buyer).release(escrowId)).to.emit(
          escrow,
          "EscrowReleased"
        );
      });

      it("should allow anyone to release after deadline", async function () {
        const escrowId = await createEscrow();
        await time.increaseTo(deadline);

        await escrow.connect(other).release(escrowId);
        const data = await escrow.getEscrow(escrowId);
        expect(data.status).to.equal(1); // Released
      });

      it("should revert if non-buyer releases before deadline", async function () {
        const escrowId = await createEscrow();
        await expect(
          escrow.connect(other).release(escrowId)
        ).to.be.revertedWith("Not authorized");
      });

      it("should revert if escrow not active", async function () {
        const escrowId = await createEscrow();
        await escrow.connect(buyer).release(escrowId);
        await expect(
          escrow.connect(buyer).release(escrowId)
        ).to.be.revertedWith("Escrow not active");
      });
    });

    describe("refund", function () {
      it("should allow owner to refund active escrow", async function () {
        const escrowId = await createEscrow();
        const buyerBalBefore = await usdc.balanceOf(buyer.address);

        await escrow.connect(owner).refund(escrowId);

        const data = await escrow.getEscrow(escrowId);
        expect(data.status).to.equal(2); // Refunded
        expect(await usdc.balanceOf(buyer.address) - buyerBalBefore).to.equal(DEPOSIT_AMOUNT);
      });

      it("should allow owner to refund disputed escrow", async function () {
        const escrowId = await createEscrow();
        await escrow.connect(buyer).dispute(escrowId);
        await escrow.connect(owner).refund(escrowId);

        const data = await escrow.getEscrow(escrowId);
        expect(data.status).to.equal(2); // Refunded
      });

      it("should emit EscrowRefunded event", async function () {
        const escrowId = await createEscrow();
        await expect(escrow.connect(owner).refund(escrowId)).to.emit(
          escrow,
          "EscrowRefunded"
        );
      });

      it("should revert if non-owner tries to refund", async function () {
        const escrowId = await createEscrow();
        await expect(
          escrow.connect(buyer).refund(escrowId)
        ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
      });
    });

    describe("dispute", function () {
      it("should allow buyer to dispute", async function () {
        const escrowId = await createEscrow();
        await escrow.connect(buyer).dispute(escrowId);

        const data = await escrow.getEscrow(escrowId);
        expect(data.status).to.equal(3); // Disputed
      });

      it("should emit EscrowDisputed event", async function () {
        const escrowId = await createEscrow();
        await expect(escrow.connect(buyer).dispute(escrowId)).to.emit(
          escrow,
          "EscrowDisputed"
        );
      });

      it("should revert if non-buyer disputes", async function () {
        const escrowId = await createEscrow();
        await expect(
          escrow.connect(provider).dispute(escrowId)
        ).to.be.revertedWith("Only buyer can dispute");
      });

      it("should revert if escrow not active", async function () {
        const escrowId = await createEscrow();
        await escrow.connect(buyer).dispute(escrowId);
        await expect(
          escrow.connect(buyer).dispute(escrowId)
        ).to.be.revertedWith("Escrow not active");
      });
    });

    describe("platform fee", function () {
      it("should allow owner to set platform fee", async function () {
        await escrow.connect(owner).setPlatformFee(500); // 5%
        expect(await escrow.platformFeeBps()).to.equal(500);
      });

      it("should revert if fee exceeds 10%", async function () {
        await expect(
          escrow.connect(owner).setPlatformFee(1001)
        ).to.be.revertedWith("Fee too high");
      });

      it("should revert if non-owner sets fee", async function () {
        await expect(
          escrow.connect(buyer).setPlatformFee(500)
        ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
      });
    });

    describe("pause/unpause", function () {
      it("should allow owner to pause and unpause", async function () {
        await escrow.connect(owner).pause();
        expect(await escrow.paused()).to.equal(true);

        await escrow.connect(owner).unpause();
        expect(await escrow.paused()).to.equal(false);
      });

      it("should revert if non-owner pauses", async function () {
        await expect(
          escrow.connect(buyer).pause()
        ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
      });
    });
  });

  describe("HumanLayerStaking", function () {
    const STAKE_AMOUNT = toUSDC(500);

    describe("stake", function () {
      it("should allow staking above minimum", async function () {
        await usdc.connect(provider).approve(await staking.getAddress(), STAKE_AMOUNT);
        await staking.connect(provider).stake(STAKE_AMOUNT);

        const s = await staking.getStake(provider.address);
        expect(s.amount).to.equal(STAKE_AMOUNT);
        expect(s.active).to.equal(true);
      });

      it("should emit Staked event", async function () {
        await usdc.connect(provider).approve(await staking.getAddress(), STAKE_AMOUNT);
        await expect(staking.connect(provider).stake(STAKE_AMOUNT))
          .to.emit(staking, "Staked")
          .withArgs(provider.address, STAKE_AMOUNT);
      });

      it("should revert below minimum stake", async function () {
        const lowAmount = toUSDC(50);
        await usdc.connect(provider).approve(await staking.getAddress(), lowAmount);
        await expect(
          staking.connect(provider).stake(lowAmount)
        ).to.be.revertedWith("Below minimum stake");
      });

      it("should allow adding to existing stake", async function () {
        await usdc.connect(provider).approve(await staking.getAddress(), STAKE_AMOUNT * 2n);
        await staking.connect(provider).stake(STAKE_AMOUNT);
        await staking.connect(provider).stake(STAKE_AMOUNT);

        const s = await staking.getStake(provider.address);
        expect(s.amount).to.equal(STAKE_AMOUNT * 2n);
      });
    });

    describe("requestUnstake", function () {
      beforeEach(async function () {
        await usdc.connect(provider).approve(await staking.getAddress(), STAKE_AMOUNT);
        await staking.connect(provider).stake(STAKE_AMOUNT);
      });

      it("should set unstakeRequestedAt", async function () {
        await staking.connect(provider).requestUnstake();
        const s = await staking.getStake(provider.address);
        expect(s.unstakeRequestedAt).to.be.gt(0);
      });

      it("should emit UnstakeRequested event", async function () {
        await expect(staking.connect(provider).requestUnstake()).to.emit(
          staking,
          "UnstakeRequested"
        );
      });

      it("should revert if no active stake", async function () {
        await expect(
          staking.connect(other).requestUnstake()
        ).to.be.revertedWith("No active stake");
      });

      it("should revert if already requested", async function () {
        await staking.connect(provider).requestUnstake();
        await expect(
          staking.connect(provider).requestUnstake()
        ).to.be.revertedWith("Unstake already requested");
      });
    });

    describe("withdraw", function () {
      beforeEach(async function () {
        await usdc.connect(provider).approve(await staking.getAddress(), STAKE_AMOUNT);
        await staking.connect(provider).stake(STAKE_AMOUNT);
        await staking.connect(provider).requestUnstake();
      });

      it("should allow withdrawal after cooldown", async function () {
        await time.increase(7 * 24 * 60 * 60); // 7 days

        const balBefore = await usdc.balanceOf(provider.address);
        await staking.connect(provider).withdraw();
        const balAfter = await usdc.balanceOf(provider.address);

        expect(balAfter - balBefore).to.equal(STAKE_AMOUNT);
        const s = await staking.getStake(provider.address);
        expect(s.active).to.equal(false);
        expect(s.amount).to.equal(0);
      });

      it("should emit Withdrawn event", async function () {
        await time.increase(7 * 24 * 60 * 60);
        await expect(staking.connect(provider).withdraw())
          .to.emit(staking, "Withdrawn")
          .withArgs(provider.address, STAKE_AMOUNT);
      });

      it("should revert before cooldown elapsed", async function () {
        await time.increase(3 * 24 * 60 * 60); // 3 days
        await expect(
          staking.connect(provider).withdraw()
        ).to.be.revertedWith("Cooldown not elapsed");
      });

      it("should revert if unstake not requested", async function () {
        await usdc.connect(other).approve(await staking.getAddress(), STAKE_AMOUNT);
        await staking.connect(other).stake(STAKE_AMOUNT);
        await expect(
          staking.connect(other).withdraw()
        ).to.be.revertedWith("Unstake not requested");
      });
    });

    describe("slash", function () {
      beforeEach(async function () {
        await usdc.connect(provider).approve(await staking.getAddress(), STAKE_AMOUNT);
        await staking.connect(provider).stake(STAKE_AMOUNT);
      });

      it("should allow owner to slash", async function () {
        const slashAmount = toUSDC(100);
        await staking.connect(owner).slash(provider.address, slashAmount);

        const s = await staking.getStake(provider.address);
        expect(s.amount).to.equal(STAKE_AMOUNT - slashAmount);
      });

      it("should deactivate if entire stake slashed", async function () {
        await staking.connect(owner).slash(provider.address, STAKE_AMOUNT);

        const s = await staking.getStake(provider.address);
        expect(s.active).to.equal(false);
        expect(s.amount).to.equal(0);
      });

      it("should emit Slashed event", async function () {
        const slashAmount = toUSDC(100);
        await expect(staking.connect(owner).slash(provider.address, slashAmount))
          .to.emit(staking, "Slashed")
          .withArgs(provider.address, slashAmount);
      });

      it("should revert if non-owner slashes", async function () {
        await expect(
          staking.connect(buyer).slash(provider.address, toUSDC(100))
        ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
      });

      it("should revert if slash exceeds stake", async function () {
        await expect(
          staking.connect(owner).slash(provider.address, STAKE_AMOUNT + 1n)
        ).to.be.revertedWith("Slash exceeds stake");
      });
    });

    describe("isActiveProvider", function () {
      it("should return true for staked provider", async function () {
        await usdc.connect(provider).approve(await staking.getAddress(), STAKE_AMOUNT);
        await staking.connect(provider).stake(STAKE_AMOUNT);
        expect(await staking.isActiveProvider(provider.address)).to.equal(true);
      });

      it("should return false for non-staked address", async function () {
        expect(await staking.isActiveProvider(other.address)).to.equal(false);
      });
    });

    describe("admin functions", function () {
      it("should allow owner to set minimum stake", async function () {
        await staking.connect(owner).setMinimumStake(toUSDC(200));
        expect(await staking.minimumStake()).to.equal(toUSDC(200));
      });

      it("should allow owner to set cooldown period", async function () {
        const newPeriod = 14 * 24 * 60 * 60; // 14 days
        await staking.connect(owner).setCooldownPeriod(newPeriod);
        expect(await staking.cooldownPeriod()).to.equal(newPeriod);
      });

      it("should revert if non-owner sets minimum stake", async function () {
        await expect(
          staking.connect(buyer).setMinimumStake(toUSDC(200))
        ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
      });
    });
  });
});
