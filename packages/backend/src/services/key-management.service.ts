import crypto from "crypto";

/**
 * KeyManagementService
 * Handles encryption/decryption of session private keys
 * - Development: Uses AES-256-GCM with secret from env
 * - Production: Can use AWS KMS for hardware-backed encryption
 */
export class KeyManagementService {
  private algorithm = "aes-256-gcm";
  private keyLength = 32; // 256 bits

  /**
   * Encrypt a session private key
   * @param privateKey The private key to encrypt (hex string with 0x prefix)
   * @returns Base64 encoded encrypted data with IV and auth tag
   */
  async encryptSessionKey(privateKey: string): Promise<string> {
    const useKMS = process.env.NODE_ENV === "production" && process.env.AWS_KMS_KEY_ID;

    if (useKMS) {
      return this.encryptWithKMS(privateKey);
    } else {
      return this.encryptLocally(privateKey);
    }
  }

  /**
   * Decrypt a session private key
   * @param encryptedData Base64 encoded encrypted data
   * @returns Decrypted private key (hex string with 0x prefix)
   */
  async decryptSessionKey(encryptedData: string): Promise<string> {
    const useKMS = process.env.NODE_ENV === "production" && process.env.AWS_KMS_KEY_ID;

    if (useKMS) {
      return this.decryptWithKMS(encryptedData);
    } else {
      return this.decryptLocally(encryptedData);
    }
  }

  /**
   * Local encryption using AES-256-GCM
   */
  private encryptLocally(privateKey: string): string {
    const secret = process.env.AA_ENCRYPTION_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error("AA_ENCRYPTION_SECRET must be at least 32 characters");
    }

    // Derive a 256-bit key from the secret
    const key = crypto.scryptSync(secret, "salt", this.keyLength);

    // Generate random IV (12 bytes for GCM)
    const iv = crypto.randomBytes(12);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    // Encrypt the private key
    let encrypted = cipher.update(privateKey, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get the auth tag
    const authTag = (cipher as any).getAuthTag();

    // Combine IV + auth tag + encrypted data
    // Format: iv(12 bytes) + authTag(16 bytes) + encryptedData
    const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, "hex")]);

    return combined.toString("base64");
  }

  /**
   * Local decryption using AES-256-GCM
   */
  private decryptLocally(encryptedData: string): string {
    const secret = process.env.AA_ENCRYPTION_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error("AA_ENCRYPTION_SECRET must be at least 32 characters");
    }

    // Derive the same key
    const key = crypto.scryptSync(secret, "salt", this.keyLength);

    // Decode the combined data
    const combined = Buffer.from(encryptedData, "base64");

    // Extract components
    const iv = combined.subarray(0, 12);
    const authTag = combined.subarray(12, 28);
    const encrypted = combined.subarray(28);

    // Create decipher
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    (decipher as any).setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  /**
   * Encrypt using AWS KMS (production)
   */
  private async encryptWithKMS(privateKey: string): Promise<string> {
    try {
      const { KMSClient, EncryptCommand } = await import("@aws-sdk/client-kms");

      const client = new KMSClient({
        region: process.env.AWS_REGION || "us-east-1",
      });

      const command = new EncryptCommand({
        KeyId: process.env.AWS_KMS_KEY_ID!,
        Plaintext: Buffer.from(privateKey, "utf8"),
      });

      const response = await client.send(command);

      if (!response.CiphertextBlob) {
        throw new Error("KMS encryption failed: no ciphertext returned");
      }

      return Buffer.from(response.CiphertextBlob).toString("base64");
    } catch (error) {
      if (error instanceof Error && error.message.includes("Cannot find package")) {
        throw new Error(
          "AWS KMS client not installed. Run: pnpm add @aws-sdk/client-kms"
        );
      }
      throw error;
    }
  }

  /**
   * Decrypt using AWS KMS (production)
   */
  private async decryptWithKMS(encryptedData: string): Promise<string> {
    try {
      const { KMSClient, DecryptCommand } = await import("@aws-sdk/client-kms");

      const client = new KMSClient({
        region: process.env.AWS_REGION || "us-east-1",
      });

      const command = new DecryptCommand({
        CiphertextBlob: Buffer.from(encryptedData, "base64"),
      });

      const response = await client.send(command);

      if (!response.Plaintext) {
        throw new Error("KMS decryption failed: no plaintext returned");
      }

      return Buffer.from(response.Plaintext).toString("utf8");
    } catch (error) {
      if (error instanceof Error && error.message.includes("Cannot find package")) {
        throw new Error(
          "AWS KMS client not installed. Run: pnpm add @aws-sdk/client-kms"
        );
      }
      throw error;
    }
  }

  /**
   * Validate encryption secret on service startup
   */
  validateConfig(): void {
    const useKMS = process.env.NODE_ENV === "production" && process.env.AWS_KMS_KEY_ID;

    if (useKMS) {
      if (!process.env.AWS_KMS_KEY_ID) {
        throw new Error("AWS_KMS_KEY_ID is required for production");
      }
      console.log("✅ Key Management: Using AWS KMS");
    } else {
      const secret = process.env.AA_ENCRYPTION_SECRET;
      if (!secret || secret.length < 32) {
        throw new Error(
          "AA_ENCRYPTION_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 32"
        );
      }
      console.log("✅ Key Management: Using local AES-256-GCM encryption");
    }
  }
}

// Export singleton instance
export const keyManagementService = new KeyManagementService();
