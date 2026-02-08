import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const isLocal =
    network.name === "hardhat" || network.name === "localhost";

  let usdcAddress: string;

  if (isLocal) {
    console.log("Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    usdcAddress = await mockUSDC.getAddress();
    console.log("MockUSDC deployed to:", usdcAddress);
  } else if (network.name === "baseSepolia") {
    // Base Sepolia USDC address
    usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    console.log("Using Base Sepolia USDC:", usdcAddress);
  } else {
    // Base Mainnet USDC address
    usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    console.log("Using Base Mainnet USDC:", usdcAddress);
  }

  console.log("Deploying HumanLayerEscrow...");
  const Escrow = await ethers.getContractFactory("HumanLayerEscrow");
  const escrow = await Escrow.deploy(usdcAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("HumanLayerEscrow deployed to:", escrowAddress);

  const minimumStake = 100n * 10n ** 6n; // 100 USDC
  console.log("Deploying HumanLayerStaking...");
  const Staking = await ethers.getContractFactory("HumanLayerStaking");
  const staking = await Staking.deploy(usdcAddress, minimumStake);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("HumanLayerStaking deployed to:", stakingAddress);

  // Save deployment info
  const deployment = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      MockUSDC: isLocal ? usdcAddress : undefined,
      HumanLayerEscrow: escrowAddress,
      HumanLayerStaking: stakingAddress,
      USDC: usdcAddress,
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filePath = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(deployment, null, 2));
  console.log(`\nDeployment info saved to ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
