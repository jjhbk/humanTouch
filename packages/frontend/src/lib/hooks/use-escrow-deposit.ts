"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { CHAIN_CONFIG, USDC_DECIMALS } from "@humanlayer/shared";

// Placeholder ABI - will be replaced with actual contract ABI from @humanlayer/shared
const ESCROW_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "orderId", type: "bytes32" },
      { name: "amount", type: "uint256" },
      { name: "provider", type: "address" },
    ],
    outputs: [],
  },
] as const;

const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const ESCROW_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_ESCROW_CONTRACT as `0x${string}`) ??
  "0x0000000000000000000000000000000000000000";

export function useEscrowDeposit() {
  const [isApproved, setIsApproved] = useState(false);

  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApproving,
  } = useWriteContract();

  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositing,
  } = useWriteContract();

  const { isLoading: isWaitingApproval, isSuccess: approvalConfirmed } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    });

  const { isLoading: isWaitingDeposit, isSuccess: depositConfirmed } =
    useWaitForTransactionReceipt({
      hash: depositHash,
    });

  if (approvalConfirmed && !isApproved) {
    setIsApproved(true);
  }

  function approve(amount: string) {
    const usdcAddress = CHAIN_CONFIG.baseSepolia.usdc as `0x${string}`;
    writeApprove({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [
        ESCROW_CONTRACT_ADDRESS,
        parseUnits(amount, USDC_DECIMALS),
      ],
    });
  }

  function deposit(orderId: string, amount: string, provider: `0x${string}`) {
    const orderIdBytes = `0x${orderId.replace(/-/g, "").padEnd(64, "0")}` as `0x${string}`;
    writeDeposit({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_ABI,
      functionName: "deposit",
      args: [
        orderIdBytes,
        parseUnits(amount, USDC_DECIMALS),
        provider,
      ],
    });
  }

  return {
    approve,
    deposit,
    isApproving: isApproving || isWaitingApproval,
    isDepositing: isDepositing || isWaitingDeposit,
    isApproved,
    approvalConfirmed,
    depositConfirmed,
    txHash: depositHash,
  };
}
