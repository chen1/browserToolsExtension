import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Browser Tools Manager 调试版扩展已激活');
    
    try {
        // 第一步：测试基本的命令注册
        console.log('步骤1: 测试基本命令注册...');
        const testCommand = vscode.commands.registerCommand('browser-tools.test', () => {
            vscode.window.showInformationMessage('测试命令执行成功！');
        });
        context.subscriptions.push(testCommand);
        console.log('✅ 基本命令注册成功');
        
        // 第二步：测试BrowserToolsManager类的创建
        console.log('步骤2: 测试BrowserToolsManager类创建...');
        try {
            const { BrowserToolsManager } = require('./browserToolsManager');
            console.log('✅ BrowserToolsManager类导入成功');
            
            // 尝试创建实例
            const browserToolsManager = new BrowserToolsManager();
            console.log('✅ BrowserToolsManager实例创建成功');
            
            // 第三步：测试命令注册
            console.log('步骤3: 测试完整命令注册...');
            const { registerCommands } = require('./commands');
            registerCommands(context, browserToolsManager);
            console.log('✅ 完整命令注册成功');
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('❌ BrowserToolsManager相关操作失败:', errorMessage);
            vscode.window.showErrorMessage(`扩展初始化失败: ${errorMessage}`);
            
            // 如果失败，回退到简化版本
            console.log('回退到简化版本...');
            registerSimpleCommands(context);
        }
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ 扩展激活失败:', errorMessage);
        vscode.window.showErrorMessage(`扩展激活失败: ${errorMessage}`);
        
        // 如果完全失败，至少注册一些基本命令
        registerSimpleCommands(context);
    }
}

function registerSimpleCommands(context: vscode.ExtensionContext) {
    console.log('注册简化命令...');
    
    const startCommand = vscode.commands.registerCommand('browser-tools.start', () => {
        vscode.window.showInformationMessage('Browser Tools服务启动命令执行成功！（简化版）');
    });
    
    const stopCommand = vscode.commands.registerCommand('browser-tools.stop', () => {
        vscode.window.showInformationMessage('Browser Tools服务停止命令执行成功！（简化版）');
    });
    
    const statusCommand = vscode.commands.registerCommand('browser-tools.status', () => {
        vscode.window.showInformationMessage('Browser Tools状态命令执行成功！（简化版）');
    });
    
    const logsCommand = vscode.commands.registerCommand('browser-tools.logs', () => {
        vscode.window.showInformationMessage('Browser Tools日志命令执行成功！（简化版）');
    });
    
    const clearLogsCommand = vscode.commands.registerCommand('browser-tools.clearLogs', () => {
        vscode.window.showInformationMessage('Browser Tools清理日志命令执行成功！（简化版）');
    });
    
    context.subscriptions.push(
        startCommand,
        stopCommand,
        statusCommand,
        logsCommand,
        clearLogsCommand
    );
    
    console.log('✅ 简化命令注册成功');
}

export function deactivate() {
    console.log('Browser Tools Manager 调试版扩展已停用');
}
