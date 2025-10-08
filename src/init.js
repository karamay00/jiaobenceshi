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
