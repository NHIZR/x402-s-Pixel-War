import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

const DEVNET_USDC_MINT = 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr';

async function checkWallet(walletAddress: string) {
  // 使用多个 RPC 端点尝试
  const endpoints = [
    'https://api.devnet.solana.com',
    clusterApiUrl('devnet'),
    'https://rpc.ankr.com/solana_devnet',
  ];

  let connection: Connection | null = null;
  let lastError: any = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`尝试连接: ${endpoint}`);
      const testConnection = new Connection(endpoint, 'confirmed');
      await testConnection.getVersion(); // 测试连接
      connection = testConnection;
      console.log(`✓ 连接成功\n`);
      break;
    } catch (err) {
      lastError = err;
      console.log(`✗ 连接失败\n`);
    }
  }

  if (!connection) {
    console.error('❌ 无法连接到任何 Devnet RPC 端点');
    console.error('错误:', lastError);
    return;
  }

  const publicKey = new PublicKey(walletAddress);

  console.log('\n=== 钱包信息 ===');
  console.log('地址:', walletAddress);
  console.log('网络: Devnet\n');

  try {
    // 检查 SOL 余额
    const solBalance = await connection.getBalance(publicKey);
    console.log('SOL 余额:', solBalance / 1e9, 'SOL');

    // 检查所有 Token 账户
    console.log('\n=== Token 账户 ===');
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      }
    );

    if (tokenAccounts.value.length === 0) {
      console.log('未找到任何 Token 账户');
    } else {
      console.log(`找到 ${tokenAccounts.value.length} 个 Token 账户:\n`);

      for (const account of tokenAccounts.value) {
        const info = account.account.data.parsed.info;
        const mint = info.mint;
        const balance = info.tokenAmount.uiAmount;
        const decimals = info.tokenAmount.decimals;

        console.log(`Mint: ${mint}`);
        console.log(`余额: ${balance} (decimals: ${decimals})`);

        if (mint === DEVNET_USDC_MINT) {
          console.log('✓ 这是 Devnet USDC!');
        }
        console.log('---');
      }
    }

    // 检查是否有 USDC Token Account
    console.log('\n=== USDC 状态 ===');
    const usdcAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      {
        mint: new PublicKey(DEVNET_USDC_MINT),
      }
    );

    if (usdcAccounts.value.length === 0) {
      console.log('❌ 未找到 USDC Token Account');
      console.log('\n建议操作:');
      console.log('1. 先获取一些 SOL (用于支付手续费)');
      console.log('2. 创建 USDC Token Account');
      console.log('3. 获取 USDC 测试代币\n');
    } else {
      const balance = usdcAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
      console.log('✓ 找到 USDC Token Account');
      console.log(`余额: ${balance} USDC`);
    }

  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

// 从命令行参数获取钱包地址
const walletAddress = process.argv[2];

if (!walletAddress) {
  console.error('请提供钱包地址');
  console.log('用法: npx tsx scripts/check-wallet.ts <钱包地址>');
  process.exit(1);
}

checkWallet(walletAddress);
