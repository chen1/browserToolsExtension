const child_process = require('child_process');

console.log('🧪 测试进程启动...');

// 测试npx命令
console.log('\n1. 测试npx命令:');
try {
    const npxVersion = child_process.execSync('npx --version', { encoding: 'utf8' }).trim();
    console.log(`✅ npx版本: ${npxVersion}`);
} catch (error) {
    console.log('❌ npx命令失败:', error.message);
    process.exit(1);
}

// 测试browser-tools-server启动
console.log('\n2. 测试browser-tools-server启动:');
const testProcess = child_process.spawn('npx', [
    '-y', 
    '@agentdeskai/browser-tools-server@1.2.0', 
    '--port', '3025'
], {
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: false
});

if (!testProcess.pid) {
    console.log('❌ 无法获取进程PID');
    process.exit(1);
}

console.log(`✅ 进程创建成功，PID: ${testProcess.pid}`);

let serverStarted = false;
let startupTimeout;

// 监听输出
testProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    console.log(`服务器输出: ${output}`);
    
    if (output.includes('Browser Tools Server Started') || 
        output.includes('For local access use:')) {
        if (!serverStarted) {
            serverStarted = true;
            console.log('✅ 服务器启动成功！');
            clearTimeout(startupTimeout);
            
            // 停止服务器
            setTimeout(() => {
                testProcess.kill('SIGINT');
                console.log('🛑 服务器已停止');
                process.exit(0);
            }, 2000);
        }
    }
});

testProcess.stderr.on('data', (data) => {
    const error = data.toString().trim();
    console.log(`服务器错误: ${error}`);
});

// 设置超时
startupTimeout = setTimeout(() => {
    if (!serverStarted) {
        console.log('❌ 服务器启动超时');
        testProcess.kill('SIGINT');
        process.exit(1);
    }
}, 15000);

// 监听进程退出
testProcess.on('exit', (code, signal) => {
    if (code !== null) {
        console.log(`进程退出，退出码: ${code}`);
    } else if (signal) {
        console.log(`进程被信号终止: ${signal}`);
    }
}); 