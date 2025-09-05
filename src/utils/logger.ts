import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class Logger {
    private logFile: string;
    private outputChannel: vscode.OutputChannel | null = null;

    constructor(logFile?: string, outputChannel?: vscode.OutputChannel) {
        this.logFile = logFile || '/tmp/browser-tools.log';
        this.outputChannel = outputChannel || null;
    }

    /**
     * 获取东八区时间格式字符串
     */
    private getBeijingTimeString(): string {
        const now = new Date();
        // 获取UTC时间戳并加上8小时（东八区）
        const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
        
        // 格式化为 YYYY-MM-DD HH:mm:ss.SSS
        const year = beijingTime.getUTCFullYear();
        const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
        const day = String(beijingTime.getUTCDate()).padStart(2, '0');
        const hours = String(beijingTime.getUTCHours()).padStart(2, '0');
        const minutes = String(beijingTime.getUTCMinutes()).padStart(2, '0');
        const seconds = String(beijingTime.getUTCSeconds()).padStart(2, '0');
        const milliseconds = String(beijingTime.getUTCMilliseconds()).padStart(3, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds} [GMT+8]`;
    }

    /**
     * 设置输出通道
     */
    setOutputChannel(outputChannel: vscode.OutputChannel): void {
        this.outputChannel = outputChannel;
    }

    /**
     * 记录信息日志
     */
    log(message: string): void {
        const timestamp = this.getBeijingTimeString();
        const logMessage = `[INFO] ${timestamp} - ${message}`;
        
        console.log(logMessage);
        this.writeToFile(logMessage);
        this.writeToOutputChannel(logMessage);
    }

    /**
     * 记录错误日志
     */
    error(message: string): void {
        const timestamp = this.getBeijingTimeString();
        const logMessage = `[ERROR] ${timestamp} - ${message}`;
        
        console.error(logMessage);
        this.writeToFile(logMessage);
        this.writeToOutputChannel(logMessage);
    }

    /**
     * 记录警告日志
     */
    warn(message: string): void {
        const timestamp = this.getBeijingTimeString();
        const logMessage = `[WARN] ${timestamp} - ${message}`;
        
        console.warn(logMessage);
        this.writeToFile(logMessage);
        this.writeToOutputChannel(logMessage);
    }

    /**
     * 记录调试日志
     */
    debug(message: string): void {
        const timestamp = this.getBeijingTimeString();
        const logMessage = `[DEBUG] ${timestamp} - ${message}`;
        
        console.debug(logMessage);
        this.writeToFile(logMessage);
        this.writeToOutputChannel(logMessage);
    }

    /**
     * 写入日志到文件
     */
    private writeToFile(message: string): void {
        try {
            // 确保日志目录存在
            const logDir = path.dirname(this.logFile);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            // 追加日志到文件
            fs.appendFileSync(this.logFile, message + '\n');
        } catch (error) {
            console.error(`写入日志文件失败: ${error}`);
        }
    }

    /**
     * 写入日志到VS Code输出通道
     */
    private writeToOutputChannel(message: string): void {
        if (this.outputChannel) {
            this.outputChannel.appendLine(message);
        }
    }

    /**
     * 清空日志文件
     */
    clearLog(): void {
        try {
            if (fs.existsSync(this.logFile)) {
                fs.writeFileSync(this.logFile, '');
                this.log('日志文件已清空');
            }
        } catch (error) {
            console.error(`清空日志文件失败: ${error}`);
        }
    }

    /**
     * 获取日志文件路径
     */
    getLogFilePath(): string {
        return this.logFile;
    }

    /**
     * 读取日志内容
     */
    readLog(): string {
        try {
            if (fs.existsSync(this.logFile)) {
                return fs.readFileSync(this.logFile, 'utf8');
            }
            return '';
        } catch (error) {
            console.error(`读取日志文件失败: ${error}`);
            return '';
        }
    }

    /**
     * 获取日志文件大小
     */
    getLogFileSize(): number {
        try {
            if (fs.existsSync(this.logFile)) {
                const stats = fs.statSync(this.logFile);
                return stats.size;
            }
            return 0;
        } catch (error) {
            return 0;
        }
    }
} 