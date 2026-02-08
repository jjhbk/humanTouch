export interface ContractAddresses {
  USDC: string;
  HumanLayerEscrow: string;
  HumanLayerStaking: string;
  MockUSDC?: string;
}

export const CONTRACT_ADDRESSES: Record<string, ContractAddresses> = {
  baseSepolia: {
    USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC
    HumanLayerEscrow: "0x0000000000000000000000000000000000000000", // To be updated after deployment
    HumanLayerStaking: "0x0000000000000000000000000000000000000000", // To be updated after deployment
  },
  baseMainnet: {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base Mainnet USDC
    HumanLayerEscrow: "0x0000000000000000000000000000000000000000", // To be updated after deployment
    HumanLayerStaking: "0x0000000000000000000000000000000000000000", // To be updated after deployment
  },
};

export function getContractAddresses(network: string): ContractAddresses {
  const addresses = CONTRACT_ADDRESSES[network];
  if (!addresses) {
    throw new Error(`No contract addresses for network: ${network}`);
  }
  return addresses;
}
