# API 文档

x402's Pixel War 的 Supabase RPC 函数 API 完整文档。

---

## 📚 目录

- [认证](#认证)
- [像素占领](#像素占领)
  - [单个像素占领](#conquer_pixel_wallet)
  - [批量像素占领](#conquer_pixels_batch)
- [像素换色](#像素换色)
  - [单个像素换色](#recolor_pixel_wallet)
  - [批量像素换色](#recolor_pixels_batch)
- [数据查询](#数据查询)
  - [获取网格状态](#get_grid_state_wallet)
  - [获取用户像素](#get_wallet_pixels)
  - [获取用户统计](#get_user_stats)
- [管理功能](#管理功能)
  - [初始化网格](#initialize_grid)
- [数据模型](#数据模型)
- [错误处理](#错误处理)

---

## 认证

所有 API 调用使用 **Solana 钱包地址** 作为身份标识，无需额外的认证 token。

**安全机制**:
- 通过钱包地址验证用户身份
- 使用 PostgreSQL 行级安全策略 (RLS)
- 前端通过钱包签名确保操作授权

---

## 像素占领

### `conquer_pixel_wallet()`

占领单个像素，支付 USDC。

#### 函数签名

```sql
conquer_pixel_wallet(
  p_pixel_x INTEGER,
  p_pixel_y INTEGER,
  p_wallet_address VARCHAR,
  p_new_color VARCHAR,
  p_tx_hash VARCHAR
) RETURNS JSONB
```

#### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `p_pixel_x` | INTEGER | ✅ | 像素 X 坐标 (0-99) |
| `p_pixel_y` | INTEGER | ✅ | 像素 Y 坐标 (0-55) |
| `p_wallet_address` | VARCHAR | ✅ | 钱包地址 |
| `p_new_color` | VARCHAR | ✅ | 新颜色 (HEX 格式, 如 "#FF0000") |
| `p_tx_hash` | VARCHAR | ✅ | 交易哈希 |

#### 返回值

**成功响应** (新占领):
```json
{
  "success": true,
  "skipped": false,
  "pixel": {
    "x": 10,
    "y": 5,
    "color": "#FF0000",
    "newPrice": 0.012,
    "walletOwner": "ABC...XYZ"
  },
  "transaction": {
    "pricePaid": 0.01,
    "newPrice": 0.012,
    "txHash": "transaction_hash_here",
    "previousOwner": "DEF...123"
  }
}
```

**成功响应** (跳过 - 已拥有):
```json
{
  "success": true,
  "skipped": true,
  "reason": "Already owned",
  "pixel": {
    "x": 10,
    "y": 5,
    "color": "#FF0000",
    "currentPrice": 0.012,
    "walletOwner": "ABC...XYZ"
  },
  "transaction": {
    "pricePaid": 0,
    "newPrice": 0.012
  }
}
```

**失败响应**:
```json
{
  "success": false,
  "error": "Pixel not found"
}
```

#### 行为说明

1. **像素已被当前用户拥有**: 返回 `skipped: true`，不扣费，不更新状态
2. **像素被他人拥有**:
   - 扣除 `current_price` 费用
   - 前所有者获得 110% 的本金 (10% 利润)
   - 平台收取 10% "战争税"
   - 价格上涨 20% (×1.2)
3. **像素无人拥有**:
   - 扣除初始价格 (0.01 USDC)
   - 价格变为 0.012 USDC

#### 使用示例

**TypeScript/JavaScript**:
```typescript
import { supabase } from '@/lib/supabase/client';

const result = await supabase.rpc('conquer_pixel_wallet', {
  p_pixel_x: 10,
  p_pixel_y: 5,
  p_wallet_address: 'ABC...XYZ',
  p_new_color: '#FF0000',
  p_tx_hash: 'transaction_hash'
});

if (result.data.success && !result.data.skipped) {
  console.log('占领成功！支付了', result.data.transaction.pricePaid, 'USDC');
} else if (result.data.skipped) {
  console.log('你已经拥有这个像素了');
}
```

---

### `conquer_pixels_batch()`

批量占领多个像素。

#### 函数签名

```sql
conquer_pixels_batch(
  p_pixels JSONB,
  p_wallet_address VARCHAR,
  p_tx_hash VARCHAR
) RETURNS JSONB
```

#### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `p_pixels` | JSONB | ✅ | 像素数组 `[{x, y, color}, ...]` |
| `p_wallet_address` | VARCHAR | ✅ | 钱包地址 |
| `p_tx_hash` | VARCHAR | ✅ | 交易哈希 |

**`p_pixels` 格式**:
```json
[
  {"x": 10, "y": 5, "color": "#FF0000"},
  {"x": 11, "y": 5, "color": "#FF0000"},
  {"x": 12, "y": 5, "color": "#00FF00"}
]
```

#### 返回值

```json
{
  "success": true,
  "totalPixels": 112,
  "successCount": 44,
  "skippedCount": 68,
  "errorCount": 0,
  "totalPaid": 0.88,
  "txHash": "transaction_hash",
  "results": [
    {
      "x": 10,
      "y": 5,
      "success": true,
      "skipped": false,
      "pricePaid": 0.01,
      "newPrice": 0.012
    },
    {
      "x": 11,
      "y": 5,
      "success": true,
      "skipped": true,
      "pricePaid": 0,
      "reason": "Already owned"
    }
  ]
}
```

#### 字段说明

| 字段 | 说明 |
|------|------|
| `totalPixels` | 请求占领的总像素数 |
| `successCount` | 新占领的像素数量 |
| `skippedCount` | 跳过的像素数量（已拥有） |
| `errorCount` | 失败的像素数量 |
| `totalPaid` | 实际支付的总金额 (USDC) |
| `results` | 每个像素的详细结果 |

#### 使用示例

```typescript
const pixels = [
  { x: 0, y: 0, color: '#FF0000' },
  { x: 1, y: 0, color: '#FF0000' },
  { x: 2, y: 0, color: '#FF0000' }
];

const result = await supabase.rpc('conquer_pixels_batch', {
  p_pixels: pixels,
  p_wallet_address: walletAddress,
  p_tx_hash: txHash
});

console.log(`占领: ${result.data.successCount} 个`);
console.log(`跳过: ${result.data.skippedCount} 个`);
console.log(`总支付: ${result.data.totalPaid} USDC`);
```

---

## 像素换色

### `recolor_pixel_wallet()`

免费为已拥有的像素更换颜色。

#### 函数签名

```sql
recolor_pixel_wallet(
  p_pixel_x INTEGER,
  p_pixel_y INTEGER,
  p_wallet_address VARCHAR,
  p_new_color VARCHAR
) RETURNS JSONB
```

#### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `p_pixel_x` | INTEGER | ✅ | 像素 X 坐标 |
| `p_pixel_y` | INTEGER | ✅ | 像素 Y 坐标 |
| `p_wallet_address` | VARCHAR | ✅ | 钱包地址 |
| `p_new_color` | VARCHAR | ✅ | 新颜色 (HEX) |

#### 返回值

```json
{
  "success": true,
  "pixel": {
    "x": 10,
    "y": 5,
    "color": "#00FF00",
    "currentPrice": 0.012,
    "walletOwner": "ABC...XYZ"
  }
}
```

#### 特点

- ✅ 完全免费，不扣费
- ✅ 不增加价格
- ✅ 不增加占领次数
- ❌ 只能操作自己拥有的像素

---

### `recolor_pixels_batch()`

批量免费换色。

#### 函数签名

```sql
recolor_pixels_batch(
  p_pixels JSONB,
  p_wallet_address VARCHAR
) RETURNS JSONB
```

#### 返回值

```json
{
  "success": true,
  "totalPixels": 20,
  "successCount": 20,
  "errorCount": 0,
  "results": [...]
}
```

---

## 数据查询

### `get_grid_state_wallet()`

获取完整的网格状态（所有 5,600 个像素）。

#### 函数签名

```sql
get_grid_state_wallet() RETURNS JSONB
```

#### 参数

无参数。

#### 返回值

```json
[
  {
    "id": "uuid-here",
    "x": 0,
    "y": 0,
    "color": "#FF0000",
    "currentPrice": 0.012,
    "ownerId": "ABC...XYZ",
    "walletOwner": "ABC...XYZ",
    "conquestCount": 5,
    "lastConqueredAt": "2026-01-23T12:00:00Z"
  },
  // ... 5599 more pixels
]
```

#### 使用示例

```typescript
const { data: pixels } = await supabase.rpc('get_grid_state_wallet');

// 按价格排序
const expensivePixels = pixels
  .sort((a, b) => b.currentPrice - a.currentPrice)
  .slice(0, 10);
```

---

### `get_wallet_pixels()`

查询特定钱包拥有的所有像素。

#### 函数签名

```sql
get_wallet_pixels(
  p_wallet_address VARCHAR
) RETURNS JSONB
```

#### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `p_wallet_address` | VARCHAR | ✅ | 钱包地址 |

#### 返回值

```json
{
  "walletAddress": "ABC...XYZ",
  "totalPixels": 42,
  "pixels": [
    {
      "x": 10,
      "y": 5,
      "color": "#FF0000",
      "currentPrice": 0.012,
      "conquestCount": 3,
      "lastConqueredAt": "2026-01-23T12:00:00Z"
    }
  ]
}
```

#### 使用示例

```typescript
const { data } = await supabase.rpc('get_wallet_pixels', {
  p_wallet_address: walletAddress
});

console.log(`你拥有 ${data.totalPixels} 个像素`);
```

---

### `get_user_stats()`

获取用户统计信息。

#### 函数签名

```sql
get_user_stats(
  p_wallet_address VARCHAR
) RETURNS JSONB
```

#### 返回值

```json
{
  "walletAddress": "ABC...XYZ",
  "totalPixelsOwned": 42,
  "totalConquests": 156,
  "totalSpent": 12.34,
  "totalEarned": 5.67,
  "netProfit": -6.67
}
```

---

## 管理功能

### `initialize_grid()`

初始化 100×56 像素网格（仅在首次设置时使用）。

#### 函数签名

```sql
initialize_grid() RETURNS VOID
```

#### 说明

- 创建 5,600 个像素 (100 × 56)
- 初始颜色: `#0a0a0a` (深灰色)
- 初始价格: 0.01 USDC
- 无所有者

**⚠️ 警告**: 此函数会清空现有的 `pixels` 表，仅在首次设置数据库时使用。

---

## 数据模型

### Pixel 对象

```typescript
interface Pixel {
  id: string;              // UUID
  x: number;               // 0-99
  y: number;               // 0-55
  color: string;           // HEX color code
  currentPrice: number;    // USDC
  walletOwner: string | null;  // Wallet address
  ownerId: string | null;  // Legacy field
  conquestCount: number;   // Times conquered
  lastConqueredAt: string | null;  // ISO timestamp
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
}
```

### Transaction 对象

```typescript
interface Transaction {
  pricePaid: number;       // Amount paid in USDC
  newPrice: number;        // New price after conquest
  txHash: string;          // Blockchain transaction hash
  previousOwner?: string;  // Previous owner wallet
}
```

---

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": "Error message here"
}
```

### 常见错误

| 错误消息 | 原因 | 解决方案 |
|---------|------|---------|
| `Pixel not found` | 坐标超出范围 | 检查 x (0-99), y (0-55) |
| `Not pixel owner` | 尝试换色别人的像素 | 只能换色自己拥有的像素 |
| `Invalid color format` | 颜色格式错误 | 使用 HEX 格式: `#RRGGBB` |
| `Insufficient balance` | 余额不足 | 充值 USDC |

### 错误处理示例

```typescript
try {
  const result = await supabase.rpc('conquer_pixel_wallet', {
    p_pixel_x: x,
    p_pixel_y: y,
    p_wallet_address: wallet,
    p_new_color: color,
    p_tx_hash: txHash
  });

  if (!result.data.success) {
    throw new Error(result.data.error);
  }

  if (result.data.skipped) {
    console.log('像素已被你拥有');
  } else {
    console.log('占领成功！');
  }
} catch (error) {
  console.error('占领失败:', error.message);
}
```

---

## 速率限制

当前版本无速率限制，但建议：
- 批量操作：每次最多 200 个像素
- 单次操作：间隔至少 100ms
- 避免短时间内大量请求

---

## 数据库架构

### pixels 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 主键 |
| `x` | INTEGER | X 坐标 (0-99) |
| `y` | INTEGER | Y 坐标 (0-55) |
| `color` | VARCHAR(7) | HEX 颜色 |
| `current_price` | DECIMAL(20,8) | 当前价格 |
| `wallet_owner` | VARCHAR(100) | 钱包所有者 |
| `conquest_count` | INTEGER | 占领次数 |
| `last_conquered_at` | TIMESTAMP | 最后占领时间 |

### 索引

- `idx_pixels_coordinates` - (x, y) 坐标查询
- `idx_pixels_wallet_owner` - 按所有者查询
- `idx_pixels_price` - 按价格排序

---

## 实时订阅

使用 Supabase Realtime 订阅像素变化：

```typescript
const channel = supabase
  .channel('pixels-changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'pixels',
  }, (payload) => {
    console.log('像素更新:', payload.new);
  })
  .subscribe();
```

---

## 相关文档

- [数据库设置指南](SETUP_DATABASE.md)
- [用户手册](USER_GUIDE.md)
- [架构设计文档](ARCHITECTURE.md)

---

**最后更新**: 2026-01-26
**版本**: v2.1
