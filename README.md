# x402's Pixel War - Solana 像素征服游戏

一个基于 Solana 区块链的多人像素征服游戏，采用 x402 支付协议和自定义 USDC 测试代币。玩家通过支付 USDC 来占领像素，价格随征服次数递增 20%。

> 💎 **Testnet 支付集成完成！** 真实的区块链交易，使用测试代币。
>
> 🚀 **快速开始**:
> 1. 查看 [Testnet 设置指南](docs/TESTNET_SETUP.md) 创建代币
> 2. 执行[数据库迁移](docs/SETUP_DATABASE.md) 初始化数据
> 3. 启动应用并开始测试！

![Game Screenshot](docs/screenshots/wallet-connected.png)

## 🎮 游戏机制

- **像素战场**: 50×30 像素网格（1,500 个像素）
- **像素占领**: 连接 Solana 钱包，支付 x402 (USDC) 占领任意像素
- **价格递增**: 每次占领后价格上涨 20% (×1.2)
- **利润分配**:
  - 前任所有者获得: 本金 + 10% 利润
  - 平台收取: 10% "战争税"
- **颜色自定义**: 占领时可以选择任意颜色
- **批量占领**: 支持一次性占领多个像素

## 💳 支付系统 (Testnet)

本项目使用 **真实的 Solana Testnet 交易** 进行支付，这意味着：

- **真实区块链**: 所有交易都在 Solana Testnet 上链，可以在区块浏览器上验证
- **x402 协议**: 支付协议标准，用于定义交易规范
- **USDC 代币**: 使用自定义创建的测试 USDC 代币进行支付（模拟真实 USDC）
- **测试代币**: 完全免费，通过水龙头获取，无需真实资金

### 关键概念

**x402 vs USDC 的区别**:
- **x402**: 这是一个**支付协议**，定义了如何进行支付交易的规范
- **USDC**: 这是实际的**支付代币**（稳定币），在本项目中是自定义创建的测试代币

**工作流程**:
1. 创建自定义 USDC 测试代币（仅需一次）
2. 通过水龙头给用户分发测试 USDC（每 24 小时 100 个）
3. 用户使用测试 USDC 占领像素
4. 所有交易在 Solana Testnet 上真实执行

### 如何获取测试 USDC

1. **安装 Solana 钱包**: Phantom 或 Solflare
2. **切换到 Testnet**: 在钱包设置中选择 "Testnet"
3. **获取测试 SOL**: 访问 https://faucet.solana.com/ (用于支付 gas 费)
4. **访问游戏的 USDC 水龙头**: 连接钱包后，在游戏界面点击 "获取测试 USDC"
5. **领取 100 USDC**: 每个钱包每 24 小时可领取一次

### 验证交易

所有交易都可以在 Solana Explorer 上验证：
- Testnet Explorer: https://explorer.solana.com/?cluster=testnet
- 粘贴您的钱包地址或交易签名查看详情

## 🚀 快速开始

### 1. 安装依赖

```bash
cd "x402's Pixel War"
npm install
```

### 2. 配置环境变量

```bash
# 复制示例文件
cp .env.local.example .env.local

# 编辑 .env.local，填入你的配置
```

需要配置:
- **Supabase**: 数据库连接
- **Solana Network**: testnet (推荐) 或 devnet
- **USDC Token**: 自定义创建的测试 USDC 代币地址
- **Wallet Paths**: Treasury 和 Faucet 钱包路径（服务端）

详细配置步骤请查看: [Testnet 设置指南](docs/TESTNET_SETUP.md)

### 3. 初始化数据库

1. 访问 [Supabase Dashboard](https://supabase.com) → SQL Editor
2. 复制并运行 `supabase/schema.sql`
3. 验证数据库:

```sql
SELECT COUNT(*) FROM pixels;  -- 应该返回 1500
```

### 4. 设置 Testnet 代币 (仅首次部署)

如果您是项目管理员，需要创建测试 USDC 代币和设置水龙头：

```bash
# 运行代币创建脚本
cd scripts
./create-token.sh

# 按照提示操作，脚本会：
# 1. 创建 Treasury 和 Faucet 钱包
# 2. 创建自定义 USDC 代币
# 3. 铸造初始代币供应
# 4. 配置代币元数据
```

详细步骤: [Testnet 设置指南](docs/TESTNET_SETUP.md)

### 5. 连接钱包并获取测试代币 (用户)

快速步骤:
1. 安装 Phantom 或 Solflare 钱包
2. 切换到 Testnet (测试网)
3. 获取测试 SOL: https://faucet.solana.com/
4. 在游戏界面点击 "获取测试 USDC" 按钮（每 24 小时 100 个）

### 6. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 🏗️ 技术栈

### 前端
- **框架**: Next.js 15 (App Router), React 19, TypeScript
- **样式**: Tailwind CSS, shadcn/ui
- **状态管理**: Zustand
- **UI 组件**: Lucide React, Sonner (toasts)

### 区块链
- **网络**: Solana Testnet (推荐用于演示和测试)
- **钱包**: @solana/wallet-adapter-react
- **支付协议**: x402 (定义交易规范)
- **支付代币**: 自定义 USDC 测试代币
- **支持钱包**: Phantom, Solflare, Torus

### 后端
- **数据库**: Supabase (PostgreSQL)
- **实时同步**: Supabase Realtime
- **认证**: Solana 钱包签名

## 📁 项目结构

```
x402's Pixel War/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # 根布局（包含 Solana Provider）
│   ├── page.tsx                 # 主页（像素网格）
│   └── globals.css              # 全局样式
├── components/
│   ├── game/                    # 游戏组件
│   │   ├── Grid.tsx            # 主网格组件
│   │   ├── Pixel.tsx           # 单个像素
│   │   ├── UserInfo.tsx        # 用户信息和钱包连接
│   │   ├── PixelInfoModal.tsx  # 单个像素占领弹窗
│   │   ├── BatchConquerModal.tsx  # 批量占领弹窗
│   │   └── ColorPicker.tsx     # 颜色选择器
│   ├── providers/
│   │   └── SolanaWalletProvider.tsx  # Solana 钱包 Provider
│   └── ui/                      # shadcn/ui 组件
├── lib/
│   ├── solana/
│   │   └── balance.ts          # USDC 余额查询
│   ├── supabase/
│   │   ├── client.ts           # Supabase 客户端
│   │   └── server.ts           # Supabase 服务端
│   ├── stores/
│   │   ├── gameStore.ts        # 游戏状态
│   │   └── userStore.ts        # 用户状态
│   ├── types/
│   │   └── game.types.ts       # TypeScript 类型
│   └── utils/
│       └── priceCalculation.ts # 价格计算工具
├── supabase/
│   └── schema.sql              # 数据库架构
├── scripts/
│   ├── check-wallet.ts         # 钱包检查工具
│   └── setup-test-usdc.sh      # 测试 USDC 设置脚本
└── docs/
    ├── WALLET_SETUP.md         # 钱包设置指南
    └── HOW_TO_GET_DEVNET_USDC.md  # 获取测试代币指南
```

## 🎯 核心功能

### ✅ 已实现
- ✅ Solana 钱包连接 (Phantom, Solflare, Torus)
- ✅ USDC 余额查询和显示
- ✅ 50×30 像素网格显示
- ✅ 实时同步 (Supabase Realtime)
- ✅ 单个像素占领 UI
- ✅ 批量像素选择 (Shift + 点击/拖动)
- ✅ 批量占领 UI
- ✅ 颜色选择器
- ✅ 价格计算和显示
- ✅ 余额检查
- ✅ **真实 Testnet 支付系统** (真实区块链交易)
- ✅ **单个像素占领逻辑** (前端 + 后端)
- ✅ **批量像素占领逻辑** (前端 + 后端)
- ✅ **Supabase RPC 函数** (钱包桥接)
- ✅ **USDC 水龙头 API** (每 24 小时 100 代币)
- ✅ **交易验证和确认**

### 🚧 开发中
- 🚧 交易历史面板
- 🚧 排行榜
- 🚧 性能优化和监控

### 📋 计划功能
- 📋 NFT 铸造（像素所有权证明）
- 📋 社交功能 (聊天、通知)
- 📋 特殊事件像素
- 📋 团队和联盟

## 💰 经济模型

### 价格递增规则

| 占领次数 | 价格 (x402/USDC) | 累计成本 |
|---------|------------------|----------|
| 0 (初始) | 0.01             | 0        |
| 1       | 0.01             | 0.01     |
| 5       | 0.025            | 0.074    |
| 10      | 0.062            | 0.255    |
| 20      | 0.383            | 2.19     |
| 50      | 91.0             | 765      |

### 交易示例

Alice 占领 Bob 的像素（当前价格: 1.0 x402）:

1. **Alice 支付**: 1.0 x402 (USDC)
2. **Bob 获得**: 1.1 x402 (本金 + 10% 利润)
3. **平台收取**: 0.1 x402 (10% 战争税)
4. **新价格**: 1.2 x402 (20% 递增)

**净效果**:
- Alice: -1.0 余额, +1 像素所有权
- Bob: +0.1 利润
- 平台金库: +0.1 积累

## 🔧 开发指南

### 测试环境设置

1. **使用 Solana Testnet** (推荐用于开发和演示)
```bash
# .env.local
NEXT_PUBLIC_SOLANA_NETWORK=testnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.testnet.solana.com
```

2. **创建测试 USDC 代币** (仅管理员需要)
```bash
# 运行代币创建脚本
cd scripts
./create-token.sh
```

3. **获取测试代币** (用户)
- 访问应用并连接钱包
- 点击 "获取测试 USDC" 按钮
- 每 24 小时可领取 100 个测试 USDC

详细文档: [Testnet 设置指南](docs/TESTNET_SETUP.md)

### 数据库架构

**核心表**:
- `pixels` - 像素网格状态（坐标、颜色、价格、所有者）
- `profiles` - 用户资料（钱包地址、余额、统计）
- `transactions` - 交易历史
- `treasury` - 平台金库

**RPC 函数**:
- `initialize_grid()` - 初始化像素网格
- `conquer_pixel()` - 原子化占领像素
- `get_grid_state()` - 获取网格状态
- `get_user_stats()` - 获取用户统计

### 调试技巧

1. **查看钱包连接状态**:
   - 打开浏览器控制台 (F12)
   - 查看 "钱包连接状态" 日志

2. **检查 USDC 余额**:
```bash
npx tsx scripts/check-wallet.ts <你的钱包地址>
```

3. **在线查看钱包和交易**:
   - Solana Explorer: https://explorer.solana.com/?cluster=testnet
   - 粘贴钱包地址或交易签名查看详情

## 📚 相关文档

### 设置和配置
- [Testnet 设置指南](docs/TESTNET_SETUP.md) - 完整的 Testnet 代币创建和配置指南
- [部署指南](docs/DEPLOYMENT.md) - Vercel 部署和环境变量配置
- [数据库设置](docs/SETUP_DATABASE.md) - Supabase 数据库初始化

### 开发和使用
- [用户手册](docs/USER_GUIDE.md) - 如何玩游戏和占领像素
- [API 文档](docs/API.md) - API 端点和 RPC 函数
- [架构设计](docs/ARCHITECTURE.md) - 技术架构和设计决策

## 🤝 贡献

这是一个学习和实验项目，欢迎 fork 和提交 PR！

### 开发规范
- TypeScript strict mode
- ESLint + Prettier
- 提交前运行 `npm run lint`

## 📄 许可证

MIT License

## 🙏 鸣谢

- Built with [Claude Code](https://claude.com/claude-code) by Anthropic
- Powered by [Solana](https://solana.com/)
- UI components by [shadcn/ui](https://ui.shadcn.com/)
- Database by [Supabase](https://supabase.com/)

---

**注意**: 这是一个演示项目，用于学习 Solana 开发和 x402 支付协议。目前使用 Solana Testnet，所有交易都是真实的链上交易，但使用的是测试代币（无真实价值）。部署到 Mainnet 前请进行充分测试。
