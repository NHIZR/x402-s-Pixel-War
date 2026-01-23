#!/bin/bash

# x402's Pixel War - 部署到私有 GitHub 仓库
# 请替换 YOUR_GITHUB_USERNAME 为您的 GitHub 用户名

echo "🚀 开始部署到私有 GitHub 仓库..."

# 1. 初始化 Git（如果还没有）
if [ ! -d .git ]; then
  echo "📦 初始化 Git 仓库..."
  git init
fi

# 2. 添加所有文件
echo "📝 添加文件到 Git..."
git add .

# 3. 创建首次提交
echo "💾 创建提交..."
git commit -m "Add Mintlify documentation and complete Day 3 tasks

- API documentation (8,000+ words)
- User guide (9,000+ words)
- Architecture documentation (10,000+ words)
- Deployment guide (7,500+ words)
- Mintlify integration (introduction, quickstart, API reference)
- Total: 34,500+ words of documentation

Built with Claude Code"

# 4. 设置主分支名称
git branch -M main

# 5. 添加远程仓库（请替换 YOUR_GITHUB_USERNAME）
echo "🔗 添加远程仓库..."
echo "⚠️  请手动替换下面命令中的 YOUR_GITHUB_USERNAME"
echo ""
echo "运行以下命令："
echo "git remote add origin https://github.com/YOUR_GITHUB_USERNAME/x402-pixel-war.git"
echo "git push -u origin main"
echo ""

# 如果您已经设置了 SSH key，也可以使用：
# git remote add origin git@github.com:YOUR_GITHUB_USERNAME/x402-pixel-war.git

echo "✅ Git 设置完成！"
echo ""
echo "📋 下一步："
echo "1. 创建私有 GitHub 仓库: https://github.com/new"
echo "2. 复制仓库 URL"
echo "3. 运行上面的 git remote add 和 git push 命令"
echo "4. 然后访问 https://dashboard.mintlify.com/ 连接您的私有仓库"
