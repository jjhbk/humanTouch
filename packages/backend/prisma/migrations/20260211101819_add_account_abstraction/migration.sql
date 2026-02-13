-- CreateTable
CREATE TABLE "SmartAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "deployed" BOOLEAN NOT NULL DEFAULT false,
    "deployedAt" TIMESTAMP(3),
    "ownerAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionKey" (
    "id" TEXT NOT NULL,
    "smartAccountId" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "encryptedPrivateKey" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmartAccount_userId_key" ON "SmartAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SmartAccount_address_key" ON "SmartAccount"("address");

-- CreateIndex
CREATE INDEX "SmartAccount_address_idx" ON "SmartAccount"("address");

-- CreateIndex
CREATE UNIQUE INDEX "SessionKey_apiKeyId_key" ON "SessionKey"("apiKeyId");

-- CreateIndex
CREATE INDEX "SessionKey_smartAccountId_idx" ON "SessionKey"("smartAccountId");

-- CreateIndex
CREATE INDEX "SessionKey_expiresAt_idx" ON "SessionKey"("expiresAt");

-- CreateIndex
CREATE INDEX "SessionKey_apiKeyId_idx" ON "SessionKey"("apiKeyId");

-- AddForeignKey
ALTER TABLE "SmartAccount" ADD CONSTRAINT "SmartAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionKey" ADD CONSTRAINT "SessionKey_smartAccountId_fkey" FOREIGN KEY ("smartAccountId") REFERENCES "SmartAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionKey" ADD CONSTRAINT "SessionKey_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
