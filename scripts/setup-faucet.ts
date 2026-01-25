/**
 * Setup Faucet Wallet
 * - Check if USDC token account exists
 * - Create token account if needed
 * - Display account information
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';
import bs58 from 'bs58';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local
function loadEnvFile(): Record<string, string> {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const env: Record<string, string> = {};

    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
          env[key.trim()] = values.join('=').trim();
        }
      }
    });

    return env;
  } catch (error) {
    console.error('无法读取 .env.local 文件');
    return {};
  }
}

const env = loadEnvFile();
const SOLANA_RPC_URL = env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const USDC_MINT_ADDRESS = env.NEXT_PUBLIC_USDC_MINT_ADDRESS;
const FAUCET_PRIVATE_KEY = env.FAUCET_WALLET_PRIVATE_KEY;

async function setupFaucet() {
  console.log('\n========================================');
  console.log('💰 Faucet 钱包设置');
  console.log('========================================\n');

  // Validate environment variables
  if (!FAUCET_PRIVATE_KEY) {
    console.error('❌ 错误: FAUCET_WALLET_PRIVATE_KEY 未设置');
    console.log('请在 .env.local 文件中设置 FAUCET_WALLET_PRIVATE_KEY\n');
    process.exit(1);
  }

  if (!USDC_MINT_ADDRESS) {
    console.error('❌ 错误: NEXT_PUBLIC_USDC_MINT_ADDRESS 未设置');
    console.log('请在 .env.local 文件中设置 NEXT_PUBLIC_USDC_MINT_ADDRESS\n');
    process.exit(1);
  }

  try {
    // Initialize connection
    console.log('🔗 连接到 Solana RPC:', SOLANA_RPC_URL);
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

    // Load faucet keypair
    const faucetKeypair = Keypair.fromSecretKey(bs58.decode(FAUCET_PRIVATE_KEY));
    const faucetAddress = faucetKeypair.publicKey.toBase58();
    console.log('📍 Faucet 地址:', faucetAddress);

    // Check SOL balance
    const solBalance = await connection.getBalance(faucetKeypair.publicKey);
    console.log('💎 SOL 余额:', (solBalance / LAMPORTS_PER_SOL).toFixed(4), 'SOL');

    if (solBalance === 0) {
      console.log('\n⚠️  警告: Faucet 钱包没有 SOL！');
      console.log('请先给钱包转入一些 SOL 用于支付交易费用。');
      console.log('可以访问: https://faucet.solana.com/?address=' + faucetAddress);
      console.log('');
    }

    // Parse USDC mint address
    const usdcMintPublicKey = new PublicKey(USDC_MINT_ADDRESS);
    console.log('🪙  USDC Mint 地址:', USDC_MINT_ADDRESS);

    // Get associated token address
    const faucetTokenAccount = await getAssociatedTokenAddress(
      usdcMintPublicKey,
      faucetKeypair.publicKey
    );
    console.log('📦 Token 账户地址:', faucetTokenAccount.toBase58());

    // Check if token account exists
    let tokenAccountExists = false;
    let tokenBalance = 0;

    try {
      const account = await getAccount(connection, faucetTokenAccount);
      tokenAccountExists = true;
      tokenBalance = Number(account.amount) / Math.pow(10, 6); // USDC has 6 decimals
      console.log('✅ Token 账户已存在');
      console.log('💰 USDC 余额:', tokenBalance.toFixed(2), 'USDC');
    } catch (error) {
      console.log('❌ Token 账户不存在，需要创建');
    }

    // Create token account if it doesn't exist
    if (!tokenAccountExists) {
      if (solBalance < 0.01 * LAMPORTS_PER_SOL) {
        console.log('\n❌ 错误: SOL 余额不足，无法创建 token 账户');
        console.log('需要至少 0.01 SOL 来创建账户');
        console.log('请访问: https://faucet.solana.com/?address=' + faucetAddress);
        console.log('');
        process.exit(1);
      }

      console.log('\n📝 正在创建 token 账户...');

      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          faucetKeypair.publicKey, // payer
          faucetTokenAccount, // associated token account
          faucetKeypair.publicKey, // owner
          usdcMintPublicKey // mint
        )
      );

      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [faucetKeypair],
        { commitment: 'confirmed' }
      );

      console.log('✅ Token 账户创建成功！');
      console.log('🔍 交易哈希:', signature);
      console.log('🔗 Solana Explorer:');
      console.log('   https://explorer.solana.com/tx/' + signature + '?cluster=devnet');
    }

    console.log('\n========================================');
    console.log('✅ Faucet 设置完成');
    console.log('========================================\n');

    if (tokenBalance === 0) {
      console.log('⚠️  注意: 您的 USDC 余额为 0');
      console.log('需要给 Faucet 钱包转入一些测试 USDC');
      console.log('Token 账户地址: ' + faucetTokenAccount.toBase58());
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ 错误:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
    }
    process.exit(1);
  }
}

setupFaucet();
