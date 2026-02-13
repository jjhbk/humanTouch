import { describe, it, expect, beforeAll } from "vitest";
import { KeyManagementService } from "../key-management.service.js";

describe("KeyManagementService", () => {
  let kms: KeyManagementService;

  beforeAll(() => {
    // Set test encryption secret
    process.env.AA_ENCRYPTION_SECRET = "test-secret-key-at-least-32-chars-long-for-aes256";
    process.env.NODE_ENV = "development";
    kms = new KeyManagementService();
  });

  it("should encrypt and decrypt a private key", async () => {
    const originalKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    // Encrypt
    const encrypted = await kms.encryptSessionKey(originalKey);
    expect(encrypted).toBeTruthy();
    expect(encrypted).not.toBe(originalKey);

    // Decrypt
    const decrypted = await kms.decryptSessionKey(encrypted);
    expect(decrypted).toBe(originalKey);
  });

  it("should produce different ciphertext for same plaintext (random IV)", async () => {
    const privateKey = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

    const encrypted1 = await kms.encryptSessionKey(privateKey);
    const encrypted2 = await kms.encryptSessionKey(privateKey);

    // Different ciphertext due to random IV
    expect(encrypted1).not.toBe(encrypted2);

    // But both decrypt to same value
    const decrypted1 = await kms.decryptSessionKey(encrypted1);
    const decrypted2 = await kms.decryptSessionKey(encrypted2);

    expect(decrypted1).toBe(privateKey);
    expect(decrypted2).toBe(privateKey);
  });

  it("should fail with invalid encryption secret", () => {
    process.env.AA_ENCRYPTION_SECRET = "short";

    expect(() => {
      const invalidKMS = new KeyManagementService();
      invalidKMS.validateConfig();
    }).toThrow("must be at least 32 characters");

    // Restore
    process.env.AA_ENCRYPTION_SECRET = "test-secret-key-at-least-32-chars-long-for-aes256";
  });

  it("should validate config successfully", () => {
    expect(() => kms.validateConfig()).not.toThrow();
  });
});
