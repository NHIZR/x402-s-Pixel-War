/**
 * Setup Treasury Wallet
 *
 * 初始化 Treasury 钱包的 USDC token 账户
 * Treasury 用于接收游戏中用户支付的 USDC
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount
} from '@solana/spl-token';
import bs58 from 'bs58';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
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
    console.error('Failed to load .env.local:', error);
    return {};
  }
}

async function setupTreasury() {
  console.log('\n========================================');
  console.log('🏦 初始化 Treasury Wallet');
  console.log('========================================\n');

  try {
    const env = loadEnvFile();

    const SOLANA_RPC_URL = env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const USDC_MINT = env.NEXT_PUBLIC_USDC_MINT_ADDRESS;
    const TREASURY_PRIVATE_KEY = env.TREASURY_WALLET_PRIVATE_KEY;
    const TREASURY_ADDRESS = env.NEXT_PUBLIC_GAME_TREASURY_WALLET;

    if (!USDC_MINT) {
      throw new Error('NEXT_PUBLIC_USDC_MINT_ADDRESS not found in .env.local');
    }

    if (!TREASURY_PRIVATE_KEY) {
      throw new Error('TREASURY_WALLET_PRIVATE_KEY not found in .env.local');
    }

    if (!TREASURY_ADDRESS) {
      throw new Error('NEXT_PUBLIC_GAME_TREASURY_WALLET not found in .env.local');
    }

    console.log('📋 配置信息:');
    console.log('   RPC:', SOLANA_RPC_URL);
    console.log('   USDC Mint:', USDC_MINT);
    console.log('   Treasury Address:', TREASURY_ADDRESS);
    console.log('');

    // Connect to Solana
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    const treasuryKeypair = Keypair.fromSecretKey(bs58.decode(TREASURY_PRIVATE_KEY));
    const usdcMintPubkey = new PublicKey(USDC_MINT);

    // Check SOL balance
    const solBalance = await connection.getBalance(treasuryKeypair.publicKey);
    const solBalanceInSol = solBalance / 1_000_000_000;

    console.log('💰 SOL 余额:', solBalanceInSol.toFixed(9), 'SOL');

    if (solBalance < 5_000_000) { // 0.005 SOL
      console.log('');
      console.log('❌ SOL 余额不足！');
      console.log('   需要至少 0.005 SOL 来创建 token 账户');
      console.log('');
      console.log('请先给 Treasury 钱包充值 SOL:');
      console.log('   1. 访问 https://faucet.solana.com/');
      console.log('   2. 粘贴地址:', TREASURY_ADDRESS);
      console.log('   3. 完成 CAPTCHA 并领取 SOL');
      console.log('');
      process.exit(1);
    }

    console.log('');

    // Get associated token address
    const treasuryTokenAccount = await getAssociatedTokenAddress(
      usdcMintPubkey,
      treasuryKeypair.publicKey
    );

    console.log('🔍 检查 USDC Token 账户...');
    console.log('   Token 账户地址:', treasuryTokenAccount.toBase58());
    console.log('');

    // Check if token account exists
    let tokenAccountExists = false;
    try {
      const account = await getAccount(connection, treasuryTokenAccount);
      tokenAccountExists = true;
      console.log('✅ Token 账户已存在');
      console.log('   余额:', Number(account.amount) / 1_000_000, 'USDC');
      console.log('');
    } catch (error) {
      console.log('ℹ️  Token 账户不存在，需要创建');
      console.log('');
    }

    if (!tokenAccountExists) {
      console.log('🔨 创建 USDC Token 账户...');

      const { Transaction, sendAndConfirmTransaction } = await import('@solana/web3.js');

      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          treasuryKeypair.publicKey, // payer
          treasuryTokenAccount,       // ata
          treasuryKeypair.publicKey, // owner
          usdcMintPubkey             // mint
        )
      );

      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [treasuryKeypair],
        { commitment: 'confirmed' }
      );

      console.log('✅ Token 账户创建成功！');
      console.log('   交易哈希:', signature);
      console.log('   Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
      console.log('');

      // Verify creation
      const account = await getAccount(connection, treasuryTokenAccount);
      console.log('✅ 验证成功');
      console.log('   余额:', Number(account.amount) / 1_000_000, 'USDC');
      console.log('');
    }

    console.log('========================================');
    console.log('✅ Treasury 设置完成！');
    console.log('========================================');
    console.log('');
    console.log('📊 摘要:');
    console.log('   Treasury 地址:', TREASURY_ADDRESS);
    console.log('   SOL 余额:', solBalanceInSol.toFixed(9), 'SOL');
    console.log('   USDC Token 账户:', treasuryTokenAccount.toBase58());
    console.log('');
    console.log('🎮 现在用户支付的 USDC 将转入这个 Treasury 钱包');
    console.log('');

  } catch (error) {
    console.error('❌ 错误:', error);
    if (error instanceof Error) {
      console.error('   详情:', error.message);
    }
    process.exit(1);
  }
}

setupTreasury();
