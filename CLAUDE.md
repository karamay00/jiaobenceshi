# Claude 指令备忘录

## 快捷指令

### 重启脚本
当用户说"重启脚本"时，执行：
```bash
node auto-run.js
```

这个命令会自动完成：
1. 关闭所有Chrome进程
2. 更新书签到最新版本
3. 打开Chrome并访问 http://zzxxyy.shop/
4. 用户只需登录后点击书签栏的"运行脚本"

## 项目说明

这是一个浏览器脚本自动化工具，主要功能：
- 拦截 console.log 捕获对象日志
- 显示期号和结果信息
- 显示"霸天虎"的输赢情况
- 提供日志面板UI和下注功能

## 文件结构

- `script.js` - 原始浏览器脚本
- `auto-run.js` - 一键自动化运行脚本
- `update-bookmark.js` - 更新Chrome书签脚本
- `bookmarks.html` - 书签导入文件
- `bookmarklet.txt` - 书签代码（可手动复制）
- `test-script.js` - Puppeteer测试脚本
