"use client";

import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { CHAIN_CONFIG, USDC_DECIMALS } from "@humanlayer/shared";

// ABI matching HumanLayerEscrow.sol
const ESCROW_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "provider", type: "address" },
      { name: "orderId", type: "string" },
      { name: "amount", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
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
  (process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS as `0x${string}`) ??
  "0x0000000000000000000000000000000000000000";

export function useEscrowDeposit() {
  const [isApproved, setIsApproved] = useState(false);
  const [error, setError] = useState<string>("");

  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApproving,
    error: approveError,
  } = useWriteContract();

  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositing,
    error: depositError,
  } = useWriteContract();

  const { isLoading: isWaitingApproval, isSuccess: approvalConfirmed } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    });

  const { isLoading: isWaitingDeposit, isSuccess: depositConfirmed, data: depositReceipt } =
    useWaitForTransactionReceipt({
      hash: depositHash,
    });

  useEffect(() => {
    if (approvalConfirmed && !isApproved) {
      setIsApproved(true);
    }
  }, [approvalConfirmed, isApproved]);

  function approve(amount: string) {
    setError("");

    if (ESCROW_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      setError("Escrow contract address not configured. Please deploy contracts first.");
      return;
    }

    const usdcAddress = CHAIN_CONFIG.baseSepolia.usdc as `0x${string}`;

    try {
      writeApprove({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [
          ESCROW_CONTRACT_ADDRESS,
          parseUnits(amount, USDC_DECIMALS),
        ],
      });
    } catch (err: any) {
      setError(err.message || "Failed to approve USDC");
    }
  }

  function deposit(orderId: string, amount: string, provider: `0x${string}`) {
    setError("");

    if (ESCROW_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      setError("Escrow contract address not configured. Please deploy contracts first.");
      return;
    }

    // Set deadline to 30 days from now
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60);

    try {
      writeDeposit({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: ESCROW_ABI,
        functionName: "deposit",
        args: [
          provider,
          orderId,
          parseUnits(amount, USDC_DECIMALS),
          deadline,
        ],
      });
    } catch (err: any) {
      setError(err.message || "Failed to deposit to escrow");
    }
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
    depositReceipt,
    error: error || approveError?.message || depositError?.message || "",
    escrowAddress: ESCROW_CONTRACT_ADDRESS,
  };
}
