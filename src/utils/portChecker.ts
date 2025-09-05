import * as net from 'net';
import * as child_process from 'child_process';

export class PortChecker {
    /**
     * 检查端口是否被占用
     */
    async isPortOccupied(port: number): Promise<boolean> {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            
            socket.setTimeout(1000);
            
            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });
            
            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });
            
            socket.on('error', () => {
                socket.destroy();
                resolve(false);
            });
            
            socket.connect(port, 'localhost');
        });
    }

    /**
     * 获取端口占用信息
     */
    async getPortInfo(port: number): Promise<any> {
        return new Promise((resolve) => {
            const command = `lsof -i:${port}`;
            
            child_process.exec(command, (error, stdout) => {
                if (error) {
                    resolve(null);
                } else {
                    const lines = stdout.trim().split('\n');
                    if (lines.length > 1) {
                        const parts = lines[1].trim().split(/\s+/);
                        resolve({
                            command: parts[0],
                            pid: parseInt(parts[1]),
                            user: parts[2],
                            fd: parts[3],
                            type: parts[4],
                            device: parts[5],
                            size: parts[6],
                            node: parts[7],
                            name: parts[8]
                        });
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    /**
     * 查找可用端口
     */
    async findAvailablePort(startPort: number = 3000, endPort: number = 4000): Promise<number | null> {
        for (let port = startPort; port <= endPort; port++) {
            if (!(await this.isPortOccupied(port))) {
                return port;
            }
        }
        return null;
    }

    /**
     * 等待端口可用
     */
    async waitForPortAvailable(port: number, timeout: number = 30000): Promise<boolean> {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (!(await this.isPortOccupied(port))) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return false;
    }
} 