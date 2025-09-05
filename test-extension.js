const path = require('path');
const fs = require('fs');

console.log('🔍 检查扩展文件...');

// 检查编译后的文件
const outDir = path.join(__dirname, 'out');
if (fs.existsSync(outDir)) {
    console.log('✅ out目录存在');
    
    const requiredFiles = [
        'extension.js',
        'commands.js',
        'browserToolsManager.js'
    ];
    
    requiredFiles.forEach(file => {
        const filePath = path.join(outDir, file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`✅ ${file} 存在 (${stats.size} bytes)`);
        } else {
            console.log(`❌ ${file} 不存在`);
        }
    });
} else {
    console.log('❌ out目录不存在');
}

// 检查package.json
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    console.log('\n📦 Package.json 信息:');
    console.log(`- 名称: ${packageJson.name}`);
    console.log(`- 版本: ${packageJson.version}`);
    console.log(`- 主文件: ${packageJson.main}`);
    console.log(`- 命令数量: ${packageJson.contributes.commands.length}`);
    
    // 检查命令
    console.log('\n🔧 注册的命令:');
    packageJson.contributes.commands.forEach(cmd => {
        console.log(`- ${cmd.command}: ${cmd.title}`);
    });
} else {
    console.log('❌ package.json 不存在');
}

// 检查扩展激活事件
const packageContent = fs.readFileSync(packagePath, 'utf8');
const packageJson = JSON.parse(packageContent);

console.log('\n🚀 激活事件:');
if (packageJson.activationEvents) {
    packageJson.activationEvents.forEach(event => {
        console.log(`- ${event}`);
    });
} else {
    console.log('❌ 没有定义激活事件');
}

console.log('\n📋 建议的解决方案:');
console.log('1. 确保扩展已正确安装到VS Code/Cursor中');
console.log('2. 检查扩展是否正确激活（查看输出面板）');
console.log('3. 尝试重新加载窗口 (Cmd+Shift+P -> Developer: Reload Window)');
console.log('4. 检查命令面板中是否有 "Browser Tools" 分类'); 