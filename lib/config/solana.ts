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
