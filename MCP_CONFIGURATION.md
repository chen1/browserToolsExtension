# MCP配置说明

## 问题描述

在使用"调用mcp,查看devTools中选中元素"等提示词时，Cursor的AI Agent无法正常调用browser-tools MCP服务。

## 原因分析

Cursor的AI Agent需要特定的MCP配置文件才能识别和调用MCP服务。仅仅启动MCP进程是不够的，还需要在Cursor的配置目录中创建正确的MCP配置文件。

## 解决方案

Browser Tools Manager扩展现在提供了自动MCP配置功能，可以：

1. **自动配置MCP设置**：在启动服务时自动创建/更新MCP配置文件
2. **手动配置MCP**：提供专门的命令来配置MCP设置
3. **配置验证**：检查MCP配置是否正确
4. **自动清理**：在停止服务时自动清理MCP配置

## 使用方法

### 方法1：自动配置（推荐）

1. 启动Browser Tools服务：
   - 命令面板 → "启动 Browser Tools 服务"
   - 扩展会自动配置MCP设置

2. 重启Cursor：
   - 配置完成后需要重启Cursor以应用MCP设置

3. 验证配置：
   - 命令面板 → "查看 Browser Tools 状态"
   - 确认"MCP配置"显示为"✅ 是"

### 方法2：手动配置

1. 手动配置MCP：
   - 命令面板 → "配置MCP设置"
   - 等待配置完成提示

2. 重启Cursor：
   - 配置完成后需要重启Cursor以应用MCP设置

## MCP配置文件位置

扩展会自动在以下位置创建MCP配置文件：

- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/mcp.json`
- **Windows**: `%APPDATA%\Cursor\User\globalStorage\mcp.json`
- **Linux**: `~/.config/Cursor/User/globalStorage/mcp.json`

## 配置内容示例

```json
{
  "mcp": {
    "browser-tools": {
      "command": "npx",
      "args": ["-y", "@agentdeskai/browser-tools-mcp@1.2.0", "--port", "3025"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## 故障排除

### MCP配置失败

1. 检查权限：
   - 确保扩展有权限写入Cursor配置目录
   - 检查目录是否存在

2. 手动创建目录：
   - 如果目录不存在，手动创建相应的目录结构

3. 查看日志：
   - 使用"查看详细日志"命令查看详细错误信息

### MCP配置后仍无法调用

1. 确认配置成功：
   - 使用"查看 Browser Tools 状态"命令
   - 确认"MCP配置"显示为"✅ 是"

2. 重启Cursor：
   - MCP配置更改后必须重启Cursor才能生效

3. 检查服务状态：
   - 确认browser-tools服务正在运行
   - 确认端口3025未被占用

### 配置清理失败

1. 手动清理：
   - 直接删除MCP配置文件
   - 重启Cursor

2. 重新配置：
   - 使用"配置MCP设置"命令重新配置

## 技术细节

### 配置流程

1. **启动时**：
   - 启动browser-tools-server
   - 配置MCP设置
   - 启动browser-tools-mcp

2. **停止时**：
   - 停止所有服务进程
   - 清理MCP配置

3. **状态检查**：
   - 检查服务进程状态
   - 验证MCP配置完整性

### 配置验证

扩展会验证以下内容：
- MCP配置文件是否存在
- 配置文件格式是否正确
- 是否包含browser-tools配置
- 配置参数是否完整

## 注意事项

1. **重启要求**：MCP配置更改后必须重启Cursor才能生效
2. **权限要求**：扩展需要写入Cursor配置目录的权限
3. **配置冲突**：如果已有其他MCP配置，扩展会保留现有配置并添加browser-tools配置
4. **自动清理**：停止服务时会自动清理MCP配置，避免配置残留

## 更新日志

### v1.1.0
- 新增MCP自动配置功能
- 新增MCP配置验证
- 新增MCP配置清理
- 新增手动MCP配置命令
- 优化状态显示，包含MCP配置状态
