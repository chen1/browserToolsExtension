# Browser Tools Manager 扩展安装和使用指南

## 🚀 扩展概述

Browser Tools Manager 是一个VSCode/Cursor扩展，用于管理和使用browser-tools服务。它将原本需要手动启动的命令行工具集成到IDE中，提供图形化界面和自动化管理。

## 📋 系统要求

- **Node.js**: 版本 >= 18.0.0
- **VSCode/Cursor**: 版本 >= 1.74.0
- **操作系统**: macOS, Windows, Linux

## 🔧 安装步骤

### 方法1：通过VSIX包安装（推荐）

1. 下载 `browser-tools-manager-1.0.0.vsix` 文件
2. 在VSCode/Cursor中按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
3. 输入 "Extensions: Install from VSIX..."
4. 选择下载的VSIX文件
5. 重启VSCode/Cursor

### 方法2：从源码编译安装

```bash
# 克隆仓库
git clone <repository-url>
cd browser-tools-extension

# 安装依赖
npm install

# 编译
npm run compile

# 创建VSIX包
node scripts/create-vsix.js

# 然后按照方法1安装
```

## 🎯 使用方法

### 启动服务

1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
2. 输入 "Browser Tools: 启动 Browser Tools 服务"
3. 等待服务启动完成

### 查看服务状态

1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
2. 输入 "Browser Tools: 查看 Browser Tools 状态"
3. 查看详细的状态信息

### 停止服务

1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
2. 输入 "Browser Tools: 停止 Browser Tools 服务"

### 重启服务

1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
2. 输入 "Browser Tools: 重启 Browser Tools 服务"

### 查看日志

1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
2. 输入 "Browser Tools: 查看详细日志"

## 🔍 故障排除

### 问题1：扩展激活失败

**症状**: 扩展无法激活，显示Node.js版本错误

**解决方案**: 
- 确保Node.js版本 >= 18.0.0
- 运行 `node --version` 检查版本
- 如需要，升级Node.js版本

### 问题2：服务启动失败

**症状**: 服务启动后立即退出

**解决方案**:
1. 检查端口3025是否被占用
2. 查看详细日志了解错误原因
3. 确保Chrome已启动并启用远程调试
4. 重启VSCode/Cursor

### 问题3：MCP配置文件不存在

**症状**: 日志显示"MCP配置文件不存在"警告

**解决方案**:
- 扩展会自动创建MCP配置文件
- 如果仍有问题，手动检查 `~/.cursor/mcp.json` 文件
- 确保文件权限正确

### 问题4：Chrome远程调试未启用

**症状**: 服务启动但无法连接Chrome

**解决方案**:
1. 关闭所有Chrome进程
2. 使用以下命令启动Chrome：
   ```bash
   # macOS
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
   
   # Windows
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
   
   # Linux
   google-chrome --remote-debugging-port=9222
   ```

## 📁 文件结构

```
browser-tools-extension/
├── src/                    # 源代码
│   ├── browserToolsManager.ts  # 核心管理器
│   ├── commands.ts         # 命令定义
│   ├── extension.ts        # 扩展入口
│   └── utils/              # 工具类
├── out/                    # 编译后的代码
├── package.json            # 扩展配置
└── browser-tools-manager-1.0.0.vsix  # 安装包
```

## 🔧 配置选项

扩展支持以下配置选项（在VSCode/Cursor设置中）：

- `browserTools.serverPort`: 服务器端口 (默认: 3025)
- `browserTools.logFile`: 日志文件路径 (默认: /tmp/browser-tools.log)
- `browserTools.chromeDebugPort`: Chrome远程调试端口 (默认: 9222)

## 📝 日志位置

- **扩展日志**: 在VSCode/Cursor的输出面板中查看 "Browser Tools Manager"
- **服务日志**: 默认保存在 `/tmp/browser-tools.log`
- **PID文件**: `/tmp/browser-tools-server.pid` 和 `/tmp/browser-tools-mcp.pid`

## 🆘 获取帮助

如果遇到问题：

1. 查看扩展日志获取详细错误信息
2. 检查系统日志
3. 确保所有依赖都已正确安装
4. 重启VSCode/Cursor

## 🔄 更新扩展

1. 下载新版本的VSIX包
2. 卸载旧版本扩展
3. 安装新版本
4. 重启VSCode/Cursor

## 📄 许可证

本扩展基于MIT许可证开源。


