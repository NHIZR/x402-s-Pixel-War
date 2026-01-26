/**
 * Create Devnet Token Script
 * 1. Create a new SPL Token (USDC) on Devnet
 * 2. Create token account for Faucet wallet
 * 3. Mint initial supply to Faucet wallet
 */

import { PublicKey } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, getMint } from '@solana/spl-token';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { loadEnvFile, getConnection, loadKeypair } from './lib/utils';

const TOKEN_DECIMALS = 6;
const INITIAL_SUPPLY = 10000;

async function createDevnetToken() {
  console.log('\n========================================');
  console.log('Create Devnet Test USDC');
  console.log('========================================\n');

  const env = loadEnvFile();
  const connection = getConnection(env);

  const faucetPrivateKey = env.FAUCET_WALLET_PRIVATE_KEY;
  if (!faucetPrivateKey) {
    console.error('Error: FAUCET_WALLET_PRIVATE_KEY not set');
    process.exit(1);
  }

  const faucetKeypair = loadKeypair(faucetPrivateKey);
  console.log('Faucet/Mint Authority:', faucetKeypair.publicKey.toBase58());

  const existingMint = env.NEXT_PUBLIC_USDC_MINT_ADDRESS;

  // Check if token mint already exists
  if (existingMint) {
    console.log('\nExisting USDC Mint detected:', existingMint);
    console.log('Verifying...');

    try {
      const mintPublicKey = new PublicKey(existingMint);
      const mintInfo = await getMint(connection, mintPublicKey);

      console.log('Mint exists');
      console.log('  Decimals:', mintInfo.decimals);
      console.log('  Supply:', Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals));

      const faucetTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        faucetKeypair,
        mintPublicKey,
        faucetKeypair.publicKey
      );

      console.log('\nFaucet Token Account:', faucetTokenAccount.address.toBase58());
      console.log('Current Balance:', Number(faucetTokenAccount.amount) / Math.pow(10, TOKEN_DECIMALS), 'USDC');

      if (Number(faucetTokenAccount.amount) === 0) {
        console.log('\nBalance is 0, minting tokens...');
        const mintAmount = INITIAL_SUPPLY * Math.pow(10, TOKEN_DECIMALS);
        const signature = await mintTo(
          connection,
          faucetKeypair,
          mintPublicKey,
          faucetTokenAccount.address,
          faucetKeypair,
          mintAmount
        );

        console.log('Minted successfully!');
        console.log('Transaction:', signature);
        console.log('Amount:', INITIAL_SUPPLY, 'USDC');
      }

      console.log('\n========================================');
      console.log('Setup Complete');
      console.log('========================================\n');
      return;
    } catch {
      console.log('Mint does not exist, creating new one...');
    }
  }

  // Create new token mint
  console.log('\nCreating new Token Mint...');
  console.log('  Decimals:', TOKEN_DECIMALS);

  const mint = await createMint(
    connection,
    faucetKeypair,
    faucetKeypair.publicKey,
    null,
    TOKEN_DECIMALS
  );

  console.log('Token Mint created!');
  console.log('Mint Address:', mint.toBase58());

  // Create token account for faucet
  console.log('\nCreating Faucet token account...');
  const faucetTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    faucetKeypair,
    mint,
    faucetKeypair.publicKey
  );

  console.log('Token Account:', faucetTokenAccount.address.toBase58());

  // Mint initial supply
  console.log('\nMinting initial supply...');
  const mintAmount = INITIAL_SUPPLY * Math.pow(10, TOKEN_DECIMALS);

  const signature = await mintTo(
    connection,
    faucetKeypair,
    mint,
    faucetTokenAccount.address,
    faucetKeypair,
    mintAmount
  );

  console.log('Minted successfully!');
  console.log('Transaction:', signature);
  console.log('Amount:', INITIAL_SUPPLY, 'USDC');

  // Update .env.local
  console.log('\nUpdating .env.local...');
  const envPath = join(process.cwd(), '.env.local');
  let envContent = readFileSync(envPath, 'utf-8');

  if (envContent.includes('NEXT_PUBLIC_USDC_MINT_ADDRESS=')) {
    envContent = envContent.replace(
      /NEXT_PUBLIC_USDC_MINT_ADDRESS=.*/,
      `NEXT_PUBLIC_USDC_MINT_ADDRESS=${mint.toBase58()}`
    );
  } else {
    envContent += `\nNEXT_PUBLIC_USDC_MINT_ADDRESS=${mint.toBase58()}\n`;
  }

  writeFileSync(envPath, envContent);
  console.log('.env.local updated');

  console.log('\n========================================');
  console.log('All Setup Complete!');
  console.log('========================================\n');

  console.log('Summary:');
  console.log('  USDC Mint:', mint.toBase58());
  console.log('  Faucet Token Account:', faucetTokenAccount.address.toBase58());
  console.log('  Faucet Balance:', INITIAL_SUPPLY, 'USDC');
  console.log('\nRestart dev server to load new env variables\n');
}

createDevnetToken().catch(error => {
  console.error('\nError:', error instanceof Error ? error.message : error);
  process.exit(1);
});
