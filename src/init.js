// ========== 初始化和事件绑定 ==========

// 清空下注数据（仅保留开奖历史用于牌路匹配）
function clearBettingData() {
  // 1. 清空日志和输赢历史
  window.logs = [];
  window.winLoseHistory = [];

  // 2. 完全重置霸天虎状态
  window.bthStatus = {
    period: '',
    result: '',
    resultNumber: '',
    status: '',
    winLose: 0,
    totalScore: 0,
    time: '',
    gamePhase: ''
  };

  // 3. 重置所有牌路状态
  for (let patternId in window.patternStates) {
    const state = window.patternStates[patternId];
    state.isActivated = false;
    state.justActivated = false;
    state.activeRowIndex = -1;
    state.currentPointer = -1;
    updatePatternUI(patternId, state);
  }

  // 4. 更新面板显示
  updatePanel();
}

// 清空所有数据（历史、状态、牌路）
function clearAllData() {
  window.gameHistory = [];
  clearBettingData();
  console.log('[清空数据] 已清空历史和所有牌路状态');
}

// 新增牌路按钮事件
document.getElementById('add-pattern').addEventListener('click', () => createPattern());

// 清空牌路按钮事件
document.getElementById('clear-history').addEventListener('click', () => {
  clearAllData();
});

// 玩家昵称确认按钮事件
document.getElementById('player-name-confirm').addEventListener('click', () => {
  const input = document.getElementById('player-name-input');
  const button = document.getElementById('player-name-confirm');
  const newName = input.value.trim();

  if (newName) {
    window.playerName = newName;
    savePlayerName(newName);
    console.log('%c昵称已更新为: ' + newName, 'color: green; font-weight: bold');

    // 视觉反馈：按钮变色并显示"已保存"
    const originalText = button.textContent;
    const originalBg = button.style.background;
    button.textContent = '已保存';
    button.style.background = '#2196F3';

    // 1秒后恢复
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = originalBg;
    }, 1000);
  } else {
    console.log('%c昵称不能为空', 'color: red');

    // 视觉反馈：按钮闪红色
    const originalBg = button.style.background;
    button.style.background = '#f44336';
    setTimeout(() => {
      button.style.background = originalBg;
    }, 500);
  }
});

// 关闭面板按钮事件
document.getElementById('close-panel').addEventListener('click', () => {
  document.getElementById('custom-panel').style.display = 'none';
  console.log('%c面板已隐藏，所有数据已保留。再次点击书签可重新显示面板。', 'color: orange');
});

// 折叠/展开面板功能
const toggleBtn = document.getElementById('toggle-panel');
const panelHeader = document.getElementById('panel-header');

// 添加拖拽功能（mousedown 监听器）
if (panelHeader && window.dragStart) {
  panelHeader.addEventListener('mousedown', window.dragStart);
}

// 阻止收起按钮的 click 事件在拖动后触发（使用 capture 阶段确保优先执行）
toggleBtn.addEventListener('click', (e) => {
  if (window.hasMoved) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    window.hasMoved = false;
    return false;
  }
}, true);

// 折叠/展开切换功能
toggleBtn.addEventListener('click', (e) => {
  const panel = document.getElementById('custom-panel');

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

// 监听下注策略切换
document.getElementById('betting-strategy').addEventListener('change', (e) => {
  const strategy = e.target.value;
  if (strategy === 'sequential') {
    window.smartMerge = false;  // 顺序下注
    console.log('%c[策略切换] 顺序下注', 'color: cyan');
  } else if (strategy === 'both-bet-big') {
    window.smartMerge = true;   // 庄闲同时出现下大
    console.log('%c[策略切换] 庄闲同时出现下大', 'color: cyan');
  }
});

// 监听自动/手动模式切换
document.querySelectorAll('input[name="betting-mode"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    const mode = e.target.value; // 'auto' 或 'manual'
    window.bettingMode = mode;
    window.mockBetting = (mode === 'manual'); // 手动模式开启模拟下注

    // 根据模式自动调整延迟配置
    if (mode === 'manual') {
      window.initialBetDelay = 15000;  // 15秒延迟
      window.betInterval = 3000;       // 3秒间隔
      console.log('%c[配置切换] 手动模式: 延迟15秒, 间隔3秒', 'color: cyan');
    } else {
      window.initialBetDelay = 10000;  // 10秒延迟
      window.betInterval = 2500;       // 2.5秒间隔
      console.log('%c[配置切换] 自动模式: 延迟10秒, 间隔2.5秒', 'color: cyan');
    }

    console.log(`%c[模式切换] ${mode === 'auto' ? '自动模式' : '手动模式'}`, 'color: orange; font-weight: bold');
    console.log(`%c[模式切换] mockBetting = ${window.mockBetting}`, 'color: orange');

    // 清空下注数据，保留开奖历史
    clearBettingData();
    console.log('[模式切换] 已清空下注数据，保留开奖历史');
  });
});

// 初始化牌路：尝试加载保存的配置，如果没有则创建默认配置
const savedData = loadPatterns();
if (savedData && savedData.patterns && savedData.patterns.length > 0) {
  // 恢复保存的配置
  window.patternIdCounter = savedData.nextId || savedData.patterns.length;
  console.log('[初始化] patternIdCounter 设置为:', window.patternIdCounter);

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
  createPresetPatternGroup(PRESET_CONFIGS[2]);
  createPresetPatternGroup(PRESET_CONFIGS[3]);
  createPresetPatternGroup(PRESET_CONFIGS[4]);
  createPresetPatternGroup(PRESET_CONFIGS[5]);
  console.log('[初始化] 已创建默认预设组');
}

// 恢复面板位置
const savedPosition = loadPanelPosition();
if (savedPosition) {
  const panel = document.getElementById('custom-panel');
  panel.style.right = 'auto';
  panel.style.left = savedPosition.x + 'px';
  panel.style.top = savedPosition.y + 'px';
  console.log('[初始化] 已恢复面板位置 x:', savedPosition.x, 'y:', savedPosition.y);
}
