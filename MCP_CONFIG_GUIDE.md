# Browser Tools Manager - MCP配置指南

## 📋 概述

Browser Tools Manager扩展需要MCP（Model Context Protocol）配置文件才能正常工作。本文档提供了完整的配置指南和默认配置项。

## 🔧 自动配置（推荐）

扩展提供了智能的自动配置功能：

1. **启动时自动检测** - 扩展启动时会自动检查MCP配置
2. **用户友好提示** - 如果配置缺失，会显示清晰的选择选项
3. **一键自动创建** - 选择"自动创建配置"即可完成配置

### 使用方法：
```
1. 启动Browser Tools服务时，如果MCP配置不存在，会自动弹出提示
2. 选择"自动创建配置"
3. 等待配置创建完成
4. 重新启动服务
```

## 📁 配置文件位置

### macOS
```
~/Library/Application Support/Cursor/User/globalStorage/mcp.json
```

### Windows
```
%USERPROFILE%\AppData\Roaming\Cursor\User\globalStorage\mcp.json
```

### Linux
```
~/.config/Cursor/User/globalStorage/mcp.json
```

## 📝 默认配置内容

### 完整配置模板

```json
{
  "mcp": {
    "browser-tools": {
      "command": "node",
      "args": [
        "/path/to/your/browser-tools-extension/node_modules/@agentdeskai/browser-tools-mcp/index.js",
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

### 配置项说明

| 配置项 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `command` | Node.js执行命令 | `"node"` | ✅ |
| `args[0]` | MCP脚本路径 | 自动解析包路径 | ✅ |
| `args[1]` | 端口参数标识 | `"--port"` | ✅ |
| `args[2]` | 服务端口号 | `"3025"` | ✅ |
| `env.NODE_ENV` | Node环境变量 | `"production"` | ⚠️ |

## 🛠️ 手动配置步骤

### 1. 创建配置目录

**macOS/Linux:**
```bash
mkdir -p ~/Library/Application\ Support/Cursor/User/globalStorage
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path "$env:APPDATA\Cursor\User\globalStorage"
```

### 2. 创建配置文件

**macOS示例:**
```bash
cat > ~/Library/Application\ Support/Cursor/User/globalStorage/mcp.json << 'EOF'
{
  "mcp": {
    "browser-tools": {
      "command": "node",
      "args": [
        "/Users/YOUR_USERNAME/browser-tools-extension/node_modules/@agentdeskai/browser-tools-mcp/index.js",
        "--port",
        "3025"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
EOF
```

**注意:** 请将 `/Users/YOUR_USERNAME/browser-tools-extension` 替换为您的实际扩展路径。

### 3. 验证配置

```bash
# 检查文件是否创建成功
cat ~/Library/Application\ Support/Cursor/User/globalStorage/mcp.json

# 验证JSON格式是否正确
python -m json.tool ~/Library/Application\ Support/Cursor/User/globalStorage/mcp.json
```

## ⚙️ 配置管理命令

扩展提供了便捷的配置管理命令：

### 通过命令面板使用：

1. **打开命令面板**: `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux)
2. **输入命令**: `Browser Tools: 配置MCP设置`
3. **选择操作**:
   - 🔧 **自动创建配置** - 自动生成完整配置
   - 📖 **查看配置指引** - 显示详细配置说明
   - ✅ **验证配置** - 检查当前配置是否有效
   - 🔨 **修复配置** - 修复现有配置问题

## 🔍 常见配置问题

### 问题1: 配置文件不存在
**现象**: 启动时提示"MCP配置文件不存在"
**解决**: 选择"自动创建配置"或按照手动配置步骤操作

### 问题2: 配置格式错误
**现象**: 启动时提示"MCP配置文件损坏"
**解决**: 选择"重新创建配置"或"备份并重建"

### 问题3: 缺少browser-tools配置
**现象**: 启动时提示"MCP配置不完整"
**解决**: 选择"修复配置"

### 问题4: 依赖包路径错误
**现象**: 配置存在但启动失败
**解决**: 
1. 确保已运行 `npm install` 安装依赖
2. 检查包路径是否正确
3. 重新运行"自动创建配置"

## 📊 配置验证清单

在启动服务前，请确认以下项目：

- [ ] 配置文件存在于正确位置
- [ ] JSON格式正确无语法错误
- [ ] 包含 `mcp.browser-tools` 配置节
- [ ] Node.js脚本路径正确
- [ ] 端口号与扩展设置一致
- [ ] 依赖包已正确安装

## 🎯 最佳实践

### 1. 使用自动配置
```
推荐使用扩展的自动配置功能，避免手动配置错误
```

### 2. 定期备份配置
```bash
# 创建配置备份
cp ~/Library/Application\ Support/Cursor/User/globalStorage/mcp.json ~/mcp.json.backup
```

### 3. 版本控制
```
如果在团队中使用，可以将配置模板添加到版本控制中
```

### 4. 环境隔离
```json
{
  "mcp": {
    "browser-tools-dev": {
      "command": "node",
      "args": ["path/to/dev/script", "--port", "3026"],
      "env": {"NODE_ENV": "development"}
    },
    "browser-tools": {
      "command": "node", 
      "args": ["path/to/prod/script", "--port", "3025"],
      "env": {"NODE_ENV": "production"}
    }
  }
}
```

## 🔧 高级配置

### 自定义端口
```json
{
  "mcp": {
    "browser-tools": {
      "command": "node",
      "args": [
        "path/to/script",
        "--port",
        "8080"  // 自定义端口
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 添加环境变量
```json
{
  "mcp": {
    "browser-tools": {
      "command": "node",
      "args": ["path/to/script", "--port", "3025"],
      "env": {
        "NODE_ENV": "production",
        "DEBUG": "browser-tools:*",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## 📞 获取帮助

如果您在配置过程中遇到问题：

1. **查看日志**: 使用 `Browser Tools: 查看详细日志` 命令
2. **验证配置**: 使用 `Browser Tools: 配置MCP设置` → `验证配置`
3. **重新配置**: 使用自动创建配置功能
4. **检查依赖**: 确保运行了 `npm install`

## 📄 配置文件示例

### 基础配置
```json
{
  "mcp": {
    "browser-tools": {
      "command": "node",
      "args": [
        "/Users/username/browser-tools-extension/node_modules/@agentdeskai/browser-tools-mcp/index.js",
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

### 多服务配置
```json
{
  "mcp": {
    "browser-tools": {
      "command": "node",
      "args": [
        "/path/to/browser-tools-mcp/index.js",
        "--port",
        "3025"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    },
    "other-service": {
      "command": "node",
      "args": ["/path/to/other/service"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

---

## 📝 更新日志

- **v1.1.0**: 添加自动MCP配置验证和用户引导
- **v1.0.0**: 基础MCP配置支持

---

**提示**: 建议使用扩展的自动配置功能，这样可以避免手动配置中的常见错误，并确保配置的正确性。
