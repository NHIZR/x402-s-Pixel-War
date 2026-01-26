/**
 * Setup Wallets Script
 * Initialize token accounts for Faucet and Treasury wallets
 *
 * Usage:
 *   npx tsx scripts/setup-wallets.ts          # Setup both wallets
 *   npx tsx scripts/setup-wallets.ts faucet   # Setup faucet only
 *   npx tsx scripts/setup-wallets.ts treasury # Setup treasury only
 */

import { loadEnvFile, getConnection, loadKeypair, checkSOLBalance, setupTokenAccount } from './lib/utils';

type WalletType = 'faucet' | 'treasury' | 'both';

async function setupWallet(walletType: 'faucet' | 'treasury') {
  const env = loadEnvFile();
  const connection = getConnection(env);
  const usdcMint = env.NEXT_PUBLIC_USDC_MINT_ADDRESS;

  if (!usdcMint) {
    throw new Error('NEXT_PUBLIC_USDC_MINT_ADDRESS not set in .env.local');
  }

  const isFaucet = walletType === 'faucet';
  const privateKeyEnv = isFaucet ? 'FAUCET_WALLET_PRIVATE_KEY' : 'TREASURY_WALLET_PRIVATE_KEY';
  const walletName = isFaucet ? 'Faucet' : 'Treasury';

  const privateKey = env[privateKeyEnv];
  if (!privateKey) {
    throw new Error(`${privateKeyEnv} not set in .env.local`);
  }

  console.log(`\n========================================`);
  console.log(`${walletName} Wallet Setup`);
  console.log(`========================================\n`);

  const keypair = loadKeypair(privateKey);
  console.log(`${walletName} Address:`, keypair.publicKey.toBase58());

  const solBalance = await checkSOLBalance(connection, keypair.publicKey);

  if (solBalance === 0) {
    console.log(`\nWarning: ${walletName} wallet has no SOL!`);
    console.log('Get SOL from: https://faucet.solana.com/?address=' + keypair.publicKey.toBase58());
  }

  console.log('USDC Mint:', usdcMint);

  const { tokenAccount, balance, created } = await setupTokenAccount(
    connection,
    keypair,
    keypair.publicKey,
    usdcMint,
    walletName
  );

  console.log(`\n========================================`);
  console.log(`${walletName} Setup Complete`);
  console.log(`========================================\n`);

  if (balance === 0 && !created) {
    console.log(`Note: ${walletName} USDC balance is 0`);
    if (isFaucet) {
      console.log('Run create-devnet-token.ts to mint USDC to faucet');
    }
  }

  return { tokenAccount, balance };
}

async function main() {
  const arg = process.argv[2]?.toLowerCase() as WalletType | undefined;
  const walletType: WalletType = arg === 'faucet' || arg === 'treasury' ? arg : 'both';

  try {
    if (walletType === 'both' || walletType === 'faucet') {
      await setupWallet('faucet');
    }

    if (walletType === 'both' || walletType === 'treasury') {
      await setupWallet('treasury');
    }

    console.log('\nAll wallet setup complete!\n');
  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
