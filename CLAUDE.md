# Claude 指令备忘录

## 快捷指令

### 发布脚本
当用户说"发布脚本"或"构建脚本"时，执行：
```bash
node build.js
```

这个命令会自动完成：
1. 从 src/ 目录合并所有模块文件生成 script.js
2. 将 script.js 编码生成 bookmarklet 代码
3. 生成 install.html 安装页面
4. 更新所有相关文件
5. 用户可以将 install.html 分享给其他人使用

### 重启脚本
当用户说"重启脚本"时，**必须先构建再重启**：
```bash
node build.js && node auto-run.js
```

**⚠️ 重要：重启前必须先构建**
- 如果修改了 `src/` 目录下的任何代码，必须先运行 `node build.js` 重新构建
- 否则重启后使用的还是旧版本代码

这个命令会自动完成：
1. **构建**：合并模块文件生成最新的 script.js 和 bookmarklet
2. **关闭**：关闭所有Chrome进程
3. **更新**：更新书签到最新版本
4. **打开**：打开Chrome并访问 http://zzxxyy.shop/
5. 用户只需登录后点击书签栏的"运行脚本"

### 模拟测试模式
用于不联网环境下测试下注和盈亏计算功能：

**启用模拟模式：**
```javascript
// 在浏览器控制台输入
window.mockBetting = true;
```

**测试流程：**
1. 开启模拟模式后，脚本会自动模拟下注成功（不发送网络请求）
2. 触发下注：`console.log({ url: '/jiang/开局.png' })`
3. 触发开奖：`console.log({ msg: ['5期结果：庄9', '(霸天虎)[100][50]'] })`
4. 查看盈亏计算和UI更新是否正常

**关闭模拟模式：**
```javascript
// 恢复真实下注
window.mockBetting = false;
```

## 项目说明

这是一个浏览器脚本自动化工具，主要功能：
- 拦截 console.log 捕获对象日志
- 显示期号和结果信息
- 显示"霸天虎"的输赢情况
- 提供日志面板UI和下注功能

## ⚠️ 重要：代码修改规则

### 源代码目录结构
```
src/                        ← ✅ 所有代码修改必须在这里进行
├── core.js                 ← Console拦截和全局状态初始化
├── storage.js              ← 配置保存和加载
├── ui.js                   ← UI面板和组件
├── betting.js              ← 自动下注核心功能
├── game-parser.js          ← 游戏数据解析
├── init.js                 ← 初始化和事件绑定
└── patterns/
    ├── preset.js           ← 预设牌路管理
    └── custom.js           ← 自定义牌路管理

script.js                   ← ❌ 自动生成，永远不要直接修改！
install.html                ← ❌ 自动生成，永远不要直接修改！
bookmarklet.txt             ← ❌ 自动生成，永远不要直接修改！
```

### 正确的修改流程
1. ✅ **修改源代码**：在 `src/` 目录下修改相应的模块文件
2. ✅ **重新构建**：运行 `node build.js` 生成最终文件
3. ❌ **永远不要直接修改** `script.js`、`install.html`、`bookmarklet.txt`，这些文件会在构建时被覆盖

### 文件说明

**源代码（需要修改的）：**
- `src/core.js` - Console拦截、全局状态、延迟控制
- `src/storage.js` - localStorage配置管理
- `src/ui.js` - 面板UI、定时更新
- `src/betting.js` - 下注逻辑、牌路激活
- `src/game-parser.js` - 解析期号、结果、霸天虎状态
- `src/patterns/preset.js` - 预设组的创建和管理
- `src/patterns/custom.js` - 自定义牌路的创建和管理
- `src/init.js` - 按钮事件、初始化牌路

**构建和工具：**
- `build.js` - 一键构建脚本（合并模块 → 生成 bookmarklet → 生成 install.html）
- `auto-run.js` - 一键自动化运行脚本（本地测试用）
- `test-script.js` - Puppeteer测试脚本

**生成的文件（不要修改）：**
- `script.js` - 从 src/ 自动生成的合并文件
- `install.html` - 用户安装页面（分享给其他人）
- `bookmarklet.txt` - 书签代码（可手动复制）
- `bookmarklet-generated.txt` - 编码后的完整代码
- `bookmarklet-raw.txt` - 原始代码（调试用）
