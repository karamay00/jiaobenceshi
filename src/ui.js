// ========== UI 面板和组件 ==========

// 小面板的 HTML 结构
const panelHtml = `
  <div id="custom-panel" style="position: fixed; top: 20px; right: 20px; height: 95vh; background: rgba(128, 128, 128, 0.6); color: black; padding: 15px; border-radius: 10px; z-index: 9999; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; flex-direction: column;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 2px solid #4CAF50; padding-bottom: 8px;">
      <button id="toggle-panel" style="width: 25px; height: 25px; min-width: 25px; min-height: 25px; max-width: 25px; max-height: 25px; background: #2196F3; color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 16px; font-weight: bold; line-height: 1; padding: 0; flex: none;">▼</button>
      <h3 id="panel-title" style="margin: 0; flex: 1; text-align: center;">霸天虎面板</h3>
      <button id="close-panel" style="width: 25px; height: 25px; min-width: 25px; min-height: 25px; max-width: 25px; max-height: 25px; background: #f44336; color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 16px; font-weight: bold; line-height: 1; padding: 0; flex: none;">×</button>
    </div>
    <div id="panel-content" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
      <div id="bth-status" style="background: rgba(255,255,255,0.08); padding: 10px; border-radius: 5px; margin-bottom: 10px; font-size: 13px; display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
        <div>🎮 <strong>游戏：</strong><span id="game-phase">-</span></div>
        <div>📊 <strong>结果：</strong><span id="period">-</span><span id="game-result">-</span></div>
        <div>💰 <strong>状态：</strong><span id="status">-</span></div>
        <div>📈 <strong>本期：</strong><span id="win-lose">-</span></div>
        <div>🏆 <strong>总分：</strong><span id="total-score">-</span></div>
        <div>🕐 <strong>更新：</strong><span id="update-time">-</span></div>
        <div style="grid-column: 1 / -1; font-size: 11px; color: black; overflow-x: auto; white-space: nowrap;">📜 <strong>历史：</strong><span id="game-history">-</span></div>
      </div>
      <div style="display: flex; gap: 5px; margin-bottom: 10px;">
        <button id="add-pattern" style="flex: 1; padding: 8px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">新增牌路并下注</button>
        <button id="clear-history" style="flex: 1; padding: 8px; background: #FF9800; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">清空牌路</button>
      </div>
      <div id="pattern-container" style="flex: 1; overflow-y: scroll; background: rgba(255,255,255,0.03); padding: 5px; border-radius: 5px;"></div>
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

  document.getElementById('period').textContent = (bth.period ? '第' + bth.period + '期 ' : '-');
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

  // 更新历史牌路
  const historySpan = document.getElementById('game-history');
  if (window.gameHistory && window.gameHistory.length > 0) {
    historySpan.textContent = window.gameHistory.join(' ');
  } else {
    historySpan.textContent = '-';
  }
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
