import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Devnet USDC Mint Address (官方测试代币)
const DEVNET_USDC_MINT = 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr';

/**
 * 获取钱包的 USDC 余额
 * @param connection Solana 连接
 * @param walletAddress 钱包地址
 * @returns USDC 余额 (已除以 decimals)
 */
export async function getUSDCBalance(
  connection: Connection,
  walletAddress: string
): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress);
    const mintPublicKey = new PublicKey(DEVNET_USDC_MINT);

    // 获取与该 mint 关联的所有 token 账户
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      {
        mint: mintPublicKey,
      }
    );

    if (tokenAccounts.value.length === 0) {
      // 没有找到 USDC token 账户
      return 0;
    }

    // 累加所有 token 账户的余额
    let totalBalance = 0;
    for (const account of tokenAccounts.value) {
      const balance = account.account.data.parsed.info.tokenAmount.uiAmount;
      totalBalance += balance || 0;
    }

    return totalBalance;
  } catch (error) {
    console.error('获取 USDC 余额失败:', error);
    return 0;
  }
}

/**
 * 获取钱包的 SOL 余额
 * @param connection Solana 连接
 * @param walletAddress 钱包地址
 * @returns SOL 余额
 */
export async function getSOLBalance(
  connection: Connection,
  walletAddress: string
): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    return balance / 1e9; // lamports 转 SOL
  } catch (error) {
    console.error('获取 SOL 余额失败:', error);
    return 0;
  }
}
