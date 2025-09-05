# Browser Tools Manager

一个用于在Cursor中管理browser-tools服务的扩展，支持启动、停止和监控服务状态。

## 功能特性

- 🚀 **一键启动**: 在Cursor中直接启动browser-tools服务
- 🛑 **一键停止**: 安全停止所有相关服务进程
- 📊 **状态监控**: 实时查看服务运行状态和端口占用情况
- ⚙️ **配置管理**: 支持自定义端口、日志路径等配置
- 🔧 **智能MCP配置**: 自动检测和配置MCP设置，提供用户友好的配置向导
- 🔍 **进程管理**: 智能管理进程生命周期和资源清理
- 📝 **日志记录**: 完整的操作日志记录和查看

## 系统要求

- Cursor 1.74.0 或更高版本
- Node.js 18.0.0 或更高版本
- Chrome浏览器（需要启用远程调试端口）

## 安装说明

### 从源码安装

1. 克隆或下载此扩展项目
2. 在项目目录中运行：
   ```bash
   npm install
   npm run compile
   ```
3. 将编译后的扩展复制到Cursor扩展目录

### 从VSIX包安装

1. 下载扩展的.vsix文件
2. 在Cursor中按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
3. 输入 "Extensions: Install from VSIX..."
4. 选择下载的.vsix文件

## 使用方法

### 启动服务

1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
2. 输入 "启动 Browser Tools 服务"
3. 选择命令并执行
4. **首次使用**：如果MCP配置不存在，扩展会自动提示配置选项：
   - **自动创建配置**（推荐）：一键创建完整配置
   - **手动配置指引**：显示详细配置步骤
   - **跳过MCP配置**：仅启动服务器功能

### 停止服务

1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
2. 输入 "停止 Browser Tools 服务"
3. 选择命令并执行

### 查看状态

1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
2. 输入 "查看 Browser Tools 状态"
3. 选择命令查看详细状态信息

### 配置MCP设置

1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
2. 输入 "配置MCP设置"
3. 选择命令并执行
4. **重要**：配置完成后需要重启Cursor以应用配置

## 配置选项

在Cursor设置中可以配置以下选项：

- `browserTools.serverPort`: 服务器端口（默认: 3025）
- `browserTools.logFile`: 日志文件路径（默认: /tmp/browser-tools.log）
- `browserTools.chromeDebugPort`: Chrome远程调试端口（默认: 9222）

## Chrome浏览器设置

使用此扩展前，需要启动Chrome并启用远程调试：

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222
```

## 🔧 MCP配置管理

Browser Tools Manager提供了智能的MCP配置管理功能：

### 自动配置（推荐）

扩展会在启动时自动检测MCP配置，如果配置缺失或有问题，会显示用户友好的选择界面：

- **🔧 自动创建配置**：一键创建完整的MCP配置
- **📖 手动配置指引**：显示详细的配置步骤和模板
- **⚠️ 跳过MCP配置**：仅启动服务器功能（部分功能不可用）

### 手动配置管理

通过命令面板使用MCP配置管理：

1. 按 `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux)
2. 输入 "Browser Tools: 配置MCP设置"
3. 选择需要的操作：
   - 自动创建配置
   - 查看配置指引
   - 验证配置
   - 修复配置

### 配置文件位置

- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/mcp.json`
- **Windows**: `%USERPROFILE%\AppData\Roaming\Cursor\User\globalStorage\mcp.json`
- **Linux**: `~/.config/Cursor/User/globalStorage/mcp.json`

### 默认配置模板

```json
{
  "mcp": {
    "browser-tools": {
      "command": "node",
      "args": [
        "/path/to/browser-tools-extension/node_modules/@agentdeskai/browser-tools-mcp/index.js",
        "--port",
        "3025"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

📖 **详细配置指南**: 请参阅 [MCP_CONFIG_GUIDE.md](./MCP_CONFIG_GUIDE.md) 获取完整的配置说明。

## 故障排除

### 服务启动失败

1. 检查Chrome是否已启动并启用远程调试端口
2. 检查端口3025是否被其他程序占用
3. 查看日志文件获取详细错误信息

### MCP配置问题

#### 问题1: MCP配置文件不存在
**现象**: 启动时提示"MCP配置文件不存在"  
**解决方案**:
1. 选择"自动创建配置"（推荐）
2. 或使用"Browser Tools: 配置MCP设置"命令手动创建

#### 问题2: MCP配置格式错误
**现象**: 启动时提示"MCP配置文件损坏"  
**解决方案**:
1. 选择"重新创建配置"
2. 或选择"备份并重建"保留原配置

#### 问题3: MCP配置不完整
**现象**: 启动时提示"MCP配置不完整"  
**解决方案**:
1. 选择"修复配置"自动补全缺失配置
2. 或查看配置指引手动修复

#### 问题4: MCP无法调用
**现象**: 服务启动但MCP功能不工作  
**解决方案**:
1. 使用"查看 Browser Tools 状态"检查MCP状态
2. 确认MCP配置显示为"✅ 是"
3. **重启Cursor**（MCP配置更改后必须重启）
4. 使用"验证配置"命令检查配置有效性

### 进程无法停止

1. 使用系统任务管理器强制终止相关进程
2. 重启Cursor编辑器
3. 检查系统权限设置

### 端口冲突

1. 在设置中修改服务器端口
2. 停止占用端口的其他服务
3. 使用扩展的状态检查功能确认端口状态

## 开发说明

### 项目结构

```
browser-tools-extension/
├── src/
│   ├── extension.ts              # 扩展主入口
│   ├── browserToolsManager.ts    # 核心管理器
│   ├── commands.ts               # 命令定义
│   └── utils/                    # 工具类
│       ├── processManager.ts     # 进程管理
│       ├── portChecker.ts        # 端口检查
│       └── logger.ts             # 日志管理
├── package.json                  # 项目配置
├── tsconfig.json                 # TypeScript配置
└── README.md                     # 说明文档
```

### 构建和测试

```bash
# 安装依赖
npm install

# 编译TypeScript
npm run compile

# 监听文件变化
npm run watch

# 运行测试
npm test

# 代码检查
npm run lint
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个扩展！

## 更新日志

### v1.0.0
- 初始版本发布
- 支持启动/停止browser-tools服务
- 提供状态监控和配置管理
- 完整的进程生命周期管理 