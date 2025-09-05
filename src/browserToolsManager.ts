/*
 * @Author: chenjie chenjie@huimei.com
 * @Date: 2025-08-25 19:20:08
 * @LastEditors: chenjie chenjie@huimei.com
 * @LastEditTime: 2025-09-05 20:45:23
 * @FilePath: /browser-tools-extension/src/browserToolsManager.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/*
 * @Author: chenjie chenjie@huimei.com
 * @Date: 2025-08-25 19:20:08
 * @LastEditors: chenjie chenjie@huimei.com
 * @LastEditTime: 2025-09-05 12:02:45
 * @FilePath: /browser-tools-extension/src/browserToolsManager.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';
import * as http from 'http';
import { ProcessManager } from './utils/processManager';
import { PortChecker } from './utils/portChecker';
import { Logger } from './utils/logger';

export class BrowserToolsManager implements vscode.Disposable {
    private processManager: ProcessManager;
    private portChecker: PortChecker;
    private logger: Logger;
    private serverProcess: child_process.ChildProcess | null = null;
    private mcpProcess: child_process.ChildProcess | null = null;
    private serverPidFile: string;
    private mcpPidFile: string;
    private logFile: string;
    private serverPort: number;
    private chromeDebugPort: number;
    private mcpConfigPath: string;


    constructor(outputChannel?: vscode.OutputChannel) {
        this.processManager = new ProcessManager();
        this.portChecker = new PortChecker();
        this.logger = new Logger();
        
        // 如果提供了输出通道，设置到Logger中
        if (outputChannel) {
            this.logger.setOutputChannel(outputChannel);
        }
        
        // 从配置中获取设置
        const config = vscode.workspace.getConfiguration('browserTools');
        this.serverPort = config.get('serverPort', 3025);
        this.logFile = config.get('logFile', '/tmp/browser-tools.log');
        this.chromeDebugPort = config.get('chromeDebugPort', 9222);
        
        this.serverPidFile = '/tmp/browser-tools-server.pid';
        this.mcpPidFile = '/tmp/browser-tools-mcp.pid';
        
        // 设置MCP配置文件路径
        this.mcpConfigPath = this.getMcpConfigPath();
        
        // 检查Node.js版本（在logger初始化之后）
        this.checkNodeVersion();
    }

    /**
     * 获取MCP配置文件路径
     */
    private getMcpConfigPath(): string {
        const homeDir = process.env.HOME || process.env.USERPROFILE || '';
        
        // 使用Cursor的默认MCP配置路径
        return path.join(homeDir, '.cursor', 'mcp.json');
    }

    /**
     * 配置MCP设置
     */
    private async configureMcp(): Promise<boolean> {
        try {
            this.logger.log('正在配置MCP设置...');
            
            // 确保目录存在
            const configDir = path.dirname(this.mcpConfigPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            // 读取现有配置或创建新配置
            let mcpConfig: any = {};
            if (fs.existsSync(this.mcpConfigPath)) {
                try {
                    const configContent = fs.readFileSync(this.mcpConfigPath, 'utf8');
                    mcpConfig = JSON.parse(configContent);
                } catch (error) {
                    this.logger.warn('现有MCP配置文件损坏，将创建新配置');
                }
            }
            
            // 检测现有配置格式并清理重复配置
            const hasMcpServers = mcpConfig.mcpServers && Object.keys(mcpConfig.mcpServers).length > 0;
            const hasMcp = mcpConfig.mcp && Object.keys(mcpConfig.mcp).length > 0;
            
            // 优先使用 mcpServers 格式（Cursor的新格式）
            if (hasMcpServers) {
                // 使用 mcpServers 格式，清理 mcp 中的重复配置
                if (!mcpConfig.mcpServers) {
                    mcpConfig.mcpServers = {};
                }
                
                // 清理 mcp 字段中的 browser-tools 配置（如果存在）
                if (mcpConfig.mcp && mcpConfig.mcp['browser-tools']) {
                    delete mcpConfig.mcp['browser-tools'];
                    this.logger.log('已清理 mcp 字段中的重复 browser-tools 配置');
                }
                
                // 使用require.resolve获取MCP脚本路径
                const mcpScript = this.getMcpScriptPath();
                if (mcpScript) {
                    mcpConfig.mcpServers['browser-tools'] = {
                        command: 'node',
                        args: [mcpScript, '--port', this.serverPort.toString()],
                        env: {
                            NODE_ENV: 'production'
                        }
                    };
                } else {
                    // 如果本地包不存在，使用npx方式
                    mcpConfig.mcpServers['browser-tools'] = {
                        command: 'npx',
                        args: ['-y', '@agentdeskai/browser-tools-mcp@1.2.0', '--port', this.serverPort.toString()],
                        env: {
                            NODE_ENV: 'production'
                        }
                    };
                }
            } else {
                // 使用 mcp 格式，清理 mcpServers 中的重复配置
                if (!mcpConfig.mcp) {
                    mcpConfig.mcp = {};
                }
                
                // 清理 mcpServers 字段中的 browser-tools 配置（如果存在）
                if (mcpConfig.mcpServers && mcpConfig.mcpServers['browser-tools']) {
                    delete mcpConfig.mcpServers['browser-tools'];
                    this.logger.log('已清理 mcpServers 字段中的重复 browser-tools 配置');
                }
                
                // 使用require.resolve获取MCP脚本路径
                const mcpScript = this.getMcpScriptPath();
                if (mcpScript) {
                    mcpConfig.mcp['browser-tools'] = {
                        command: 'node',
                        args: [mcpScript, '--port', this.serverPort.toString()],
                        env: {
                            NODE_ENV: 'production'
                        }
                    };
                } else {
                    // 如果本地包不存在，使用npx方式
                    mcpConfig.mcp['browser-tools'] = {
                        command: 'npx',
                        args: ['-y', '@agentdeskai/browser-tools-mcp@1.2.0', '--port', this.serverPort.toString()],
                        env: {
                            NODE_ENV: 'production'
                        }
                    };
                }
            }
            
            // 写入配置文件
            fs.writeFileSync(this.mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
            
            this.logger.log(`✅ MCP配置已更新: ${this.mcpConfigPath}`);
            
            // 根据实际使用的格式输出配置内容
            const browserToolsConfig = mcpConfig.mcpServers?.['browser-tools'] || mcpConfig.mcp?.['browser-tools'];
            if (browserToolsConfig) {
                this.logger.log(`配置内容: ${JSON.stringify(browserToolsConfig, null, 2)}`);
            }
            
            return true;
            
        } catch (error) {
            this.logger.error(`配置MCP设置失败: ${error}`);
            return false;
        }
    }

    /**
     * 清理MCP配置（仅在卸载插件时使用）
     * 注意：此方法会永久删除MCP配置，仅在插件卸载时调用
     */
    async uninstallCleanupMcpConfig(): Promise<boolean> {
        try {
            if (fs.existsSync(this.mcpConfigPath)) {
                const configContent = fs.readFileSync(this.mcpConfigPath, 'utf8');
                let mcpConfig = JSON.parse(configContent);
                
                // 移除browser-tools配置
                if (mcpConfig.mcp && mcpConfig.mcp['browser-tools']) {
                    delete mcpConfig.mcp['browser-tools'];
                    
                    // 如果mcp对象为空，也删除它
                    if (Object.keys(mcpConfig.mcp).length === 0) {
                        delete mcpConfig.mcp;
                    }
                    
                    // 写入更新后的配置
                    fs.writeFileSync(this.mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
                    this.logger.log('✅ MCP配置已清理（插件卸载）');
                }
            }
            
            return true;
            
        } catch (error) {
            this.logger.error(`清理MCP配置失败: ${error}`);
            return false;
        }
    }

    /**
     * 清理MCP配置（已弃用）
     * @deprecated 此方法已弃用，停止服务时不应删除MCP配置
     * 如需删除配置，请使用 uninstallCleanupMcpConfig()
     */
    private async cleanupMcpConfig(): Promise<boolean> {
        this.logger.warn('cleanupMcpConfig() 已弃用，停止服务时不删除MCP配置');
        return true;
    }

    /**
     * 验证MCP配置
     */
    private async validateMcpConfig(): Promise<boolean> {
        try {
            if (!fs.existsSync(this.mcpConfigPath)) {
                this.logger.warn('MCP配置文件不存在');
                return false;
            }
            
            const configContent = fs.readFileSync(this.mcpConfigPath, 'utf8');
            const mcpConfig = JSON.parse(configContent);
            
            // 支持两种MCP配置格式：mcp 和 mcpServers
            const hasBrowserToolsInMcp = mcpConfig.mcp && mcpConfig.mcp['browser-tools'];
            const hasBrowserToolsInMcpServers = mcpConfig.mcpServers && mcpConfig.mcpServers['browser-tools'];
            
            if (!hasBrowserToolsInMcp && !hasBrowserToolsInMcpServers) {
                this.logger.warn('MCP配置中缺少browser-tools配置');
                return false;
            }
            
            this.logger.log('✅ MCP配置验证通过');
            return true;
            
        } catch (error) {
            this.logger.error(`验证MCP配置失败: ${error}`);
            return false;
        }
    }

    /**
     * 检查Node.js版本
     */
    private checkNodeVersion(): void {
        const requiredVersion = '18.0.0';
        const currentVersion = process.version;
        
        // 解析版本号
        const required = requiredVersion.split('.').map(Number);
        const current = currentVersion.replace('v', '').split('.').map(Number);
        
        // 比较主版本号
        if (current[0] < required[0]) {
            throw new Error(`Node.js版本不兼容！当前版本: ${currentVersion}，需要版本: >=${requiredVersion}`);
        }
        
        // 如果主版本号相同，比较次版本号
        if (current[0] === required[0] && current[1] < required[1]) {
            throw new Error(`Node.js版本不兼容！当前版本: ${currentVersion}，需要版本: >=${requiredVersion}`);
        }
        
        this.logger.log(`Node.js版本检查通过: ${currentVersion}`);
    }

    /**
     * 初始化时验证MCP配置，并提供用户引导
     */
    private async initializeMcpConfig(): Promise<boolean> {
        try {
            this.logger.log('正在验证MCP配置...');
            
            // 1. 检查配置文件是否存在
            if (!fs.existsSync(this.mcpConfigPath)) {
                this.logger.warn('MCP配置文件不存在');
                return await this.handleMissingMcpConfig();
            }
            
            // 2. 检查配置文件是否有效
            try {
                const configContent = fs.readFileSync(this.mcpConfigPath, 'utf8');
                const mcpConfig = JSON.parse(configContent);
                
                // 支持两种MCP配置格式检查
                const hasBrowserToolsInMcp = mcpConfig.mcp && mcpConfig.mcp['browser-tools'];
                const hasBrowserToolsInMcpServers = mcpConfig.mcpServers && mcpConfig.mcpServers['browser-tools'];
                
                if (!hasBrowserToolsInMcp && !hasBrowserToolsInMcpServers) {
                    this.logger.warn('MCP配置中缺少browser-tools配置');
                    return await this.handleInvalidMcpConfig();
                }
                
                this.logger.log('✅ MCP配置验证通过');
                return true;
                
            } catch (parseError) {
                this.logger.error(`MCP配置文件格式错误: ${parseError}`);
                return await this.handleCorruptedMcpConfig();
            }
            
        } catch (error) {
            this.logger.error(`验证MCP配置时出错: ${error}`);
            return false;
        }
    }

    /**
     * 处理MCP配置文件不存在的情况
     */
    private async handleMissingMcpConfig(): Promise<boolean> {
        // 显示用户友好的提示
        const choice = await vscode.window.showWarningMessage(
            '🔧 MCP配置文件不存在',
            {
                modal: true,
                detail: `Browser Tools需要MCP配置文件才能正常工作。\n\n配置文件路径：${this.mcpConfigPath}\n\n您可以选择：`
            },
            '自动创建配置',
            '手动配置指引',
            '跳过MCP配置'
        );
        
        switch (choice) {
            case '自动创建配置':
                return await this.autoCreateMcpConfig();
                
            case '手动配置指引':
                await this.showMcpConfigGuide();
                return false;
                
            case '跳过MCP配置':
                this.logger.warn('用户选择跳过MCP配置，部分功能可能不可用');
                vscode.window.showWarningMessage('⚠️ 已跳过MCP配置，某些功能可能不可用');
                return true; // 允许继续启动服务器
                
            default:
                return false;
        }
    }

    /**
     * 处理MCP配置无效的情况
     */
    private async handleInvalidMcpConfig(): Promise<boolean> {
        const choice = await vscode.window.showWarningMessage(
            '⚠️ MCP配置不完整',
            {
                modal: true,
                detail: 'MCP配置文件存在，但缺少browser-tools相关配置。'
            },
            '修复配置',
            '查看配置指引',
            '跳过'
        );
        
        switch (choice) {
            case '修复配置':
                return await this.repairMcpConfig();
                
            case '查看配置指引':
                await this.showMcpConfigGuide();
                return false;
                
            default:
                return true; // 跳过MCP配置
        }
    }

    /**
     * 处理MCP配置文件损坏的情况
     */
    private async handleCorruptedMcpConfig(): Promise<boolean> {
        const choice = await vscode.window.showErrorMessage(
            '❌ MCP配置文件损坏',
            {
                modal: true,
                detail: 'MCP配置文件存在但格式错误，无法解析。'
            },
            '重新创建配置',
            '备份并重建',
            '查看配置指引'
        );
        
        switch (choice) {
            case '重新创建配置':
                return await this.autoCreateMcpConfig();
                
            case '备份并重建':
                return await this.backupAndRecreateMcpConfig();
                
            case '查看配置指引':
                await this.showMcpConfigGuide();
                return false;
                
            default:
                return false;
        }
    }

    /**
     * 自动创建MCP配置
     */
    private async autoCreateMcpConfig(): Promise<boolean> {
        try {
            this.logger.log('正在自动创建MCP配置...');
            
            // 确保目录存在
            const configDir = path.dirname(this.mcpConfigPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
                this.logger.log(`创建配置目录: ${configDir}`);
            }
            
            // 检查依赖包是否存在
            const mcpScript = this.getMcpScriptPath();
            if (!mcpScript || !fs.existsSync(mcpScript)) {
                vscode.window.showErrorMessage(
                    '❌ 无法找到browser-tools-mcp包，请先运行 npm install'
                );
                return false;
            }
            
            // 读取现有配置或创建新配置
            let mcpConfig: any = {};
            if (fs.existsSync(this.mcpConfigPath)) {
                try {
                    const configContent = fs.readFileSync(this.mcpConfigPath, 'utf8');
                    mcpConfig = JSON.parse(configContent);
                } catch (error) {
                    this.logger.warn('现有配置文件损坏，将创建新配置');
                }
            }
            
            // 确保mcp字段存在
            if (!mcpConfig.mcp) {
                mcpConfig.mcp = {};
            }
            
            // 添加browser-tools配置
            mcpConfig.mcp['browser-tools'] = {
                command: 'node',
                args: [mcpScript, '--port', this.serverPort.toString()],
                env: {
                    NODE_ENV: 'production'
                }
            };
            
            // 写入配置文件
            fs.writeFileSync(this.mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
            
            this.logger.log(`✅ MCP配置已自动创建: ${this.mcpConfigPath}`);
            vscode.window.showInformationMessage('✅ MCP配置已自动创建成功！');
            
            return true;
            
        } catch (error) {
            this.logger.error(`自动创建MCP配置失败: ${error}`);
            vscode.window.showErrorMessage(`❌ 自动创建MCP配置失败: ${error}`);
            return false;
        }
    }

    /**
     * 修复现有MCP配置
     */
    private async repairMcpConfig(): Promise<boolean> {
        try {
            const configContent = fs.readFileSync(this.mcpConfigPath, 'utf8');
            const mcpConfig = JSON.parse(configContent);
            
            // 检查依赖包
            const mcpScript = this.getMcpScriptPath();
            if (!mcpScript || !fs.existsSync(mcpScript)) {
                vscode.window.showErrorMessage('❌ 无法找到browser-tools-mcp包');
                return false;
            }
            
            // 检测现有配置格式并清理重复配置
            const hasMcpServers = mcpConfig.mcpServers && Object.keys(mcpConfig.mcpServers).length > 0;
            
            // 优先使用 mcpServers 格式（Cursor的新格式）
            if (hasMcpServers) {
                // 使用 mcpServers 格式，清理 mcp 中的重复配置
                if (!mcpConfig.mcpServers) {
                    mcpConfig.mcpServers = {};
                }
                
                // 清理 mcp 字段中的 browser-tools 配置（如果存在）
                if (mcpConfig.mcp && mcpConfig.mcp['browser-tools']) {
                    delete mcpConfig.mcp['browser-tools'];
                    this.logger.log('已清理 mcp 字段中的重复 browser-tools 配置');
                }
                
                mcpConfig.mcpServers['browser-tools'] = {
                    command: 'node',
                    args: [mcpScript, '--port', this.serverPort.toString()],
                    env: {
                        NODE_ENV: 'production'
                    }
                };
            } else {
                // 使用 mcp 格式，清理 mcpServers 中的重复配置
                if (!mcpConfig.mcp) {
                    mcpConfig.mcp = {};
                }
                
                // 清理 mcpServers 字段中的 browser-tools 配置（如果存在）
                if (mcpConfig.mcpServers && mcpConfig.mcpServers['browser-tools']) {
                    delete mcpConfig.mcpServers['browser-tools'];
                    this.logger.log('已清理 mcpServers 字段中的重复 browser-tools 配置');
                }
                
                mcpConfig.mcp['browser-tools'] = {
                    command: 'node',
                    args: [mcpScript, '--port', this.serverPort.toString()],
                    env: {
                        NODE_ENV: 'production'
                    }
                };
            }
            
            // 写入配置文件
            fs.writeFileSync(this.mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
            
            this.logger.log('✅ MCP配置已修复');
            vscode.window.showInformationMessage('✅ MCP配置已修复成功！');
            
            return true;
            
        } catch (error) {
            this.logger.error(`修复MCP配置失败: ${error}`);
            vscode.window.showErrorMessage(`❌ 修复MCP配置失败: ${error}`);
            return false;
        }
    }

    /**
     * 备份并重建MCP配置
     */
    private async backupAndRecreateMcpConfig(): Promise<boolean> {
        try {
            // 创建备份
            const backupPath = `${this.mcpConfigPath}.backup.${Date.now()}`;
            fs.copyFileSync(this.mcpConfigPath, backupPath);
            this.logger.log(`配置文件已备份到: ${backupPath}`);
            
            // 重新创建配置
            return await this.autoCreateMcpConfig();
            
        } catch (error) {
            this.logger.error(`备份并重建MCP配置失败: ${error}`);
            return false;
        }
    }

    /**
     * 显示MCP配置指引
     */
    private async showMcpConfigGuide(): Promise<void> {
        const mcpScript = this.getMcpScriptPath() || 'npx @agentdeskai/browser-tools-mcp@1.2.0';
        
        const guideContent = `# MCP配置指引

## 配置文件路径
${this.mcpConfigPath}

## 配置内容模板
\`\`\`json
{
  "mcp": {
    "browser-tools": {
      "command": "node",
      "args": [
        "${mcpScript}",
        "--port",
        "${this.serverPort}"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
\`\`\`

## 手动配置步骤

### 1. 创建配置目录
\`\`\`bash
mkdir -p "${path.dirname(this.mcpConfigPath)}"
\`\`\`

### 2. 创建配置文件
\`\`\`bash
cat > "${this.mcpConfigPath}" << 'EOF'
{
  "mcp": {
    "browser-tools": {
      "command": "node",
      "args": [
        "${mcpScript}",
        "--port",
        "${this.serverPort}"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
EOF
\`\`\`

### 3. 验证配置
\`\`\`bash
cat "${this.mcpConfigPath}"
\`\`\`

配置完成后，请重新启动Browser Tools服务。`;
        
        // 创建指引文档
        const document = await vscode.workspace.openTextDocument({
            content: guideContent,
            language: 'markdown'
        });
        
        await vscode.window.showTextDocument(document);
        
        // 复制配置内容到剪贴板
        const configContent = JSON.stringify({
            mcp: {
                "browser-tools": {
                    command: "node",
                    args: [mcpScript, "--port", this.serverPort.toString()],
                    env: {
                        NODE_ENV: "production"
                    }
                }
            }
        }, null, 2);
        
        await vscode.env.clipboard.writeText(configContent);
        vscode.window.showInformationMessage('📋 配置内容已复制到剪贴板');
    }

    /**
     * 启动Browser Tools服务
     */
    async start(): Promise<boolean> {
        try {
            this.logger.log('正在启动Browser Tools服务...');
            this.logger.log(`当前工作目录: ${process.cwd()}`);
            this.logger.log(`Node.js版本: ${process.version}`);
            this.logger.log(`服务端口: ${this.serverPort}`);
            this.logger.log(`MCP配置路径: ${this.mcpConfigPath}`);
            
            // 🆕 首先验证MCP配置
            const mcpConfigValid = await this.initializeMcpConfig();
            if (!mcpConfigValid) {
                throw new Error('MCP配置验证失败，请完成配置后重试');
            }
            
            // 包已在package.json中声明为dependencies，无需检查
            
            // 先停止所有现有服务
            await this.stopAll();
            
            // 检查Chrome是否运行
            const chromeRunning = await this.checkChromeRunning();
            if (!chromeRunning) {
                this.logger.warn(`Chrome未运行或未启用远程调试端口${this.chromeDebugPort}`);
                vscode.window.showWarningMessage(
                    `Chrome未运行或未启用远程调试端口${this.chromeDebugPort}。` +
                    '请确保Chrome已启动并使用以下参数: --remote-debugging-port=' + this.chromeDebugPort
                );
            } else {
                this.logger.log('✅ Chrome远程调试端口检查通过');
            }
            
            // 启动服务器
            this.logger.log('开始启动browser-tools-server...');
            const serverStarted = await this.startServer();
            if (!serverStarted) {
                throw new Error('服务器启动失败');
            }
            this.logger.log('✅ browser-tools-server启动成功');
            
            // MCP配置已在初始化时完成，这里只需要验证
            this.logger.log('验证MCP配置状态...');
            const mcpConfigured = await this.validateMcpConfig();
            if (!mcpConfigured) {
                this.logger.warn('MCP配置验证失败，但服务器已启动');
            } else {
                this.logger.log('✅ MCP配置验证通过');
            }
            
            // 启动MCP客户端
            this.logger.log('开始启动MCP客户端...');
            const mcpStarted = await this.startMcpClient();
            if (!mcpStarted) {
                this.logger.warn('MCP客户端启动失败，但服务器已启动');
            } else {
                this.logger.log('✅ MCP客户端启动成功');
            }
            
            this.logger.log('🎉 Browser Tools服务启动成功');
            vscode.window.showInformationMessage(`Browser Tools服务已启动，端口: ${this.serverPort}`);
            return true;
            
        } catch (error) {
            const errorMsg = `启动失败: ${error}`;
            this.logger.error(errorMsg);
            this.logger.error(`错误堆栈: ${error instanceof Error ? error.stack : 'N/A'}`);
            
            // 运行诊断
            this.logger.log('运行启动失败诊断...');
            const issues = await this.diagnoseStartupFailure();
            const suggestions = this.getStartupFailureSuggestions(issues);
            
            // 显示详细的错误信息和建议
            let detailedMessage = errorMsg;
            if (issues.length > 0) {
                detailedMessage += '\n\n发现的问题：\n' + issues.map((issue, index) => `${index + 1}. ${issue}`).join('\n');
            }
            if (suggestions.length > 0) {
                detailedMessage += '\n\n解决建议：\n' + suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n');
            }
            
            vscode.window.showErrorMessage(errorMsg, '查看详细信息').then(selection => {
                if (selection === '查看详细信息') {
                    vscode.window.showInformationMessage(detailedMessage, { modal: true });
                }
            });
            
            return false;
        }
    }

    /**
     * 停止Browser Tools服务
     */
    async stop(): Promise<boolean> {
        try {
            this.logger.log('正在停止Browser Tools服务...');
            
            const success = await this.stopAll();
            
            // 注意：停止服务时不删除MCP配置，保持配置持久化
            // MCP配置应该在用户明确卸载插件时才删除
            
            if (success) {
                this.logger.log('Browser Tools服务已停止（MCP配置已保留）');
                vscode.window.showInformationMessage('Browser Tools服务已停止');
            }
            
            return success;
            
        } catch (error) {
            const errorMsg = `停止失败: ${error}`;
            this.logger.error(errorMsg);
            vscode.window.showErrorMessage(errorMsg);
            return false;
        }
    }

    /**
     * 获取服务状态
     */
    async getStatus(): Promise<{
        serverRunning: boolean;
        mcpRunning: boolean;
        portOccupied: boolean;
        chromeRunning: boolean;
        mcpConfigured: boolean;
    }> {
        const serverRunning = await this.isServerRunning();
        const mcpRunning = await this.isMcpRunning();
        const portOccupied = await this.portChecker.isPortOccupied(this.serverPort);
        const chromeRunning = await this.checkChromeRunning();
        const mcpConfigured = await this.validateMcpConfig();
        
        return {
            serverRunning,
            mcpRunning,
            portOccupied,
            chromeRunning,
            mcpConfigured
        };
    }

    /**
     * 停止占用端口的进程
     */
    private async stopPortOccupyingProcesses(): Promise<void> {
        try {
            const portInfo = await this.portChecker.getPortInfo(this.serverPort);
            if (portInfo && portInfo.pid) {
                this.logger.log(`停止占用端口 ${this.serverPort} 的进程 ${portInfo.pid}`);
                this.processManager.killProcess(portInfo.pid, true);
                
                // 等待进程完全停止
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            this.logger.error(`停止占用端口进程时出错: ${error}`);
        }
    }

    /**
     * 检查依赖包是否可用
     */
    private async checkDependencyAvailability(): Promise<{available: boolean, method: 'require' | 'npx' | 'none'}> {
        // 方法1：尝试 require 方式
        try {
            require.resolve('@agentdeskai/browser-tools-server/dist/browser-connector.js');
            this.logger.log('✅ 通过 require 找到 browser-tools-server');
            return {available: true, method: 'require'};
        } catch (error) {
            this.logger.log('⚠️  require 方式找不到 browser-tools-server');
        }

        // 方法2：检查 npx 是否可用
        try {
            child_process.execSync('npx --version', { stdio: 'ignore' });
            this.logger.log('✅ npx 可用，可以动态下载包');
            return {available: true, method: 'npx'};
        } catch (error) {
            this.logger.log('❌ npx 不可用');
        }

        return {available: false, method: 'none'};
    }

    /**
     * 显示依赖安装指导
     */
    private async showDependencyGuidance(): Promise<boolean> {
        const choice = await vscode.window.showWarningMessage(
            '❌ 未找到 browser-tools-server 依赖包',
            {
                modal: true,
                detail: '请选择安装方式：\n\n' +
                       '1. 自动下载（推荐）：使用 npx 自动下载并运行\n' +
                       '2. 手动安装：在项目目录运行 npm install\n' +
                       '3. 查看帮助：获取详细安装指导'
            },
            '自动下载', '手动安装', '查看帮助'
        );

        switch (choice) {
            case '自动下载':
                return true; // 继续使用 npx
            case '手动安装':
                this.showManualInstallGuidance();
                return false;
            case '查看帮助':
                this.showDetailedGuidance();
                return false;
            default:
                return false;
        }
    }

    /**
     * 显示手动安装指导
     */
    private showManualInstallGuidance(): void {
        const terminal = vscode.window.createTerminal('Browser Tools 安装');
        terminal.show();
        terminal.sendText('# 安装 browser-tools-server 依赖');
        terminal.sendText('npm install @agentdeskai/browser-tools-server@1.2.0');
        
        vscode.window.showInformationMessage(
            '📋 已在终端中准备安装命令，请按回车执行'
        );
    }

    /**
     * 显示详细安装指导
     */
    private showDetailedGuidance(): void {
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/AgentDeskAI/browser-tools-server#installation'));
    }

    /**
     * 启动服务器
     */
    private async startServer(): Promise<boolean> {
        return new Promise(async (resolve) => {
            // 先检查端口是否被占用
            const portOccupied = await this.portChecker.isPortOccupied(this.serverPort);
            if (portOccupied) {
                this.logger.error(`端口 ${this.serverPort} 已被占用，尝试停止占用进程`);
                await this.stopPortOccupyingProcesses();
                await this.portChecker.waitForPortAvailable(this.serverPort, 10000);
            }
            
            this.logger.log(`准备启动browser-tools-server，端口: ${this.serverPort}`);
            this.logger.log(`工作目录: ${process.cwd()}`);
            this.logger.log(`Node.js版本: ${process.version}`);
            
            // 检查依赖可用性
            const dependencyCheck = await this.checkDependencyAvailability();
            
            if (!dependencyCheck.available) {
                this.logger.error('❌ 无法找到或下载 browser-tools-server');
                const shouldContinue = await this.showDependencyGuidance();
                if (!shouldContinue) {
                    resolve(false);
                    return;
                }
            }
            
            this.logger.log(`使用 ${dependencyCheck.method} 方式启动服务器`);
            
            // 根据依赖检查结果选择启动方式
            if (dependencyCheck.method === 'require') {
                try {
                    this.logger.log('使用 require 方式启动服务器');
                    const serverScript = require.resolve('@agentdeskai/browser-tools-server/dist/browser-connector.js');
                    this.logger.log(`服务器脚本路径: ${serverScript}`);
                    
                    this.serverProcess = child_process.spawn('node', [
                        serverScript,
                        '--port', this.serverPort.toString()
                    ], {
                        cwd: process.cwd(),
                        env: { 
                            ...process.env,
                            NODE_ENV: 'production',
                            FORCE_COLOR: '1'
                        },
                        stdio: ['pipe', 'pipe', 'pipe'],
                        detached: false,
                        shell: false
                    });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.logger.error(`require 方式启动失败: ${errorMessage}`);
                    resolve(false);
                    return;
                }
            } else {
                // 使用 npx 方式
                this.logger.log('使用 npx 方式启动服务器（首次可能需要下载）');
                vscode.window.showInformationMessage('⏳ 首次启动可能需要下载依赖包，请稍等...');
                
                this.serverProcess = child_process.spawn('npx', [
                    '-y', 
                    '@agentdeskai/browser-tools-server@1.2.0', 
                    '--port', this.serverPort.toString()
                ], {
                    cwd: process.cwd(),
                    env: { 
                        ...process.env,
                        NODE_ENV: 'production',
                        FORCE_COLOR: '1'
                    },
                    stdio: ['pipe', 'pipe', 'pipe'],
                    detached: false,
                    shell: false
                });
            }
            
            // 添加错误处理，确保进程创建成功
            if (!this.serverProcess) {
                this.logger.error('无法创建服务器进程');
                resolve(false);
                return;
            }
            
            // 等待进程启动并获取PID
            let retryCount = 0;
            const maxRetries = 15; // 减少重试次数，本地包启动更快
            
            while (!this.serverProcess.pid && retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 100)); // 减少等待间隔
                retryCount++;
                this.logger.log(`等待进程启动... (${retryCount}/${maxRetries})`);
                
                // 检查进程是否已经退出或出错
                if (this.serverProcess.killed || this.serverProcess.exitCode !== null) {
                    this.logger.error('进程在启动过程中被终止或退出');
                    resolve(false);
                    return;
                }
            }
            
            // 如果超过最大重试次数仍未获得PID，直接返回失败
            if (!this.serverProcess.pid) {
                this.logger.error(`等待进程启动超时，超过最大重试次数 ${maxRetries}`);
                resolve(false);
                return;
            }
            
            if (this.serverProcess.pid) {
                // 保存PID到文件
                fs.writeFileSync(this.serverPidFile, this.serverProcess.pid.toString());
                this.logger.log(`服务器进程ID: ${this.serverProcess.pid}`);
                
                let serverStarted = false;
                let startupTimeout: NodeJS.Timeout;
                let connectionTestInterval: NodeJS.Timeout;
                
                // 每2秒测试一次连接，更快检测服务器是否就绪
                connectionTestInterval = setInterval(async () => {
                    if (!serverStarted) {
                        try {
                            const isRunning = await this.testServerConnection();
                            if (isRunning) {
                                this.logger.log('✅ 服务器连接测试成功！');
                                serverStarted = true;
                                clearTimeout(startupTimeout);
                                clearInterval(connectionTestInterval);
                                resolve(true);
                            }
                        } catch (error) {
                            // 忽略连接测试错误，继续等待
                        }
                    }
                }, 2000);
                
                // 监听标准输出
                this.serverProcess.stdout?.on('data', (data) => {
                    const output = data.toString().trim();
                    if (output) {
                        this.logger.log(`服务器输出: ${output}`);
                        // 检查是否成功启动 - 扩展检测条件
                        if (output.includes('Browser Tools Server Started') || 
                            output.includes('listening on') || 
                            output.includes('Available on the following network addresses') ||
                            output.includes('For local access use:') ||
                            output.includes('Server running') ||
                            output.includes('Started') ||
                            output.includes('Ready') ||
                            output.includes('port') ||
                            output.includes('3025')) {
                            if (!serverStarted) {
                                serverStarted = true;
                                this.logger.log('✅ 服务器启动成功！');
                                clearTimeout(startupTimeout);
                                clearInterval(connectionTestInterval);
                                resolve(true);
                            }
                        }
                    }
                });
                
                // 监听标准错误
                this.serverProcess.stderr?.on('data', (data) => {
                    const error = data.toString().trim();
                    if (error) {
                        this.logger.error(`服务器错误: ${error}`);
                        // 如果是致命错误，立即返回失败
                        if (error.includes('EADDRINUSE') || error.includes('port') || error.includes('listen')) {
                            this.logger.error('检测到端口占用或监听错误');
                            if (!serverStarted) {
                                clearTimeout(startupTimeout);
                                clearInterval(connectionTestInterval);
                                resolve(false);
                            }
                        }
                    }
                });
                
                // 监听进程退出
                this.serverProcess.on('exit', (code, signal) => {
                    if (code !== null) {
                        this.logger.error(`服务器进程退出，退出码: ${code}`);
                        if (code !== 0) {
                            this.logger.error(`服务器启动失败，退出码: ${code}`);
                        }
                    } else if (signal) {
                        this.logger.error(`服务器进程被信号终止: ${signal}`);
                    }
                    this.serverProcess = null;
                    // 清理PID文件
                    if (fs.existsSync(this.serverPidFile)) {
                        fs.unlinkSync(this.serverPidFile);
                    }
                    
                    // 如果还没有启动成功，则返回失败
                    if (!serverStarted) {
                        clearTimeout(startupTimeout);
                        clearInterval(connectionTestInterval);
                        resolve(false);
                    }
                });
                
                // 监听进程错误
                this.serverProcess.on('error', (error) => {
                    this.logger.error(`服务器进程错误: ${error.message}`);
                    this.logger.error(`错误堆栈: ${error.stack}`);
                    this.serverProcess = null;
                    // 清理PID文件
                    if (fs.existsSync(this.serverPidFile)) {
                        fs.unlinkSync(this.serverPidFile);
                    }
                    
                    // 如果还没有启动成功，则返回失败
                    if (!serverStarted) {
                        clearTimeout(startupTimeout);
                        clearInterval(connectionTestInterval);
                        resolve(false);
                    }
                });
                
                // 设置启动超时，缩短等待时间并尽早测试连接
                startupTimeout = setTimeout(async () => {
                    if (!serverStarted) {
                        this.logger.log('等待服务器输出超时，尝试测试连接...');
                        clearInterval(connectionTestInterval); // 先清理定时器
                        try {
                            const isRunning = await this.testServerConnection();
                            if (isRunning) {
                                this.logger.log('✅ 服务器启动成功，响应正常');
                                serverStarted = true;
                                resolve(true);
                            } else {
                                this.logger.error('❌ 服务器启动失败，无法连接');
                                resolve(false);
                            }
                        } catch (error) {
                            this.logger.error(`测试服务器连接时出错: ${error}`);
                            resolve(false);
                        }
                    }
                }, 5000); // 5秒超时，更快进入连接测试
                
            } else {
                this.logger.error('无法获取服务器进程ID');
                this.logger.error(`进程对象: ${this.serverProcess ? '存在' : '不存在'}`);
                this.logger.error(`进程PID: ${this.serverProcess?.pid || 'undefined'}`);
                this.logger.error(`进程状态: ${this.serverProcess?.killed || 'unknown'}`);
                resolve(false);
            }
        });
    }

    /**
     * 检查MCP配置文件
     */
    private async checkMcpConfig(): Promise<boolean> {
        try {
            // 使用统一的MCP配置文件路径
            const configExists = fs.existsSync(this.mcpConfigPath);
            
            if (!configExists) {
                this.logger.warn('MCP配置文件不存在');
                return false;
            }
            
            // 读取并验证配置文件
            const configContent = fs.readFileSync(this.mcpConfigPath, 'utf8');
            const config = JSON.parse(configContent);
            
            // 检查是否包含browser-tools配置
            const hasBrowserTools = config.mcp && config.mcp['browser-tools'];
            
            if (!hasBrowserTools) {
                this.logger.warn('MCP配置文件中缺少browser-tools配置');
                return false;
            }
            
            this.logger.log('MCP配置文件检查通过');
            return true;
            
        } catch (error) {
            this.logger.error(`检查MCP配置文件时出错: ${error}`);
            return false;
        }
    }

    /**
     * 创建MCP配置文件
     */
    private async createMcpConfig(): Promise<boolean> {
        try {
            // 使用统一的MCP配置文件路径
            const mcpConfigDir = path.dirname(this.mcpConfigPath);
            
            // 确保目录存在
            if (!fs.existsSync(mcpConfigDir)) {
                fs.mkdirSync(mcpConfigDir, { recursive: true });
            }
            
            // 创建MCP配置
            const mcpScript = this.getMcpScriptPath();
            const browserToolsConfig = mcpScript ? {
                command: "node",
                args: [mcpScript, "--port", this.serverPort.toString()],
                env: {
                    NODE_ENV: "production"
                }
            } : {
                command: "npx",
                args: ["-y", "@agentdeskai/browser-tools-mcp@1.2.0", "--port", this.serverPort.toString()],
                env: {
                    NODE_ENV: "production"
                }
            };
            
            // 如果配置文件已存在，读取并合并
            if (fs.existsSync(this.mcpConfigPath)) {
                try {
                    const existingConfig = JSON.parse(fs.readFileSync(this.mcpConfigPath, 'utf8'));
                    
                    // 检测现有配置格式并清理重复配置
                    const hasMcpServers = existingConfig.mcpServers && Object.keys(existingConfig.mcpServers).length > 0;
                    
                    if (hasMcpServers) {
                        // 使用 mcpServers 格式，清理 mcp 中的重复配置
                        if (!existingConfig.mcpServers) {
                            existingConfig.mcpServers = {};
                        }
                        
                        // 清理 mcp 字段中的 browser-tools 配置（如果存在）
                        if (existingConfig.mcp && existingConfig.mcp['browser-tools']) {
                            delete existingConfig.mcp['browser-tools'];
                            this.logger.log('已清理 mcp 字段中的重复 browser-tools 配置');
                        }
                        
                        existingConfig.mcpServers["browser-tools"] = browserToolsConfig;
                    } else {
                        // 使用 mcp 格式，清理 mcpServers 中的重复配置
                        if (!existingConfig.mcp) {
                            existingConfig.mcp = {};
                        }
                        
                        // 清理 mcpServers 字段中的 browser-tools 配置（如果存在）
                        if (existingConfig.mcpServers && existingConfig.mcpServers['browser-tools']) {
                            delete existingConfig.mcpServers['browser-tools'];
                            this.logger.log('已清理 mcpServers 字段中的重复 browser-tools 配置');
                        }
                        
                        existingConfig.mcp["browser-tools"] = browserToolsConfig;
                    }
                    
                    fs.writeFileSync(this.mcpConfigPath, JSON.stringify(existingConfig, null, 2));
                } catch (parseError) {
                    this.logger.warn('现有MCP配置文件格式错误，将创建新配置');
                    // 创建默认的 mcp 格式配置
                    const mcpConfig = { mcp: { "browser-tools": browserToolsConfig } };
                    fs.writeFileSync(this.mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
                }
            } else {
                // 创建默认的 mcp 格式配置
                const mcpConfig = { mcp: { "browser-tools": browserToolsConfig } };
                fs.writeFileSync(this.mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
            }
            
            this.logger.log('MCP配置文件创建成功');
            return true;
            
        } catch (error) {
            this.logger.error(`创建MCP配置文件时出错: ${error}`);
            return false;
        }
    }

    /**
     * 获取MCP脚本路径
     */
    private getMcpScriptPath(): string | null {
        try {
            return require.resolve('@agentdeskai/browser-tools-mcp/dist/mcp-server.js');
        } catch (error) {
            return null;
        }
    }

    /**
     * 检查MCP依赖可用性
     */
    private async checkMcpDependencyAvailability(): Promise<{available: boolean, method: 'require' | 'npx' | 'none'}> {
        // 方法1：尝试 require 方式
        try {
            require.resolve('@agentdeskai/browser-tools-mcp/dist/mcp-server.js');
            this.logger.log('✅ 通过 require 找到 browser-tools-mcp');
            return {available: true, method: 'require'};
        } catch (error) {
            this.logger.log('⚠️  require 方式找不到 browser-tools-mcp');
        }

        // 方法2：检查 npx 是否可用
        try {
            await new Promise<void>((resolve, reject) => {
                child_process.exec('npx --version', (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
            this.logger.log('✅ npx 可用，将使用在线下载方式');
            return {available: true, method: 'npx'};
        } catch (error) {
            this.logger.log('❌ npx 不可用');
            return {available: false, method: 'none'};
        }
    }

    /**
     * 启动MCP客户端
     */
    private async startMcpClient(): Promise<boolean> {
        return new Promise(async (resolve) => {
            try {
                // 先检查MCP配置
                const configExists = await this.checkMcpConfig();
                if (!configExists) {
                    this.logger.log('MCP配置文件不存在，正在创建...');
                    const created = await this.createMcpConfig();
                    if (!created) {
                        this.logger.error('创建MCP配置文件失败');
                        resolve(false);
                        return;
                    }
                }
                
                this.logger.log('启动MCP客户端...');
                
                // 检查依赖可用性
                const dependencyCheck = await this.checkMcpDependencyAvailability();
                
                if (!dependencyCheck.available) {
                    this.logger.error('❌ 无法找到或下载 browser-tools-mcp');
                    resolve(false);
                    return;
                }
                
                // 根据可用性选择启动方式
                if (dependencyCheck.method === 'require') {
                    try {
                        this.logger.log('使用 require 方式启动MCP客户端');
                        const mcpScript = require.resolve('@agentdeskai/browser-tools-mcp/dist/mcp-server.js');
                        this.logger.log(`MCP客户端脚本路径: ${mcpScript}`);
                        
                        this.mcpProcess = child_process.spawn('node', [
                            mcpScript,
                            '--port', this.serverPort.toString()
                        ], {
                            cwd: process.cwd(),
                            env: { 
                                ...process.env,
                                NODE_ENV: 'production'
                            },
                            stdio: ['pipe', 'pipe', 'pipe'],
                            detached: false,
                            shell: false
                        });
                    } catch (error) {
                        this.logger.error(`require 方式启动失败: ${error}`);
                        resolve(false);
                        return;
                    }
                } else {
                    // 使用 npx 方式
                    this.logger.log('使用 npx 方式启动MCP客户端（首次可能需要下载）');
                    
                    this.mcpProcess = child_process.spawn('npx', [
                        '-y', 
                        '@agentdeskai/browser-tools-mcp@1.2.0', 
                        '--port', this.serverPort.toString()
                    ], {
                        cwd: process.cwd(),
                        env: { 
                            ...process.env,
                            NODE_ENV: 'production',
                            FORCE_COLOR: '1'
                        },
                        stdio: ['pipe', 'pipe', 'pipe'],
                        detached: false,
                        shell: false
                    });
                }
                
                if (this.mcpProcess.pid) {
                    // 保存PID到文件
                    fs.writeFileSync(this.mcpPidFile, this.mcpProcess.pid.toString());
                    this.logger.log(`MCP客户端进程ID: ${this.mcpProcess.pid}`);
                    
                    let mcpStarted = false;
                    let startupTimeout: NodeJS.Timeout;
                    
                    // 监听标准输出
                    this.mcpProcess.stdout?.on('data', (data) => {
                        const output = data.toString().trim();
                        if (output) {
                            this.logger.log(`MCP输出: ${output}`);
                            // 检查是否成功启动
                            if (output.includes('MCP client started') || output.includes('connected')) {
                                if (!mcpStarted) {
                                    mcpStarted = true;
                                    this.logger.log('✅ MCP客户端启动成功！');
                                    clearTimeout(startupTimeout);
                                    resolve(true);
                                }
                            }
                        }
                    });
                    
                    // 监听标准错误
                    this.mcpProcess.stderr?.on('data', (data) => {
                        const error = data.toString().trim();
                        if (error) {
                            this.logger.error(`MCP错误: ${error}`);
                        }
                    });
                    
                    // 监听进程退出
                    this.mcpProcess.on('exit', (code, signal) => {
                        if (code !== null) {
                            this.logger.error(`MCP客户端进程退出，退出码: ${code}`);
                        } else if (signal) {
                            this.logger.error(`MCP客户端进程被信号终止: ${signal}`);
                        }
                        this.mcpProcess = null;
                        // 清理PID文件
                        if (fs.existsSync(this.mcpPidFile)) {
                            fs.unlinkSync(this.mcpPidFile);
                        }
                        
                        // 如果还没有启动成功，则返回失败
                        if (!mcpStarted) {
                            clearTimeout(startupTimeout);
                            resolve(false);
                        }
                    });
                    
                    // 监听进程错误
                    this.mcpProcess.on('error', (error) => {
                        this.logger.error(`MCP客户端进程错误: ${error.message}`);
                        this.mcpProcess = null;
                        // 清理PID文件
                        if (fs.existsSync(this.mcpPidFile)) {
                            fs.unlinkSync(this.mcpPidFile);
                        }
                        
                        // 如果还没有启动成功，则返回失败
                        if (!mcpStarted) {
                            clearTimeout(startupTimeout);
                            resolve(false);
                        }
                    });
                    
                    // 设置启动超时
                    startupTimeout = setTimeout(() => {
                        if (!mcpStarted) {
                            this.logger.warn('MCP客户端启动超时，但可能仍在运行');
                            resolve(true); // MCP客户端启动较慢，给一些宽容
                        }
                    }, 5000);
                    
                } else {
                    this.logger.error('无法获取MCP客户端进程ID');
                    resolve(false);
                }
                
            } catch (error) {
                this.logger.error(`启动MCP客户端时出错: ${error}`);
                resolve(false);
            }
        });
    }

    /**
     * 等待服务器启动
     */
    private async waitForServer(): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, 5000); // 等待5秒
        });
    }

    /**
     * 测试服务器连接
     */
    private async testServerConnection(): Promise<boolean> {
        return new Promise((resolve) => {
            // 使用HTTP请求测试，而不是TCP连接
            const http = require('http');
            
            const req = http.request({
                hostname: 'localhost',
                port: this.serverPort,
                path: '/',
                method: 'GET',
                timeout: 5000
            }, (res: any) => {
                // 收到HTTP响应，说明服务器正常
                resolve(true);
            });
            
            req.on('error', () => {
                resolve(false);
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
            
            req.end();
        });
    }

    /**
     * 检查Chrome是否运行
     */
    private async checkChromeRunning(): Promise<boolean> {
        return new Promise((resolve) => {
            const command = `ps aux | grep -v grep | grep "Chrome.*remote-debugging-port=${this.chromeDebugPort}"`;
            
            child_process.exec(command, (error, stdout) => {
                resolve(stdout.trim().length > 0);
            });
        });
    }

    /**
     * 检查服务器是否运行
     */
    private async isServerRunning(): Promise<boolean> {
        if (!fs.existsSync(this.serverPidFile)) {
            return false;
        }
        
        try {
            const pid = parseInt(fs.readFileSync(this.serverPidFile, 'utf8'));
            return this.processManager.isProcessRunning(pid);
        } catch {
            return false;
        }
    }

    /**
     * 检查MCP是否运行
     */
    private async isMcpRunning(): Promise<boolean> {
        // 首先检查PID文件
        if (fs.existsSync(this.mcpPidFile)) {
            try {
                const pid = parseInt(fs.readFileSync(this.mcpPidFile, 'utf8'));
                if (this.processManager.isProcessRunning(pid)) {
                    return true;
                }
            } catch {
                // PID文件损坏，继续使用进程名检测
            }
        }
        
        // 如果PID文件不存在或进程不存在，通过进程名检测
        try {
            const result = child_process.execSync('ps -ef | grep browser-tools-mcp | grep -v grep', { 
                encoding: 'utf8',
                stdio: 'pipe'
            });
            
            // 检查是否有实际的MCP服务进程（不是npm exec进程）
            const lines = result.trim().split('\n');
            for (const line of lines) {
                if (line.includes('node /usr/local/bin/browser-tools-mcp') || 
                    line.includes('browser-tools-mcp --port')) {
                    return true;
                }
            }
            
            return false;
        } catch {
            return false;
        }
    }

    /**
     * 停止所有服务
     */
    private async stopAll(): Promise<boolean> {
        try {
            // 停止服务器进程
            if (this.serverProcess) {
                this.serverProcess.kill();
                this.serverProcess = null;
            }
            
            // 停止MCP进程
            if (this.mcpProcess) {
                this.mcpProcess.kill();
                this.mcpProcess = null;
            }
            
            // 清理PID文件
            this.cleanupPidFiles();
            
            // 等待进程完全停止
            await this.waitForProcessesToStop();
            
            return true;
            
        } catch (error) {
            this.logger.error(`停止服务时出错: ${error}`);
            return false;
        }
    }

    /**
     * 清理PID文件
     */
    private cleanupPidFiles(): void {
        try {
            if (fs.existsSync(this.serverPidFile)) {
                fs.unlinkSync(this.serverPidFile);
            }
            if (fs.existsSync(this.mcpPidFile)) {
                fs.unlinkSync(this.mcpPidFile);
            }
        } catch (error) {
            this.logger.error(`清理PID文件时出错: ${error}`);
        }
    }

    /**
     * 等待进程完全停止
     */
    private async waitForProcessesToStop(): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, 2000); // 等待2秒
        });
    }

    /**
     * 获取日志内容
     */
    getLogs(): string {
        return this.logger.readLog();
    }

    /**
     * 清理日志
     */
    clearLogs(): void {
        this.logger.clearLog();
    }

    /**
     * 诊断启动失败原因
     */
    private async diagnoseStartupFailure(): Promise<string[]> {
        const issues: string[] = [];
        
        this.logger.log('开始诊断启动失败原因...');
        
        try {
            // 检查Node.js版本
            const requiredVersion = '18.0.0';
            const currentVersion = process.version;
            const required = requiredVersion.split('.').map(Number);
            const current = currentVersion.replace('v', '').split('.').map(Number);
            
            if (current[0] < required[0] || (current[0] === required[0] && current[1] < required[1])) {
                issues.push(`Node.js版本不兼容：当前${currentVersion}，需要>=${requiredVersion}`);
            }
            
            // 检查包是否存在，使用绝对路径
            const serverScript = path.join(process.cwd(), 'node_modules/@agentdeskai/browser-tools-server/dist/browser-connector.js');
            if (fs.existsSync(serverScript)) {
                this.logger.log('✅ browser-tools-server包存在');
            } else {
                issues.push('browser-tools-server包未安装或无法找到');
            }
            
            const mcpScript = this.getMcpScriptPath();
            if (mcpScript && fs.existsSync(mcpScript)) {
                this.logger.log('✅ browser-tools-mcp包存在');
            } else {
                issues.push('browser-tools-mcp包未安装或无法找到');
            }
            
            // 检查端口可用性
            const portOccupied = await this.portChecker.isPortOccupied(this.serverPort);
            if (portOccupied) {
                const portInfo = await this.portChecker.getPortInfo(this.serverPort);
                if (portInfo) {
                    issues.push(`端口${this.serverPort}被占用，占用进程：${portInfo.command} (PID: ${portInfo.pid})`);
                } else {
                    issues.push(`端口${this.serverPort}被占用`);
                }
            }
            
            // 检查Chrome状态
            const chromeRunning = await this.checkChromeRunning();
            if (!chromeRunning) {
                issues.push(`Chrome未运行或未启用远程调试端口${this.chromeDebugPort}`);
            }
            
            // 检查文件系统权限
            try {
                const testFile = '/tmp/browser-tools-test.txt';
                fs.writeFileSync(testFile, 'test');
                fs.unlinkSync(testFile);
                this.logger.log('✅ 文件系统权限正常');
            } catch {
                issues.push('无法写入临时文件，可能存在权限问题');
            }
            
            // 检查MCP配置目录权限
            try {
                const mcpConfigDir = path.dirname(this.mcpConfigPath);
                if (!fs.existsSync(mcpConfigDir)) {
                    fs.mkdirSync(mcpConfigDir, { recursive: true });
                }
                this.logger.log('✅ MCP配置目录权限正常');
            } catch {
                issues.push('无法创建MCP配置目录，可能存在权限问题');
            }
            
        } catch (error) {
            issues.push(`诊断过程中出错：${error}`);
        }
        
        if (issues.length === 0) {
            this.logger.log('✅ 未发现明显问题');
        } else {
            this.logger.warn(`发现 ${issues.length} 个问题：`);
            issues.forEach((issue, index) => {
                this.logger.warn(`${index + 1}. ${issue}`);
            });
        }
        
        return issues;
    }

    /**
     * 提供启动失败的解决建议
     */
    private getStartupFailureSuggestions(issues: string[]): string[] {
        const suggestions: string[] = [];
        
        for (const issue of issues) {
            if (issue.includes('Node.js版本')) {
                suggestions.push('请升级Node.js到18.0.0或更高版本');
            } else if (issue.includes('包未安装')) {
                suggestions.push('请运行 npm install 安装依赖包');
            } else if (issue.includes('端口被占用')) {
                suggestions.push('请停止占用端口的进程，或在设置中更改服务端口');
            } else if (issue.includes('Chrome未运行')) {
                suggestions.push('请启动Chrome并启用远程调试：chrome --remote-debugging-port=9222');
            } else if (issue.includes('权限问题')) {
                suggestions.push('请检查文件系统权限，确保有写入临时文件的权限');
            }
        }
        
        if (suggestions.length === 0) {
            suggestions.push('请查看详细日志获取更多信息');
            suggestions.push('可以尝试重启Cursor编辑器');
        }
        
        return suggestions;
    }

    dispose(): void {
        this.stopAll();
    }
} 