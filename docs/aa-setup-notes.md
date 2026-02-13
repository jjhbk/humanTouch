# Account Abstraction Setup Notes

## Provider Choice: Biconomy

**Decision**: Using Biconomy for AA implementation on Base L2

**Rationale**:
- ✅ Official Base L2 support with documentation
- ✅ Battle-tested in production (used by major dapps)
- ✅ Full-stack solution (bundler, paymaster, smart accounts)
- ✅ Good TypeScript SDK
- ✅ Active development and community

**Sources**:
- [Account Abstraction on Base using Biconomy - Base Documentation](https://docs.base.org/learn/onchain-app-development/account-abstraction/account-abstraction-on-base-using-biconomy)
- [Biconomy SDK Overview](https://docs.biconomy.io/smartAccountsV2/overview/)

## Packages Installed

```json
{
  "dependencies": {
    "@biconomy/account": "^4.5.7",
    "@biconomy/bundler": "^3.1.4",
    "@biconomy/paymaster": "^3.1.4",
    "@biconomy/core-types": "^3.1.4",
    "@biconomy/modules": "^3.1.4",
    "viem": "^2.45.1"
  },
  "optionalDependencies": {
    "@aws-sdk/client-kms": "^3.987.0"
  }
}
```

## EntryPoint Contract

Base Sepolia EntryPoint (ERC-4337):
- Address: `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`
- Already deployed and verified
- Standard ERC-4337 EntryPoint v0.6

## Biconomy Services

### Bundler (Base Sepolia)
- Endpoint: `https://bundler.biconomy.io/api/v2/84532/...`
- Purpose: Bundles user operations and submits to EntryPoint
- Free tier available

### Paymaster (Base Sepolia)
- Endpoint: `https://paymaster.biconomy.io/api/v1/84532/...`
- Purpose: Sponsors gas fees for user operations
- Requires API key from Biconomy dashboard

## Configuration Added

New environment variables in `.env.example`:
```bash
# Account Abstraction (Biconomy)
BICONOMY_BUNDLER_URL="..."
BICONOMY_PAYMASTER_URL="..."
AA_ENCRYPTION_SECRET="your-32-character-encryption-key"
AWS_KMS_KEY_ID=""  # Optional: For production
AWS_REGION="us-east-1"
```

## Key Management Strategy

### Development:
- Use AES-256-GCM encryption with `AA_ENCRYPTION_SECRET`
- Store encrypted session keys in PostgreSQL
- Simple and fast for local development

### Production:
- Use AWS KMS for key encryption
- Hardware Security Module (HSM) backed
- Automatic key rotation support
- Audit logging built-in

## Security Model

### Session Key Permissions:
1. **Target whitelist**: Only HumanLayer contracts
2. **Function whitelist**: Only specific functions (approve, deposit, release)
3. **Amount limits**: Max per transaction
4. **Time limits**: 90-day expiry
5. **Rate limits**: Max transactions per minute

### Multi-layer Security:
- Layer 1: API key authentication (existing)
- Layer 2: Session key validation (new)
- Layer 3: Smart contract permissions (new)
- Layer 4: Biconomy bundler validation

## Next Steps

1. ✅ Choose AA provider (Biconomy)
2. ✅ Install dependencies
3. ✅ Add configuration
4. 🔄 Update Prisma schema
5. ⏳ Build key management service
6. ⏳ Build smart account service
7. ⏳ Create API endpoints
8. ⏳ Update MCP tools
9. ⏳ Test end-to-end
10. ⏳ Add monitoring

## Resources

- [Biconomy Docs](https://docs.biconomy.io/)
- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [Base AA Guide](https://docs.base.org/chain/account-abstraction)
- [Viem AA Utils](https://viem.sh/docs/account-abstraction/introduction.html)
