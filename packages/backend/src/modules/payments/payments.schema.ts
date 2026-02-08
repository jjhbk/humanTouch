import { z } from "zod";

export const confirmDepositSchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});
