# x402's Pixel War

A real-time pixel conquest game with dynamic on-chain economy, built on Solana blockchain.

基于 Solana 区块链的多人像素征服游戏，使用 USDC 进行真实链上交易。

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://pixel-war.vercel.app)
[![Docs](https://img.shields.io/badge/docs-mintlify-blue)](https://x402-pixel-war.mintlify.app)

## Features

- **100×56 Pixel Grid** - 5,600 pixels to conquer and defend
- **Dynamic Pricing** - Price increases 20% after each conquest
- **Profit System** - Previous owner gets 110% return (10% profit), 10% goes to treasury
- **Batch Operations** - Select multiple pixels with Shift + drag
- **Text Tool** - Draw text as pixel art with real-time preview
- **Free Recolor** - Recolor your owned pixels for free
- **Real-time Sync** - Instant updates via Supabase Realtime

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your config

# Start dev server
npm run dev
```

Visit http://localhost:3000

## Environment Variables

Create `.env.local` with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Solana RPC (Helius recommended)
NEXT_PUBLIC_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
HELIUS_API_KEY=your_helius_api_key

# USDC Token (Devnet)
NEXT_PUBLIC_USDC_MINT=your_usdc_mint_address
NEXT_PUBLIC_TREASURY_ADDRESS=your_treasury_wallet

# Faucet (for test tokens)
FAUCET_PRIVATE_KEY=your_faucet_wallet_private_key
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| State | Zustand |
| Blockchain | Solana Devnet, SPL Token, USDC |
| Database | Supabase (PostgreSQL + Realtime) |
| Wallet | Phantom, Solflare, Torus |

## Text Tool

The Text Tool allows you to draw text as pixel art on the canvas:

- Full canvas preview (100×56) with drag-and-drop positioning
- Font size scaling with +/- controls
- Compact color picker (recent + preset + custom HEX)
- Input modes: Continuous text / Single letter
- Purchase modes: Text only / Full cover (with background)
- Smart boundary detection

## Documentation

- [Mintlify Docs](https://x402-pixel-war.mintlify.app) - Official documentation
- [docs/HACKATHON.md](docs/HACKATHON.md) - Complete project overview
- [docs/USER_GUIDE.md](docs/USER_GUIDE.md) - User manual
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture
- [docs/API.md](docs/API.md) - API reference

## Roadmap

- [x] Core game (100×56 grid)
- [x] SPL Token payment integration
- [x] Text Tool with canvas preview
- [x] Internationalization (EN/CN)
- [ ] x402 Protocol integration
- [ ] AI Agent SDK
- [ ] Mainnet launch

## License

MIT License

---

Built with [Claude Code](https://claude.ai/claude-code)
