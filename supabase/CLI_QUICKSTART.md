# Supabase CLI 快速开始 🚀

✅ **Supabase CLI 已安装成功！** (版本 2.72.7)

现在你可以使用命令行自动执行 SQL 文件了。

---

## 🔐 步骤 1: 登录 Supabase

打开你的终端（Terminal），运行：

```bash
supabase login
```

这会打开浏览器让你授权。登录成功后会自动保存凭证。

**如果你在 VSCode 终端里运行**，可能需要在外部终端（iTerm 或 macOS Terminal）中执行。

---

## 🔗 步骤 2: 链接到你的项目

```bash
cd "/Users/lobesterk/Library/Mobile Documents/com~apple~CloudDocs/x402's Pixel War"

supabase link --project-ref xxizahqoxgldrbkuwaxd
```

系统会要求你输入数据库密码。密码在这里找到：
1. 打开 [Supabase Dashboard](https://supabase.com/dashboard/project/xxizahqoxgldrbkuwaxd)
2. 点击左侧 **Settings** → **Database**
3. 向下滚动到 **Connection string**
4. 点击眼睛图标显示密码

---

## 🎯 步骤 3: 执行 SQL 文件

**重要说明**: Supabase CLI v2.72.7 没有直接执行 SQL 文件到远程数据库的命令。有两种方法：

### 方法 A: SQL Editor（推荐，最简单）✅

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard/project/xxizahqoxgldrbkuwaxd)
2. 点击左侧 **SQL Editor**
3. 打开本地文件 `supabase/schema-complete.sql`
4. 复制全部内容
5. 粘贴到 SQL Editor 并点击 **Run**

### 方法 B: 使用 Migration 系统

如果你想使用 CLI 自动化，需要先初始化 Supabase 项目：

```bash
# 1. 初始化本地项目（会创建 config.toml 和 migrations/ 目录）
supabase init

# 2. 创建一个新的 migration 文件
supabase migration new initial_schema

# 3. 将 schema-complete.sql 的内容复制到生成的 migration 文件
# 文件位置: supabase/migrations/YYYYMMDDHHMMSS_initial_schema.sql

# 4. 推送到远程数据库
supabase db push
```

**注意**: 方法 B 更适合团队协作和版本控制，但设置较复杂。对于快速测试，建议使用方法 A。

---

## ✨ 常用 CLI 命令

**注意**: 以下命令需要先运行 `supabase init` 初始化本地项目。

### 数据库 Dump 和备份
```bash
# 导出完整数据库架构
supabase db dump > backup-$(date +%Y%m%d).sql

# 只导出数据（不含架构）
supabase db dump --data-only > data-backup.sql

# 只导出架构（不含数据）
supabase db dump --schema-only > schema-backup.sql
```

### Migration 管理
```bash
# 创建新的 migration 文件
supabase migration new my_migration_name

# 推送 migrations 到远程数据库
supabase db push

# 从远程数据库拉取架构
supabase db pull

# 查看本地和远程的差异
supabase db diff
```

### 项目管理
```bash
# 查看项目状态
supabase status

# 查看项目信息
supabase projects list

# 链接到另一个项目
supabase link --project-ref <project-ref>
```

### 查询数据（使用 SQL Editor）

由于 CLI 不支持直接执行 SQL 查询到远程数据库，推荐使用以下方式：

**方式 1: Dashboard SQL Editor**
- 打开 [SQL Editor](https://supabase.com/dashboard/project/xxizahqoxgldrbkuwaxd/sql)
- 直接运行 SQL 查询

**方式 2: Supabase Client (JavaScript/Python)**
```javascript
// 在代码中查询
const { data, error } = await supabase
  .from('pixels')
  .select('*')
  .limit(10);
```

---

## 🆘 故障排除

### 问题 1: `supabase: command not found`

重启终端，或运行：
```bash
source ~/.zshrc
```

### 问题 2: 登录失败

使用 Access Token 登录：
1. 打开 [Supabase Dashboard](https://supabase.com/dashboard/account/tokens)
2. 点击 **Generate new token**
3. 复制 token
4. 运行：
```bash
export SUPABASE_ACCESS_TOKEN="你的token"
supabase link --project-ref xxizahqoxgldrbkuwaxd
```

### 问题 3: 数据库密码忘记

在 Supabase Dashboard:
1. Settings → Database
2. 点击 "Reset database password"

---

## 🎮 实际使用示例

### 示例 1: 更新数据库函数（使用 SQL Editor）

1. 修改 `supabase/schema-complete.sql`
2. 打开 [SQL Editor](https://supabase.com/dashboard/project/xxizahqoxgldrbkuwaxd/sql)
3. 复制粘贴文件内容并执行
4. 验证函数已更新：
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%pixel%';
```

### 示例 2: 查看我拥有的像素（使用 SQL Editor）

在 SQL Editor 中运行：
```sql
SELECT * FROM pixels
WHERE wallet_owner = '你的钱包地址';

-- 或使用 RPC 函数
SELECT get_wallet_pixels('你的钱包地址');
```

### 示例 3: 备份数据库

```bash
# 导出完整数据库架构
supabase db dump > backup-$(date +%Y%m%d).sql

# 只导出数据（不含架构）
supabase db dump --data-only > data-backup.sql

# 只导出架构（不含数据）
supabase db dump --schema-only > schema-backup.sql
```

---

## 📚 下一步

1. **执行数据库架构**（两种方式二选一）：

   **方式 A - SQL Editor（推荐）**：
   - 打开 [SQL Editor](https://supabase.com/dashboard/project/xxizahqoxgldrbkuwaxd/sql)
   - 打开 `supabase/schema-complete.sql` 文件
   - 复制全部内容粘贴到 SQL Editor
   - 点击 Run 执行

   **方式 B - Migration 系统**：
   ```bash
   supabase init
   supabase migration new initial_schema
   # 将 schema-complete.sql 内容复制到生成的 migration 文件
   supabase db push
   ```

2. **验证安装**（在 SQL Editor 中运行）：
   ```sql
   SELECT COUNT(*) FROM pixels;
   ```

3. **开始测试**：
   - 运行 `npm run dev`
   - 连接钱包
   - 测试批量占领功能

---

## 🔗 更多资源

- [Supabase CLI 官方文档](https://supabase.com/docs/guides/cli)
- [SQL Editor 使用指南](https://supabase.com/docs/guides/database/overview)
- [PostgreSQL 命令速查](https://www.postgresqltutorial.com/postgresql-cheat-sheet/)

---

**安装时间**: 2026-01-23
**CLI 版本**: 2.72.7
**项目 ID**: xxizahqoxgldrbkuwaxd
