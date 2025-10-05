const { execSync } = require('child_process');
const { spawn } = require('child_process');

async function autoRun() {
  console.log('🔄 Step 1: 关闭所有Chrome进程...');
  try {
    execSync('pkill -9 "Google Chrome"', { stdio: 'ignore' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Chrome已关闭');
  } catch (e) {
    console.log('✅ Chrome未运行或已关闭');
  }

  console.log('\n🔄 Step 2: 更新书签...');
  try {
    const output = execSync('node update-bookmark.js', { encoding: 'utf8' });
    console.log(output);
  } catch (e) {
    console.error('❌ 更新书签失败:', e.message);
    process.exit(1);
  }

  console.log('\n🔄 Step 3: 打开Chrome并访问网站...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 使用你的Chrome，打开网站
  const chrome = spawn('open', [
    '-a', 'Google Chrome',
    'http://zzxxyy.shop/'
  ], { detached: true, stdio: 'ignore' });

  chrome.unref();

  console.log('✅ Chrome已启动，正在访问 http://zzxxyy.shop/');

  // 等待Chrome窗口打开
  console.log('🔄 Step 4: 等待页面加载，自动打开开发者工具...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 使用AppleScript模拟按键 Cmd+Option+J
  const appleScript = `
    tell application "Google Chrome"
      activate
    end tell

    delay 0.5

    tell application "System Events"
      keystroke "j" using {command down, option down}
    end tell
  `;

  try {
    execSync(`osascript -e '${appleScript.replace(/'/g, "'\\''")}'`, { stdio: 'ignore' });
    console.log('✅ 开发者工具已自动打开');
  } catch (e) {
    console.log('⚠️  开发者工具打开失败，请手动按 Cmd+Option+J');
  }

  console.log('\n📌 接下来请：');
  console.log('   1. 点击书签栏的"运行脚本"书签');
  console.log('   2. 在Console标签中查看日志输出');
  console.log('   3. 享受自动化脚本！');
}

autoRun().catch(err => {
  console.error('❌ 错误:', err.message);
  process.exit(1);
});
