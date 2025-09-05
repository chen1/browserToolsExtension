#!/usr/bin/env node

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Browser Tools Manager 诊断工具');
console.log('=====================================');

// 检查系统信息
console.log('\n📋 系统信息:');
console.log(`操作系统: ${process.platform}`);
console.log(`Node.js版本: ${process.version}`);
console.log(`当前工作目录: ${process.cwd()}`);

// 检查端口占用
console.log('\n🌐 端口检查:');
const checkPort = (port) => {
    return new Promise((resolve) => {
        const net = require('net');
        const server = net.createServer();
        server.listen(port, () => {
            server.close();
            resolve(false); // 端口可用
        });
        server.on('error', () => {
            resolve(true); // 端口被占用
        });
    });
};

async function checkPorts() {
    const ports = [3025, 3026, 3027];
    for (const port of ports) {
        const occupied = await checkPort(port);
        console.log(`端口 ${port}: ${occupied ? '❌ 被占用' : '✅ 可用'}`);
    }
}

checkPorts();

// 检查npx命令
console.log('\n📦 包管理器检查:');
try {
    const npxVersion = child_process.execSync('npx --version', { encoding: 'utf8' }).trim();
    console.log(`npx版本: ${npxVersion}`);
} catch (error) {
    console.log('❌ npx命令不可用');
}

// 检查browser-tools-server包
console.log('\n🔧 包可用性检查:');
try {
    console.log('正在检查 @agentdeskai/browser-tools-server@1.2.0...');
    const result = child_process.execSync('npx -y @agentdeskai/browser-tools-server@1.2.0 --help', { 
        encoding: 'utf8',
        timeout: 5000 
    });
    console.log('✅ browser-tools-server 包可用');
} catch (error) {
    console.log('❌ browser-tools-server 包不可用或启动失败');
    console.log(`错误信息: ${error.message}`);
}

// 检查进程管理
console.log('\n⚙️ 进程管理测试:');
try {
    console.log('正在测试进程启动...');
    const testProcess = child_process.spawn('echo', ['test'], {
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    if (testProcess.pid) {
        console.log(`✅ 进程创建成功，PID: ${testProcess.pid}`);
        testProcess.kill();
    } else {
        console.log('❌ 进程创建失败');
    }
} catch (error) {
    console.log(`❌ 进程管理测试失败: ${error.message}`);
}

// 检查文件权限
console.log('\n📁 文件权限检查:');
const tempDir = '/tmp';
const pidFile = '/tmp/browser-tools-server.pid';

try {
    if (fs.existsSync(tempDir)) {
        console.log(`✅ 临时目录存在: ${tempDir}`);
        
        // 测试写入权限
        fs.writeFileSync(pidFile, '12345');
        console.log('✅ 文件写入权限正常');
        
        // 清理测试文件
        if (fs.existsSync(pidFile)) {
            fs.unlinkSync(pidFile);
        }
    } else {
        console.log(`❌ 临时目录不存在: ${tempDir}`);
    }
} catch (error) {
    console.log(`❌ 文件权限检查失败: ${error.message}`);
}

console.log('\n🎯 诊断完成！');
console.log('如果发现问题，请根据上述信息进行相应的修复。');


