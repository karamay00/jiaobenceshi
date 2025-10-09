// ========== 自定义牌路管理 ==========

// 创建牌路元素
function createPattern(initialData = null) {
  const patternId = initialData ? initialData.id : window.patternIdCounter;
  if (!initialData) window.patternIdCounter++;
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
  console.log(`[创建牌路] patternId=${patternId}, 按钮ID=add-col-custom-${patternId}`);
  document.getElementById(`add-col-custom-${patternId}`).addEventListener('click', () => {
    console.log(`[点击增加] patternId=${patternId}`);
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
