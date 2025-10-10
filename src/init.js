// ========== 初始化和事件绑定 ==========

// 新增牌路按钮事件
document.getElementById('add-pattern').addEventListener('click', () => createPattern());

// 清空牌路按钮事件
document.getElementById('clear-history').addEventListener('click', () => {
  // 1. 清空历史记录
  window.gameHistory = [];
  window.logs = [];

  // 2. 重置霸天虎状态
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

  console.log('[清空牌路] 已清空历史和所有牌路状态');
});

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

// 手动下注选择器颜色切换
document.getElementById('manual-bet-select').addEventListener('change', function() {
  this.style.background = this.value === '庄' ? 'red' : 'blue';
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
