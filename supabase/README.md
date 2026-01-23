# Supabase 数据库管理

## 📁 文件结构

```
supabase/
├── schema-complete.sql           ✨ 完整的数据库架构（推荐使用）
├── schema-wallet-bridge.sql      📦 基础钱包集成（已被合并）
├── optimizations-batch-conquest.sql  🚀 批量占领优化（已被合并）
├── README.md                     📖 本文件 - 数据库管理指南
├── CLI_QUICKSTART.md             🚀 Supabase CLI 快速开始指南
└── archive/                      📦 归档的旧版本
    ├── schema.sql                   （Supabase Auth 版本）
    └── schema-guest-mode.sql        （游客模式版本）
```

## 🚀 快速开始

### 方法 1: SQL Editor（手动复制粘贴）

这是你目前使用的方法，适合快速测试：

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目 `xxizahqoxgldrbkuwaxd`
3. 点击左侧 **SQL Editor**
4. 复制 `schema-complete.sql` 的完整内容
5. 粘贴到编辑器并点击 **Run**

**优点**：
- ✅ 简单直接
- ✅ 不需要安装工具

**缺点**：
- ❌ 每次都要手动复制粘贴
- ❌ 无法版本控制
- ❌ 容易出错

---

### 方法 2: Supabase CLI（推荐用于 Migration 管理）⭐

Supabase CLI 主要用于管理数据库 migrations 和本地开发。

**注意**: CLI v2.72.7 不支持直接执行任意 SQL 文件到远程数据库。如果你需要使用 CLI，请查看 [CLI_QUICKSTART.md](CLI_QUICKSTART.md) 了解完整的使用方法和 Migration 系统。

#### 快速安装

```bash
# macOS (使用 Homebrew)
brew install supabase/tap/supabase

# 验证安装
supabase --version
```

#### 推荐工作流程

```bash
# 1. 初始化项目
supabase init

# 2. 创建 migration 文件
supabase migration new initial_schema

# 3. 将 schema-complete.sql 内容复制到 migration 文件

# 4. 推送到远程
supabase db push
```

**优点**：
- ✅ 完整的版本控制
- ✅ 团队协作友好
- ✅ 可回滚变更
- ✅ 支持数据库备份

**缺点**：
- ❌ 初次设置较复杂
- ❌ 不支持直接执行任意 SQL 文件

**详细文档**: 查看 [CLI_QUICKSTART.md](CLI_QUICKSTART.md)

---

## 📋 当前推荐使用方式

根据你的项目阶段：

### 🏃 Hackathon 阶段（现在）
**使用方法 1 - SQL Editor**：
- 快速测试和迭代
- 不需要额外配置
- 立即执行 SQL 文件

### 🚀 生产环境（未来）
**使用方法 2 - Migration 系统**：
- 正式部署前迁移到 Migration 系统
- 确保数据库变更可追踪和回滚
- 详细说明见 [CLI_QUICKSTART.md](CLI_QUICKSTART.md)

---

## 🔧 常用操作

### 查看数据库状态

推荐使用 SQL Editor 查询：

```sql
-- 查看所有表
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- 查看所有函数
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public';

-- 查看像素统计
SELECT COUNT(*) as total_pixels,
       COUNT(wallet_owner) as owned_pixels
FROM pixels;
```

### 备份数据库

使用 CLI 进行备份：

```bash
# 导出完整数据库架构
supabase db dump > backup-$(date +%Y%m%d).sql

# 只导出数据（不含架构）
supabase db dump --data-only > data-backup.sql
```

### 重置数据库（慎用！）

在 SQL Editor 中执行：

```sql
-- 重置所有像素为初始状态
UPDATE pixels
SET wallet_owner = NULL,
    color = '#0a0a0a',
    current_price = 0.01,
    conquest_count = 0,
    last_conquered_at = NULL,
    updated_at = NOW();
```

**更多 CLI 命令**: 查看 [CLI_QUICKSTART.md](CLI_QUICKSTART.md)

---

## 🆘 常见问题

### Q1: 如何执行 SQL 文件？

**推荐方式 - SQL Editor**：
1. 打开 [SQL Editor](https://supabase.com/dashboard/project/xxizahqoxgldrbkuwaxd/sql)
2. 复制 `schema-complete.sql` 内容
3. 粘贴并点击 Run

**CLI 方式** - 需要 Migration 系统，查看 [CLI_QUICKSTART.md](CLI_QUICKSTART.md)

### Q2: CLI 能直接执行 SQL 文件吗？

不能。Supabase CLI v2.72.7 不支持直接执行任意 SQL 文件到远程数据库。需要使用 Migration 系统或 SQL Editor。

详细说明：[CLI_QUICKSTART.md](CLI_QUICKSTART.md)

### Q3: 函数找不到 "function does not exist"

**原因**：SQL 文件未正确执行

**解决方案**：
在 SQL Editor 中验证：
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name LIKE '%pixel%';
```

应该看到 6 个函数。如果没有，重新执行 `schema-complete.sql`。

### Q4: 数据库密码忘记

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard/project/xxizahqoxgldrbkuwaxd)
2. Settings → Database
3. 点击 "Reset database password"

---

## 📚 官方文档

- [Supabase CLI 文档](https://supabase.com/docs/guides/cli)
- [数据库管理](https://supabase.com/docs/guides/database)
- [Migrations 指南](https://supabase.com/docs/guides/cli/local-development#database-migrations)

---

## 🎯 下一步

1. **立即执行数据库架构**：
   - 使用 SQL Editor 执行 `schema-complete.sql`
   - 详细步骤见上方"快速开始"

2. **开始测试**：
   - 运行 `npm run dev`
   - 连接钱包
   - 测试批量占领功能

3. **（可选）学习 CLI**：
   - 查看 [CLI_QUICKSTART.md](CLI_QUICKSTART.md)
   - 了解 Migration 系统和数据库备份

---

**最后更新**: 2026-01-23
**维护者**: x402's Pixel War Team
