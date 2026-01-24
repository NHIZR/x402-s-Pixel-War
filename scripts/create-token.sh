#!/bin/bash

# Solana Testnet Token Creation Script
# Creates custom test USDC token on Solana Testnet for x402's Pixel War

set -e  # Exit on error

echo "==================================="
echo "Solana Testnet Token Creation"
echo "==================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
WALLET_DIR="$HOME/.solana-wallets"
TREASURY_WALLET="$WALLET_DIR/treasury-keypair.json"
FAUCET_WALLET="$WALLET_DIR/faucet-keypair.json"
MINT_AMOUNT=1000000
TOKEN_DECIMALS=6
AIRDROP_AMOUNT=2

# Check prerequisites
echo "Checking prerequisites..."
echo ""

if ! command -v solana &> /dev/null; then
    echo -e "${RED}Error: Solana CLI not found${NC}"
    echo ""
    echo "Please install Solana CLI:"
    echo "  sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    echo ""
    exit 1
fi

if ! command -v spl-token &> /dev/null; then
    echo -e "${RED}Error: SPL Token CLI not found${NC}"
    echo ""
    echo "Please install SPL Token CLI:"
    echo "  cargo install spl-token-cli"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Solana CLI installed${NC}"
echo -e "${GREEN}✓ SPL Token CLI installed${NC}"
echo ""

# Configure network to Testnet
echo "Configuring network to Testnet..."
solana config set --url testnet
echo ""

# Create wallet directory if it doesn't exist
mkdir -p "$WALLET_DIR"

# Function to create wallet if not exists
create_wallet_if_needed() {
    local wallet_path=$1
    local wallet_name=$2

    if [ -f "$wallet_path" ]; then
        echo -e "${YELLOW}✓ $wallet_name already exists${NC}"
        local pubkey=$(solana-keygen pubkey "$wallet_path")
        echo "  Address: $pubkey"
    else
        echo "Creating $wallet_name..."
        solana-keygen new --no-bip39-passphrase --outfile "$wallet_path" --force
        local pubkey=$(solana-keygen pubkey "$wallet_path")
        echo -e "${GREEN}✓ $wallet_name created${NC}"
        echo "  Address: $pubkey"
    fi
    echo ""
}

# Function to airdrop SOL
airdrop_sol() {
    local wallet_path=$1
    local wallet_name=$2

    local pubkey=$(solana-keygen pubkey "$wallet_path")
    local balance=$(solana balance "$pubkey" 2>/dev/null | awk '{print $1}')

    echo "$wallet_name balance: $balance SOL"

    if (( $(echo "$balance < 1" | bc -l) )); then
        echo "Requesting $AIRDROP_AMOUNT SOL airdrop for $wallet_name..."
        solana airdrop $AIRDROP_AMOUNT "$pubkey" --commitment finalized

        # Wait a moment and check new balance
        sleep 2
        local new_balance=$(solana balance "$pubkey" 2>/dev/null | awk '{print $1}')
        echo -e "${GREEN}✓ Airdrop complete. New balance: $new_balance SOL${NC}"
    else
        echo -e "${GREEN}✓ Sufficient balance${NC}"
    fi
    echo ""
}

# Create wallets
echo "==================================="
echo "Step 1: Creating Wallets"
echo "==================================="
echo ""

create_wallet_if_needed "$TREASURY_WALLET" "Treasury wallet"
create_wallet_if_needed "$FAUCET_WALLET" "Faucet wallet"

# Airdrop SOL to wallets
echo "==================================="
echo "Step 2: Airdropping SOL"
echo "==================================="
echo ""

airdrop_sol "$TREASURY_WALLET" "Treasury"
airdrop_sol "$FAUCET_WALLET" "Faucet"

# Create SPL Token
echo "==================================="
echo "Step 3: Creating SPL Token"
echo "==================================="
echo ""

echo "Creating SPL token with $TOKEN_DECIMALS decimals (USDC-like)..."
MINT_OUTPUT=$(spl-token create-token --decimals $TOKEN_DECIMALS --mint-authority "$TREASURY_WALLET" 2>&1)
MINT_ADDRESS=$(echo "$MINT_OUTPUT" | grep -oE '[A-Za-z0-9]{32,}' | head -1)

if [ -z "$MINT_ADDRESS" ]; then
    echo -e "${RED}Error: Failed to create token${NC}"
    echo "$MINT_OUTPUT"
    exit 1
fi

echo -e "${GREEN}✓ Token created successfully${NC}"
echo "  Mint Address: $MINT_ADDRESS"
echo ""

# Create token account for faucet wallet
echo "==================================="
echo "Step 4: Creating Token Account"
echo "==================================="
echo ""

echo "Creating token account for faucet wallet..."
FAUCET_PUBKEY=$(solana-keygen pubkey "$FAUCET_WALLET")
TOKEN_ACCOUNT_OUTPUT=$(spl-token create-account "$MINT_ADDRESS" --owner "$FAUCET_PUBKEY" --fee-payer "$TREASURY_WALLET" 2>&1)
TOKEN_ACCOUNT=$(echo "$TOKEN_ACCOUNT_OUTPUT" | grep -oE '[A-Za-z0-9]{32,}' | head -1)

echo -e "${GREEN}✓ Token account created${NC}"
echo "  Token Account: $TOKEN_ACCOUNT"
echo ""

# Mint tokens
echo "==================================="
echo "Step 5: Minting Tokens"
echo "==================================="
echo ""

echo "Minting $MINT_AMOUNT tokens to faucet wallet..."
spl-token mint "$MINT_ADDRESS" $MINT_AMOUNT "$TOKEN_ACCOUNT" --mint-authority "$TREASURY_WALLET"

# Verify balance
sleep 2
BALANCE=$(spl-token balance "$MINT_ADDRESS" --owner "$FAUCET_PUBKEY" 2>/dev/null || echo "0")
echo ""
echo -e "${GREEN}✓ Minting complete${NC}"
echo "  Faucet token balance: $BALANCE"
echo ""

# Save configuration
CONFIG_FILE=".testnet-token-config"
cat > "$CONFIG_FILE" << EOF
# Testnet Token Configuration
# Generated on $(date)

MINT_ADDRESS=$MINT_ADDRESS
TOKEN_ACCOUNT=$TOKEN_ACCOUNT
TREASURY_PUBKEY=$(solana-keygen pubkey "$TREASURY_WALLET")
FAUCET_PUBKEY=$FAUCET_PUBKEY
EOF

echo -e "${GREEN}✓ Configuration saved to $CONFIG_FILE${NC}"
echo ""

# Display summary and next steps
echo "==================================="
echo "Setup Complete!"
echo "==================================="
echo ""
echo -e "${GREEN}Token Details:${NC}"
echo "  Mint Address:    $MINT_ADDRESS"
echo "  Token Account:   $TOKEN_ACCOUNT"
echo "  Treasury:        $(solana-keygen pubkey "$TREASURY_WALLET")"
echo "  Faucet:          $FAUCET_PUBKEY"
echo "  Initial Supply:  $MINT_AMOUNT tokens"
echo ""
echo "==================================="
echo "Next Steps:"
echo "==================================="
echo ""
echo "1. Copy .env.local.example to .env.local:"
echo "   cp .env.local.example .env.local"
echo ""
echo "2. Add the following to your .env.local:"
echo ""
echo "   # Solana Testnet Configuration"
echo "   NEXT_PUBLIC_SOLANA_NETWORK=testnet"
echo "   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.testnet.solana.com"
echo "   NEXT_PUBLIC_USDC_MINT_ADDRESS=$MINT_ADDRESS"
echo "   NEXT_PUBLIC_FAUCET_WALLET=$FAUCET_PUBKEY"
echo "   TREASURY_WALLET_PATH=$TREASURY_WALLET"
echo "   FAUCET_WALLET_PATH=$FAUCET_WALLET"
echo ""
echo "3. Restart your development server"
echo ""
echo -e "${YELLOW}Note: Keep your wallet keypair files secure!${NC}"
echo "  Treasury: $TREASURY_WALLET"
echo "  Faucet:   $FAUCET_WALLET"
echo ""
