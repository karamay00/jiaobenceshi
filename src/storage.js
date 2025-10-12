// ========== 配置保存和加载 ==========

// 牌路ID计数器（全局变量，确保模块间可访问）
window.patternIdCounter = 0;

// 保存所有牌路配置到 localStorage
function savePatterns() {
  const patterns = [];

  // 遍历所有牌路状态
  for (let patternId in window.patternStates) {
    const state = window.patternStates[patternId];

    // 从 patternId (格式: "preset-0" 或 "custom-0") 中提取数字ID
    const numericId = parseInt(patternId.split('-')[1]);
    const inputRow = document.getElementById(`input-row-${patternId}`);
    const checkbox = document.getElementById(`enable-${patternId}`);

    if (!inputRow) continue;

    if (state.type === 'preset') {
      // 预设组
      const amounts = [];
      for (let i = 0; i < inputRow.children.length; i++) {
        amounts.push(parseInt(inputRow.children[i].value) || 0);
      }

      patterns.push({
        id: numericId,
        type: 'preset',
        configIndex: state.configIndex || 0,
        amounts: amounts,
        enabled: checkbox ? checkbox.checked : false
      });
    } else {
      // 自定义牌路
      const selectRow = document.getElementById(`select-row-${patternId}`);

      if (!selectRow) continue;

      const columns = [];
      for (let i = 0; i < inputRow.children.length; i++) {
        columns.push({
          amount: parseInt(inputRow.children[i].value) || 0,
          betType: selectRow.children[i].value
        });
      }

      patterns.push({
        id: numericId,
        type: 'custom',
        columns: columns,
        enabled: checkbox ? checkbox.checked : false
      });
    }
  }

  const data = {
    nextId: window.patternIdCounter,
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

// 保存面板位置到 localStorage
function savePanelPosition(x, y) {
  try {
    localStorage.setItem('batian_panel_position', JSON.stringify({ x, y }));
    console.log('[保存位置] x:', x, 'y:', y);
  } catch (e) {
    console.error('[保存位置] 失败:', e);
  }
}

// 从 localStorage 加载面板位置
function loadPanelPosition() {
  try {
    const saved = localStorage.getItem('batian_panel_position');
    if (!saved) return null;

    const position = JSON.parse(saved);
    console.log('[加载位置] x:', position.x, 'y:', position.y);
    return position;
  } catch (e) {
    console.error('[加载位置] 解析失败:', e);
    return null;
  }
}

// 保存玩家昵称到 localStorage
function savePlayerName(name) {
  try {
    localStorage.setItem('batian_player_name', name);
    console.log('[保存昵称]', name);
  } catch (e) {
    console.error('[保存昵称] 失败:', e);
  }
}

// 从 localStorage 加载玩家昵称
function loadPlayerName() {
  try {
    return localStorage.getItem('batian_player_name') || '霸天虎';
  } catch (e) {
    console.error('[加载昵称] 失败:', e);
    return '霸天虎';
  }
}
