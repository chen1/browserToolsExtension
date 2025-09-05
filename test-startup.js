const { BrowserToolsManager } = require('./out/browserToolsManager');

async function testStartup() {
    console.log('开始测试 Browser Tools Manager 启动...');
    
    const manager = new BrowserToolsManager();
    
    try {
        console.log('正在启动服务...');
        const success = await manager.start();
        
        if (success) {
            console.log('✅ 服务启动成功！');
            
            // 获取状态
            const status = await manager.getStatus();
            console.log('服务状态:', status);
            
            // 等待5秒后停止
            console.log('等待5秒后停止服务...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const stopSuccess = await manager.stop();
            if (stopSuccess) {
                console.log('✅ 服务停止成功！');
            } else {
                console.log('❌ 服务停止失败！');
            }
        } else {
            console.log('❌ 服务启动失败！');
        }
    } catch (error) {
        console.error('测试过程中出错:', error);
    }
}

testStartup(); 