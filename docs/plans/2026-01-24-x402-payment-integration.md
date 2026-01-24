# x402 Payment Integration & Testnet Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace mock payment system with real x402 protocol payments on Solana Testnet, create custom test USDC token, and implement faucet system for easy token distribution.

**Architecture:** Hybrid approach with on-chain payments (Solana Testnet) + off-chain state (Supabase). Each pixel conquest triggers a real SPL token transfer via x402 SDK, transaction hash is stored in database for verification. Faucet API distributes test USDC automatically.

**Tech Stack:**
- x402 SDK (@payai/x402-solana-react v2.0.0)
- Solana SPL Token (@solana/spl-token)
- Next.js API Routes (faucet endpoint)
- Supabase (state + transaction tracking)

**Key Principles:**
- x402 = payment protocol (how to pay)
- USDC = token name (what to pay)
- Never say "pay x402", always "pay USDC via x402 protocol"

---

## Phase 1: Token Infrastructure Setup

### Task 1: Create Testnet Wallets and Token

**Prerequisites:**
- Solana CLI installed (`solana --version`)
- Connected to Testnet (`solana config set --url testnet`)

**Files:**
- Create: `scripts/create-token.sh`
- Create: `.env.local.example` (update)
- Modify: `.env.local` (local only, not committed)

**Step 1: Create wallet keypairs**

Create two wallets:
1. Treasury wallet (receives player payments)
2. Faucet wallet (distributes test tokens)

```bash
# Create treasury wallet
solana-keygen new --outfile treasury-wallet.json

# Create faucet wallet
solana-keygen new --outfile faucet-wallet.json

# Get wallet addresses
solana address -k treasury-wallet.json
solana address -k faucet-wallet.json
```

Save addresses for later.

**Step 2: Airdrop SOL for transaction fees**

```bash
# Airdrop to treasury (for token creation)
solana airdrop 2 $(solana address -k treasury-wallet.json) --url testnet

# Airdrop to faucet (for distribution transactions)
solana airdrop 2 $(solana address -k faucet-wallet.json) --url testnet

# Verify balances
solana balance -k treasury-wallet.json --url testnet
solana balance -k faucet-wallet.json --url testnet
```

Expected: Each wallet has ~2 SOL

**Step 3: Create SPL Token (Test USDC)**

```bash
# Create token
spl-token create-token --decimals 6 treasury-wallet.json --url testnet

# Save the mint address output (example: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU)
# This is your NEXT_PUBLIC_USDC_MINT_ADDRESS
```

**Step 4: Create token account and mint initial supply**

```bash
# Create associated token account for faucet wallet
spl-token create-account <MINT_ADDRESS> --owner faucet-wallet.json --url testnet

# Mint 1,000,000 USDC to faucet wallet
spl-token mint <MINT_ADDRESS> 1000000 --owner treasury-wallet.json --url testnet

# Verify balance
spl-token balance <MINT_ADDRESS> --owner faucet-wallet.json --url testnet
```

Expected: Faucet wallet has 1,000,000 USDC

**Step 5: Update environment variables**

Add to `.env.local`:

```bash
# Solana Network
NEXT_PUBLIC_SOLANA_NETWORK=testnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.testnet.solana.com

# Test USDC Token
NEXT_PUBLIC_USDC_MINT_ADDRESS=<your_mint_address>

# Wallets
NEXT_PUBLIC_GAME_TREASURY_WALLET=<treasury_wallet_address>

# Faucet (server-side only, DO NOT add NEXT_PUBLIC_)
FAUCET_WALLET_PRIVATE_KEY=<base58_encoded_private_key_from_faucet-wallet.json>
```

To get base58 private key:
```bash
cat faucet-wallet.json | jq -r '.[:] | @json' | python3 -c "import sys, json, base58; print(base58.b58encode(bytes(json.loads(sys.stdin.read()))).decode())"
```

**Step 6: Create setup script**

File: `scripts/create-token.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Setting up Testnet Token Infrastructure..."

# Check if wallets exist
if [ ! -f "treasury-wallet.json" ]; then
  echo "Creating treasury wallet..."
  solana-keygen new --outfile treasury-wallet.json --no-bip39-passphrase
fi

if [ ! -f "faucet-wallet.json" ]; then
  echo "Creating faucet wallet..."
  solana-keygen new --outfile faucet-wallet.json --no-bip39-passphrase
fi

TREASURY=$(solana address -k treasury-wallet.json)
FAUCET=$(solana address -k faucet-wallet.json)

echo "Treasury: $TREASURY"
echo "Faucet: $FAUCET"

# Airdrop SOL
echo "Airdropping SOL for fees..."
solana airdrop 2 $TREASURY --url testnet
solana airdrop 2 $FAUCET --url testnet

# Create token
echo "Creating SPL Token..."
MINT=$(spl-token create-token --decimals 6 treasury-wallet.json --url testnet | grep -oP 'Creating token \K\w+')

echo "Mint address: $MINT"

# Create account and mint
echo "Creating token account and minting..."
spl-token create-account $MINT --owner faucet-wallet.json --url testnet
spl-token mint $MINT 1000000 --owner treasury-wallet.json --url testnet

echo "✅ Setup complete!"
echo ""
echo "Add to .env.local:"
echo "NEXT_PUBLIC_USDC_MINT_ADDRESS=$MINT"
echo "NEXT_PUBLIC_GAME_TREASURY_WALLET=$TREASURY"
```

**Step 7: Commit configuration**

```bash
git add scripts/create-token.sh .env.local.example
git commit -m "feat: add Testnet token creation script and env template"
```

---

## Phase 2: Network Configuration

### Task 2: Update Wallet Provider for Testnet

**Files:**
- Modify: `components/providers/WalletProvider.tsx`
- Modify: `lib/config/solana.ts` (create if doesn't exist)

**Step 1: Create Solana configuration file**

File: `lib/config/solana.ts`

```typescript
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

export const SOLANA_CONFIG = {
  network: (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork) || WalletAdapterNetwork.Testnet,
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(WalletAdapterNetwork.Testnet),
  usdcMint: process.env.NEXT_PUBLIC_USDC_MINT_ADDRESS || '',
  treasuryWallet: process.env.NEXT_PUBLIC_GAME_TREASURY_WALLET || '',
};

// Validate configuration
if (!SOLANA_CONFIG.usdcMint) {
  console.warn('⚠️ USDC mint address not configured');
}

if (!SOLANA_CONFIG.treasuryWallet) {
  console.warn('⚠️ Treasury wallet not configured');
}

export const getSolanaExplorerUrl = (
  type: 'tx' | 'address' | 'token',
  identifier: string
): string => {
  const cluster = SOLANA_CONFIG.network === WalletAdapterNetwork.Mainnet
    ? ''
    : `?cluster=${SOLANA_CONFIG.network}`;

  return `https://explorer.solana.com/${type}/${identifier}${cluster}`;
};
```

**Step 2: Update WalletProvider to use Testnet**

Find and modify `components/providers/WalletProvider.tsx`:

```typescript
'use client';

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { SOLANA_CONFIG } from '@/lib/config/solana';

require('@solana/wallet-adapter-react-ui/styles.css');

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={SOLANA_CONFIG.rpcUrl}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
```

**Step 3: Verify configuration**

Run the dev server:
```bash
npm run dev
```

Open browser console, should see:
- No warnings about missing config (if .env.local is set)
- Wallet connects to Testnet (check in Phantom/Solflare network indicator)

**Step 4: Commit network configuration**

```bash
git add lib/config/solana.ts components/providers/WalletProvider.tsx
git commit -m "feat: configure Solana Testnet network and explorer URLs"
```

---

## Phase 3: Faucet API Implementation

### Task 3: Create Faucet API Endpoint

**Files:**
- Create: `app/api/faucet/route.ts`
- Create: `lib/services/faucet.ts`
- Create: `lib/utils/rateLimit.ts`

**Step 1: Create rate limiting utility**

File: `lib/utils/rateLimit.ts`

```typescript
interface RateLimitEntry {
  timestamp: number;
  count: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 1,
  windowMs: number = 24 * 60 * 60 * 1000 // 24 hours
): { allowed: boolean; resetAt?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now - entry.timestamp > windowMs) {
    // Reset or first request
    rateLimitStore.set(identifier, { timestamp: now, count: 1 });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    // Rate limited
    const resetAt = entry.timestamp + windowMs;
    return { allowed: false, resetAt };
  }

  // Increment count
  entry.count += 1;
  return { allowed: true };
}

export function clearRateLimitStore() {
  rateLimitStore.clear();
}
```

**Step 2: Create faucet service**

File: `lib/services/faucet.ts`

```typescript
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import bs58 from 'bs58';
import { SOLANA_CONFIG } from '@/lib/config/solana';

const FAUCET_AMOUNT = 100; // 100 USDC per request

export async function distributeFaucetTokens(
  recipientAddress: string
): Promise<{ success: true; txHash: string; amount: number } | { success: false; error: string }> {
  try {
    // Validate inputs
    if (!process.env.FAUCET_WALLET_PRIVATE_KEY) {
      throw new Error('Faucet wallet not configured');
    }

    if (!SOLANA_CONFIG.usdcMint) {
      throw new Error('USDC mint not configured');
    }

    // Initialize connection and wallet
    const connection = new Connection(SOLANA_CONFIG.rpcUrl, 'confirmed');
    const faucetKeypair = Keypair.fromSecretKey(
      bs58.decode(process.env.FAUCET_WALLET_PRIVATE_KEY)
    );
    const recipient = new PublicKey(recipientAddress);
    const usdcMint = new PublicKey(SOLANA_CONFIG.usdcMint);

    // Get token accounts
    const faucetTokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      faucetKeypair.publicKey
    );

    const recipientTokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      recipient
    );

    // Check if recipient token account exists
    const accountInfo = await connection.getAccountInfo(recipientTokenAccount);

    if (!accountInfo) {
      return {
        success: false,
        error: '请先在钱包中添加此代币。Token Mint: ' + SOLANA_CONFIG.usdcMint
      };
    }

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      faucetTokenAccount,
      recipientTokenAccount,
      faucetKeypair.publicKey,
      FAUCET_AMOUNT * 1_000_000, // Convert to smallest unit (6 decimals)
    );

    // Create and send transaction
    const transaction = new Transaction().add(transferInstruction);
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = faucetKeypair.publicKey;

    // Sign and send
    transaction.sign(faucetKeypair);
    const txHash = await connection.sendRawTransaction(transaction.serialize());

    // Confirm transaction
    await connection.confirmTransaction(txHash, 'confirmed');

    return {
      success: true,
      txHash,
      amount: FAUCET_AMOUNT
    };

  } catch (error) {
    console.error('Faucet error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

**Step 3: Create API route**

File: `app/api/faucet/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { distributeFaucetTokens } from '@/lib/services/faucet';
import { checkRateLimit } from '@/lib/utils/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    // Validate wallet address
    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json(
        { success: false, error: '无效的钱包地址' },
        { status: 400 }
      );
    }

    // Rate limiting (1 request per 24 hours per wallet)
    const rateLimitCheck = checkRateLimit(walletAddress, 1, 24 * 60 * 60 * 1000);

    if (!rateLimitCheck.allowed) {
      const resetDate = new Date(rateLimitCheck.resetAt!);
      return NextResponse.json(
        {
          success: false,
          error: `每个钱包每24小时只能领取一次。下次可领取时间: ${resetDate.toLocaleString('zh-CN')}`
        },
        { status: 429 }
      );
    }

    // Distribute tokens
    const result = await distributeFaucetTokens(walletAddress);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      txHash: result.txHash,
      amount: result.amount,
      message: `成功领取 ${result.amount} USDC`
    });

  } catch (error) {
    console.error('Faucet API error:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
```

**Step 4: Test faucet API**

Start dev server:
```bash
npm run dev
```

Test with curl (replace with your wallet address):
```bash
curl -X POST http://localhost:3000/api/faucet \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"YOUR_TESTNET_WALLET_ADDRESS"}'
```

Expected response:
```json
{
  "success": true,
  "txHash": "...",
  "amount": 100,
  "message": "成功领取 100 USDC"
}
```

**Step 5: Commit faucet implementation**

```bash
git add app/api/faucet/ lib/services/faucet.ts lib/utils/rateLimit.ts
git commit -m "feat: implement faucet API for test USDC distribution"
```

---

## Phase 4: Faucet UI Integration

### Task 4: Create Faucet UI Components

**Files:**
- Create: `components/FaucetButton.tsx`
- Create: `hooks/useTokenBalance.ts`
- Modify: `components/Header.tsx` (or wherever wallet button is)

**Step 1: Create token balance hook**

File: `hooks/useTokenBalance.ts`

```typescript
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { useEffect, useState } from 'react';
import { SOLANA_CONFIG } from '@/lib/config/solana';

export function useTokenBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    if (!publicKey || !SOLANA_CONFIG.usdcMint) {
      setBalance(null);
      return;
    }

    try {
      setLoading(true);
      const usdcMint = new PublicKey(SOLANA_CONFIG.usdcMint);
      const tokenAccount = await getAssociatedTokenAddress(usdcMint, publicKey);

      const accountInfo = await getAccount(connection, tokenAccount);
      const balanceInSmallestUnit = Number(accountInfo.amount);
      const balanceInUsdc = balanceInSmallestUnit / 1_000_000; // 6 decimals

      setBalance(balanceInUsdc);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(0); // Account doesn't exist yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();

    // Refresh balance every 10 seconds
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  return { balance, loading, refetch: fetchBalance };
}
```

**Step 2: Create FaucetButton component**

File: `components/FaucetButton.tsx`

```typescript
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { getSolanaExplorerUrl } from '@/lib/config/solana';

export function FaucetButton() {
  const { publicKey } = useWallet();
  const { balance, refetch } = useTokenBalance();
  const [loading, setLoading] = useState(false);

  const handleFaucet = async () => {
    if (!publicKey) {
      toast.error('请先连接钱包');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toBase58() })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          <div>
            {data.message}
            <a
              href={getSolanaExplorerUrl('tx', data.txHash)}
              target="_blank"
              className="block text-xs text-blue-400 hover:underline mt-1"
            >
              查看交易 ↗
            </a>
          </div>,
          { duration: 5000 }
        );

        // Refresh balance after 2 seconds
        setTimeout(() => refetch(), 2000);
      } else {
        toast.error(data.error || '领取失败');
      }
    } catch (error) {
      console.error('Faucet error:', error);
      toast.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm">
        余额: {balance !== null ? `${balance.toFixed(2)} USDC` : '...'}
      </div>
      <button
        onClick={handleFaucet}
        disabled={loading}
        className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-md transition-colors flex items-center gap-1"
      >
        {loading ? '领取中...' : '💧 领取'}
      </button>
    </div>
  );
}
```

**Step 3: Add FaucetButton to Header**

Find your header/navigation component and add:

```typescript
import { FaucetButton } from '@/components/FaucetButton';

// Inside your Header component
<div className="flex items-center gap-4">
  <FaucetButton />
  <WalletMultiButton />
</div>
```

**Step 4: Add first-time user guidance**

File: `components/WalletConnectionGuide.tsx`

```typescript
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTokenBalance } from '@/hooks/useTokenBalance';

export function WalletConnectionGuide() {
  const { publicKey } = useWallet();
  const { balance } = useTokenBalance();
  const [hasShownGuide, setHasShownGuide] = useState(false);

  useEffect(() => {
    if (publicKey && balance !== null && balance < 10 && !hasShownGuide) {
      setHasShownGuide(true);

      toast.info(
        <div>
          <p className="font-semibold">余额不足！</p>
          <p className="text-sm">点击右上角"💧 领取"按钮获取 100 测试 USDC</p>
        </div>,
        { duration: 8000 }
      );
    }
  }, [publicKey, balance, hasShownGuide]);

  return null;
}
```

Add to your root layout or main page:

```typescript
import { WalletConnectionGuide } from '@/components/WalletConnectionGuide';

// In your component
<>
  <WalletConnectionGuide />
  {/* rest of your app */}
</>
```

**Step 5: Test faucet UI**

1. Connect wallet (Testnet)
2. Should see balance: 0 USDC
3. Should see toast: "余额不足！点击领取..."
4. Click "💧 领取" button
5. Should see success toast with transaction link
6. Balance should update to 100 USDC after ~2 seconds

**Step 6: Commit faucet UI**

```bash
git add components/FaucetButton.tsx hooks/useTokenBalance.ts components/WalletConnectionGuide.tsx components/Header.tsx
git commit -m "feat: add faucet UI with balance display and first-time guidance"
```

---

## Phase 5: x402 Payment Integration

### Task 5: Integrate x402 SDK for Real Payments

**Files:**
- Create: `lib/services/x402Payment.ts`
- Create: `components/providers/X402Provider.tsx`
- Modify: `app/layout.tsx`

**Step 1: Create X402 Provider wrapper**

File: `components/providers/X402Provider.tsx`

```typescript
'use client';

import { ReactNode } from 'react';
import { X402Provider as PayAIProvider } from '@payai/x402-solana-react';
import { SOLANA_CONFIG } from '@/lib/config/solana';

interface X402ProviderProps {
  children: ReactNode;
}

export function X402Provider({ children }: X402ProviderProps) {
  return (
    <PayAIProvider
      network={SOLANA_CONFIG.network}
      config={{
        // x402 SDK configuration
        autoConnect: true,
      }}
    >
      {children}
    </PayAIProvider>
  );
}
```

**Step 2: Wrap app with X402Provider**

Modify `app/layout.tsx`:

```typescript
import { WalletProvider } from '@/components/providers/WalletProvider';
import { X402Provider } from '@/components/providers/X402Provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <WalletProvider>
          <X402Provider>
            {children}
          </X402Provider>
        </WalletProvider>
      </body>
    </html>
  );
}
```

**Step 3: Create x402 payment service**

File: `lib/services/x402Payment.ts`

```typescript
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import { SOLANA_CONFIG } from '@/lib/config/solana';

export interface PaymentResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export function useX402Payment() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const pay = async (
    amount: number,
    recipient?: string
  ): Promise<PaymentResult> => {
    try {
      if (!publicKey) {
        return { success: false, error: '钱包未连接' };
      }

      if (!SOLANA_CONFIG.usdcMint) {
        return { success: false, error: 'USDC 代币未配置' };
      }

      const usdcMint = new PublicKey(SOLANA_CONFIG.usdcMint);
      const recipientPubkey = new PublicKey(
        recipient || SOLANA_CONFIG.treasuryWallet
      );

      // Get token accounts
      const senderTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        publicKey
      );

      const recipientTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        recipientPubkey
      );

      // Create transfer instruction
      const transferInstruction = createTransferInstruction(
        senderTokenAccount,
        recipientTokenAccount,
        publicKey,
        Math.floor(amount * 1_000_000) // Convert to smallest unit
      );

      // Build transaction
      const transaction = new Transaction().add(transferInstruction);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send transaction
      const txHash = await sendTransaction(transaction, connection);

      // Wait for confirmation
      await connection.confirmTransaction(txHash, 'confirmed');

      return {
        success: true,
        txHash
      };

    } catch (error) {
      console.error('Payment error:', error);

      // Parse common errors
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          return { success: false, error: '用户取消了交易' };
        }
        if (error.message.includes('insufficient funds')) {
          return { success: false, error: 'USDC 余额不足' };
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : '支付失败'
      };
    }
  };

  return { pay };
}
```

**Step 4: Test payment service**

Create a test component to verify payment works:

File: `components/TestPayment.tsx` (temporary, for testing)

```typescript
'use client';

import { useX402Payment } from '@/lib/services/x402Payment';
import { toast } from 'sonner';

export function TestPayment() {
  const { pay } = useX402Payment();

  const handleTestPayment = async () => {
    toast.info('发起测试支付: 0.01 USDC');

    const result = await pay(0.01);

    if (result.success) {
      toast.success(`支付成功！TxHash: ${result.txHash?.slice(0, 8)}...`);
    } else {
      toast.error(result.error || '支付失败');
    }
  };

  return (
    <button
      onClick={handleTestPayment}
      className="px-4 py-2 bg-green-500 text-white rounded"
    >
      测试支付 0.01 USDC
    </button>
  );
}
```

Add to your page temporarily, test:
1. Click "测试支付"
2. Wallet should prompt for signature
3. After signing, should see success toast with txHash
4. Check Solana Explorer to verify transaction

**Step 5: Commit x402 integration**

```bash
git add lib/services/x402Payment.ts components/providers/X402Provider.tsx app/layout.tsx
git commit -m "feat: integrate x402 payment system with SPL token transfers"
```

---

## Phase 6: Update Pixel Conquest with Real Payments

### Task 6: Replace Mock Payment in Pixel Conquest

**Files:**
- Modify: `components/PixelInfoModal.tsx`
- Modify: `components/BatchConquerModal.tsx`
- Modify: `lib/services/pixelConquest.ts`

**Step 1: Update pixelConquest service to use real payment**

File: `lib/services/pixelConquest.ts`

Find the payment call and replace:

```typescript
// OLD (mock payment):
import { mockX402Payment } from '@/lib/solana/mockPayment';
const paymentResult = await mockX402Payment(connection, walletAddress, price);

// NEW (real payment):
import { useX402Payment } from '@/lib/services/x402Payment';

// This service needs to be converted to a hook or receive payment function
// Let's refactor to make it cleaner
```

Actually, let's refactor the conquest flow to use the hook directly in components.

**Step 2: Update PixelInfoModal to use real payment**

File: `components/PixelInfoModal.tsx`

Find the conquer function and update:

```typescript
'use client';

import { useX402Payment } from '@/lib/services/x402Payment';
import { getSolanaExplorerUrl } from '@/lib/config/solana';
// ... other imports

export function PixelInfoModal({ pixel, onClose }: Props) {
  const { pay } = useX402Payment();
  const [loading, setLoading] = useState(false);

  const handleConquer = async () => {
    setLoading(true);

    try {
      // Step 1: Payment via x402
      toast.info(`支付 ${pixel.currentPrice} USDC...`);

      const paymentResult = await pay(pixel.currentPrice);

      if (!paymentResult.success) {
        toast.error(paymentResult.error || '支付失败');
        return;
      }

      toast.success(
        <div>
          支付成功！
          <a
            href={getSolanaExplorerUrl('tx', paymentResult.txHash!)}
            target="_blank"
            className="block text-xs text-blue-400 hover:underline mt-1"
          >
            查看交易 ↗
          </a>
        </div>
      );

      // Step 2: Update database
      toast.info('更新像素状态...');

      const { data, error } = await supabase.rpc('conquer_pixel_wallet', {
        p_pixel_x: pixel.x,
        p_pixel_y: pixel.y,
        p_wallet_address: wallet.publicKey!.toBase58(),
        p_new_color: selectedColor,
        p_tx_hash: paymentResult.txHash
      });

      if (error) {
        toast.error('数据库更新失败: ' + error.message);
        return;
      }

      toast.success('占领成功！');
      onClose();

    } catch (error) {
      console.error('Conquest error:', error);
      toast.error('占领失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... rest of component
    <button onClick={handleConquer} disabled={loading}>
      {loading ? '处理中...' : `占领 (${pixel.currentPrice} USDC)`}
    </button>
  );
}
```

**Step 3: Update BatchConquerModal similarly**

File: `components/BatchConquerModal.tsx`

```typescript
'use client';

import { useX402Payment } from '@/lib/services/x402Payment';
// ... other imports

export function BatchConquerModal({ pixels, onClose }: Props) {
  const { pay } = useX402Payment();
  const [loading, setLoading] = useState(false);

  const totalCost = pixels.reduce((sum, p) => sum + p.currentPrice, 0);

  const handleBatchConquer = async () => {
    setLoading(true);

    try {
      // Step 1: Single payment for total amount
      toast.info(`支付 ${totalCost.toFixed(6)} USDC...`);

      const paymentResult = await pay(totalCost);

      if (!paymentResult.success) {
        toast.error(paymentResult.error || '支付失败');
        return;
      }

      toast.success(`支付成功！共 ${totalCost.toFixed(6)} USDC`);

      // Step 2: Batch update database
      toast.info(`占领 ${pixels.length} 个像素...`);

      const { data, error } = await supabase.rpc('conquer_pixels_batch', {
        p_pixels: pixels.map(p => ({
          x: p.x,
          y: p.y,
          color: selectedColor
        })),
        p_wallet_address: wallet.publicKey!.toBase58(),
        p_tx_hash: paymentResult.txHash
      });

      if (error) {
        toast.error('批量占领失败: ' + error.message);
        return;
      }

      const successCount = data?.filter((r: any) => r.success).length || 0;
      toast.success(`成功占领 ${successCount} 个像素！`);
      onClose();

    } catch (error) {
      console.error('Batch conquest error:', error);
      toast.error('批量占领失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... rest of component
    <button onClick={handleBatchConquer} disabled={loading}>
      {loading ? '处理中...' : `占领 ${pixels.length} 个像素 (${totalCost.toFixed(6)} USDC)`}
    </button>
  );
}
```

**Step 4: Test pixel conquest with real payment**

1. Connect wallet with test USDC
2. Click a pixel
3. Click "占领"
4. Wallet prompts for payment signature
5. After signing, see payment success + database update
6. Pixel should update in real-time

**Step 5: Commit real payment integration**

```bash
git add components/PixelInfoModal.tsx components/BatchConquerModal.tsx
git commit -m "feat: replace mock payment with real x402 USDC transfers"
```

---

## Phase 7: Database Schema Updates

### Task 7: Add Transaction Tracking to Database

**Files:**
- Create: `supabase/migrations/add_transaction_tracking.sql`
- Modify: `supabase/schema-wallet-bridge.sql` (update RPC functions)

**Step 1: Create migration for transaction tracking**

File: `supabase/migrations/add_transaction_tracking.sql`

```sql
-- Add transaction tracking columns to pixels table
ALTER TABLE pixels
ADD COLUMN IF NOT EXISTS last_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS last_tx_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tx_count INTEGER DEFAULT 0;

-- Create index for transaction lookups
CREATE INDEX IF NOT EXISTS idx_pixels_tx_hash ON pixels(last_tx_hash);

-- Create transaction history table (optional but recommended)
CREATE TABLE IF NOT EXISTS pixel_transactions (
  id BIGSERIAL PRIMARY KEY,
  pixel_x INTEGER NOT NULL,
  pixel_y INTEGER NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  from_wallet TEXT,
  to_wallet TEXT NOT NULL,
  usdc_amount DECIMAL(18, 6) NOT NULL,
  tx_timestamp TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_pixel
    FOREIGN KEY (pixel_x, pixel_y)
    REFERENCES pixels(x, y)
    ON DELETE CASCADE
);

-- Indexes for transaction history
CREATE INDEX IF NOT EXISTS idx_tx_to_wallet ON pixel_transactions(to_wallet);
CREATE INDEX IF NOT EXISTS idx_tx_timestamp ON pixel_transactions(tx_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tx_pixel ON pixel_transactions(pixel_x, pixel_y);

COMMENT ON TABLE pixel_transactions IS 'Complete history of all pixel conquest transactions on Solana';
COMMENT ON COLUMN pixel_transactions.tx_hash IS 'Solana transaction hash (signature)';
COMMENT ON COLUMN pixel_transactions.usdc_amount IS 'Amount paid in USDC (6 decimals)';
```

**Step 2: Update conquer_pixel_wallet RPC function**

File: `supabase/schema-wallet-bridge.sql`

Add `p_tx_hash` parameter to function:

```sql
CREATE OR REPLACE FUNCTION conquer_pixel_wallet(
  p_pixel_x INTEGER,
  p_pixel_y INTEGER,
  p_wallet_address VARCHAR,
  p_new_color VARCHAR,
  p_tx_hash TEXT  -- NEW parameter
) RETURNS JSONB AS $$
DECLARE
  v_pixel RECORD;
  v_new_price DECIMAL(10, 6);
  v_previous_owner VARCHAR;
  v_price_paid DECIMAL(10, 6);
BEGIN
  -- Lock the pixel row
  SELECT * INTO v_pixel
  FROM pixels
  WHERE x = p_pixel_x AND y = p_pixel_y
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pixel not found');
  END IF;

  -- Check if already owned (skip gracefully)
  IF v_pixel.wallet_owner = p_wallet_address THEN
    RETURN jsonb_build_object(
      'success', true,
      'skipped', true,
      'reason', 'Already owned',
      'pixel', row_to_json(v_pixel),
      'transaction', jsonb_build_object(
        'pricePaid', 0,
        'newPrice', v_pixel.current_price
      )
    );
  END IF;

  -- Calculate new price (current price * 1.2)
  v_new_price := v_pixel.current_price * 1.2;
  v_previous_owner := v_pixel.wallet_owner;
  v_price_paid := v_pixel.current_price;

  -- Update pixel
  UPDATE pixels SET
    wallet_owner = p_wallet_address,
    current_color = p_new_color,
    current_price = v_new_price,
    conquest_count = conquest_count + 1,
    last_conquered_at = NOW(),
    last_tx_hash = p_tx_hash,           -- NEW
    last_tx_timestamp = NOW(),           -- NEW
    tx_count = COALESCE(tx_count, 0) + 1 -- NEW
  WHERE x = p_pixel_x AND y = p_pixel_y;

  -- Insert transaction record (NEW)
  INSERT INTO pixel_transactions (
    pixel_x,
    pixel_y,
    tx_hash,
    from_wallet,
    to_wallet,
    usdc_amount
  ) VALUES (
    p_pixel_x,
    p_pixel_y,
    p_tx_hash,
    v_previous_owner,
    p_wallet_address,
    v_price_paid
  );

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'txHash', p_tx_hash,  -- NEW: return tx hash
    'pixel', jsonb_build_object(
      'x', p_pixel_x,
      'y', p_pixel_y,
      'currentColor', p_new_color,
      'walletOwner', p_wallet_address,
      'currentPrice', v_new_price,
      'conquestCount', v_pixel.conquest_count + 1,
      'lastTxHash', p_tx_hash  -- NEW
    ),
    'transaction', jsonb_build_object(
      'pricePaid', v_price_paid,
      'newPrice', v_new_price,
      'previousOwner', v_previous_owner
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Step 3: Update batch conquest function similarly**

```sql
CREATE OR REPLACE FUNCTION conquer_pixels_batch(
  p_pixels JSONB,
  p_wallet_address VARCHAR,
  p_tx_hash TEXT  -- NEW parameter
) RETURNS JSONB[] AS $$
DECLARE
  v_result JSONB[];
  v_pixel JSONB;
  v_conquest_result JSONB;
BEGIN
  v_result := ARRAY[]::JSONB[];

  FOR v_pixel IN SELECT * FROM jsonb_array_elements(p_pixels)
  LOOP
    -- Call single pixel conquest with tx_hash
    v_conquest_result := conquer_pixel_wallet(
      (v_pixel->>'x')::INTEGER,
      (v_pixel->>'y')::INTEGER,
      p_wallet_address,
      v_pixel->>'color',
      p_tx_hash || '_' || (v_pixel->>'x') || '_' || (v_pixel->>'y')  -- Unique hash per pixel
    );

    v_result := array_append(v_result, v_conquest_result);
  END LOOP;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Step 4: Execute migration in Supabase**

Go to Supabase Dashboard → SQL Editor, run:
```sql
-- Copy and paste content from add_transaction_tracking.sql
```

Or use Supabase CLI:
```bash
supabase db push
```

**Step 5: Verify schema changes**

Query to check:
```sql
-- Check new columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pixels'
AND column_name IN ('last_tx_hash', 'last_tx_timestamp', 'tx_count');

-- Check transaction history table
SELECT * FROM pixel_transactions LIMIT 5;
```

**Step 6: Commit database changes**

```bash
git add supabase/migrations/add_transaction_tracking.sql supabase/schema-wallet-bridge.sql
git commit -m "feat: add Solana transaction tracking to database schema"
```

---

## Phase 8: UI Polish and Text Updates

### Task 8: Update All UI Text from "x402" to "USDC"

**Files:**
- Modify: All components that display payment amounts
- Modify: Toast messages
- Modify: Button labels

**Step 1: Search for incorrect "x402" references**

```bash
# Find all files mentioning "x402" in context of amounts
grep -r "x402" --include="*.tsx" --include="*.ts" app/ components/ lib/
```

**Step 2: Update common patterns**

Replace these patterns across all files:

```typescript
// ❌ WRONG
"支付 0.012 x402"
"{amount} x402"
"余额: {balance} x402"

// ✅ CORRECT
"支付 0.012 USDC"
"{amount} USDC"
"余额: {balance} USDC"
```

**Step 3: Update specific files**

Example fixes:

`components/PixelInfoModal.tsx`:
```typescript
// Old
<p>价格: {pixel.currentPrice} x402</p>
<button>占领 ({pixel.currentPrice} x402)</button>

// New
<p>价格: {pixel.currentPrice} USDC</p>
<button>占领 ({pixel.currentPrice} USDC)</button>
```

`components/BatchConquerModal.tsx`:
```typescript
// Old
<p>总费用: {totalCost} x402</p>

// New
<p>总费用: {totalCost} USDC</p>
```

`components/FaucetButton.tsx`:
```typescript
// Already correct - uses "USDC"
```

**Step 4: Add payment method explanation (optional)**

In modal or info section:
```typescript
<div className="text-xs text-gray-500">
  使用 x402 协议支付 USDC
</div>
```

**Step 5: Update transaction success messages**

```typescript
toast.success(
  <div>
    <p>支付成功！金额: {amount} USDC</p>
    <p className="text-xs">通过 x402 协议</p>
  </div>
);
```

**Step 6: Commit text updates**

```bash
git add .
git commit -m "fix: update UI text - x402 is protocol, USDC is token"
```

---

## Phase 9: End-to-End Testing

### Task 9: Comprehensive Testing

**Step 1: Test token account creation**

```bash
# User's first time connecting wallet won't have token account
# They need to create it first

# Create a new test wallet
solana-keygen new --outfile test-user-wallet.json

# Get test USDC from faucet (this should fail gracefully)
# Then guide user to create token account
```

**Step 2: Add token account creation to faucet**

Update `lib/services/faucet.ts` to create token account if it doesn't exist:

```typescript
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount
} from '@solana/spl-token';

// In distributeFaucetTokens function:

// Check if recipient token account exists
let recipientTokenAccount = await getAssociatedTokenAddress(
  usdcMint,
  recipient
);

const accountInfo = await connection.getAccountInfo(recipientTokenAccount);

const transaction = new Transaction();

if (!accountInfo) {
  // Create associated token account
  const createAccountIx = createAssociatedTokenAccountInstruction(
    faucetKeypair.publicKey, // payer
    recipientTokenAccount,    // account to create
    recipient,                // owner
    usdcMint                  // mint
  );
  transaction.add(createAccountIx);
}

// Add transfer instruction
const transferIx = createTransferInstruction(
  faucetTokenAccount,
  recipientTokenAccount,
  faucetKeypair.publicKey,
  FAUCET_AMOUNT * 1_000_000
);
transaction.add(transferIx);

// Send transaction
const { blockhash } = await connection.getLatestBlockhash();
transaction.recentBlockhash = blockhash;
transaction.feePayer = faucetKeypair.publicKey;
transaction.sign(faucetKeypair);

const txHash = await connection.sendRawTransaction(transaction.serialize());
await connection.confirmTransaction(txHash, 'confirmed');
```

**Step 3: Testing checklist**

Test each scenario:

- [ ] **New wallet first connection**
  - Connect wallet (no USDC yet)
  - See "余额不足" toast
  - Click "💧 领取"
  - Token account created + 100 USDC received
  - Balance updates to 100 USDC

- [ ] **Single pixel conquest**
  - Click pixel
  - See current price (e.g., 0.012 USDC)
  - Click "占领"
  - Wallet prompts for signature
  - After signing: payment success toast with tx link
  - Pixel updates color
  - Other users see real-time update
  - Check Solana Explorer: transaction exists

- [ ] **Batch pixel conquest**
  - Select 5 pixels (Shift+click)
  - Click "批量占领"
  - See total cost (e.g., 0.06 USDC)
  - Wallet prompts for signature
  - After signing: all 5 pixels update
  - Transaction exists on-chain

- [ ] **Insufficient balance**
  - Try to conquer pixel with insufficient USDC
  - See error: "USDC 余额不足"
  - Guided to faucet

- [ ] **User cancels transaction**
  - Click "占领"
  - Reject in wallet
  - See error: "用户取消了交易"
  - Pixel unchanged

- [ ] **Rate limiting**
  - Get faucet tokens
  - Try to get again immediately
  - See error: "每个钱包每24小时只能领取一次"

- [ ] **Multi-user real-time sync**
  - Open 3 browser windows
  - 3 different wallets
  - User A conquers pixel
  - Users B and C see update instantly
  - User B conquers same pixel (higher price)
  - All users see update

- [ ] **Transaction verification**
  - Conquer pixel
  - Get tx hash from toast
  - Visit Solana Explorer link
  - Verify: sender, recipient, amount match
  - Check database: last_tx_hash matches

**Step 4: Performance testing**

- [ ] Balance updates within 2 seconds of faucet
- [ ] Pixel conquest completes in < 5 seconds
- [ ] Real-time sync delay < 1 second
- [ ] UI remains responsive during payments

**Step 5: Document test results**

Create: `docs/testing/testnet-integration-results.md`

```markdown
# Testnet Integration Test Results

**Date**: 2026-01-24
**Network**: Solana Testnet
**Token**: Custom USDC (Mint: <address>)

## Test Environment
- Wallets: 3 test wallets
- Initial USDC: 100 per wallet
- RPC: https://api.testnet.solana.com

## Test Results

### ✅ Faucet System
- Token account creation: PASS
- 100 USDC distribution: PASS
- Rate limiting: PASS
- Balance display: PASS

### ✅ Single Conquest
- Payment flow: PASS
- Transaction confirmation: PASS
- Database update: PASS
- Real-time sync: PASS

### ✅ Batch Conquest
- Multi-pixel payment: PASS
- Transaction confirmation: PASS
- All pixels update: PASS

### ✅ Error Handling
- Insufficient balance: PASS
- User cancellation: PASS
- Network errors: PASS

### ⚠️ Known Issues
- [List any issues found]

## Transaction Examples
- Single conquest: <tx_hash>
- Batch conquest: <tx_hash>
- Faucet distribution: <tx_hash>
```

**Step 6: Commit testing updates**

```bash
git add lib/services/faucet.ts docs/testing/testnet-integration-results.md
git commit -m "feat: add token account auto-creation to faucet"
```

---

## Phase 10: Documentation and Deployment

### Task 10: Update Documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/DEPLOYMENT.md`
- Modify: `docs/USER_GUIDE.md`
- Create: `docs/TESTNET_SETUP.md`

**Step 1: Update main README**

File: `README.md`

Add section about Testnet:

```markdown
## 🌐 Network Configuration

**Current Network**: Solana Testnet

This application uses **real Solana transactions** on Testnet for pixel conquest payments.

### Payment System
- **Protocol**: x402 (payment method)
- **Token**: USDC (what you pay)
- **Network**: Solana Testnet

### Getting Test USDC
1. Connect your Solana wallet (Phantom/Solflare)
2. Switch to **Testnet** in wallet settings
3. Click "💧 领取" in the app header
4. Receive 100 test USDC (once per 24 hours)

### Transaction Verification
Every pixel conquest generates a real Solana transaction. Click "查看交易 ↗" in success messages to view on Solana Explorer.
```

**Step 2: Create Testnet setup guide**

File: `docs/TESTNET_SETUP.md`

```markdown
# Testnet Setup Guide

Complete guide for setting up and testing the payment system on Solana Testnet.

## Prerequisites
- Solana CLI installed
- Node.js 18+
- Phantom or Solflare wallet

## Token Creation

### 1. Create Wallets
```bash
# Treasury wallet
solana-keygen new --outfile treasury-wallet.json

# Faucet wallet
solana-keygen new --outfile faucet-wallet.json
```

### 2. Airdrop SOL
```bash
solana airdrop 2 $(solana address -k treasury-wallet.json) --url testnet
solana airdrop 2 $(solana address -k faucet-wallet.json) --url testnet
```

### 3. Create USDC Token
```bash
spl-token create-token --decimals 6 treasury-wallet.json --url testnet
```

### 4. Mint Initial Supply
```bash
MINT_ADDRESS=<your_mint_address>

spl-token create-account $MINT_ADDRESS --owner faucet-wallet.json --url testnet
spl-token mint $MINT_ADDRESS 1000000 --owner treasury-wallet.json --url testnet
```

## Environment Configuration

`.env.local`:
```bash
NEXT_PUBLIC_SOLANA_NETWORK=testnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.testnet.solana.com
NEXT_PUBLIC_USDC_MINT_ADDRESS=<mint_address>
NEXT_PUBLIC_GAME_TREASURY_WALLET=<treasury_address>
FAUCET_WALLET_PRIVATE_KEY=<base58_private_key>
```

## Testing

### Manual Testing
1. Connect wallet (Testnet)
2. Get USDC from faucet
3. Conquer a pixel
4. Verify transaction on Explorer

### Automated Testing
```bash
npm run test:payment
```

## Troubleshooting

**Issue**: "Token account not found"
**Solution**: Faucet auto-creates token accounts on first request

**Issue**: "Insufficient SOL for transaction fees"
**Solution**: Airdrop more SOL to your wallet from https://faucet.solana.com

**Issue**: "Rate limited"
**Solution**: Wait 24 hours or use different wallet
```

**Step 3: Update deployment guide**

File: `docs/DEPLOYMENT.md`

Add section:

```markdown
## Testnet Configuration

### Required Environment Variables (Vercel)

```bash
# Solana
NEXT_PUBLIC_SOLANA_NETWORK=testnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.testnet.solana.com
NEXT_PUBLIC_USDC_MINT_ADDRESS=<your_mint>
NEXT_PUBLIC_GAME_TREASURY_WALLET=<your_treasury>

# Faucet (Secret)
FAUCET_WALLET_PRIVATE_KEY=<your_private_key>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=<your_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_key>
```

### Security Notes
- Never commit wallet private keys
- Use Vercel environment variables for secrets
- Faucet wallet only holds test tokens (safe to automate)
```

**Step 4: Commit documentation**

```bash
git add README.md docs/TESTNET_SETUP.md docs/DEPLOYMENT.md
git commit -m "docs: add Testnet setup and configuration guides"
```

---

## Final Checklist

### Before Considering Complete

- [ ] **Token Infrastructure**
  - [ ] Custom USDC token created on Testnet
  - [ ] Faucet wallet funded with tokens
  - [ ] Treasury wallet configured

- [ ] **Payment System**
  - [ ] x402 SDK integrated
  - [ ] Real SPL token transfers working
  - [ ] Transaction hashes stored in database
  - [ ] Error handling complete

- [ ] **Faucet System**
  - [ ] API endpoint working
  - [ ] Auto-creates token accounts
  - [ ] Rate limiting functional
  - [ ] UI integrated (button + guidance)

- [ ] **Database**
  - [ ] Transaction tracking fields added
  - [ ] RPC functions updated
  - [ ] Transaction history table created
  - [ ] Migration executed

- [ ] **UI Updates**
  - [ ] All "x402 amount" changed to "USDC"
  - [ ] Balance display shows USDC
  - [ ] Transaction links to Explorer
  - [ ] First-time user guidance

- [ ] **Testing**
  - [ ] New user flow tested
  - [ ] Single conquest tested
  - [ ] Batch conquest tested
  - [ ] Error scenarios tested
  - [ ] Multi-user sync tested
  - [ ] All tests documented

- [ ] **Documentation**
  - [ ] README updated
  - [ ] Testnet setup guide created
  - [ ] Deployment guide updated
  - [ ] User guide updated

### Success Criteria

**The system is complete when:**
1. New user can connect wallet, get USDC, and conquer pixels
2. Every conquest creates real Solana transaction
3. Transaction hash is verifiable on Solana Explorer
4. Real-time sync still works perfectly
5. All UI text correctly distinguishes x402 (protocol) vs USDC (token)
6. Multi-user testing shows no race conditions
7. Documentation is complete and accurate

---

## Time Estimates

- **Phase 1**: Token Infrastructure (1-2 hours)
- **Phase 2**: Network Configuration (30 min)
- **Phase 3**: Faucet API (2 hours)
- **Phase 4**: Faucet UI (1 hour)
- **Phase 5**: x402 Integration (2 hours)
- **Phase 6**: Update Conquest (2 hours)
- **Phase 7**: Database Updates (1 hour)
- **Phase 8**: UI Polish (1 hour)
- **Phase 9**: Testing (2-3 hours)
- **Phase 10**: Documentation (1 hour)

**Total**: ~14-16 hours (fits in 2 days)

---

## Notes

- Keep mock payment code for reference (don't delete yet)
- Test on Testnet first before considering Mainnet
- Faucet private key is low-risk (only test tokens)
- Consider adding transaction history view later
- Real-time sync is critical - test thoroughly

---

**Implementation Ready**: This plan can now be executed task-by-task using superpowers:executing-plans skill.
