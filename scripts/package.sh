#!/bin/bash

# Browser Tools Manager 扩展打包脚本

echo "🚀 开始打包 Browser Tools Manager 扩展..."

# 检查是否安装了vsce
if ! command -v vsce &> /dev/null; then
    echo "❌ 未找到 vsce 工具，正在安装..."
    npm install -g @vscode/vsce
fi

# 清理之前的构建
echo "🧹 清理之前的构建..."
rm -rf out
rm -f *.vsix

# 编译TypeScript
echo "🔨 编译TypeScript代码..."
npm run compile

# 检查编译是否成功
if [ ! -d "out" ]; then
    echo "❌ 编译失败，out目录不存在"
    exit 1
fi

# 打包扩展
echo "📦 打包扩展..."
vsce package

# 检查打包是否成功
if [ -f "*.vsix" ]; then
    echo "✅ 扩展打包成功！"
    ls -la *.vsix
else
    echo "❌ 扩展打包失败"
    exit 1
fi

echo "🎉 打包完成！"
echo "📁 扩展文件: *.vsix"
echo "📋 安装方法:"
echo "   1. 在Cursor中按 Ctrl+Shift+P (Windows/Linux) 或 Cmd+Shift+P (macOS)"
echo "   2. 输入 'Extensions: Install from VSIX...'"
echo "   3. 选择生成的 .vsix 文件" 