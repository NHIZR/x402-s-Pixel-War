/**
 * Check SOL Balance
 * Usage: npx tsx scripts/check-sol-balance.ts <wallet-address>
 */

import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { loadEnvFile, getConnection } from './lib/utils';

async function checkSOLBalance(walletAddress: string) {
  console.log('\n========================================');
  console.log('Check SOL Balance');
  console.log('========================================\n');

  const env = loadEnvFile();
  const connection = getConnection(env);

  const publicKey = new PublicKey(walletAddress);
  console.log('Wallet:', walletAddress);

  const balance = await connection.getBalance(publicKey);
  const solBalance = balance / LAMPORTS_PER_SOL;

  console.log('SOL Balance:', solBalance.toFixed(9), 'SOL');
  console.log('Lamports:', balance);

  const minRequired = 0.001;
  const txCost = 0.00001;

  if (solBalance < txCost) {
    console.log('\nInsufficient balance for transactions');
  } else if (solBalance < minRequired) {
    console.log('\nLow balance, recommend adding more SOL');
    console.log('Can execute ~', Math.floor(solBalance / txCost), 'transactions');
  } else {
    console.log('\nBalance sufficient');
    console.log('Can execute ~', Math.floor(solBalance / txCost), 'transactions');
  }

  console.log('\nExplorer: https://explorer.solana.com/address/' + walletAddress + '?cluster=devnet');
  console.log('========================================\n');
}

const walletAddress = process.argv[2];
if (!walletAddress) {
  console.error('Please provide wallet address');
  console.log('Usage: npx tsx scripts/check-sol-balance.ts <wallet-address>');
  process.exit(1);
}

checkSOLBalance(walletAddress).catch(error => {
  console.error('Error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
