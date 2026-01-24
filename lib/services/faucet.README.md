# Faucet Service

## Overview
The faucet service distributes test USDC tokens to users on Solana Testnet. It handles token account creation and transfers automatically.

## Configuration
Required environment variables:
- `FAUCET_WALLET_PRIVATE_KEY` - Base58-encoded private key of the faucet wallet
- `NEXT_PUBLIC_USDC_MINT_ADDRESS` - USDC token mint address on testnet

## Testing the Faucet API

### Using curl

**Get faucet info:**
```bash
curl http://localhost:3000/api/faucet
```

**Request tokens:**
```bash
curl -X POST http://localhost:3000/api/faucet \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"YOUR_WALLET_ADDRESS_HERE"}'
```

### Expected Responses

**Success (200):**
```json
{
  "success": true,
  "message": "Successfully sent 100 USDC to <wallet>",
  "txHash": "transaction-signature",
  "amount": 100,
  "explorerUrl": "https://explorer.solana.com/tx/..."
}
```

**Rate Limited (429):**
```json
{
  "success": false,
  "error": "Rate limit exceeded. You can request tokens again in X hour(s)",
  "resetAt": "2026-01-25T09:30:00.000Z"
}
```

**Invalid Request (400):**
```json
{
  "success": false,
  "error": "Invalid wallet address format"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "error": "Failed to distribute tokens"
}
```

## Rate Limiting
- 1 request per wallet address per 24 hours
- In-memory storage (resets on server restart)
- Can be cleared with `clearRateLimitStore()` for testing

## Functions

### `distributeFaucetTokens(recipientAddress: string)`
Main function that handles token distribution.

**Returns:**
- `success`: boolean
- `txHash`: transaction signature (if successful)
- `amount`: amount of USDC sent (if successful)
- `error`: error message (if failed)

### `getFaucetBalance()`
Gets the current balance of the faucet wallet.

**Returns:** number (USDC balance)

## Notes
- Automatically creates associated token accounts if they don't exist
- Uses 6 decimals for USDC (100 USDC = 100,000,000 smallest units)
- Requires faucet wallet to be initialized with test USDC tokens (Task 1)
