/**
 * Check SOL Balance
 * Quick script to check SOL balance for any wallet
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
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
    return {};
  }
}

const env = loadEnvFile();
const SOLANA_RPC_URL = env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

async function checkSOLBalance(walletAddress: string) {
  console.log('\n========================================');
  console.log('💎 检查 SOL 余额');
  console.log('========================================\n');

  try {
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    const publicKey = new PublicKey(walletAddress);

    console.log('🔗 RPC:', SOLANA_RPC_URL);
    console.log('📍 钱包地址:', walletAddress);
    console.log('');

    // Get SOL balance
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;

    console.log('💰 SOL 余额:', solBalance.toFixed(9), 'SOL');
    console.log('   (Lamports:', balance, ')');
    console.log('');

    // Check if balance is sufficient for transactions
    const minRequiredSOL = 0.001; // Minimum recommended
    const typicalTxCost = 0.00001; // Typical transaction cost

    if (solBalance < typicalTxCost) {
      console.log('❌ 余额不足以支付交易费用');
      console.log('   需要至少:', typicalTxCost, 'SOL');
    } else if (solBalance < minRequiredSOL) {
      console.log('⚠️  余额较低，建议充值');
      console.log('   推荐余额:', minRequiredSOL, 'SOL');
      console.log('   当前可以执行约', Math.floor(solBalance / typicalTxCost), '笔交易');
    } else {
      console.log('✅ 余额充足');
      console.log('   可以执行约', Math.floor(solBalance / typicalTxCost), '笔交易');
    }

    console.log('');
    console.log('🔍 Solana Explorer:');
    console.log('   https://explorer.solana.com/address/' + walletAddress + '?cluster=devnet');
    console.log('');

    // Get rent exempt minimum
    const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(0);
    console.log('📊 账户租金豁免最低余额:', (rentExemptBalance / LAMPORTS_PER_SOL).toFixed(9), 'SOL');
    console.log('');

  } catch (error) {
    console.error('❌ 错误:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
    }
  }

  console.log('========================================\n');
}

// Get wallet address from command line or use default
const walletAddress = process.argv[2];

if (!walletAddress) {
  console.error('请提供钱包地址');
  console.log('用法: npx tsx scripts/check-sol-balance.ts <钱包地址>');
  console.log('');
  console.log('示例:');
  console.log('  npx tsx scripts/check-sol-balance.ts 9AZFUhWXXupekLUQ3KWreDmooZpmmQ9E8cbFNNENQDFQ');
  process.exit(1);
}

checkSOLBalance(walletAddress);
