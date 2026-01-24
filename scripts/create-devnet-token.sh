#!/bin/bash
# Devnet Token Creation Script
# Run this after getting SOL from web faucet for H7yThEThcDYFe7BGx9iHuXs4WMAWB3yux4DL9wGFqqbn

set -e

echo "🚀 Creating SPL Token on Devnet..."
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

# Verify we're on Devnet
CURRENT_NETWORK=$(solana config get | grep "RPC URL" | awk '{print $3}')
if [[ "$CURRENT_NETWORK" != *"devnet"* ]]; then
  echo "❌ Error: Not on Devnet. Current RPC: $CURRENT_NETWORK"
  echo "Run: solana config set --url devnet"
  exit 1
fi

# Check balance
BALANCE=$(solana balance)
echo "Treasury wallet balance: $BALANCE"
if [[ "$BALANCE" == "0 SOL" ]]; then
  echo "❌ Error: Treasury wallet has 0 SOL"
  echo "Please get SOL from web faucet first:"
  echo "  - https://faucet.quicknode.com/solana/devnet"
  echo "  - Wallet: H7yThEThcDYFe7BGx9iHuXs4WMAWB3yux4DL9wGFqqbn"
  exit 1
fi

echo ""
echo "✅ Creating SPL Token with 6 decimals..."
TOKEN_ADDRESS=$(~/.cargo/bin/spl-token create-token --decimals 6 | grep "Creating token" | awk '{print $3}')

if [ -z "$TOKEN_ADDRESS" ]; then
  echo "❌ Failed to create token"
  exit 1
fi

echo "✅ Token created: $TOKEN_ADDRESS"
echo ""

echo "📦 Creating token account..."
~/.cargo/bin/spl-token create-account "$TOKEN_ADDRESS"

echo ""
echo "🪙 Minting 1,000,000 tokens to treasury..."
~/.cargo/bin/spl-token mint "$TOKEN_ADDRESS" 1000000

echo ""
echo "👛 Creating faucet wallet..."
if [ ! -f "wallets/faucet-wallet.json" ]; then
  solana-keygen new --outfile wallets/faucet-wallet.json --no-bip39-passphrase
fi

FAUCET_ADDRESS=$(solana-keygen pubkey wallets/faucet-wallet.json)
echo "✅ Faucet wallet: $FAUCET_ADDRESS"

echo ""
echo "📝 Getting faucet wallet private key (Base58)..."
FAUCET_PRIVATE_KEY=$(cat wallets/faucet-wallet.json | jq -r '. | @json' | base64)

echo ""
echo "💰 Creating faucet token account and transferring 500,000 tokens..."
~/.cargo/bin/spl-token create-account "$TOKEN_ADDRESS" --owner wallets/faucet-wallet.json || true
~/.cargo/bin/spl-token transfer "$TOKEN_ADDRESS" 500000 "$FAUCET_ADDRESS"

echo ""
echo "✅ Setup complete!"
echo ""
echo "════════════════════════════════════════════════════"
echo "📋 Add these to your .env.local file:"
echo "════════════════════════════════════════════════════"
echo ""
echo "NEXT_PUBLIC_SOLANA_NETWORK=devnet"
echo "NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com"
echo "NEXT_PUBLIC_USDC_MINT_ADDRESS=$TOKEN_ADDRESS"
echo "NEXT_PUBLIC_GAME_TREASURY_WALLET=H7yThEThcDYFe7BGx9iHuXs4WMAWB3yux4DL9wGFqqbn"
echo "FAUCET_WALLET_PRIVATE_KEY=[Run this command to get it]"
echo ""
echo "To get FAUCET_WALLET_PRIVATE_KEY, run:"
echo "  cat wallets/faucet-wallet.json | jq -r 'map(tostring) | join(\",\")' | base58"
echo ""
echo "════════════════════════════════════════════════════"
echo ""
echo "🌐 View on Solana Explorer:"
echo "  https://explorer.solana.com/address/$TOKEN_ADDRESS?cluster=devnet"
echo ""
