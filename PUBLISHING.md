# 发布说明

## 发布到Cursor扩展市场

### 准备工作

1. **注册开发者账号**
   - 访问 [Visual Studio Marketplace](https://marketplace.visualstudio.com/)
   - 使用Microsoft账号登录
   - 创建发布者账号（Publisher）

2. **更新package.json**
   - 修改 `publisher` 字段为你的发布者ID
   - 更新 `repository.url` 为你的GitHub仓库地址
   - 确保版本号正确

3. **准备发布材料**
   - 扩展图标（128x128 PNG）
   - 扩展截图（1280x720 PNG）
   - 详细的README文档
   - 更新日志

### 发布步骤

#### 方法1: 使用vsce工具（推荐）

```bash
# 安装vsce工具
npm install -g @vscode/vsce

# 登录到发布者账号
vsce login <publisher-name>

# 发布扩展
vsce publish

# 或者发布特定版本
vsce publish patch  # 补丁版本
vsce publish minor  # 次要版本
vsce publish major  # 主要版本
```

#### 方法2: 手动上传

1. 访问 [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage)
2. 点击 "New Extension"
3. 选择 "Visual Studio Code"
4. 上传VSIX文件
5. 填写扩展信息
6. 提交审核

### 发布检查清单

- [ ] 扩展功能完整且无bug
- [ ] 代码已编译并通过测试
- [ ] package.json配置正确
- [ ] README文档完整
- [ ] 许可证文件存在
- [ ] 更新日志记录完整
- [ ] 扩展图标和截图准备就绪
- [ ] 发布者账号已创建

### 版本管理

遵循[语义化版本](https://semver.org/lang/zh-CN/)规范：

- **补丁版本** (1.0.1): Bug修复，向后兼容
- **次要版本** (1.1.0): 新功能，向后兼容
- **主要版本** (2.0.0): 破坏性变更

### 发布后

1. **监控反馈**
   - 查看用户评价和问题报告
   - 及时响应用户反馈

2. **持续更新**
   - 修复发现的bug
   - 添加新功能
   - 保持与Cursor版本的兼容性

3. **推广扩展**
   - 在相关社区分享
   - 撰写技术博客
   - 参与开发者讨论

## 本地测试

在发布前，建议在本地测试扩展：

```bash
# 编译扩展
npm run compile

# 在Cursor中按F5启动调试模式
# 测试所有功能是否正常
```

## 故障排除

### 常见问题

1. **发布失败**
   - 检查网络连接
   - 确认发布者账号权限
   - 验证package.json格式

2. **扩展无法安装**
   - 检查VSIX文件完整性
   - 确认Cursor版本兼容性
   - 查看安装日志

3. **功能异常**
   - 检查依赖是否正确安装
   - 验证系统权限设置
   - 查看扩展输出日志

## 联系支持

如果遇到发布问题，可以：

- 查看 [VS Code扩展开发文档](https://code.visualstudio.com/api)
- 访问 [VS Code扩展市场帮助](https://marketplace.visualstudio.com/help)
- 在 [GitHub Issues](https://github.com/microsoft/vscode/issues) 中寻求帮助 