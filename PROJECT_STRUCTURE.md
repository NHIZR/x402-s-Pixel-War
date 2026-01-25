# 📁 项目结构

x402's Pixel War 的完整文件夹结构和说明。

---

## 🗂️ 目录结构

```
x402-pixel-war/
├── 📱 app/                    # Next.js App Router
│   ├── api/                   # API Routes
│   │   └── faucet/           # Faucet 发放 USDC
│   ├── debug/                # Debug 页面（开发用）
│   ├── layout.tsx            # 根布局
│   ├── page.tsx              # 主页（游戏画布）
│   └── globals.css           # 全局样式
│
├── 🎨 components/             # React 组件
│   ├── game/                 # 游戏相关组件
│   │   ├── Grid.tsx          # 游戏网格容器
│   │   ├── PixelCanvas.tsx   # 像素画布（核心）
│   │   ├── PixelInfoModal.tsx # 像素信息弹窗
│   │   └── UserInfo.tsx      # 用户信息（余额、Faucet）
│   ├── providers/            # Context Providers
│   │   └── SolanaWalletProvider.tsx
│   └── ui/                   # shadcn/ui 组件
│       └── button.tsx
│
├── 🪝 hooks/                  # React Hooks
│   └── useTokenBalance.ts    # USDC 余额查询
│
├── 📚 lib/                    # 核心库
│   ├── config/               # 配置文件
│   │   └── solana.ts         # Solana 网络配置
│   ├── constants/            # 常量
│   │   └── game.ts           # 游戏常量
│   ├── hooks/                # 库级 Hooks
│   │   └── usePixelConquest.ts
│   ├── services/             # 业务服务
│   │   ├── faucet.ts         # Faucet 服务
│   │   ├── pixelConquest.ts  # 像素占领逻辑
│   │   └── x402Payment.ts    # SPL Token 支付
│   ├── solana/               # Solana 工具
│   │   └── balance.ts        # 余额查询
│   ├── stores/               # Zustand 状态管理
│   │   ├── gameStore.ts      # 游戏状态
│   │   └── userStore.ts      # 用户状态
│   ├── supabase/             # Supabase 客户端
│   │   ├── client.ts         # 浏览器端
│   │   └── server.ts         # 服务端
│   ├── types/                # TypeScript 类型
│   │   └── game.types.ts
│   └── utils/                # 工具函数
│       ├── priceCalculation.ts
│       └── rateLimit.ts
│
├── 🛠️ scripts/                # 实用脚本
│   ├── check-sol-balance.ts  # 查询 SOL 余额
│   ├── create-devnet-token.ts # 创建 Devnet Token
│   ├── setup-faucet.ts       # 配置 Faucet
│   ├── setup-treasury.ts     # 初始化 Treasury
│   └── README.md             # 脚本说明
│
├── 📖 docs/                   # 项目文档
│   ├── HACKATHON.md          # 🏆 一站式主文档
│   ├── DOCS_INDEX.md         # 📑 文档导航
│   ├── ARCHITECTURE.md       # 架构设计
│   ├── API.md                # API 文档
│   ├── TESTNET_SETUP.md      # Token 设置指南
│   ├── TESTING_GUIDE.md      # 测试指南
│   ├── X402_INTEGRATION_GUIDE.md # x402 集成
│   ├── FAQ.md                # 常见问题
│   ├── DEPLOYMENT.md         # 部署指南
│   ├── USER_GUIDE.md         # 用户手册
│   ├── screenshots/          # 截图
│   └── docs-mintlify/        # Mintlify 文档（可选）
│
├── 🗄️ supabase/               # Supabase 配置
│   ├── schema-complete.sql   # 完整数据库 Schema
│   ├── README.md             # Supabase 说明
│   └── archive/              # 历史 Schema
│
├── 🔐 .private/               # 私有文件（不提交）
│   └── wallets/              # 钱包密钥
│       ├── faucet-wallet.json
│       └── treasury-wallet.json
│
├── ⚙️ 配置文件
│   ├── .env.local            # 环境变量（不提交）
│   ├── .gitignore            # Git 忽略规则
│   ├── package.json          # NPM 依赖
│   ├── tsconfig.json         # TypeScript 配置
│   ├── tailwind.config.ts    # Tailwind CSS 配置
│   └── next.config.ts        # Next.js 配置
│
└── 📄 README.md               # 项目主 README
```

---

## 📂 关键目录说明

### `/app` - Next.js 应用
- **App Router**：Next.js 15 的新路由系统
- **API Routes**：`/app/api/faucet/route.ts` 处理 USDC 发放

### `/components` - 组件库
- **game/**：游戏核心组件（画布、弹窗、用户信息）
- **providers/**：Context 提供者（钱包连接）
- **ui/**：shadcn/ui 基础组件

### `/lib` - 核心逻辑
- **services/**：业务逻辑（支付、占领、Faucet）
- **stores/**：全局状态（Zustand）
- **supabase/**：数据库客户端

### `/scripts` - 实用工具
- Token 创建和管理
- 钱包配置和查询
- 所有脚本都用 TypeScript 编写

### `/docs` - 完整文档
- **HACKATHON.md**：最全面的单一文档
- **技术文档**：架构、API、测试
- **设置指南**：Testnet、部署、集成

### `/.private` - 敏感文件
- **不提交到 Git**
- 存放钱包密钥和私密配置
- 需要手动备份

### `/supabase` - 数据库
- Schema 定义（SQL）
- RPC 函数（PostgreSQL）
- 实时订阅配置

---

## 🔒 安全文件

以下文件**永远不提交**到 Git：

```
.env.local                    # 环境变量
.private/                     # 私有目录
wallets/                      # 钱包文件
treasury-wallet.json          # Treasury 密钥
faucet-wallet.json            # Faucet 密钥
```

确保 `.gitignore` 包含这些规则。

---

## 📝 配置文件

### 必需的环境变量

`.env.local` 示例：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=xxx
HELIUS_API_KEY=xxx

# Token
NEXT_PUBLIC_USDC_MINT_ADDRESS=xxx

# Treasury（接收游戏收入）
NEXT_PUBLIC_GAME_TREASURY_WALLET=xxx
TREASURY_WALLET_PRIVATE_KEY=xxx  # Base58 格式

# Faucet（发放测试代币）
FAUCET_WALLET_PRIVATE_KEY=xxx    # Base58 格式
```

---

## 🎯 快速导航

### 阅读顺序（新手）
1. [README.md](./README.md) - 项目介绍
2. [docs/HACKATHON.md](./docs/HACKATHON.md) - 完整文档
3. [docs/TESTNET_SETUP.md](./docs/TESTNET_SETUP.md) - 设置指南

### 开发相关
- **组件**：`/components/game/`
- **支付逻辑**：`/lib/services/x402Payment.ts`
- **数据库**：`/supabase/schema-complete.sql`

### 部署相关
- **环境配置**：`.env.local`
- **数据库迁移**：`/supabase/`
- **Token 设置**：`/scripts/`

---

## 📊 文件统计

| 类型 | 数量 | 说明 |
|------|------|------|
| 组件 | ~15 | React 组件 |
| 服务 | ~8 | 业务逻辑 |
| Hooks | ~5 | 自定义 Hooks |
| 脚本 | 4 | 实用工具 |
| 文档 | 12 | Markdown 文档 |
| 配置 | ~10 | 各种配置文件 |

---

## 🔄 维护建议

### 添加新功能
1. 组件 → `/components/game/`
2. 业务逻辑 → `/lib/services/`
3. API 端点 → `/app/api/`

### 更新文档
1. 主文档 → `docs/HACKATHON.md`
2. 专项文档 → `docs/` 对应文件
3. 代码注释 → 直接在代码中

### 数据库更改
1. 修改 → `/supabase/schema-complete.sql`
2. 测试 → Supabase Dashboard
3. 迁移 → `supabase db push`

---

**最后更新**: 2026-01-25
