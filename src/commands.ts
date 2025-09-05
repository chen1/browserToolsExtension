import * as vscode from 'vscode';
import { BrowserToolsManager } from './browserToolsManager';

export function registerCommands(context: vscode.ExtensionContext, browserToolsManager: BrowserToolsManager) {
    // 启动服务命令
    const startCommand = vscode.commands.registerCommand('browser-tools.start', async () => {
        try {
            // 显示进度通知
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "启动 Browser Tools 服务",
                cancellable: false
            }, async (progress) => {
                progress.report({ message: "正在检查服务状态..." });
                
                // 先检查当前状态
                const currentStatus = await browserToolsManager.getStatus();
                if (currentStatus.serverRunning) {
                    vscode.window.showInformationMessage('Browser Tools服务已经在运行中');
                    return;
                }
                
                progress.report({ message: "正在启动服务器..." });
                const success = await browserToolsManager.start();
                
                if (success) {
                    progress.report({ message: "服务启动成功！" });
                    vscode.window.showInformationMessage('✅ Browser Tools服务启动成功！');
                    
                    // 显示服务信息
                    const status = await browserToolsManager.getStatus();
                    if (status.serverRunning) {
                        vscode.window.showInformationMessage(`🌐 服务地址: http://localhost:${browserToolsManager['serverPort']}`);
                    }
                } else {
                    progress.report({ message: "服务启动失败" });
                    vscode.window.showErrorMessage('❌ Browser Tools服务启动失败，请查看日志了解详情');
                }
            });
            
        } catch (error) {
            const errorMsg = `启动命令执行失败: ${error}`;
            vscode.window.showErrorMessage(errorMsg);
            console.error(errorMsg);
        }
    });

    // 停止服务命令
    const stopCommand = vscode.commands.registerCommand('browser-tools.stop', async () => {
        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "停止 Browser Tools 服务",
                cancellable: false
            }, async (progress) => {
                progress.report({ message: "正在停止服务..." });
                
                const success = await browserToolsManager.stop();
                
                if (success) {
                    progress.report({ message: "服务已停止" });
                    vscode.window.showInformationMessage('✅ Browser Tools服务已停止');
                } else {
                    progress.report({ message: "停止服务失败" });
                    vscode.window.showWarningMessage('⚠️ 停止服务时出现问题，请查看日志了解详情');
                }
            });
            
        } catch (error) {
            const errorMsg = `停止命令执行失败: ${error}`;
            vscode.window.showErrorMessage(errorMsg);
            console.error(errorMsg);
        }
    });

    // 查看服务状态命令
    const statusCommand = vscode.commands.registerCommand('browser-tools.status', async () => {
        try {
            const status = await browserToolsManager.getStatus();
            
            const statusText = `
📊 Browser Tools 服务状态

🖥️  服务器运行: ${status.serverRunning ? '✅ 是' : '❌ 否'}
🔌 MCP运行: ${status.mcpRunning ? '✅ 是' : '❌ 否'}
🌐 端口占用: ${status.portOccupied ? '⚠️ 是' : '✅ 否'}
🌍 Chrome运行: ${status.chromeRunning ? '✅ 是' : '❌ 否'}

${status.serverRunning ? `📍 服务地址: http://localhost:${browserToolsManager['serverPort']}` : ''}
            `.trim();
            
            // 创建状态面板
            const panel = vscode.window.createWebviewPanel(
                'browserToolsStatus',
                'Browser Tools 服务状态',
                vscode.ViewColumn.One,
                {}
            );
            
            panel.webview.html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Browser Tools 状态</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; }
                        .status-item { margin: 10px 0; padding: 10px; border-radius: 5px; }
                        .running { background-color: #d4edda; border: 1px solid #c3e6cb; }
                        .stopped { background-color: #f8d7da; border: 1px solid #f5c6cb; }
                        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; }
                        .info { background-color: #d1ecf1; border: 1px solid #bee5eb; }
                    </style>
                </head>
                <body>
                    <h1>🌐 Browser Tools 服务状态</h1>
                    <div class="status-item ${status.serverRunning ? 'running' : 'stopped'}">
                        <strong>🖥️ 服务器运行:</strong> ${status.serverRunning ? '✅ 是' : '❌ 否'}
                    </div>
                    <div class="status-item ${status.mcpRunning ? 'running' : 'stopped'}">
                        <strong>🔌 MCP运行:</strong> ${status.mcpRunning ? '✅ 是' : '❌ 否'}
                    </div>
                    <div class="status-item ${status.portOccupied ? 'warning' : 'info'}">
                        <strong>🌐 端口占用:</strong> ${status.portOccupied ? '⚠️ 是' : '✅ 否'}
                    </div>
                    <div class="status-item ${status.chromeRunning ? 'running' : 'stopped'}">
                        <strong>🌍 Chrome运行:</strong> ${status.chromeRunning ? '✅ 是' : '❌ 否'}
                    </div>
                    ${status.serverRunning ? `
                    <div class="status-item info">
                        <strong>📍 服务地址:</strong> <a href="http://localhost:${browserToolsManager['serverPort']}" target="_blank">http://localhost:${browserToolsManager['serverPort']}</a>
                    </div>
                    ` : ''}
                </body>
                </html>
            `;
            
        } catch (error) {
            vscode.window.showErrorMessage(`获取状态失败: ${error}`);
        }
    });

    // 查看详细日志命令
    const logsCommand = vscode.commands.registerCommand('browser-tools.logs', async () => {
        try {
            const logContent = browserToolsManager.getLogs();
            if (logContent) {
                // 创建新的文档显示日志
                const document = await vscode.workspace.openTextDocument({
                    content: logContent,
                    language: 'log'
                });
                await vscode.window.showTextDocument(document);
            } else {
                vscode.window.showInformationMessage('暂无日志内容');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`获取日志失败: ${error}`);
        }
    });

    // 清理日志命令
    const clearLogsCommand = vscode.commands.registerCommand('browser-tools.clearLogs', async () => {
        try {
            browserToolsManager.clearLogs();
            vscode.window.showInformationMessage('✅ 日志已清理');
        } catch (error) {
            vscode.window.showErrorMessage(`清理日志失败: ${error}`);
        }
    });

    // 重启服务命令
    const restartCommand = vscode.commands.registerCommand('browser-tools.restart', async () => {
        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "重启 Browser Tools 服务",
                cancellable: false
            }, async (progress) => {
                progress.report({ message: "正在停止服务..." });
                await browserToolsManager.stop();
                
                progress.report({ message: "正在启动服务..." });
                const success = await browserToolsManager.start();
                
                if (success) {
                    progress.report({ message: "服务重启成功！" });
                    vscode.window.showInformationMessage('✅ Browser Tools服务重启成功！');
                } else {
                    progress.report({ message: "服务重启失败" });
                    vscode.window.showErrorMessage('❌ Browser Tools服务重启失败，请查看日志了解详情');
                }
            });
            
        } catch (error) {
            const errorMsg = `重启命令执行失败: ${error}`;
            vscode.window.showErrorMessage(errorMsg);
            console.error(errorMsg);
        }
    });

    // 诊断MCP连接命令
    const diagnoseMcpCommand = vscode.commands.registerCommand('browser-tools.diagnoseMcp', async () => {
        try {
            const status = await browserToolsManager.getStatus();
            
            // 创建诊断面板
            const panel = vscode.window.createWebviewPanel(
                'mcpDiagnosis',
                'MCP 连接诊断',
                vscode.ViewColumn.One,
                {}
            );
            
            // 检查 MCP 配置文件内容
            const mcpConfigPath = '/Users/fwmh/.cursor/mcp.json';
            let configContent = '';
            let configValid = false;
            
            try {
                const fs = require('fs');
                if (fs.existsSync(mcpConfigPath)) {
                    configContent = fs.readFileSync(mcpConfigPath, 'utf8');
                    JSON.parse(configContent); // 验证 JSON 格式
                    configValid = true;
                }
            } catch (error) {
                configContent = `配置文件读取失败: ${error}`;
            }
            
            panel.webview.html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; }
                        .status-good { color: #28a745; }
                        .status-bad { color: #dc3545; }
                        .status-warning { color: #ffc107; }
                        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
                        pre { background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; }
                        .action-button { background: #007acc; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
                    </style>
                </head>
                <body>
                    <h1>🔍 MCP 连接诊断报告</h1>
                    
                    <div class="section">
                        <h2>📊 服务状态</h2>
                        <p>🖥️ 服务器运行: <span class="${status.serverRunning ? 'status-good' : 'status-bad'}">${status.serverRunning ? '✅ 正常' : '❌ 未运行'}</span></p>
                        <p>🔌 MCP运行: <span class="${status.mcpRunning ? 'status-good' : 'status-bad'}">${status.mcpRunning ? '✅ 正常' : '❌ 未运行'}</span></p>
                        <p>📁 MCP配置: <span class="${status.mcpConfigured ? 'status-good' : 'status-bad'}">${status.mcpConfigured ? '✅ 已配置' : '❌ 未配置'}</span></p>
                        <p>🌍 Chrome连接: <span class="${status.chromeRunning ? 'status-good' : 'status-bad'}">${status.chromeRunning ? '✅ 已连接' : '❌ 未连接'}</span></p>
                    </div>
                    
                    <div class="section">
                        <h2>📝 MCP 配置文件</h2>
                        <p><strong>路径:</strong> <code>${mcpConfigPath}</code></p>
                        <p><strong>状态:</strong> <span class="${configValid ? 'status-good' : 'status-bad'}">${configValid ? '✅ 有效' : '❌ 无效'}</span></p>
                        <pre>${configContent}</pre>
                    </div>
                    
                    <div class="section">
                        <h2>🔧 解决步骤</h2>
                        <ol>
                            <li><strong>完全重启 Cursor</strong> - 这是最重要的步骤！MCP 配置只在 Cursor 启动时加载</li>
                            <li><strong>检查 AI 对话框</strong> - 重启后，在 AI 对话框中尝试使用类似 "使用 browser-tools 获取当前页面信息" 的提示</li>
                            <li><strong>验证工具可见性</strong> - 在 AI 对话中，MCP 工具应该会自动被识别</li>
                        </ol>
                        
                        <h3>📝 测试提示词：</h3>
                        <pre>请使用 browser-tools MCP 工具帮我获取当前浏览器页面的信息</pre>
                        <pre>调用 MCP 工具，查看 DevTools 中选中的元素</pre>
                        <pre>使用浏览器工具截取当前页面的截图</pre>
                    </div>
                    
                    <div class="section">
                        <h2>⚠️ 常见问题</h2>
                        <ul>
                            <li><strong>问题</strong>: AI 提示 "我无法访问浏览器工具"
                                <br><strong>解决</strong>: 完全重启 Cursor，确保 MCP 配置被重新加载</li>
                            <li><strong>问题</strong>: MCP 工具不出现在 AI 对话中
                                <br><strong>解决</strong>: 检查配置文件路径和内容，重新配置后重启 Cursor</li>
                            <li><strong>问题</strong>: 连接超时或错误
                                <br><strong>解决</strong>: 确保 browser-tools 服务正在运行，端口 3025 未被其他程序占用</li>
                        </ul>
                    </div>
                </body>
                </html>
            `;
            
        } catch (error) {
            vscode.window.showErrorMessage(`MCP诊断失败: ${error}`);
        }
    });

    // 配置MCP命令
    const configureMcpCommand = vscode.commands.registerCommand('browser-tools.configureMcp', async () => {
        try {
            // 显示MCP配置选项
            const choice = await vscode.window.showInformationMessage(
                '🔧 MCP配置管理',
                {
                    modal: true,
                    detail: '请选择要执行的MCP配置操作：'
                },
                '自动创建配置',
                '查看配置指引',
                '验证配置',
                '修复配置'
            );
            
            switch (choice) {
                case '自动创建配置':
                    const created = await browserToolsManager['autoCreateMcpConfig']();
                    if (created) {
                        vscode.window.showInformationMessage('✅ MCP配置已自动创建成功！');
                    }
                    break;
                    
                case '查看配置指引':
                    await browserToolsManager['showMcpConfigGuide']();
                    break;
                    
                case '验证配置':
                    const valid = await browserToolsManager['validateMcpConfig']();
                    if (valid) {
                        vscode.window.showInformationMessage('✅ MCP配置验证通过！');
                    } else {
                        vscode.window.showWarningMessage('⚠️ MCP配置验证失败，请检查配置文件');
                    }
                    break;
                    
                case '修复配置':
                    const repaired = await browserToolsManager['repairMcpConfig']();
                    if (repaired) {
                        vscode.window.showInformationMessage('✅ MCP配置已修复成功！');
                    }
                    break;
            }
            
        } catch (error) {
            const errorMsg = `MCP配置操作失败: ${error}`;
            vscode.window.showErrorMessage(errorMsg);
            console.error(errorMsg);
        }
    });

    // 注册所有命令
    context.subscriptions.push(
        startCommand,
        stopCommand,
        statusCommand,
        logsCommand,
        clearLogsCommand,
        restartCommand,
        diagnoseMcpCommand,
        configureMcpCommand
    );
} 