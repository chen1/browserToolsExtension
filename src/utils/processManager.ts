import * as child_process from 'child_process';

export class ProcessManager {
    /**
     * 检查进程是否正在运行
     */
    isProcessRunning(pid: number): boolean {
        try {
            process.kill(pid, 0); // 发送信号0来检查进程是否存在
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 杀死进程
     */
    killProcess(pid: number, force: boolean = false): boolean {
        try {
            if (force) {
                process.kill(pid, 'SIGKILL');
            } else {
                process.kill(pid, 'SIGTERM');
            }
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 杀死所有匹配的进程
     */
    killAllProcesses(pattern: string): Promise<boolean> {
        return new Promise((resolve) => {
            const command = `pkill -f '${pattern}'`;
            
            child_process.exec(command, (error) => {
                resolve(!error);
            });
        });
    }

    /**
     * 强制杀死所有匹配的进程
     */
    forceKillAllProcesses(pattern: string): Promise<boolean> {
        return new Promise((resolve) => {
            const command = `pkill -9 -f '${pattern}'`;
            
            child_process.exec(command, (error) => {
                resolve(!error);
            });
        });
    }

    /**
     * 获取进程信息
     */
    getProcessInfo(pid: number): Promise<any> {
        return new Promise((resolve) => {
            const command = `ps -p ${pid} -o pid,ppid,cmd,etime`;
            
            child_process.exec(command, (error, stdout) => {
                if (error) {
                    resolve(null);
                } else {
                    const lines = stdout.trim().split('\n');
                    if (lines.length > 1) {
                        const parts = lines[1].trim().split(/\s+/);
                        resolve({
                            pid: parseInt(parts[0]),
                            ppid: parseInt(parts[1]),
                            cmd: parts.slice(2, -1).join(' '),
                            etime: parts[parts.length - 1]
                        });
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }
} 