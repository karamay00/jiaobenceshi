(function () {
// ========== Console 拦截和全局状态初始化 ==========

// 检查面板是否已经存在
const existingPanel = document.getElementById('custom-panel');
if (existingPanel) {
  // 如果面板已存在，切换显示状态
  if (existingPanel.style.display === 'none') {
    existingPanel.style.display = 'block';
    console.log('%c面板已重新显示', 'color: green');
  } else {
    console.log('%c面板已存在，无需重复创建', 'color: orange');
  }
  return; // 退出脚本，不重复执行
}

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

        // 立即检查是否包含 url 字段并解析游戏阶段
        if (a.url) {
          parseGamePhase(a);
        }

        // 立即检查是否是开奖消息并解析
        if (a.msg && Array.isArray(a.msg) && a.msg[0] && a.msg[0].includes('期结果')) {
          setTimeout(() => parseDataAndDisplay(a), 100); // 延迟100ms解析，确保已添加到logs
        }
      } catch (e) {
        oldLog('[无法序列化对象]', a);
      }
    }
  });

  // 保持原始输出
  oldLog.apply(console, args);
};

oldLog('%c已开启 console.log 对象捕获，数据保存在 window.logs', 'color: green');

// 初始化全局状态
window.gameHistory = [];      // 存储开奖历史
window.patternStates = {};    // 管理所有牌路的激活状态

// 保存最新的霸天虎状态
window.bthStatus = {
  period: '',
  result: '',
  resultNumber: '', // 结果后面的数字（如"閒6"中的"6"）
  status: '',
  winLose: 0,
  totalScore: 0,
  time: '',
  gamePhase: '' // 游戏阶段：可以下注 / 已封盘
};


// ========== 配置保存和加载 ==========

// 牌路ID计数器
let patternIdCounter = 0;

// 保存所有牌路配置到 localStorage
function savePatterns() {
  const patterns = [];

  // 遍历所有牌路状态
  for (let patternId in window.patternStates) {
    const state = window.patternStates[patternId];

    if (state.type === 'preset') {
      // 预设组
      const inputRow = document.getElementById(`input-row-${patternId}`);
      const checkbox = document.getElementById(`enable-${patternId}`);

      if (!inputRow) continue;

      const amounts = [];
      for (let i = 0; i < inputRow.children.length; i++) {
        amounts.push(parseInt(inputRow.children[i].value) || 0);
      }

      patterns.push({
        id: parseInt(patternId),
        type: 'preset',
        configIndex: state.configIndex || 0,
        amounts: amounts,
        enabled: checkbox ? checkbox.checked : false
      });
    } else {
      // 自定义牌路
      const inputRow = document.getElementById(`input-row-custom-${patternId}`);
      const selectRow = document.getElementById(`select-row-custom-${patternId}`);
      const checkbox = document.getElementById(`enable-custom-${patternId}`);

      if (!inputRow || !selectRow) continue;

      const columns = [];
      for (let i = 0; i < inputRow.children.length; i++) {
        columns.push({
          amount: parseInt(inputRow.children[i].value) || 0,
          betType: selectRow.children[i].value
        });
      }

      patterns.push({
        id: parseInt(patternId),
        type: 'custom',
        columns: columns,
        enabled: checkbox ? checkbox.checked : false
      });
    }
  }

  const data = {
    nextId: patternIdCounter,
    patterns: patterns
  };

  localStorage.setItem('batian_patterns', JSON.stringify(data));
  console.log('[保存配置] 已保存', patterns.length, '个牌路');
}

// 从 localStorage 加载牌路配置
function loadPatterns() {
  try {
    const saved = localStorage.getItem('batian_patterns');
    if (!saved) return null;

    const data = JSON.parse(saved);
    console.log('[加载配置] 找到', data.patterns.length, '个牌路');
    return data;
  } catch (e) {
    console.error('[加载配置] 解析失败:', e);
    return null;
  }
}


// ========== UI 面板和组件 ==========

// 小面板的 HTML 结构
const panelHtml = `
  <div id="custom-panel" style="position: fixed; top: 20px; right: 20px; width: 630px; height: 600px; background: rgba(128, 128, 128, 0.6); color: black; padding: 15px; border-radius: 10px; z-index: 9999; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 2px solid #4CAF50; padding-bottom: 8px;">
      <button id="toggle-panel" style="width: 25px; height: 25px; background: #2196F3; color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 16px; font-weight: bold; line-height: 1; padding: 0; flex-shrink: 0;">▼</button>
      <h3 id="panel-title" style="margin: 0; flex: 1; text-align: center;">霸天虎面板</h3>
      <button id="close-panel" style="width: 25px; height: 25px; background: #f44336; color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 16px; font-weight: bold; line-height: 1; padding: 0; flex-shrink: 0;">×</button>
    </div>
    <div id="panel-content">
      <div id="bth-status" style="background: rgba(255,255,255,0.08); padding: 10px; border-radius: 5px; margin-bottom: 10px; font-size: 13px; display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
        <div>🎮 <strong>游戏：</strong><span id="game-phase">-</span></div>
        <div>📊 <strong>期数：</strong><span id="period">-</span></div>
        <div>🎲 <strong>结果：</strong><span id="game-result">-</span></div>
        <div>💰 <strong>状态：</strong><span id="status">-</span></div>
        <div>📈 <strong>本期：</strong><span id="win-lose">-</span></div>
        <div>🏆 <strong>总分：</strong><span id="total-score">-</span></div>
        <div style="grid-column: 1 / -1; font-size: 11px; color: black;">🕐 <span id="update-time">-</span></div>
      </div>
      <button id="add-pattern" style="width: 100%; padding: 8px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">新增牌路并下注</button>
      <div id="pattern-container" style="margin-top: 10px; max-height: 340px; overflow-y: auto; background: rgba(255,255,255,0.03); padding: 5px; border-radius: 5px;"></div>
    </div>
  </div>
`;

// 插入面板到页面中
document.body.insertAdjacentHTML('beforeend', panelHtml);

// 隐藏数字输入框的上下箭头（spinner）和折叠面板样式
const style = document.createElement('style');
style.textContent = `
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* 收起状态的样式 */
  #custom-panel.collapsed {
    width: 40px !important;
    height: 40px !important;
    padding: 0 !important;
    border-radius: 50% !important;
  }

  #custom-panel.collapsed #panel-content,
  #custom-panel.collapsed #panel-title,
  #custom-panel.collapsed #close-panel {
    display: none !important;
  }

  #custom-panel.collapsed > div:first-child {
    border: none !important;
    margin: 0 !important;
    padding: 0 !important;
    justify-content: center !important;
  }

  #custom-panel.collapsed #toggle-panel {
    width: 40px !important;
    height: 40px !important;
    font-size: 18px !important;
  }
`;
document.head.appendChild(style);

// 更新面板内容显示
function updatePanel() {
  // 更新霸天虎状态
  const bth = window.bthStatus;

  // 更新游戏阶段
  const gamePhaseSpan = document.getElementById('game-phase');
  gamePhaseSpan.textContent = bth.gamePhase || '-';
  // 根据游戏阶段设置颜色
  if (bth.gamePhase === '可以下注') {
    gamePhaseSpan.style.color = '#4CAF50';
    gamePhaseSpan.style.fontWeight = 'bold';
  } else if (bth.gamePhase === '已封盘') {
    gamePhaseSpan.style.color = '#f44336';
    gamePhaseSpan.style.fontWeight = 'bold';
  } else {
    gamePhaseSpan.style.color = '#fff';
    gamePhaseSpan.style.fontWeight = 'normal';
  }

  document.getElementById('period').textContent = bth.period || '-';
  document.getElementById('game-result').textContent = (bth.result || '-') + (bth.resultNumber || '');

  const statusSpan = document.getElementById('status');
  statusSpan.textContent = bth.status || '-';
  // 根据状态设置颜色
  if (bth.status === '赢了') {
    statusSpan.style.color = '#4CAF50';
    statusSpan.style.fontWeight = 'bold';
  } else if (bth.status === '输了') {
    statusSpan.style.color = '#f44336';
    statusSpan.style.fontWeight = 'bold';
  } else if (bth.status === '未下注') {
    statusSpan.style.color = '#FFC107';
    statusSpan.style.fontWeight = 'normal';
  } else {
    statusSpan.style.color = '#fff';
    statusSpan.style.fontWeight = 'normal';
  }

  const winLoseSpan = document.getElementById('win-lose');
  if (bth.winLose > 0) {
    winLoseSpan.textContent = `+${bth.winLose}`;
    winLoseSpan.style.color = '#4CAF50';
  } else if (bth.winLose < 0) {
    winLoseSpan.textContent = bth.winLose;
    winLoseSpan.style.color = '#f44336';
  } else {
    winLoseSpan.textContent = bth.winLose || '-';
    winLoseSpan.style.color = '#fff';
  }

  document.getElementById('total-score').textContent = bth.totalScore || '-';
  document.getElementById('update-time').textContent = bth.time || '-';
}

// 定时更新面板内容
setInterval(updatePanel, 5000); // 每5秒更新一次面板

// ========== 通用 UI 组件 ==========

// 创建数字输入框
function createAmountInput(value = '') {
  const input = document.createElement('input');
  input.type = 'number';
  input.style.cssText = 'width: 40px; padding: 3px; font-size: 11px; border-radius: 3px; border: 1px solid #666; background: #333; color: white; text-align: center; flex-shrink: 0; -moz-appearance: textfield;';
  input.placeholder = '0';
  if (value) input.value = value;
  return input;
}

// 创建下拉菜单（庄/闲）
function createBetSelect(defaultValue = '庄', isEditable = true) {
  const select = document.createElement('select');
  select.style.cssText = 'width: 40px; padding: 3px; font-size: 11px; border-radius: 3px; border: 1px solid #ccc; color: white; flex-shrink: 0;';
  select.innerHTML = '<option value="庄">庄</option><option value="閒">閒</option>';
  select.value = defaultValue;
  select.style.background = defaultValue === '庄' ? 'red' : 'blue';

  if (!isEditable) {
    select.disabled = true;
  }

  select.onchange = function() {
    this.style.background = this.value === '庄' ? 'red' : 'blue';
  };

  return select;
}

// 创建一列（包含输入框和多个下拉菜单）
function createBettingColumn(selectValues = ['庄'], isEditable = true) {
  const column = document.createElement('div');
  column.style.cssText = 'display: flex; flex-direction: column; gap: 3px;';

  column.appendChild(createAmountInput());

  selectValues.forEach(value => {
    column.appendChild(createBetSelect(value, isEditable));
  });

  return column;
}


// ========== 自动下注核心功能 ==========

// 下注功能
function placeBet(message) {
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
    console.log('[下注结果]', d);
  })
  .catch(error => console.error('下注请求出错:', error));
}

// 动态获取牌路的总列数
function getTotalColumns(patternId, state) {
  if (state.type === 'preset') {
    const inputRow = document.getElementById(`input-row-${patternId}`);
    return inputRow ? inputRow.children.length : 0;
  } else {
    const inputRow = document.getElementById(`input-row-custom-${patternId}`);
    return inputRow ? inputRow.children.length : 0;
  }
}

// 更新游戏历史
function updateGameHistory(result) {
  if (!result) return;
  window.gameHistory.push(result);
  console.log(`[历史更新] 新增结果: ${result}, 当前历史: ${window.gameHistory.join(',')}`);
}

// 更新牌路UI显示（激活状态和指针位置）
function updatePatternUI(patternId, state) {
  let statusElement;

  if (state.type === 'preset') {
    // 预设组：在累计盈亏后面添加状态显示
    const profitSpan = document.getElementById(`profit-preset-${patternId}`);
    if (!profitSpan) return;

    statusElement = profitSpan.parentElement.querySelector('.activation-status');
    if (!statusElement) {
      statusElement = document.createElement('span');
      statusElement.className = 'activation-status';
      statusElement.style.cssText = 'margin-left: 10px; font-size: 11px;';
      profitSpan.parentElement.appendChild(statusElement);
    }
  } else {
    // 自定义牌路：在标题处显示
    const patternDiv = document.getElementById(patternId);
    if (!patternDiv) return;

    const titleDiv = patternDiv.querySelector('div:first-child');
    statusElement = titleDiv.querySelector('.activation-status');
    if (!statusElement) {
      statusElement = document.createElement('span');
      statusElement.className = 'activation-status';
      statusElement.style.cssText = 'margin-left: 10px; font-size: 11px;';
      titleDiv.appendChild(statusElement);
    }
  }

  // 更新显示内容
  if (state.isActivated) {
    const rowInfo = state.type === 'preset' ? ` 行${state.activeRowIndex + 1}` : '';
    statusElement.textContent = `[已激活${rowInfo} - 第${state.currentPointer}列]`;
    statusElement.style.color = '#4CAF50';
  } else {
    statusElement.textContent = '[未激活]';
    statusElement.style.color = '#fff';
  }
}

// 尝试激活预设组
function tryActivatePresetGroup(groupId, state) {
  const rowCount = state.rowCount;

  // 从上到下遍历每一行
  for (let row = 0; row < rowCount; row++) {
    const selectRow = document.getElementById(`select-row-${groupId}-${row}`);
    const inputRow = document.getElementById(`input-row-${groupId}`);

    if (!selectRow || !inputRow) continue;

    // 找到该行第一个数字不为0的列（入场点）
    let entryPoint = -1;
    for (let col = 0; col < inputRow.children.length; col++) {
      const amount = parseInt(inputRow.children[col].value) || 0;
      if (amount !== 0) {
        entryPoint = col;
        break;
      }
    }

    // 如果没有入场点，跳过这一行
    if (entryPoint === -1) continue;

    // 检查历史是否匹配入场点之前的所有下拉菜单值
    const requiredHistory = [];
    for (let col = 0; col < entryPoint; col++) {
      requiredHistory.push(selectRow.children[col].value);
    }

    // 历史长度不够，跳过
    if (window.gameHistory.length < requiredHistory.length) continue;

    // 对比最近的N条历史
    const recentHistory = window.gameHistory.slice(-requiredHistory.length);
    const isMatch = requiredHistory.every((val, idx) => val === recentHistory[idx]);

    if (isMatch) {
      // 激活该行
      state.isActivated = true;
      state.justActivated = true; // 标记为刚激活，本期不推进
      state.activeRowIndex = row;
      state.currentPointer = entryPoint;
      console.log(`[激活] 预设组 ${groupId} 第 ${row} 行激活，指针在第 ${entryPoint} 列`);
      updatePatternUI(groupId, state);
      return; // 激活第一个满足的行后退出
    }
  }
}

// 尝试激活自定义牌路
function tryActivateCustomPattern(patternId, state) {
  const inputRow = document.getElementById(`input-row-custom-${patternId}`);
  const selectRow = document.getElementById(`select-row-custom-${patternId}`);

  if (!inputRow || !selectRow) return;

  // 找到第一个数字不为0的列
  let entryPoint = -1;
  for (let col = 0; col < inputRow.children.length; col++) {
    const amount = parseInt(inputRow.children[col].value) || 0;
    if (amount !== 0) {
      entryPoint = col;
      break;
    }
  }

  if (entryPoint === -1) return;

  // 检查历史匹配
  const requiredHistory = [];
  for (let col = 0; col < entryPoint; col++) {
    requiredHistory.push(selectRow.children[col].value);
  }

  if (window.gameHistory.length < requiredHistory.length) return;

  const recentHistory = window.gameHistory.slice(-requiredHistory.length);
  const isMatch = requiredHistory.every((val, idx) => val === recentHistory[idx]);

  if (isMatch) {
    state.isActivated = true;
    state.justActivated = true; // 标记为刚激活，本期不推进
    state.currentPointer = entryPoint;
    console.log(`[激活] 自定义牌路 ${patternId} 激活，指针在第 ${entryPoint} 列`);
    updatePatternUI(patternId, state);
  }
}

// 检查所有未激活的牌路是否满足激活条件
function checkActivation() {
  for (let patternId in window.patternStates) {
    const state = window.patternStates[patternId];

    // 跳过已激活的牌路
    if (state.isActivated) continue;

    // 检查是否勾选
    const checkbox = state.type === 'preset'
      ? document.getElementById(`enable-${patternId}`)
      : document.getElementById(`enable-custom-${patternId}`);
    if (!checkbox || !checkbox.checked) continue;

    // 尝试激活
    if (state.type === 'preset') {
      tryActivatePresetGroup(patternId, state);
    } else {
      tryActivateCustomPattern(patternId, state);
    }
  }
}

// 自动下注
function autoPlaceBets() {
  console.log('[自动下注] 开始检查所有牌路...');

  for (let patternId in window.patternStates) {
    const state = window.patternStates[patternId];

    // 必须已激活
    if (!state.isActivated) continue;

    // 必须勾选
    const checkbox = state.type === 'preset'
      ? document.getElementById(`enable-${patternId}`)
      : document.getElementById(`enable-custom-${patternId}`);
    if (!checkbox || !checkbox.checked) continue;

    // 获取当前列的金额和下注类型
    let amount, betType;

    if (state.type === 'preset') {
      const inputRow = document.getElementById(`input-row-${patternId}`);
      const selectRow = document.getElementById(`select-row-${patternId}-${state.activeRowIndex}`);

      if (!inputRow || !selectRow || state.currentPointer >= inputRow.children.length) continue;

      amount = parseInt(inputRow.children[state.currentPointer].value) || 0;
      betType = selectRow.children[state.currentPointer].value;
    } else {
      const inputRow = document.getElementById(`input-row-custom-${patternId}`);
      const selectRow = document.getElementById(`select-row-custom-${patternId}`);

      if (!inputRow || !selectRow || state.currentPointer >= inputRow.children.length) continue;

      amount = parseInt(inputRow.children[state.currentPointer].value) || 0;
      betType = selectRow.children[state.currentPointer].value;
    }

    // 金额为0，跳过
    if (amount === 0) {
      console.log(`[跳过下注] ${patternId} 第 ${state.currentPointer} 列金额为0`);
      continue;
    }

    // 执行下注
    const message = `${betType}${amount}`;
    console.log(`[执行下注] ${patternId} 下注: ${message}`);
    // placeBet(message); // 已注释：测试时不实际发送下注请求
  }
}

// 推进指针逻辑
function advancePointers(result) {
  for (let patternId in window.patternStates) {
    const state = window.patternStates[patternId];

    // 只处理已激活的牌路
    if (!state.isActivated) continue;

    // 跳过刚激活的牌路（本期不推进）
    if (state.justActivated) {
      state.justActivated = false; // 清除标记，下期开始正常推进
      console.log(`[跳过推进] ${patternId} 刚激活，本期不推进指针`);
      continue;
    }

    // 获取当前指针列的下注类型
    let expectedBetType;

    if (state.type === 'preset') {
      const selectRow = document.getElementById(`select-row-${patternId}-${state.activeRowIndex}`);
      if (!selectRow || state.currentPointer >= selectRow.children.length) continue;

      expectedBetType = selectRow.children[state.currentPointer].value;
    } else {
      const selectRow = document.getElementById(`select-row-custom-${patternId}`);
      if (!selectRow || state.currentPointer >= selectRow.children.length) continue;

      expectedBetType = selectRow.children[state.currentPointer].value;
    }

    // 判断是否匹配
    if (result === expectedBetType) {
      // 匹配：指针右移
      state.currentPointer++;

      // 获取总列数
      const totalColumns = getTotalColumns(patternId, state);

      // 循环回第一列
      if (state.currentPointer >= totalColumns) {
        state.currentPointer = 0;
        console.log(`[推进] ${patternId} 指针循环回第 0 列`);
      } else {
        console.log(`[推进] ${patternId} 指针推进到第 ${state.currentPointer} 列`);
      }

      updatePatternUI(patternId, state);
    } else {
      // 不匹配：取消激活
      console.log(`[取消激活] ${patternId} 结果不匹配，预期 ${expectedBetType}，实际 ${result}`);
      state.isActivated = false;
      state.activeRowIndex = -1;
      state.currentPointer = -1;
      updatePatternUI(patternId, state);
    }
  }
}


// ========== 预设牌路管理 ==========

// 预设牌路配置（定义1组基础模式，创建时会自动复制）
const PRESET_CONFIGS = [
  {
    name: '预设组1',
    patterns: [
      ['庄','庄','閒'],
      ['庄','閒','庄'],
      ['閒','庄','庄']
    ]
  },
  {
    name: '预设组2',
    patterns: [
      ['庄','庄','庄','閒'],
      ['庄','庄','閒','庄'],
      ['庄','閒','庄','庄'],
      ['閒','庄','庄','庄']
    ]
  }
];

// 创建预设牌路组
function createPresetPatternGroup(config, initialData = null) {
  const { name, patterns } = config;
  const groupId = initialData ? initialData.id : patternIdCounter++;
  if (!initialData) patternIdCounter = groupId + 1;
  const container = document.getElementById('pattern-container');

  const rowCount = patterns.length;              // 行数
  const basePatternColCount = patterns[0].length; // 基础模式的列数

  // 自动复制一次基础模式
  const duplicatedPatterns = patterns.map(row => [...row, ...row]);
  const initialColCount = duplicatedPatterns[0].length; // 初始列数（已复制）

  // 创建组容器
  const groupDiv = document.createElement('div');
  groupDiv.id = `preset-group-${groupId}`;
  groupDiv.style.cssText = 'margin-bottom: 8px; background: rgba(0, 0, 0, 0.5); padding: 10px; border-radius: 5px;';

  // 创建表格容器
  const tableContainer = document.createElement('div');
  tableContainer.style.cssText = 'display: flex; flex-direction: column; gap: 3px; overflow-x: auto;';

  // 第1行：数字输入框
  const inputRow = document.createElement('div');
  inputRow.id = `input-row-${groupId}`;
  inputRow.style.cssText = 'display: flex; gap: 3px;';

  // 第2到(rowCount+1)行：下拉菜单
  const selectRows = [];
  for (let i = 0; i < rowCount; i++) {
    const row = document.createElement('div');
    row.id = `select-row-${groupId}-${i}`;
    row.style.cssText = 'display: flex; gap: 3px;';
    selectRows.push(row);
  }

  // 初始列数（使用复制后的模式）
  for (let col = 0; col < initialColCount; col++) {
    // 添加输入框
    inputRow.appendChild(createAmountInput());

    // 添加下拉菜单（预设值，不可编辑）
    for (let row = 0; row < rowCount; row++) {
      selectRows[row].appendChild(createBetSelect(duplicatedPatterns[row][col], false));
    }
  }

  // 组装表格
  tableContainer.appendChild(inputRow);
  selectRows.forEach(row => tableContainer.appendChild(row));

  // 底部控制栏
  const controlBar = document.createElement('div');
  controlBar.style.cssText = 'margin-top: 10px; display: flex; align-items: center; gap: 10px; color: white; font-size: 12px;';
  controlBar.innerHTML = `
    <span style="flex: 1;">本组累计盈亏：<span id="profit-preset-${groupId}" style="font-weight: bold; color: #4CAF50;">0</span></span>
    <button id="add-col-${groupId}" style="padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">增</button>
    <button id="delete-col-${groupId}" style="padding: 5px 10px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 14px;" disabled>减</button>
    <input type="checkbox" id="enable-${groupId}" style="width: 20px; height: 20px; cursor: pointer;">
    <label for="enable-${groupId}" style="cursor: pointer;">启用</label>
  `;

  groupDiv.appendChild(tableContainer);
  groupDiv.appendChild(controlBar);
  container.appendChild(groupDiv);

  // 如果有初始数据，添加额外的列并填充金额
  if (initialData && initialData.amounts) {
    const targetColCount = initialData.amounts.length;

    // 添加额外的列
    while (inputRow.children.length < targetColCount) {
      addColumnToPresetGroup(groupId, rowCount, basePatternColCount, patterns);
    }

    // 填充金额值
    for (let i = 0; i < inputRow.children.length && i < initialData.amounts.length; i++) {
      inputRow.children[i].value = initialData.amounts[i];
    }

    // 设置复选框状态
    const checkbox = document.getElementById(`enable-${groupId}`);
    if (checkbox) {
      checkbox.checked = initialData.enabled || false;
    }
  }

  // 绑定事件
  document.getElementById(`add-col-${groupId}`).addEventListener('click', () => {
    addColumnToPresetGroup(groupId, rowCount, basePatternColCount, patterns);
    savePatterns(); // 自动保存
  });

  document.getElementById(`delete-col-${groupId}`).addEventListener('click', () => {
    deleteLastColumn(groupId, rowCount, initialColCount, basePatternColCount);
    savePatterns(); // 自动保存
  });

  document.getElementById(`enable-${groupId}`).addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    console.log(`预设组 ${groupId} ${isEnabled ? '已启用' : '已停用'}`);
    togglePresetGroupInteraction(groupId, isEnabled);
    savePatterns(); // 自动保存
  });

  // 为所有输入框添加自动保存
  const inputs = inputRow.querySelectorAll('input[type="number"]');
  inputs.forEach(input => {
    input.addEventListener('change', () => savePatterns());
  });

  // 初始化牌路状态
  const configIndex = PRESET_CONFIGS.findIndex(c => c.name === config.name);
  window.patternStates[groupId] = {
    type: 'preset',
    configIndex: configIndex,
    isActivated: false,
    activeRowIndex: -1,
    currentPointer: -1,
    rowCount: rowCount
  };
  updatePatternUI(groupId, window.patternStates[groupId]);
}

// 动态添加列到预设组（一次添加1列）
function addColumnToPresetGroup(groupId, rowCount, basePatternColCount, patterns) {
  const inputRow = document.getElementById(`input-row-${groupId}`);

  // 添加输入框
  const newInput = createAmountInput();
  newInput.addEventListener('change', () => savePatterns());
  inputRow.appendChild(newInput);

  // 计算当前新增列的索引位置
  const currentColIndex = inputRow.children.length - 1;
  // 对基础模式列数取余，得到应使用的基础模式索引
  const patternIndex = currentColIndex % basePatternColCount;

  // 为每一行添加下拉菜单（使用计算出的基础模式值，不可编辑）
  for (let row = 0; row < rowCount; row++) {
    const selectRow = document.getElementById(`select-row-${groupId}-${row}`);
    selectRow.appendChild(createBetSelect(patterns[row][patternIndex], false));
  }

  // 启用删除按钮
  const deleteBtn = document.getElementById(`delete-col-${groupId}`);
  if (deleteBtn) {
    deleteBtn.disabled = false;
  }
}

// 删除预设组的最后1列
function deleteLastColumn(groupId, rowCount, initialColCount, basePatternColCount) {
  const inputRow = document.getElementById(`input-row-${groupId}`);

  // 检查是否有可删除的列
  if (inputRow.children.length <= initialColCount) {
    return; // 不能删除初始列
  }

  // 删除输入框的最后一个
  if (inputRow.lastChild) {
    inputRow.removeChild(inputRow.lastChild);
  }

  // 删除每行下拉菜单的最后一个
  for (let row = 0; row < rowCount; row++) {
    const selectRow = document.getElementById(`select-row-${groupId}-${row}`);
    if (selectRow && selectRow.lastChild) {
      selectRow.removeChild(selectRow.lastChild);
    }
  }

  // 如果删除后只剩初始列数，禁用删除按钮
  if (inputRow.children.length <= initialColCount) {
    const deleteBtn = document.getElementById(`delete-col-${groupId}`);
    if (deleteBtn) {
      deleteBtn.disabled = true;
    }
  }
}

// 锁定/解锁预设组的交互
function togglePresetGroupInteraction(groupId, isDisabled) {
  // 禁用/启用所有输入框
  const inputRow = document.getElementById(`input-row-${groupId}`);
  if (inputRow) {
    Array.from(inputRow.children).forEach(input => {
      input.disabled = isDisabled;
    });
  }

  // 禁用/启用增加和删除按钮
  const addBtn = document.getElementById(`add-col-${groupId}`);
  const deleteBtn = document.getElementById(`delete-col-${groupId}`);
  if (addBtn) addBtn.disabled = isDisabled;
  if (deleteBtn && inputRow && inputRow.children.length > 1) {
    deleteBtn.disabled = isDisabled;
  }
}


// ========== 自定义牌路管理 ==========

// 创建牌路元素
function createPattern(initialData = null) {
  const patternId = initialData ? initialData.id : patternIdCounter++;
  if (!initialData) patternIdCounter = patternId + 1;
  const container = document.getElementById('pattern-container');

  const patternDiv = document.createElement('div');
  patternDiv.id = `pattern-${patternId}`;
  patternDiv.style.cssText = 'margin-bottom: 8px; background: rgba(0, 0, 0, 0.5); padding: 10px; border-radius: 5px;';

  // 创建标题
  const titleDiv = document.createElement('div');
  titleDiv.style.cssText = 'color: white; font-size: 12px; margin-bottom: 5px;';
  titleDiv.innerHTML = `本牌路累计盈亏：<span id="profit-${patternId}" style="font-weight: bold; color: #4CAF50;">0</span>`;

  // 创建表格容器
  const tableContainer = document.createElement('div');
  tableContainer.style.cssText = 'display: flex; flex-direction: column; gap: 3px; overflow-x: auto;';

  // 第一行：数字输入框（初始1列）
  const row1 = document.createElement('div');
  row1.id = `input-row-custom-${patternId}`;
  row1.style.cssText = 'display: flex; gap: 3px;';
  row1.appendChild(createAmountInput());

  // 第二行：下拉菜单（初始1列）
  const row2 = document.createElement('div');
  row2.id = `select-row-custom-${patternId}`;
  row2.style.cssText = 'display: flex; gap: 3px;';
  row2.appendChild(createBetSelect('庄', true));

  tableContainer.appendChild(row1);
  tableContainer.appendChild(row2);

  // 底部控制栏
  const controlBar = document.createElement('div');
  controlBar.style.cssText = 'margin-top: 10px; display: flex; align-items: center; gap: 10px; color: white; font-size: 12px;';
  controlBar.innerHTML = `
    <button id="add-col-custom-${patternId}" style="padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">增</button>
    <button id="delete-col-custom-${patternId}" style="padding: 5px 10px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 14px;" disabled>减</button>
    <input type="checkbox" id="enable-custom-${patternId}" style="width: 20px; height: 20px; cursor: pointer;">
    <label for="enable-custom-${patternId}" style="cursor: pointer;">启用</label>
    <button id="delete-pattern-${patternId}" style="margin-left: auto; padding: 5px 10px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-weight: bold;">×删除牌路</button>
  `;

  patternDiv.appendChild(titleDiv);
  patternDiv.appendChild(tableContainer);
  patternDiv.appendChild(controlBar);
  container.appendChild(patternDiv);

  // 如果有初始数据，添加额外的列并填充值
  if (initialData && initialData.columns) {
    const targetColCount = initialData.columns.length;

    // 添加额外的列
    while (row1.children.length < targetColCount) {
      addColumnToCustomPattern(patternId);
    }

    // 填充金额和下注类型
    for (let i = 0; i < initialData.columns.length; i++) {
      const col = initialData.columns[i];
      if (row1.children[i]) row1.children[i].value = col.amount;
      if (row2.children[i]) row2.children[i].value = col.betType;
    }

    // 设置复选框状态
    const checkbox = document.getElementById(`enable-custom-${patternId}`);
    if (checkbox) {
      checkbox.checked = initialData.enabled || false;
    }
  }

  // 绑定事件
  document.getElementById(`add-col-custom-${patternId}`).addEventListener('click', () => {
    addColumnToCustomPattern(patternId);
    savePatterns(); // 自动保存
  });

  document.getElementById(`delete-col-custom-${patternId}`).addEventListener('click', () => {
    deleteLastColumnFromCustomPattern(patternId);
    savePatterns(); // 自动保存
  });

  document.getElementById(`enable-custom-${patternId}`).addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    console.log(`自定义牌路 ${patternId} ${isEnabled ? '已启用' : '已停用'}`);
    toggleCustomPatternInteraction(patternId, isEnabled);
    savePatterns(); // 自动保存
  });

  document.getElementById(`delete-pattern-${patternId}`).addEventListener('click', () => {
    patternDiv.remove();
    delete window.patternStates[`pattern-${patternId}`];
    savePatterns(); // 自动保存
  });

  // 为所有输入框和下拉菜单添加自动保存
  const inputs = row1.querySelectorAll('input[type="number"]');
  const selects = row2.querySelectorAll('select');
  inputs.forEach(input => {
    input.addEventListener('change', () => savePatterns());
  });
  selects.forEach(select => {
    select.addEventListener('change', () => savePatterns());
  });

  // 初始化牌路状态
  window.patternStates[`pattern-${patternId}`] = {
    type: 'custom',
    isActivated: false,
    activeRowIndex: -1,
    currentPointer: -1,
    rowCount: 1
  };
  updatePatternUI(`pattern-${patternId}`, window.patternStates[`pattern-${patternId}`]);
}

// 为自定义牌路添加一列
function addColumnToCustomPattern(patternId) {
  const inputRow = document.getElementById(`input-row-custom-${patternId}`);
  const selectRow = document.getElementById(`select-row-custom-${patternId}`);

  // 添加输入框
  const newInput = createAmountInput();
  newInput.addEventListener('change', () => savePatterns());
  inputRow.appendChild(newInput);

  // 添加下拉菜单
  const newSelect = createBetSelect('庄', true);
  newSelect.addEventListener('change', () => savePatterns());
  selectRow.appendChild(newSelect);

  // 启用删除按钮
  const deleteBtn = document.getElementById(`delete-col-custom-${patternId}`);
  if (deleteBtn) {
    deleteBtn.disabled = false;
  }
}

// 删除自定义牌路的最后一列
function deleteLastColumnFromCustomPattern(patternId) {
  const inputRow = document.getElementById(`input-row-custom-${patternId}`);
  const selectRow = document.getElementById(`select-row-custom-${patternId}`);

  // 检查是否只剩1列
  if (inputRow.children.length <= 1) {
    return; // 不能删除最后一列
  }

  // 删除输入框的最后一个
  if (inputRow.lastChild) {
    inputRow.removeChild(inputRow.lastChild);
  }

  // 删除下拉菜单的最后一个
  if (selectRow.lastChild) {
    selectRow.removeChild(selectRow.lastChild);
  }

  // 如果删除后只剩1列，禁用删除按钮
  if (inputRow.children.length <= 1) {
    const deleteBtn = document.getElementById(`delete-col-custom-${patternId}`);
    if (deleteBtn) {
      deleteBtn.disabled = true;
    }
  }
}

// 锁定/解锁自定义牌路的交互
function toggleCustomPatternInteraction(patternId, isDisabled) {
  // 禁用/启用所有输入框
  const inputRow = document.getElementById(`input-row-custom-${patternId}`);
  if (inputRow) {
    Array.from(inputRow.children).forEach(input => {
      input.disabled = isDisabled;
    });
  }

  // 禁用/启用所有下拉菜单
  const selectRow = document.getElementById(`select-row-custom-${patternId}`);
  if (selectRow) {
    Array.from(selectRow.children).forEach(select => {
      select.disabled = isDisabled;
    });
  }

  // 禁用/启用增加、删除列按钮
  const addBtn = document.getElementById(`add-col-custom-${patternId}`);
  const deleteBtn = document.getElementById(`delete-col-custom-${patternId}`);
  if (addBtn) addBtn.disabled = isDisabled;
  if (deleteBtn && inputRow && inputRow.children.length > 1) {
    deleteBtn.disabled = isDisabled;
  }

  // 禁用/启用删除牌路按钮
  const deletePatternBtn = document.getElementById(`delete-pattern-${patternId}`);
  if (deletePatternBtn) deletePatternBtn.disabled = isDisabled;
}


// ========== 游戏数据解析 ==========

// 解析 URL 字段，识别游戏阶段
function parseGamePhase(logData) {
  if (!logData || !logData.url) return;

  const url = logData.url;

  if (url.includes('/jiang/开局.png') || url.includes('/jiang/开宝.png')) {
    window.bthStatus.gamePhase = '可以下注';
    window.bthStatus.time = new Date().toLocaleTimeString();
    console.log(`%c游戏状态: 可以下注`, 'color: green; font-weight: bold');
    updatePanel();

    // 自动下注
    autoPlaceBets();
  } else if (url.includes('/jiang/封盘.png')) {
    window.bthStatus.gamePhase = '已封盘';
    window.bthStatus.time = new Date().toLocaleTimeString();
    console.log(`%c游戏状态: 已封盘`, 'color: red; font-weight: bold');
    updatePanel();
  }
}

// 解析和展示最新的期号和结果，并且显示"霸天虎"的输赢情况
function parseDataAndDisplay(logData) {
  // 如果没有传入数据，使用最新的一条
  const data = logData || (window.logs.length ? window.logs[window.logs.length - 1] : null);
  if (!data) return;

  if (data.msg && Array.isArray(data.msg)) {
    // 获取期号和结果 - 只解析包含"期结果"的消息
    const periodResult = data.msg[0]; // 期号和结果
    if (!periodResult.includes('期结果')) return; // 如果不是期数结果消息，跳过

    const periodMatch = periodResult.split('：');
    const period = periodMatch[0]; // 期号
    const resultRaw = periodMatch[1]; // 结果
    const result = resultRaw ? resultRaw.charAt(0) : resultRaw; // 只取第一个字（閒 或 庄）
    const numberMatch = resultRaw ? resultRaw.match(/\d+/) : null; // 提取数字
    const resultNumber = numberMatch ? numberMatch[0] : '';
    console.log(`第 ${period} 期结果: ${result}${resultNumber}`);

    // 更新状态
    window.bthStatus.period = period;
    window.bthStatus.result = result;
    window.bthStatus.resultNumber = resultNumber;
    window.bthStatus.time = new Date().toLocaleTimeString();

    // 查找霸天虎信息
    let foundBTH = false;
    data.msg.forEach(m => {
      if (m.includes('(霸天虎)')) {
        foundBTH = true;
        // 匹配格式：(霸天虎)[总分] [本期输赢] 或 (霸天虎)[总分]
        const matches = m.match(/\[([^\]]+)\]/g); // 匹配所有 [xxx]
        if (matches && matches.length >= 2) {
          // 有两个数字，第二个是本期输赢
          const totalScore = parseInt(matches[0].replace(/[\[\]]/g, ''), 10);
          const winLose = parseInt(matches[1].replace(/[\[\]]/g, ''), 10);
          const status = winLose > 0 ? '赢了' : winLose < 0 ? '输了' : '平局';
          console.log(`霸天虎 ${status}, 本期: ${winLose}, 总分: ${totalScore}`);

          window.bthStatus.status = status;
          window.bthStatus.winLose = winLose;
          window.bthStatus.totalScore = totalScore;
        } else if (matches && matches.length === 1) {
          // 只有一个数字，是总分，本期没有输赢
          const totalScore = parseInt(matches[0].replace(/[\[\]]/g, ''), 10);
          console.log(`霸天虎 本期未下注, 总分: ${totalScore}`);

          window.bthStatus.status = '未下注';
          window.bthStatus.winLose = 0;
          window.bthStatus.totalScore = totalScore;
        }
      }
    });

    // 如果消息里没有霸天虎，说明这期没下注
    if (!foundBTH) {
      console.log(`霸天虎 本期未下注`);
      window.bthStatus.status = '未下注';
      window.bthStatus.winLose = 0;
      // 保持上一期的总分
    }

    // 立即更新面板
    updatePanel();

    // 自动下注功能：更新历史、检查激活、推进指针
    updateGameHistory(window.bthStatus.result);
    checkActivation();
    advancePointers(window.bthStatus.result);
  }
}

// 每当新数据进来时，触发解析和显示
setInterval(parseDataAndDisplay, 5000); // 每隔5秒检查并解析日志


// ========== 初始化和事件绑定 ==========

// 新增牌路按钮事件
document.getElementById('add-pattern').addEventListener('click', createPattern);

// 关闭面板按钮事件
document.getElementById('close-panel').addEventListener('click', () => {
  document.getElementById('custom-panel').style.display = 'none';
  console.log('%c面板已隐藏，所有数据已保留。再次点击书签可重新显示面板。', 'color: orange');
});

// 折叠/展开面板功能
document.getElementById('toggle-panel').addEventListener('click', () => {
  const panel = document.getElementById('custom-panel');
  const toggleBtn = document.getElementById('toggle-panel');

  if (panel.classList.contains('collapsed')) {
    // 展开面板
    panel.classList.remove('collapsed');
    toggleBtn.textContent = '▼';
    console.log('%c面板已展开', 'color: green');
  } else {
    // 收起面板
    panel.classList.add('collapsed');
    toggleBtn.textContent = '▲';
    console.log('%c面板已收起', 'color: orange');
  }
});

// 初始化牌路：尝试加载保存的配置，如果没有则创建默认配置
const savedData = loadPatterns();
if (savedData && savedData.patterns && savedData.patterns.length > 0) {
  // 恢复保存的配置
  patternIdCounter = savedData.nextId || savedData.patterns.length;

  savedData.patterns.forEach(pattern => {
    if (pattern.type === 'preset') {
      const config = PRESET_CONFIGS[pattern.configIndex || 0];
      if (config) {
        createPresetPatternGroup(config, pattern);
      }
    } else if (pattern.type === 'custom') {
      createPattern(pattern);
    }
  });

  console.log('[初始化] 已恢复', savedData.patterns.length, '个牌路');
} else {
  // 创建默认的预设组
  createPresetPatternGroup(PRESET_CONFIGS[0]);
  createPresetPatternGroup(PRESET_CONFIGS[1]);
  console.log('[初始化] 已创建默认预设组');
}


})();