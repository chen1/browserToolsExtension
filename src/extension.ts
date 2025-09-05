import * as vscode from 'vscode';
import { BrowserToolsManager } from './browserToolsManager';
import { registerCommands } from './commands';

// 创建全局输出通道
export const outputChannel = vscode.window.createOutputChannel('Browser Tools Manager');

// 全局管理器实例
let browserToolsManager: BrowserToolsManager | null = null;

// 检查Node.js版本
function checkNodeVersion(): boolean {
    const requiredVersion = '18.0.0';
    const currentVersion = process.version;
    
    // 解析版本号
    const required = requiredVersion.split('.').map(Number);
    const current = currentVersion.replace('v', '').split('.').map(Number);
    
    // 比较主版本号
    if (current[0] < required[0]) {
        return false;
    }
    
    // 如果主版本号相同，比较次版本号
    if (current[0] === required[0] && current[1] < required[1]) {
        return false;
    }
    
    return true;
}

export function activate(context: vscode.ExtensionContext) {
    try {
        // 首先检查Node.js版本
        if (!checkNodeVersion()) {
            const errorMsg = `Node.js版本不兼容！当前版本: ${process.version}，需要版本: >=18.0.0。请升级Node.js版本。`;
            vscode.window.showErrorMessage(errorMsg);
            outputChannel.appendLine(`[ERROR] ${errorMsg}`);
            console.error(errorMsg);
            return; // 阻止扩展激活
        }
        
        outputChannel.appendLine('🚀 Browser Tools Manager 扩展正在激活...');
        outputChannel.appendLine(`📋 当前Node.js版本: ${process.version}`);
        outputChannel.appendLine(`📁 工作目录: ${process.cwd()}`);
        console.log('Browser Tools Manager 扩展正在激活');
        console.log(`当前Node.js版本: ${process.version}`);

        // 创建Browser Tools管理器实例，并传递输出通道
        browserToolsManager = new BrowserToolsManager(outputChannel);

        // 注册命令
        registerCommands(context, browserToolsManager);

        // 将管理器实例存储到context中，供其他模块使用
        context.subscriptions.push(
            vscode.Disposable.from(browserToolsManager)
        );
        
        // 显示输出通道，让用户知道日志在哪里
        outputChannel.show();
        
        // 显示激活成功消息
        outputChannel.appendLine('✅ Browser Tools Manager 扩展激活成功！');
        vscode.window.showInformationMessage('Browser Tools Manager 扩展已激活，可以使用命令面板启动服务');
        
        // 自动检查现有服务状态
        setTimeout(async () => {
            if (browserToolsManager) {
                try {
                    const status = await browserToolsManager.getStatus();
                    outputChannel.appendLine(`📊 服务状态检查: 服务器运行=${status.serverRunning}, MCP运行=${status.mcpRunning}, 端口占用=${status.portOccupied}`);
                    
                    if (status.serverRunning) {
                        outputChannel.appendLine('✅ 检测到现有服务正在运行');
                    } else {
                        outputChannel.appendLine('ℹ️ 未检测到运行中的服务，可以使用命令启动');
                    }
                } catch (error) {
                    outputChannel.appendLine(`⚠️ 状态检查失败: ${error}`);
                }
            }
        }, 2000);
        
    } catch (error) {
        const errorMsg = `扩展激活失败: ${error}`;
        outputChannel.appendLine(`[ERROR] ${errorMsg}`);
        vscode.window.showErrorMessage(errorMsg);
        console.error(errorMsg);
    }
}

export function deactivate() {
    try {
        outputChannel.appendLine('🔄 Browser Tools Manager 扩展正在停用...');
        
        // 停止所有服务
        if (browserToolsManager) {
            browserToolsManager.stop().then(() => {
                outputChannel.appendLine('✅ 所有服务已停止');
            }).catch(error => {
                outputChannel.appendLine(`⚠️ 停止服务时出错: ${error}`);
            });
        }
        
        outputChannel.appendLine('✅ Browser Tools Manager 扩展已停用');
        console.log('Browser Tools Manager 扩展已停用');
        
    } catch (error) {
        const errorMsg = `扩展停用失败: ${error}`;
        outputChannel.appendLine(`[ERROR] ${errorMsg}`);
        console.error(errorMsg);
    }
}

// 导出管理器实例，供其他模块使用
export function getBrowserToolsManager(): BrowserToolsManager | null {
    return browserToolsManager;
} 