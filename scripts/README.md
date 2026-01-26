# Scripts

## Available Scripts

### `create-devnet-token.ts`
Create USDC token on Solana Devnet and mint initial supply to Faucet

```bash
npx tsx scripts/create-devnet-token.ts
```

### `setup-wallets.ts`
Initialize token accounts for Faucet and Treasury wallets

```bash
npx tsx scripts/setup-wallets.ts          # Both wallets
npx tsx scripts/setup-wallets.ts faucet   # Faucet only
npx tsx scripts/setup-wallets.ts treasury # Treasury only
```

### `check-sol-balance.ts`
Check SOL balance for any wallet

```bash
npx tsx scripts/check-sol-balance.ts <wallet-address>
```

## Shared Utilities

`lib/utils.ts` contains shared functions:
- `loadEnvFile()` - Load .env.local
- `getConnection()` - Get Solana connection
- `loadKeypair()` - Load wallet from private key
- `setupTokenAccount()` - Create/verify token account

---

See [TESTNET_SETUP.md](../docs/TESTNET_SETUP.md) for detailed setup guide.
