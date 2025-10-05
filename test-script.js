const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // 有界面模式
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    userDataDir: './chrome-user-data', // 使用独立的用户数据目录，会保存登录状态
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled' // 隐藏自动化特征
    ],
    defaultViewport: null // 使用完整窗口大小
  });

  const page = await browser.newPage();

  // 监听控制台输出
  page.on('console', msg => {
    console.log('浏览器控制台:', msg.text());
  });

  // 访问实际网站
  await page.goto('http://zzxxyy.shop/', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  // 执行你的脚本
  await page.evaluate(() => {
    (function () {
      const oldLog = console.log;
      window.logs = []; // 保存捕获的对象日志

      console.log = function (...args) {
        args.forEach(a => {
          // 只处理对象，不处理 null、数组、字符串
          if (a && typeof a === 'object' && !Array.isArray(a) && a.constructor === Object) {
            try {
              const json = JSON.stringify(a);
              window.logs.push(a); // 保存对象日志
              oldLog('[JSON]', json); // 打印 JSON 格式的日志
            } catch (e) {
              oldLog('[无法序列化对象]', a);
            }
          }
        });

        // 保持原始输出
        oldLog.apply(console, args);
      };

      oldLog('%c已开启 console.log 对象捕获，数据保存在 window.logs', 'color: green');

      // 解析和展示最新的期号和结果，并且显示"霸天虎"的输赢情况
      function parseDataAndDisplay() {
        if (!window.logs.length) return;

        const latestLog = window.logs[window.logs.length - 1]; // 获取最新的一条日志

        if (latestLog.msg && Array.isArray(latestLog.msg)) {
          // 获取期号和结果
          const periodResult = latestLog.msg[0]; // 期号和结果
          const periodMatch = periodResult.split('：');
          const period = periodMatch[0]; // 期号
          const result = periodMatch[1]; // 结果
          console.log(`第 ${period} 期结果: ${result}`);

          // 提取 "霸天虎" 输赢
          latestLog.msg.forEach(m => {
            if (m.includes('(霸天虎)')) {
              const match = m.split('[');
              const amountStr = match[1].split(']')[0]; // 获取金额
              const amount = parseInt(amountStr, 10);
              const winLose = amount > 0 ? '赢了' : amount < 0 ? '输了' : '平局';
              console.log(`霸天虎 ${winLose}, 金额: ${amount}`);
            }
          });
        }
      }

      // 每当新数据进来时，触发解析和显示
      setInterval(parseDataAndDisplay, 5000); // 每隔5秒检查并解析日志

      // 小面板的 HTML 结构
      const panelHtml = `
        <div id="custom-panel" style="position: fixed; top: 20px; right: 20px; width: 200px; height: 350px; background: rgba(0, 0, 0, 0.7); color: white; padding: 10px; border-radius: 8px; z-index: 9999;">
          <h3>日志面板</h3>
          <div id="log-content" style="overflow-y: auto; height: 220px;"></div>
          <button id="clear-logs" style="width: 100%; padding: 5px; background: red; color: white; border: none; border-radius: 5px;">清理日志</button>
          <button id="place-bet" style="width: 100%; padding: 5px; background: green; color: white; border: none; border-radius: 5px; margin-top: 10px;">下注</button>
        </div>
      `;

      // 插入面板到页面中
      document.body.insertAdjacentHTML('beforeend', panelHtml);

      // 更新面板内容显示
      function updatePanel() {
        const logContent = document.getElementById('log-content');
        logContent.innerHTML = ''; // 清空现有内容

        // 仅显示最新的日志信息
        if (window.logs.length) {
          window.logs.forEach(log => {
            const logDiv = document.createElement('div');
            logDiv.style.marginBottom = '10px';
            logDiv.innerHTML = `<pre>${JSON.stringify(log, null, 2)}</pre>`;
            logContent.appendChild(logDiv);
          });
        }
      }

      // 清理日志按钮点击事件
      document.getElementById('clear-logs').addEventListener('click', () => {
        window.logs = []; // 清空 logs
        updatePanel(); // 更新面板
        console.log('%c日志已清空', 'color: red');
      });

      // 下注按钮点击事件
      document.getElementById('place-bet').addEventListener('click', () => {
        const message = '这里改成你想发送的消息'; // 在此处修改下注的消息内容
        fetch('http://zzxxyy.shop/doXiazhu.html', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            message: message
          })
        })
        .then(res => res.json())
        .then(d => {
          if (d.msg === null) d.msg = [];
          console.log(d);
        })
        .catch(error => console.error('下注请求出错:', error));
      });

      // 定时更新面板内容
      setInterval(updatePanel, 5000); // 每5秒更新一次面板
    })();
  });

  console.log('脚本已注入到实际网站，浏览器窗口已打开...');
  console.log('按 Ctrl+C 退出并关闭浏览器');

  // 检查面板是否存在
  const panelExists = await page.evaluate(() => {
    return document.getElementById('custom-panel') !== null;
  });

  console.log('面板是否创建成功:', panelExists);

  // 保持浏览器打开，直到用户手动关闭或按 Ctrl+C
  await new Promise(() => {});
})();
