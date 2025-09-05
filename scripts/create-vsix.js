#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// 递归获取所有依赖包（包括传递依赖）
function getAllDependencies() {
    const allDeps = new Set();
    const visited = new Set();
    
    function collectDependencies(packagePath, packageName = '') {
        if (visited.has(packagePath)) {
            return;
        }
        visited.add(packagePath);
        
        const packageJsonPath = path.join(packagePath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            return;
        }
        
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            const dependencies = {
                ...packageJson.dependencies,
                ...packageJson.optionalDependencies
            };
            
            for (const dep of Object.keys(dependencies || {})) {
                allDeps.add(dep);
                
                // 递归处理子依赖
                const depPath = path.join('node_modules', dep);
                if (fs.existsSync(depPath)) {
                    collectDependencies(depPath, dep);
                }
            }
        } catch (error) {
            console.warn(`⚠️  无法解析 ${packageJsonPath}: ${error.message}`);
        }
    }
    
    // 从根目录的 package.json 开始
    const rootPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const rootDependencies = rootPackageJson.dependencies || {};
    
    for (const dep of Object.keys(rootDependencies)) {
        allDeps.add(dep);
        const depPath = path.join('node_modules', dep);
        if (fs.existsSync(depPath)) {
            collectDependencies(depPath, dep);
        }
    }
    
    return allDeps;
}

// 创建VSIX包
async function createVSIX() {
    console.log('🚀 开始创建VSIX包...');
    
    // 动态读取版本号
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = packageJson.version;
    const filename = `browser-tools-manager-${version}.vsix`;
    
    const output = fs.createWriteStream(filename);
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });
    
    output.on('close', () => {
        console.log('✅ VSIX包创建成功！');
        console.log(`📦 文件大小: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📁 文件名: ${filename}`);
    });
    
    archive.on('error', (err) => {
        throw err;
    });
    
    archive.pipe(output);
    
    // 添加必要的文件到extension/目录下
    const filesToInclude = [
        { source: 'package.json', target: 'extension/package.json' },
        { source: 'README.md', target: 'extension/README.md' },
        { source: 'LICENSE', target: 'extension/LICENSE' },
        { source: 'CHANGELOG.md', target: 'extension/CHANGELOG.md' }
    ];
    
    // 添加编译后的文件
    filesToInclude.forEach(file => {
        if (fs.existsSync(file.source)) {
            archive.file(file.source, { name: file.target });
            console.log(`📁 添加文件: ${file.source} -> ${file.target}`);
        } else {
            console.warn(`⚠️  文件不存在: ${file.source}`);
        }
    });
    
    // 添加编译后的out目录内容到extension/out/
    if (fs.existsSync('out')) {
        archive.directory('out', 'extension/out');
        console.log('📁 添加编译后的代码目录: extension/out/');
    } else {
        console.warn('⚠️  out目录不存在，请先运行 npm run compile');
    }
    
    // 不打包依赖包 - 改为使用 npx 方式运行
    console.log('📦 使用轻量级打包方式（不包含依赖包）');
    
    await archive.finalize();
}

// 检查依赖
function checkDependencies() {
    try {
        require('archiver');
    } catch (error) {
        console.log('📦 正在安装archiver依赖...');
        const { execSync } = require('child_process');
        execSync('npm install archiver', { stdio: 'inherit' });
    }
}

// 主函数
async function main() {
    try {
        checkDependencies();
        await createVSIX();
    } catch (error) {
        console.error('❌ 创建VSIX包失败:', error);
        process.exit(1);
    }
}

main(); 