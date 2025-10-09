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
    name: '预设组5',
    patterns: [
      ['閒','閒','庄'],
      ['閒','庄','閒'],
      ['庄','閒','閒']
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
  },
  {
    name: '预设组6',
    patterns: [
      ['閒','閒','閒','庄'],
      ['閒','閒','庄','閒'],
      ['閒','庄','閒','閒'],
      ['庄','閒','閒','閒']
    ]
  },
  {
    name: '预设组3',
    patterns: [
      ['庄','庄','閒','閒'],
      ['庄','閒','閒','庄'],
      ['閒','閒','庄','庄'],
      ['閒','庄','庄','閒']
    ]
  },
  {
    name: '预设组4',
    patterns: [
      ['庄','庄','庄','閒','閒','閒'],
      ['庄','庄','閒','閒','閒','庄'],
      ['庄','閒','閒','閒','庄','庄'],
      ['閒','閒','閒','庄','庄','庄'],
      ['閒','閒','庄','庄','庄','閒'],
      ['閒','庄','庄','庄','閒','閒']
    ]
  }
];

// 创建预设牌路组
function createPresetPatternGroup(config, initialData = null) {
  const { name, patterns } = config;
  const groupId = initialData ? initialData.id : window.patternIdCounter;
  if (!initialData) window.patternIdCounter++;
  const container = document.getElementById('pattern-container');

  const rowCount = patterns.length;              // 行数
  const basePatternColCount = patterns[0].length; // 基础模式的列数

  // 自动复制一次基础模式
  const duplicatedPatterns = patterns.map(row => [...row, ...row]);
  const initialColCount = duplicatedPatterns[0].length; // 初始列数（已复制）

  // 创建组容器
  const groupDiv = document.createElement('div');
  groupDiv.id = `preset-group-${groupId}`;
  groupDiv.style.cssText = 'margin-bottom: 8px; background: rgba(0, 0, 0, 0.5); padding: 2px; border-radius: 5px;';

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

  // 获取第一行前6个牌型用于预览（带颜色和描边）
  const patternPreview = duplicatedPatterns[0].slice(0, 6)
    .map(val => {
      const color = val === '庄' ? 'red' : 'blue';
      return `<span style="color: ${color}; -webkit-text-stroke: 0.7px white; text-stroke: 0.7px white;">${val}</span>`;
    })
    .join('');

  // 底部控制栏（在最左边添加折叠按钮）
  const controlBar = document.createElement('div');
  controlBar.style.cssText = 'margin-top: 10px; display: flex; align-items: center; gap: 10px; color: white; font-size: 12px;';
  controlBar.innerHTML = `
    <button id="toggle-expand-preset-${groupId}" style="width: 20px; height: 20px; background: #2196F3; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; font-weight: bold; padding: 0; flex-shrink: 0;">▼</button>
    <span style="flex: 1;">本组累计盈亏：<span id="profit-preset-${groupId}" style="font-weight: bold; color: #4CAF50;">0</span></span>
    <button id="add-col-${groupId}" style="padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">增</button>
    <button id="delete-col-${groupId}" style="padding: 5px 10px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 14px;" disabled>减</button>
    <input type="checkbox" id="enable-${groupId}" style="width: 20px; height: 20px; cursor: pointer;">
    <label for="enable-${groupId}" style="cursor: pointer;">启用</label>
  `;

  // 创建展开容器（默认显示）
  const expandedContainer = document.createElement('div');
  expandedContainer.id = `expanded-preset-${groupId}`;
  expandedContainer.style.cssText = 'display: block;';
  expandedContainer.appendChild(tableContainer);
  expandedContainer.appendChild(controlBar);

  // 创建概览容器（默认隐藏）
  const collapsedContainer = document.createElement('div');
  collapsedContainer.id = `collapsed-preset-${groupId}`;
  collapsedContainer.style.cssText = 'display: none; padding: 2px 0; color: white; font-size: 12px;';
  collapsedContainer.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <button id="toggle-collapse-preset-${groupId}" style="width: 20px; height: 20px; background: #2196F3; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; font-weight: bold; padding: 0; flex-shrink: 0;">▲</button>
      <span style="font-weight: bold;">${patternPreview}</span>
      <span id="status-collapsed-preset-${groupId}" style="color: #fff;">[未激活]</span>
      <span style="flex: 1; text-align: right;">本组累计盈亏：<span id="profit-collapsed-preset-${groupId}" style="font-weight: bold; color: #4CAF50;">0</span></span>
    </div>
  `;

  groupDiv.appendChild(expandedContainer);
  groupDiv.appendChild(collapsedContainer);
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
      // 如果已启用，则禁用交互
      if (initialData.enabled) {
        togglePresetGroupInteraction(groupId, true);
      }
    }
  }

  // 绑定折叠按钮事件
  document.getElementById(`toggle-expand-preset-${groupId}`).addEventListener('click', () => {
    const expanded = document.getElementById(`expanded-preset-${groupId}`);
    const collapsed = document.getElementById(`collapsed-preset-${groupId}`);

    // 同步盈亏数据
    const profitValue = document.getElementById(`profit-preset-${groupId}`).textContent;
    document.getElementById(`profit-collapsed-preset-${groupId}`).textContent = profitValue;
    document.getElementById(`profit-collapsed-preset-${groupId}`).style.color = document.getElementById(`profit-preset-${groupId}`).style.color;

    // 收起
    expanded.style.display = 'none';
    collapsed.style.display = 'block';
  });

  document.getElementById(`toggle-collapse-preset-${groupId}`).addEventListener('click', () => {
    const expanded = document.getElementById(`expanded-preset-${groupId}`);
    const collapsed = document.getElementById(`collapsed-preset-${groupId}`);

    // 展开
    expanded.style.display = 'block';
    collapsed.style.display = 'none';
  });

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
