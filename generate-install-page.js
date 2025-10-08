const fs = require('fs');

// 读取bookmarklet代码
const bookmarkletCode = fs.readFileSync('bookmarklet-generated.txt', 'utf8').trim();

// HTML模板
const htmlTemplate = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>金沙国际脚本 - 安装页面</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 800px;
            width: 100%;
            padding: 40px;
        }

        h1 {
            color: #333;
            font-size: 32px;
            margin-bottom: 10px;
            text-align: center;
        }

        .subtitle {
            color: #666;
            text-align: center;
            margin-bottom: 30px;
            font-size: 16px;
        }

        .bookmarklet-zone {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            margin-bottom: 30px;
        }

        .bookmarklet-zone h2 {
            color: white;
            margin-bottom: 20px;
            font-size: 20px;
        }

        .bookmarklet-link {
            display: inline-block;
            background: white;
            color: #667eea;
            padding: 16px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            font-size: 18px;
            cursor: move;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .bookmarklet-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        }

        .instructions {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 30px;
            margin-bottom: 20px;
        }

        .instructions h3 {
            color: #333;
            margin-bottom: 20px;
            font-size: 20px;
        }

        .step {
            display: flex;
            margin-bottom: 20px;
            align-items: start;
        }

        .step-number {
            background: #667eea;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 15px;
            flex-shrink: 0;
        }

        .step-content {
            flex: 1;
            color: #555;
            line-height: 1.6;
        }

        .step-content strong {
            color: #333;
        }

        .step-content code {
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
        }

        .features {
            background: #fff;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 30px;
        }

        .features h3 {
            color: #333;
            margin-bottom: 20px;
            font-size: 20px;
        }

        .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }

        .feature-item {
            display: flex;
            align-items: start;
        }

        .feature-icon {
            color: #667eea;
            font-size: 24px;
            margin-right: 12px;
        }

        .feature-text {
            color: #555;
            line-height: 1.5;
        }

        .note {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin-top: 20px;
            border-radius: 4px;
            color: #856404;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            color: #999;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎰 金沙国际自动下注脚本</h1>
        <p class="subtitle">智能牌路识别 · 自动激活下注 · 实时状态追踪</p>

        <div class="bookmarklet-zone">
            <h2>📌 拖动下方按钮到浏览器书签栏</h2>
            <a href="${bookmarkletCode}" class="bookmarklet-link">🚀 运行脚本</a>
            <p style="color: white; margin-top: 15px; font-size: 14px;">提示：拖动按钮到书签栏，然后在目标网站点击即可运行</p>
        </div>

        <div class="instructions">
            <h3>📖 使用说明</h3>
            <div class="step">
                <div class="step-number">0</div>
                <div class="step-content">
                    <strong>打开书签栏：</strong>如果书签栏未显示，按快捷键 <code>Ctrl + Shift + B</code>（Windows）或 <code>Cmd + Shift + B</code>（Mac）
                </div>
            </div>
            <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                    <strong>拖拽书签：</strong>按住上方的 "🚀 运行脚本" 按钮，拖动到浏览器书签栏并释放
                </div>
            </div>
            <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                    <strong>访问网站：</strong>打开 <code>http://zzxxyy.shop/</code> 并登录
                </div>
            </div>
            <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                    <strong>启动脚本：</strong>点击书签栏中的 "🚀 运行脚本" 书签，面板会出现在页面右上角
                </div>
            </div>
            <div class="step">
                <div class="step-number">4</div>
                <div class="step-content">
                    <strong>配置牌路：</strong>在预设组或自定义牌路中填写金额、勾选"启用"，等待自动激活和下注
                </div>
            </div>

            <div class="note">
                <strong>⚠️ 注意：</strong>书签在浏览器中是永久保存的，只需要安装一次。如果脚本有更新，重新拖拽一次即可覆盖。
            </div>
        </div>

        <div class="features">
            <h3>✨ 功能特性</h3>
            <div class="feature-list">
                <div class="feature-item">
                    <div class="feature-icon">🎯</div>
                    <div class="feature-text">智能识别历史牌路，自动激活下注时机</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🤖</div>
                    <div class="feature-text">根据游戏阶段自动执行下注操作</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">📊</div>
                    <div class="feature-text">实时显示激活状态和指针位置</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🔄</div>
                    <div class="feature-text">结果验证，匹配则推进，不匹配则重置</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🎮</div>
                    <div class="feature-text">支持预设组和自定义牌路</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">♻️</div>
                    <div class="feature-text">循环牌路模式，自动重复下注</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>🤖 Generated with Claude Code</p>
            <p style="margin-top: 5px;">© 2025 金沙国际自动下注系统</p>
        </div>
    </div>
</body>
</html>`;

// 写入文件
fs.writeFileSync('install.html', htmlTemplate);
console.log('✅ 安装页面已生成: install.html');
console.log('📦 文件大小:', (htmlTemplate.length / 1024).toFixed(2), 'KB');
console.log('');
console.log('📌 使用方法:');
console.log('   1. 用浏览器打开 install.html');
console.log('   2. 拖动按钮到书签栏即可');
