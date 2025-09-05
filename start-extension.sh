#!/bin/bash

echo "🚀 Browser Tools Manager 扩展启动助手"
echo "====================================="

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在扩展项目根目录下运行此脚本"
    exit 1
fi

echo "📁 当前目录: $(pwd)"
echo ""

# 1. 清理并重新编译
echo "1. 🔨 清理并重新编译项目..."
rm -rf out/
npm run compile

if [ $? -eq 0 ]; then
    echo "✅ 编译成功"
else
    echo "❌ 编译失败"
    exit 1
fi

# 2. 创建VSIX包
echo ""
echo "2. 📦 创建VSIX包..."
npm run package

if [ $? -eq 0 ]; then
    echo "✅ VSIX包创建成功"
    ls -la *.vsix
else
    echo "❌ VSIX包创建失败"
    exit 1
fi

# 3. 检查文件
echo ""
echo "3. 🔍 检查关键文件..."
if [ -f "out/extension.js" ]; then
    echo "✅ extension.js 存在"
else
    echo "❌ extension.js 不存在"
    exit 1
fi

if [ -f "out/commands.js" ]; then
    echo "✅ commands.js 存在"
else
    echo "❌ commands.js 不存在"
    exit 1
fi

# 4. 显示安装说明
echo ""
echo "4. 📋 安装说明:"
echo "   请在Cursor中执行以下步骤:"
echo ""
echo "   a) 按 Cmd+Shift+P 打开命令面板"
echo "   b) 输入 'Extensions: Install from VSIX...'"
echo "   c) 选择刚创建的 browser-tools-manager-1.0.0.vsix 文件"
echo "   d) 安装完成后，按 Cmd+Shift+P 重新加载窗口"
echo "   e) 输入 'Developer: Reload Window'"
echo ""
echo "5. 🧪 测试扩展:"
echo "   重新加载后，按 Cmd+Shift+P 并输入 'Browser Tools' 查看命令"
echo ""

# 5. 检查扩展状态
echo "6. 🔍 检查扩展状态:"
echo "   如果扩展已安装，可以:"
echo "   - 按 Cmd+Shift+P 输入 'Output: Show Output Channels'"
echo "   - 选择 'Browser Tools Manager' 查看日志"
echo ""

echo "====================================="
echo "脚本执行完成！请按照上述步骤安装扩展。"
echo "如果仍有问题，请检查Cursor的扩展面板和输出日志。"
