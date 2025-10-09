// ========== 配置保存和加载 ==========

// 牌路ID计数器（全局变量，确保模块间可访问）
window.patternIdCounter = 0;

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
