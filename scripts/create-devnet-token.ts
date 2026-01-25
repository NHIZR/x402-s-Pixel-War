/**
 * Create Devnet Token Script
 * 1. Create a new SPL Token (USDC) on Devnet
 * 2. Create token account for Faucet wallet
 * 3. Mint initial supply to Faucet wallet
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getMint,
} from '@solana/spl-token';
import bs58 from 'bs58';
import { readFileSync, writeFileSync } from 'fs';
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

// Token configuration
const TOKEN_DECIMALS = 6; // USDC has 6 decimals
const INITIAL_SUPPLY = 10000; // Mint 10,000 USDC initially

async function createDevnetToken() {
  console.log('\n========================================');
  console.log('🪙  创建 Devnet 测试 USDC');
  console.log('========================================\n');

  // Validate environment variables
  if (!FAUCET_PRIVATE_KEY) {
    console.error('❌ 错误: FAUCET_WALLET_PRIVATE_KEY 未设置');
    process.exit(1);
  }

  try {
    // Initialize connection
    console.log('🔗 连接到 Solana RPC:', SOLANA_RPC_URL);
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

    // Load faucet keypair (will be the mint authority)
    const faucetKeypair = Keypair.fromSecretKey(bs58.decode(FAUCET_PRIVATE_KEY));
    const faucetAddress = faucetKeypair.publicKey.toBase58();
    console.log('📍 Faucet/Mint Authority 地址:', faucetAddress);

    // Check if token mint already exists
    if (USDC_MINT_ADDRESS) {
      console.log('\n⚠️  检测到现有的 USDC Mint 地址:', USDC_MINT_ADDRESS);
      console.log('正在验证...');

      try {
        const mintPublicKey = new PublicKey(USDC_MINT_ADDRESS);
        const mintInfo = await getMint(connection, mintPublicKey);

        console.log('✅ Mint 存在');
        console.log('   Decimals:', mintInfo.decimals);
        console.log('   Supply:', Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals));
        console.log('   Mint Authority:', mintInfo.mintAuthority?.toBase58());

        // Check if faucet has token account
        console.log('\n📦 检查 Faucet 的 token 账户...');
        const faucetTokenAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          faucetKeypair,
          mintPublicKey,
          faucetKeypair.publicKey
        );

        console.log('✅ Token 账户地址:', faucetTokenAccount.address.toBase58());
        console.log('💰 当前余额:', Number(faucetTokenAccount.amount) / Math.pow(10, TOKEN_DECIMALS), 'USDC');

        // Ask if user wants to mint more tokens
        if (Number(faucetTokenAccount.amount) === 0) {
          console.log('\n📝 余额为 0，开始铸造代币...');

          const mintAmount = INITIAL_SUPPLY * Math.pow(10, TOKEN_DECIMALS);
          const signature = await mintTo(
            connection,
            faucetKeypair,
            mintPublicKey,
            faucetTokenAccount.address,
            faucetKeypair, // mint authority
            mintAmount
          );

          console.log('✅ 铸造成功！');
          console.log('🔍 交易哈希:', signature);
          console.log('🔗 Solana Explorer:');
          console.log('   https://explorer.solana.com/tx/' + signature + '?cluster=devnet');
          console.log('💰 铸造数量:', INITIAL_SUPPLY, 'USDC');
        } else {
          console.log('\n✅ Faucet 已有足够的 USDC');
        }

        console.log('\n========================================');
        console.log('✅ 设置完成');
        console.log('========================================\n');
        return;

      } catch (error) {
        console.log('❌ Mint 不存在或无效，将创建新的 Token Mint');
      }
    }

    // Create new token mint
    console.log('\n📝 创建新的 Token Mint...');
    console.log('   Decimals:', TOKEN_DECIMALS);
    console.log('   Mint Authority: Faucet 钱包');
    console.log('   Freeze Authority: None');

    const mint = await createMint(
      connection,
      faucetKeypair, // payer
      faucetKeypair.publicKey, // mint authority
      null, // freeze authority (null = no freeze)
      TOKEN_DECIMALS
    );

    console.log('✅ Token Mint 创建成功！');
    console.log('🪙  Mint 地址:', mint.toBase58());

    // Create token account for faucet
    console.log('\n📦 创建 Faucet 的 token 账户...');
    const faucetTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      faucetKeypair,
      mint,
      faucetKeypair.publicKey
    );

    console.log('✅ Token 账户创建成功！');
    console.log('📦 Token 账户地址:', faucetTokenAccount.address.toBase58());

    // Mint initial supply
    console.log('\n📝 铸造初始供应量...');
    const mintAmount = INITIAL_SUPPLY * Math.pow(10, TOKEN_DECIMALS);

    const signature = await mintTo(
      connection,
      faucetKeypair,
      mint,
      faucetTokenAccount.address,
      faucetKeypair, // mint authority
      mintAmount
    );

    console.log('✅ 铸造成功！');
    console.log('🔍 交易哈希:', signature);
    console.log('🔗 Solana Explorer:');
    console.log('   https://explorer.solana.com/tx/' + signature + '?cluster=devnet');
    console.log('💰 铸造数量:', INITIAL_SUPPLY, 'USDC');

    // Update .env.local with new mint address
    console.log('\n📝 更新 .env.local 文件...');
    const envPath = join(process.cwd(), '.env.local');
    let envContent = readFileSync(envPath, 'utf-8');

    if (envContent.includes('NEXT_PUBLIC_USDC_MINT_ADDRESS=')) {
      // Replace existing
      envContent = envContent.replace(
        /NEXT_PUBLIC_USDC_MINT_ADDRESS=.*/,
        `NEXT_PUBLIC_USDC_MINT_ADDRESS=${mint.toBase58()}`
      );
    } else {
      // Add new line
      envContent += `\nNEXT_PUBLIC_USDC_MINT_ADDRESS=${mint.toBase58()}\n`;
    }

    writeFileSync(envPath, envContent);
    console.log('✅ .env.local 已更新');

    console.log('\n========================================');
    console.log('✅ 所有设置完成！');
    console.log('========================================\n');

    console.log('📋 摘要:');
    console.log('   🪙  USDC Mint:', mint.toBase58());
    console.log('   📦 Faucet Token 账户:', faucetTokenAccount.address.toBase58());
    console.log('   💰 Faucet 余额:', INITIAL_SUPPLY, 'USDC');
    console.log('   🔑 Mint Authority: Faucet 钱包');
    console.log('');
    console.log('⚠️  请重启开发服务器以加载新的环境变量');
    console.log('');

  } catch (error) {
    console.error('\n❌ 错误:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
    }
    process.exit(1);
  }
}

createDevnetToken();
