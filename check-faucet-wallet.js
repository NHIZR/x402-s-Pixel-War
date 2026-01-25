const bs58 = require('bs58');
const { Keypair } = require('@solana/web3.js');

const privateKey = process.env.FAUCET_WALLET_PRIVATE_KEY || '322nVKrSY9qzF4j9jKBt8SSuRo4tsnLVVDy1ohqwWoxwpivyLTDFWp6AyvMPeMmJRUZ7vV43ErCcsjmBApLqf6Uc';
const keypair = Keypair.fromSecretKey(bs58.default.decode(privateKey));

console.log('');
console.log('========================================');
console.log('💰 Faucet 钱包信息');
console.log('========================================');
console.log('');
console.log('📍 公钥地址 (Public Key):');
console.log('   ' + keypair.publicKey.toBase58());
console.log('');
console.log('🔑 私钥 (Private Key - Base58):');
console.log('   ' + privateKey);
console.log('');
console.log('🔍 Solana Explorer:');
console.log('   https://explorer.solana.com/address/' + keypair.publicKey.toBase58() + '?cluster=devnet');
console.log('');
console.log('========================================');
console.log('');
console.log('⚠️  重要提示:');
console.log('   - 这是 Devnet 测试网络的钱包');
console.log('   - 私钥存储在 .env.local 文件中');
console.log('   - 请妥善保管私钥，不要泄露给他人');
console.log('   - 主网使用时请生成新的钱包');
console.log('');
