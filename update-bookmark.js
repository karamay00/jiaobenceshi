const fs = require('fs');
const path = require('path');
const os = require('os');

// Chrome书签文件路径
const bookmarksPath = path.join(
  os.homedir(),
  'Library/Application Support/Google/Chrome/Default/Bookmarks'
);

// 读取原始脚本
const scriptContent = fs.readFileSync('./script.js', 'utf8');

// 将脚本转换为bookmarklet格式
function createBookmarklet(script) {
  // 简单方式：直接URL编码整个脚本
  return 'javascript:' + encodeURIComponent(script.trim());
}

// 检查Chrome是否在运行
function isChromeRunning() {
  const { execSync } = require('child_process');
  try {
    const result = execSync('pgrep -x "Google Chrome"', { encoding: 'utf8' });
    return result.trim().length > 0;
  } catch (e) {
    return false;
  }
}

async function updateBookmark() {
  // 检查Chrome是否运行
  if (isChromeRunning()) {
    console.log('❌ 请先关闭所有Chrome浏览器窗口，然后重新运行此脚本');
    console.log('提示：Chrome运行时无法修改书签文件');
    process.exit(1);
  }

  // 检查书签文件是否存在
  if (!fs.existsSync(bookmarksPath)) {
    console.log('❌ 找不到Chrome书签文件');
    console.log('路径:', bookmarksPath);
    process.exit(1);
  }

  // 备份原书签文件
  const backupPath = bookmarksPath + '.backup.' + Date.now();
  fs.copyFileSync(bookmarksPath, backupPath);
  console.log('✅ 已备份原书签文件到:', backupPath);

  // 读取书签文件
  const bookmarks = JSON.parse(fs.readFileSync(bookmarksPath, 'utf8'));

  // 创建bookmarklet URL
  const bookmarkletUrl = createBookmarklet(scriptContent);

  // 查找或创建书签
  let found = false;
  const bookmarkBar = bookmarks.roots.bookmark_bar;

  function findAndUpdate(node) {
    if (node.type === 'url' && node.name === '运行脚本') {
      node.url = bookmarkletUrl;
      node.date_modified = Date.now() * 1000; // Chrome使用微秒
      found = true;
      return true;
    }
    if (node.children) {
      for (let child of node.children) {
        if (findAndUpdate(child)) return true;
      }
    }
    return false;
  }

  findAndUpdate(bookmarkBar);

  if (!found) {
    // 如果没找到，创建新书签
    if (!bookmarkBar.children) {
      bookmarkBar.children = [];
    }
    bookmarkBar.children.push({
      date_added: Date.now() * 1000,
      date_modified: Date.now() * 1000,
      id: Date.now().toString(),
      name: '运行脚本',
      type: 'url',
      url: bookmarkletUrl
    });
    console.log('✅ 已创建新书签："运行脚本"');
  } else {
    console.log('✅ 已更新书签："运行脚本"');
  }

  // 写回书签文件
  fs.writeFileSync(bookmarksPath, JSON.stringify(bookmarks, null, 3), 'utf8');
  console.log('✅ 书签已更新完成！');
  console.log('\n📌 现在可以打开Chrome浏览器，书签已经自动更新了！');
}

updateBookmark().catch(err => {
  console.error('❌ 错误:', err.message);
  process.exit(1);
});
