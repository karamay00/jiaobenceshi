// 客户端脚本 - 负责接收服务器消息并注入到 console

let historyResults = [];
let consoleMessages = [];
let rawLogMessages = [];

// 添加消息到页面显示
function addConsoleMessage(msg) {
  const output = document.getElementById('console-output');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'console-message';

  const time = new Date().toLocaleTimeString();
  const timeSpan = document.createElement('span');
  timeSpan.className = 'console-time';
  timeSpan.textContent = `[${time}] `;

  const contentSpan = document.createElement('span');
  contentSpan.className = 'console-content';

  // 格式化消息
  if (msg.url) {
    // 游戏阶段消息
    if (msg.url.includes('开局') || msg.url.includes('开宝')) {
      contentSpan.innerHTML = '<span style="color: #4CAF50; font-weight: bold;">✅ 开局 - 可以下注</span>';
    } else if (msg.url.includes('封盘')) {
      contentSpan.innerHTML = '<span style="color: #ff9800; font-weight: bold;">🔒 封盘</span>';
    }
  } else if (msg.msg && Array.isArray(msg.msg)) {
    // 开奖消息
    const firstLine = msg.msg[0];
    if (firstLine.includes('期结果')) {
      contentSpan.innerHTML = `<span style="color: #2196F3; font-weight: bold;">🎲 ${firstLine}</span>`;
    } else {
      contentSpan.textContent = JSON.stringify(msg);
    }
  } else {
    contentSpan.textContent = JSON.stringify(msg);
  }

  messageDiv.appendChild(timeSpan);
  messageDiv.appendChild(contentSpan);
  output.appendChild(messageDiv);

  // 自动滚动到底部
  output.scrollTop = output.scrollHeight;

  // 限制消息数量（保留最近100条）
  consoleMessages.push(messageDiv);
  if (consoleMessages.length > 100) {
    const oldMsg = consoleMessages.shift();
    oldMsg.remove();
  }
}

// 清空控制台
function clearConsole() {
  const output = document.getElementById('console-output');
  output.innerHTML = '';
  consoleMessages = [];
  console.log('%c[页面控制台] 已清空', 'color: orange');
}

// 添加原始Log到页面显示
function addRawLog(msg) {
  const output = document.getElementById('raw-log-output');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'raw-log-message';

  const time = new Date().toLocaleTimeString();
  const timeSpan = document.createElement('span');
  timeSpan.className = 'console-time';
  timeSpan.textContent = `[${time}] `;

  const contentPre = document.createElement('pre');
  contentPre.className = 'raw-log-content';

  // 格式化对象显示
  const formatted = formatObject(msg, 0);
  contentPre.textContent = formatted;

  messageDiv.appendChild(timeSpan);
  messageDiv.appendChild(contentPre);
  output.appendChild(messageDiv);

  // 自动滚动到底部
  output.scrollTop = output.scrollHeight;

  // 限制消息数量（保留最近50条）
  rawLogMessages.push(messageDiv);
  if (rawLogMessages.length > 50) {
    const oldMsg = rawLogMessages.shift();
    oldMsg.remove();
  }
}

// 格式化对象（类似Chrome控制台的显示方式）
function formatObject(obj, indent) {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';

  const type = typeof obj;

  if (type === 'string') {
    return `"${obj}"`;
  }

  if (type === 'number' || type === 'boolean') {
    return String(obj);
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const spaces = '  '.repeat(indent);
    const innerSpaces = '  '.repeat(indent + 1);
    const items = obj.map(item => `${innerSpaces}${formatObject(item, indent + 1)}`).join(',\n');
    return `[\n${items}\n${spaces}]`;
  }

  if (type === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    const spaces = '  '.repeat(indent);
    const innerSpaces = '  '.repeat(indent + 1);
    const items = keys.map(key => {
      const value = formatObject(obj[key], indent + 1);
      return `${innerSpaces}${key}: ${value}`;
    }).join('\n');
    return `{\n${items}\n${spaces}}`;
  }

  return String(obj);
}

// 清空原始Log
function clearRawLog() {
  const output = document.getElementById('raw-log-output');
  output.innerHTML = '';
  rawLogMessages = [];
  console.log('%c[原始Log] 已清空', 'color: orange');
}

// 轮询获取消息
async function pollMessages() {
  try {
    const response = await fetch('/api/messages');
    const data = await response.json();

    // 将消息注入到 console 和页面
    data.messages.forEach(msg => {
      console.log(msg);
      addConsoleMessage(msg);
      addRawLog(msg); // 添加原始log显示

      // 如果是开奖消息，记录到历史
      if (msg.msg && msg.msg[0] && msg.msg[0].includes('期结果')) {
        const match = msg.msg[0].match(/：(.+)/);
        if (match) {
          const result = match[1].charAt(0); // 取第一个字
          historyResults.push(result);
          updateHistoryDisplay();
        }
      }
    });
  } catch (error) {
    console.error('[轮询错误]', error);
  }
}

// 更新历史显示
function updateHistoryDisplay() {
  const historyList = document.getElementById('history-list');
  const html = historyResults.map(r => {
    const color = r === '庄' ? 'red' : 'blue';
    return `<span class="history-item" style="color: ${color}">${r}</span>`;
  }).join(' ');
  historyList.innerHTML = html || '暂无历史';
}

// 轮询游戏状态
async function pollStatus() {
  try {
    const response = await fetch('/api/status');
    const data = await response.json();

    // 更新状态显示
    document.getElementById('period').textContent = `期号: ${data.period}`;
    document.getElementById('phase').textContent = `状态: ${getPhaseText(data.phase)}`;
    document.getElementById('result').textContent = data.result ? `结果: ${data.result}` : '结果: -';

    // 更新下注记录
    updateBetRecords(data.betRecords);
  } catch (error) {
    console.error('[状态轮询错误]', error);
  }
}

function getPhaseText(phase) {
  const map = {
    'waiting': '⏳ 等待中',
    'betting': '✅ 可以下注',
    'closed': '🔒 已封盘',
    'drawing': '🎲 开奖中'
  };
  return map[phase] || phase;
}

// 更新下注记录
function updateBetRecords(records) {
  const container = document.getElementById('bet-records');
  if (!records || records.length === 0) {
    container.innerHTML = '<p class="no-data">暂无下注</p>';
    return;
  }

  const html = records.slice(-10).reverse().map(r => {
    const color = r.type === '庄' ? 'red' : 'blue';
    return `<div class="bet-record">
      <span class="bet-period">${r.period}期</span>
      <span class="bet-type" style="color: ${color}">${r.type}</span>
      <span class="bet-amount">${r.amount}</span>
      <span class="bet-time">${r.time}</span>
    </div>`;
  }).join('');

  container.innerHTML = html;
}

// 设置模式
async function setMode(mode) {
  try {
    await fetch('/api/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setMode', data: { mode } })
    });
    console.log('[模式切换]', mode);
  } catch (error) {
    console.error('[设置模式错误]', error);
  }
}

// 设置牌路
async function setPattern() {
  const input = document.getElementById('pattern-input');
  const pattern = input.value.trim();

  if (!pattern) {
    alert('请输入牌路，例如：庄,庄,閒,庄,庄,閒');
    return;
  }

  try {
    await fetch('/api/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setPattern', data: { pattern } })
    });
    console.log('[设置牌路]', pattern);
    alert('牌路设置成功！');
  } catch (error) {
    console.error('[设置牌路错误]', error);
  }
}

// 手动开奖
async function manualDraw(result) {
  try {
    await fetch('/api/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'manualDraw', data: { result } })
    });
    console.log('[手动开奖]', result);
  } catch (error) {
    console.error('[手动开奖错误]', error);
  }
}

// 设置周期时长
async function setCycleTime() {
  const input = document.getElementById('cycle-time');
  const seconds = parseInt(input.value);

  if (isNaN(seconds) || seconds < 5) {
    alert('周期时长至少5秒！');
    return;
  }

  try {
    await fetch('/api/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setCycleTime', data: { time: seconds * 1000 } })
    });
    console.log('[设置周期]', seconds + '秒');
    alert('周期时长设置成功，下一期生效！');
  } catch (error) {
    console.error('[设置周期错误]', error);
  }
}

// 暂停游戏
async function pauseGame() {
  try {
    await fetch('/api/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause' })
    });
    console.log('%c[游戏控制] ⏸️  已停止发送消息', 'color: orange; font-weight: bold');
    alert('游戏已暂停，停止发送消息');
  } catch (error) {
    console.error('[暂停游戏错误]', error);
  }
}

// 重启游戏
async function restartGame() {
  if (!confirm('确定要重新开始吗？这将清空所有数据并从第1期重新开始！')) {
    return;
  }

  try {
    await fetch('/api/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'restart' })
    });
    console.log('%c[游戏控制] 🔄 游戏已重启，从第1期重新开始', 'color: green; font-weight: bold');

    // 清空本地历史
    historyResults = [];
    updateHistoryDisplay();

    alert('游戏已重启，从第1期重新开始！');
  } catch (error) {
    console.error('[重启游戏错误]', error);
  }
}

// 模式切换事件
document.getElementById('mode-select').addEventListener('change', (e) => {
  setMode(e.target.value);
});

// 启动轮询
setInterval(pollMessages, 1000);  // 每1秒轮询消息
setInterval(pollStatus, 1000);    // 每1秒轮询状态

// 初始化
console.log('%c🎮 游戏测试服务器已连接', 'color: green; font-weight: bold; font-size: 16px');
console.log('%c💡 点击书签栏的"运行脚本"开始测试自动下注功能', 'color: blue');
