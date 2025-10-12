// ========== UI 面板和组件 ==========

// 小面板的 HTML 结构
const panelHtml = `
  <div id="custom-panel" style="position: fixed; top: 20px; right: 20px; height: 95vh; background: #808080; color: black; padding: 15px; border-radius: 10px; z-index: 9999; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; flex-direction: column;">
    <div id="panel-header" style="position: relative; margin-bottom: 10px; border-bottom: 2px solid #4CAF50; padding-bottom: 8px; height: 25px; cursor: move;">
      <button id="toggle-panel" style="position: absolute; left: 0; top: 0; width: 25px; height: 25px; background: #2196F3; color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 16px; font-weight: bold; line-height: 1; padding: 0;">▼</button>
      <span id="brand-name" style="position: absolute; left: 35px; top: 0; color: black; font-weight: bold; font-size: 16px; line-height: 25px;">永利自动投注分析器</span>
      <div id="panel-title" style="width: fit-content; margin: 0 auto; cursor: move; user-select: none;">
        <input type="text" id="player-name-input" value="${window.playerName}" style="width: 80px; padding: 2px 5px; font-size: 14px; border-radius: 3px; border: 1px solid #ccc; text-align: center; vertical-align: middle;">
        <button id="player-name-confirm" style="padding: 2px 8px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer; font-weight: bold; font-size: 12px; vertical-align: middle; margin-left: 5px;">确认</button>
      </div>
      <select id="betting-strategy" style="position: absolute; right: 35px; top: 0; width: 140px; height: 25px; padding: 0 5px; background: #2196F3; color: white; border: 1px solid #1976D2; border-radius: 5px; cursor: pointer; font-size: 12px; font-weight: bold;">
        <option value="sequential">顺序下注</option>
        <option value="both-bet-big">庄闲同时出现下大</option>
      </select>
      <button id="close-panel" style="position: absolute; right: 0; top: 0; width: 25px; height: 25px; background: #f44336; color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 16px; font-weight: bold; line-height: 1; padding: 0;">×</button>
    </div>
    <div id="panel-content" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0;">
      <div id="bth-status" style="background: rgba(255,255,255,1); padding: 10px; border-radius: 5px; margin-bottom: 10px; font-size: 13px; display: grid; grid-template-columns: 180px 150px auto auto 1fr; gap: 5px;">
        <div>📊 <strong>结果：</strong><span id="period">-</span><span id="game-result"></span></div>
        <div>🏆 <strong>总分：</strong><span id="total-score">-</span></div>
        <div style="grid-column: 3; grid-row: 1 / 3; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 5px; padding-left: 10px;">
          <div id="update-time" style="font-size: 10px; color: black; display: none;">-</div>
          <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; color: black; font-size: 13px; font-weight: bold;">
            <input type="radio" name="betting-mode" value="auto" style="cursor: pointer; width: 16px; height: 16px;">
            自动
          </label>
          <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; color: black; font-size: 13px; font-weight: bold;">
            <input type="radio" name="betting-mode" value="manual" checked style="cursor: pointer; width: 16px; height: 16px;">
            手动
          </label>
        </div>
        <div style="grid-column: 4; grid-row: 1 / 3; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding-left: 10px;">
          <select id="manual-bet-select" style="padding: 5px 10px; background: red; color: white; border: 1px solid #1976D2; border-radius: 5px; cursor: pointer; font-size: 13px; font-weight: bold;">
            <option value="庄">庄</option>
            <option value="閒">閒</option>
            <option value="庄6">庄6</option>
            <option value="閒6">閒6</option>
          </select>
          <button id="manual-bet-confirm" style="padding: 5px 15px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 13px; font-weight: bold;">开奖并开盘</button>
        </div>
        <div style="grid-column: 1;">💰 <strong>状态：</strong><span id="status">-</span></div>
        <div>🎮 <strong>游戏：</strong><span id="game-phase">-</span></div>
        <div style="grid-column: 1 / -1; font-size: 13px; color: black; display: flex; align-items: center; gap: 5px;">
          <span style="flex-shrink: 0;">💰 <strong>输赢：</strong></span>
          <span id="win-lose-history" style="flex: 1; overflow-x: auto; white-space: nowrap; border: 1px solid black; padding: 2px 5px; border-radius: 3px;">-</span>
          <span id="total-score-display" style="flex-shrink: 0; width: 75px; text-align: right; font-weight: bold; border: 1px solid black; padding: 2px 5px; border-radius: 3px; color: black;">-</span>
        </div>
        <div style="grid-column: 1 / -1; font-size: 13px; color: black; display: flex; align-items: center; gap: 5px;">
          <span style="flex-shrink: 0;">📜 <strong>历史：</strong></span>
          <span id="game-history" style="flex: 1; overflow-x: auto; white-space: nowrap; border: 1px solid black; padding: 2px 5px; border-radius: 3px;">-</span>
        </div>
      </div>
      <div style="display: flex; gap: 5px; margin-bottom: 10px;">
        <button id="add-pattern" style="width: 15%; padding: 8px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">新增牌路并下注</button>
        <button id="clear-history" style="width: 15%; padding: 8px; background: #FF9800; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-left: auto;">清空历史记录</button>
      </div>
      <div id="pattern-container" style="flex: 1; overflow-y: auto; background: rgba(255,255,255,0.03); padding: 5px; border-radius: 5px; min-height: 0;"></div>
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

  /* 响应式宽度 */
  #custom-panel {
    width: 70%; /* 默认大屏幕 */
    min-width: 320px;
  }

  @media (max-width: 1199px) {
    #custom-panel {
      width: 85%; /* 中等屏幕 */
    }
  }

  @media (max-width: 767px) {
    #custom-panel {
      width: 95%; /* 小屏幕 */
    }
  }

  /* 收起状态的样式 */
  #custom-panel.collapsed {
    width: 40px !important;
    height: 40px !important;
    min-width: 40px !important;
    min-height: 40px !important;
    padding: 0 !important;
    border-radius: 50% !important;
  }

  #custom-panel.collapsed #panel-content,
  #custom-panel.collapsed #panel-title,
  #custom-panel.collapsed #close-panel,
  #custom-panel.collapsed #betting-strategy,
  #custom-panel.collapsed #brand-name {
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
    min-width: 40px !important;
    min-height: 40px !important;
    max-width: 40px !important;
    max-height: 40px !important;
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

  document.getElementById('period').textContent = (bth.period ? bth.period + '期 ' : '-');
  document.getElementById('game-result').textContent = (bth.result || '') + (bth.resultNumber || '');

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

  document.getElementById('total-score').textContent = bth.totalScore || '-';

  // 更新时间显示（仅在自动模式显示）
  const updateTimeElement = document.getElementById('update-time');
  if (window.bettingMode === 'auto') {
    updateTimeElement.style.display = 'block';
    updateTimeElement.textContent = bth.time || '-';
  } else {
    updateTimeElement.style.display = 'none';
  }

  // 更新输赢历史
  const winLoseHistorySpan = document.getElementById('win-lose-history');
  if (window.winLoseHistory && window.winLoseHistory.length > 0) {
    // 格式化输赢历史：正数加+显示绿色，负数显示红色，0显示黑色
    const formattedHistory = window.winLoseHistory.map(val => {
      let color = 'black';
      let text = val.toString();
      if (val > 0) {
        color = '#4CAF50';
        text = `+${val}`;
      } else if (val < 0) {
        color = '#f44336';
      }
      return `<span style="color: ${color};">${text}</span>`;
    }).join(' ');
    winLoseHistorySpan.innerHTML = formattedHistory;
    // 自动滚动到最右边，显示最新记录
    winLoseHistorySpan.scrollLeft = winLoseHistorySpan.scrollWidth;

    // 计算输赢历史的总和并显示
    const winLoseSum = window.winLoseHistory.reduce((sum, val) => sum + val, 0);
    document.getElementById('total-score-display').textContent = winLoseSum;
  } else {
    winLoseHistorySpan.textContent = '-';
    document.getElementById('total-score-display').textContent = '-';
  }

  // 更新历史牌路
  const historySpan = document.getElementById('game-history');
  if (window.gameHistory && window.gameHistory.length > 0) {
    // 格式化历史牌路：庄显示红色，閒显示蓝色
    const formattedHistory = window.gameHistory.map(val => {
      const color = val === '庄' ? 'red' : 'blue';
      return `<span style="color: ${color};">${val}</span>`;
    }).join(' ');
    historySpan.innerHTML = formattedHistory;
    // 自动滚动到最右边，显示最新记录
    historySpan.scrollLeft = historySpan.scrollWidth;
  } else {
    historySpan.textContent = '-';
  }
}

// 定时更新面板内容
setInterval(updatePanel, 5000); // 每5秒更新一次面板

// ========== 面板拖拽功能 ==========

// 拖拽状态
let isDragging = false;
let hasMoved = false; // 是否发生了移动
let dragStartTime = 0; // 记录按下时间
let dragStartX = 0; // 记录按下时的X坐标
let dragStartY = 0; // 记录按下时的Y坐标
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

// 获取面板和标题元素（声明为全局变量，供拖拽函数使用）
window.dragPanel = document.getElementById('custom-panel');
window.dragPanelHeader = document.getElementById('panel-header');

// 暴露拖拽函数给全局，供 init.js 调用
window.dragStart = function(e) {
  const panel = window.dragPanel;

  // 如果点击的是输入框或按钮或下拉菜单，不触发拖拽
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT') {
    return; // 直接返回，不阻止默认行为
  }

  // 阻止默认行为，防止文本选择或其他干扰
  e.preventDefault();

  // 获取当前面板位置
  const rect = panel.getBoundingClientRect();

  initialX = e.clientX - rect.left;
  initialY = e.clientY - rect.top;

  isDragging = true;
  hasMoved = false; // 重置移动标志
  dragStartTime = Date.now(); // 记录按下时间
  dragStartX = e.clientX; // 记录按下时的X坐标
  dragStartY = e.clientY; // 记录按下时的Y坐标

  // 添加全局事件监听
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
};

function drag(e) {
  if (isDragging) {
    e.preventDefault();

    const panel = window.dragPanel;

    // 计算鼠标移动距离
    const moveX = Math.abs(e.clientX - dragStartX);
    const moveY = Math.abs(e.clientY - dragStartY);
    const moveDistance = Math.sqrt(moveX * moveX + moveY * moveY);

    // 只有移动距离超过5像素才认为是拖动
    if (moveDistance > 5) {
      hasMoved = true;
    }

    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;

    // 边界检测
    const panelWidth = panel.offsetWidth;
    const panelHeight = panel.offsetHeight;
    const maxX = window.innerWidth - panelWidth;
    const maxY = window.innerHeight - panelHeight;

    currentX = Math.max(0, Math.min(currentX, maxX));
    currentY = Math.max(0, Math.min(currentY, maxY));

    xOffset = currentX;
    yOffset = currentY;

    // 更新面板位置（切换到 left 定位）
    panel.style.right = 'auto';
    panel.style.left = currentX + 'px';
    panel.style.top = currentY + 'px';
  }
}

function dragEnd(e) {
  if (isDragging) {
    isDragging = false;

    // 将移动标志暴露给全局，供 click 事件检查
    window.hasMoved = hasMoved;

    // 移除全局事件监听
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', dragEnd);

    // 如果发生了移动，保存位置到 localStorage
    if (hasMoved && typeof savePanelPosition === 'function') {
      savePanelPosition(xOffset, yOffset);
    }
  }
}

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
