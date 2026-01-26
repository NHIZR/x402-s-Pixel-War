# x402's Pixel War

基于 Solana 区块链的多人像素征服游戏，使用 USDC 测试代币进行真实链上交易。

## 游戏机制

- **64×36 像素网格** - 共 2,304 个像素可争夺
- **价格递增** - 每次占领后价格上涨 20%
- **利润分配** - 前所有者获得本金 + 10%，平台收取 10% 战争税
- **批量占领** - 支持 Shift + 拖拽选择多个像素

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入配置

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 15, React 19, TypeScript, Tailwind CSS |
| 状态 | Zustand |
| 区块链 | Solana Devnet, @solana/web3.js, SPL Token |
| 数据库 | Supabase (PostgreSQL) |
| 钱包 | Phantom, Solflare, Torus |

## 文档

详细文档请查看 [docs/DOCS_INDEX.md](docs/DOCS_INDEX.md)

- [HACKATHON.md](docs/HACKATHON.md) - 完整项目文档（推荐）
- [TESTNET_SETUP.md](docs/TESTNET_SETUP.md) - 代币设置指南
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - 系统架构

## 许可证

MIT License
