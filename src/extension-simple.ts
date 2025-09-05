import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Browser Tools Manager 简化版扩展已激活');
    
    // 注册一个简单的测试命令
    const testCommand = vscode.commands.registerCommand('browser-tools.test', () => {
        vscode.window.showInformationMessage('测试命令执行成功！');
    });
    
    // 注册启动命令
    const startCommand = vscode.commands.registerCommand('browser-tools.start', () => {
        vscode.window.showInformationMessage('Browser Tools服务启动命令执行成功！');
    });
    
    // 注册停止命令
    const stopCommand = vscode.commands.registerCommand('browser-tools.stop', () => {
        vscode.window.showInformationMessage('Browser Tools服务停止命令执行成功！');
    });
    
    // 注册状态命令
    const statusCommand = vscode.commands.registerCommand('browser-tools.status', () => {
        vscode.window.showInformationMessage('Browser Tools状态命令执行成功！');
    });
    
    // 注册日志命令
    const logsCommand = vscode.commands.registerCommand('browser-tools.logs', () => {
        vscode.window.showInformationMessage('Browser Tools日志命令执行成功！');
    });
    
    // 注册清理日志命令
    const clearLogsCommand = vscode.commands.registerCommand('browser-tools.clearLogs', () => {
        vscode.window.showInformationMessage('Browser Tools清理日志命令执行成功！');
    });
    
    // 将所有命令添加到订阅中
    context.subscriptions.push(
        testCommand,
        startCommand,
        stopCommand,
        statusCommand,
        logsCommand,
        clearLogsCommand
    );
    
    console.log('所有命令已注册');
}

export function deactivate() {
    console.log('Browser Tools Manager 简化版扩展已停用');
}



