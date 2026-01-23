# 数据库设置指南

完整的数据库设置和迁移指南，包括最新的批量占领优化。

## 快速开始

### 步骤 1: 执行数据库迁移

打开 Supabase Dashboard → SQL Editor，按顺序执行以下脚本：

1. **基础架构** - `supabase/schema-wallet-bridge.sql`
2. **批量占领优化** - `supabase/optimizations-batch-conquest.sql` ✨ 最新

### 步骤 2: 启用实时同步

确保 `pixels` 表已添加到实时发布：

```sql
-- 检查当前发布
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- 如果没有 pixels 表，添加它
ALTER PUBLICATION supabase_realtime ADD TABLE pixels;
```

### 步骤 3: 验证安装

```sql
-- 验证函数存在
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'conquer_pixel_wallet',
    'conquer_pixels_batch',
    'recolor_pixel_wallet',
    'recolor_pixels_batch',
    'get_grid_state_wallet',
    'get_wallet_pixels'
  );
```

应该看到 **6 个函数**。

---

## 完整迁移脚本

### 1️⃣ 基础钱包桥接 (schema-wallet-bridge.sql)

这个脚本创建了基础的钱包集成功能。

**核心功能**：
- ✅ 添加 `wallet_owner` 字段到 `pixels` 表
- ✅ `conquer_pixel_wallet()` - 单像素占领
- ✅ `conquer_pixels_batch()` - 批量占领
- ✅ `get_grid_state_wallet()` - 获取网格状态
- ✅ `get_wallet_pixels()` - 查询用户拥有的像素
- ✅ RLS 策略配置

**执行方式**：
```sql
-- 复制 supabase/schema-wallet-bridge.sql 的完整内容到 SQL Editor
-- 点击 Run 执行
```

### 2️⃣ 批量占领优化 (optimizations-batch-conquest.sql) ✨

这个脚本修复了批量占领的高失败率问题（从 40% 提升至接近 100%）。

**核心改进**：
- ✅ **优雅跳过已拥有像素** - 不再返回错误，返回 `skipped: true`
- ✅ **不重复扣费** - 跳过的像素 `pricePaid: 0`
- ✅ **免费换色功能** - `recolor_pixel_wallet()` 和 `recolor_pixels_batch()`
- ✅ **准确统计** - 区分 成功/跳过/失败 三种状态

**执行方式**：
```sql
-- 复制 supabase/optimizations-batch-conquest.sql 的完整内容到 SQL Editor
-- 点击 Run 执行
```

**修复效果对比**：

| 状态 | 修复前 | 修复后 |
|------|--------|--------|
| 选择像素 | 112 个 | 112 个 |
| ✅ 成功占领 | 44 个 (40%) | 44 个 (新占领) |
| ⏭️ 跳过 | - | 68 个 (已拥有) |
| ❌ 失败 | 68 个 (60%) | 0 个 |
| 💰 支付金额 | 1.328 USDC | ~0.88 USDC (节省 33%) |

---

## 数据库函数说明

### conquer_pixel_wallet()

占领单个像素（支付 USDC）。

**参数**：
- `p_pixel_x`: 像素 X 坐标
- `p_pixel_y`: 像素 Y 坐标
- `p_wallet_address`: 钱包地址
- `p_new_color`: 新颜色 (HEX)
- `p_tx_hash`: 交易哈希

**返回**：
```json
{
  "success": true,
  "skipped": false,  // 是否跳过（已拥有）
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
    "txHash": "...",
    "previousOwner": "DEF...123"
  }
}
```

**特殊行为**：
- 如果像素已被当前用户拥有，返回 `skipped: true`，不扣费，不更新状态

### conquer_pixels_batch()

批量占领多个像素。

**参数**：
- `p_pixels`: JSONB 数组 `[{x, y, color}, ...]`
- `p_wallet_address`: 钱包地址
- `p_tx_hash`: 交易哈希

**返回**：
```json
{
  "success": true,
  "totalPixels": 112,
  "successCount": 44,     // 新占领的数量
  "skippedCount": 68,     // 跳过的数量（已拥有）
  "errorCount": 0,        // 真正失败的数量
  "totalPaid": 0.88,      // 实际支付金额
  "txHash": "...",
  "results": [...]        // 每个像素的详细结果
}
```

### recolor_pixel_wallet()

免费为已拥有的像素换色。

**参数**：
- `p_pixel_x`: 像素 X 坐标
- `p_pixel_y`: 像素 Y 坐标
- `p_wallet_address`: 钱包地址
- `p_new_color`: 新颜色 (HEX)

**返回**：
```json
{
  "success": true,
  "pixel": {
    "x": 10,
    "y": 5,
    "color": "#00FF00",
    "currentPrice": 0.012,  // 价格不变
    "walletOwner": "ABC...XYZ"
  }
}
```

**特点**：
- ✅ 完全免费，不扣费
- ✅ 不增加价格
- ✅ 不增加占领次数
- ❌ 只能操作自己拥有的像素

### recolor_pixels_batch()

批量免费换色。

**参数**：
- `p_pixels`: JSONB 数组 `[{x, y, color}, ...]`
- `p_wallet_address`: 钱包地址

**返回**：
```json
{
  "success": true,
  "totalPixels": 20,
  "successCount": 20,
  "errorCount": 0,
  "results": [...]
}
```

### get_grid_state_wallet()

获取完整的网格状态（包含钱包所有者信息）。

**返回**：
```json
[
  {
    "id": "uuid",
    "x": 0,
    "y": 0,
    "color": "#FF0000",
    "currentPrice": 0.012,
    "ownerId": "ABC...XYZ",
    "walletOwner": "ABC...XYZ",
    "conquestCount": 5,
    "lastConqueredAt": "2026-01-23T..."
  },
  ...
]
```

### get_wallet_pixels()

查询特定钱包拥有的所有像素。

**参数**：
- `p_wallet_address`: 钱包地址

**返回**：
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
      "lastConqueredAt": "2026-01-23T..."
    },
    ...
  ]
}
```

---

## 实时同步设置

Supabase Realtime 自动同步数据库变更到所有连接的客户端。

### 启用 Realtime

```sql
-- 1. 确保 Realtime 已启用（默认已启用）
-- 2. 将 pixels 表添加到发布
ALTER PUBLICATION supabase_realtime ADD TABLE pixels;

-- 3. 验证
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND tablename = 'pixels';
```

### 客户端订阅

前端代码已经配置好实时订阅（无需修改）：

```typescript
// components/game/Grid.tsx
const channel = supabase
  .channel('pixels-changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'pixels',
  }, (payload) => {
    // 自动更新本地状态
    updatePixel(payload.new);
  })
  .subscribe();
```

**效果**：
- 用户 A 占领像素 → 用户 B 的浏览器立即看到颜色变化
- 无需手动刷新
- 延迟通常 < 100ms

---

## 测试和验证

### 测试单像素占领

1. 启动开发服务器：`npm run dev`
2. 打开浏览器：http://localhost:3000
3. 连接钱包（Phantom/Solflare）
4. 点击任意像素 → 选择颜色 → 占领

**预期结果**：
- ✅ Toast 通知："🎉 占领成功！"
- ✅ 显示支付金额和新价格
- ✅ 像素颜色立即更新
- ✅ 余额扣除（模拟）
- ✅ 其他浏览器窗口同步更新

### 测试批量占领

1. 按住 `Shift` 键
2. 拖动鼠标选择一片区域（包含已拥有和未拥有的像素）
3. 点击"批量占领"按钮

**预期结果**：
- ✅ 新占领的像素正常扣费
- ✅ 已拥有的像素自动跳过，不扣费
- ✅ Toast 显示详细统计：
  - "✅ 占领: X 个"
  - "⏭️ 跳过: Y 个 (已拥有)"
  - "💰 总支付: Z USDC"

### 测试免费换色

**单像素换色**：
1. 点击已拥有的像素
2. 选择新颜色
3. 点击 "🎨 免费换色" 按钮

**批量换色**：
1. 按住 `Shift` 选择多个已拥有的像素
2. 点击"批量占领"
3. 系统自动识别为换色操作（免费）

---

## 常见问题

### Q1: 函数找不到 "function does not exist"

**原因**：迁移脚本未执行或执行失败

**解决方案**：
```sql
-- 查看函数是否存在
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name LIKE '%pixel%';
```

如果没有函数，重新执行迁移脚本。

### Q2: 批量占领还是有很多失败

**原因**：可能未执行 `optimizations-batch-conquest.sql`

**解决方案**：
```sql
-- 检查 conquer_pixel_wallet 是否支持 skipped 字段
SELECT conquer_pixel_wallet(0, 0, 'test-address', '#FF0000', 'test-hash');
```

如果返回没有 `skipped` 字段，执行优化脚本。

### Q3: 实时同步不工作

**原因**：`pixels` 表未添加到 Realtime 发布

**解决方案**：
```sql
-- 添加到发布
ALTER PUBLICATION supabase_realtime ADD TABLE pixels;

-- 如果已存在，先删除再添加
ALTER PUBLICATION supabase_realtime DROP TABLE pixels;
ALTER PUBLICATION supabase_realtime ADD TABLE pixels;
```

### Q4: 换色功能不可用

**原因**：未执行 `optimizations-batch-conquest.sql`

**解决方案**：执行完整的优化脚本（包含换色函数）

### Q5: 如何重置整个网格？

```sql
-- 重置所有像素为初始状态
UPDATE pixels
SET
  wallet_owner = NULL,
  color = '#0a0a0a',
  current_price = 0.01,
  conquest_count = 0,
  last_conquered_at = NULL,
  updated_at = NOW();
```

### Q6: 如何查看我拥有的所有像素？

```sql
-- 替换为你的钱包地址
SELECT * FROM pixels
WHERE wallet_owner = '你的钱包地址'
ORDER BY conquest_count DESC;
```

或使用 RPC 函数：
```sql
SELECT get_wallet_pixels('你的钱包地址');
```

---

## 数据库架构

### pixels 表结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 主键 |
| `x` | INTEGER | X 坐标 (0-49) |
| `y` | INTEGER | Y 坐标 (0-29) |
| `color` | VARCHAR(7) | HEX 颜色代码 |
| `current_price` | DECIMAL(20,8) | 当前价格 (USDC) |
| `wallet_owner` | VARCHAR(100) | 钱包所有者地址 |
| `owner_id` | UUID | 旧字段，兼容用 |
| `conquest_count` | INTEGER | 被占领次数 |
| `last_conquered_at` | TIMESTAMP | 最后占领时间 |
| `created_at` | TIMESTAMP | 创建时间 |
| `updated_at` | TIMESTAMP | 更新时间 |

### 索引

```sql
-- 坐标索引（用于快速查找）
CREATE INDEX IF NOT EXISTS idx_pixels_coordinates ON pixels(x, y);

-- 所有者索引（用于查询用户的像素）
CREATE INDEX IF NOT EXISTS idx_pixels_wallet_owner ON pixels(wallet_owner);

-- 价格索引（用于排序）
CREATE INDEX IF NOT EXISTS idx_pixels_price ON pixels(current_price);
```

---

## 下一步

- ✅ 完成数据库迁移
- ✅ 测试单像素占领
- ✅ 测试批量占领
- ✅ 测试免费换色
- ⏭️ 查看 [黑客松任务](HACKATHON.md) 了解后续开发计划
- ⏭️ 开始 Day 3 优化任务

---

**最后更新**: 2026-01-23
**迁移版本**: v2.0 (批量占领优化)
