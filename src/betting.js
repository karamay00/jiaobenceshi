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
  let statusElement, collapsedStatusElement;

  if (state.type === 'preset') {
    // 预设组：在累计盈亏后面添加状态显示（展开容器）
    const profitSpan = document.getElementById(`profit-preset-${patternId}`);
    if (!profitSpan) return;

    statusElement = profitSpan.parentElement.querySelector('.activation-status');
    if (!statusElement) {
      statusElement = document.createElement('span');
      statusElement.className = 'activation-status';
      statusElement.style.cssText = 'margin-left: 10px; font-size: 11px;';
      profitSpan.parentElement.appendChild(statusElement);
    }

    // 概览容器中的状态显示
    collapsedStatusElement = document.getElementById(`status-collapsed-preset-${patternId}`);
  } else {
    // 自定义牌路：在盈亏信息后面添加状态显示（展开容器）
    const profitSpan = document.getElementById(`profit-${patternId}`);
    if (!profitSpan) return;

    statusElement = profitSpan.parentElement.querySelector('.activation-status');
    if (!statusElement) {
      statusElement = document.createElement('span');
      statusElement.className = 'activation-status';
      statusElement.style.cssText = 'margin-left: 10px; font-size: 11px;';
      profitSpan.parentElement.appendChild(statusElement);
    }

    // 概览容器中的状态显示
    collapsedStatusElement = document.getElementById(`status-collapsed-custom-${patternId}`);
  }

  // 更新显示内容（展开容器和概览容器）
  if (state.isActivated) {
    const rowInfo = state.type === 'preset' ? ` 行${state.activeRowIndex + 1}` : '';
    const expandedText = `[已激活${rowInfo} - 第${state.currentPointer}列]`;
    const collapsedText = `[已激活${rowInfo} - 第${state.currentPointer}列]`;

    statusElement.textContent = expandedText;
    statusElement.style.color = '#4CAF50';

    if (collapsedStatusElement) {
      collapsedStatusElement.textContent = collapsedText;
      collapsedStatusElement.style.color = '#4CAF50';
    }
  } else {
    statusElement.textContent = '[未激活]';
    statusElement.style.color = '#fff';

    if (collapsedStatusElement) {
      collapsedStatusElement.textContent = '[未激活]';
      collapsedStatusElement.style.color = '#fff';
    }
  }

  // 高亮当前激活位置的下拉菜单
  if (state.type === 'preset') {
    // 清除该预设组所有行的高亮
    for (let row = 0; row < state.rowCount; row++) {
      const selectRow = document.getElementById(`select-row-${patternId}-${row}`);
      if (selectRow) {
        Array.from(selectRow.children).forEach(select => {
          select.style.border = '1px solid #ccc';
          select.style.boxShadow = 'none';
        });
      }
    }

    // 高亮激活行的当前列
    if (state.isActivated && state.activeRowIndex >= 0) {
      const selectRow = document.getElementById(`select-row-${patternId}-${state.activeRowIndex}`);
      const highlightIndex = Math.max(0, state.currentPointer - 1);
      if (selectRow && selectRow.children[highlightIndex]) {
        const targetSelect = selectRow.children[highlightIndex];
        targetSelect.style.border = '3px solid #FFD700';
        targetSelect.style.boxShadow = '0 0 8px #FFD700';
      }
    }
  } else {
    // 自定义牌路：清除所有高亮
    const selectRow = document.getElementById(`select-row-custom-${patternId}`);
    if (selectRow) {
      Array.from(selectRow.children).forEach(select => {
        select.style.border = '1px solid #ccc';
        select.style.boxShadow = 'none';
      });

      // 高亮当前列
      if (state.isActivated) {
        const highlightIndex = Math.max(0, state.currentPointer - 1);
        if (selectRow.children[highlightIndex]) {
          const targetSelect = selectRow.children[highlightIndex];
          targetSelect.style.border = '3px solid #FFD700';
          targetSelect.style.boxShadow = '0 0 8px #FFD700';
        }
      }
    }
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
      : document.getElementById(`enable-custom-${patternId.replace('pattern-', '')}`);
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
      : document.getElementById(`enable-custom-${patternId.replace('pattern-', '')}`);
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
    // 将"閒"转换为"闲"用于服务器下注，庄保持不变
    const serverBetType = betType === '閒' ? '闲' : betType;
    const message = `${serverBetType}${amount}`;

    // 生成牌路描述
    let patternDesc;
    if (state.type === 'preset') {
      patternDesc = `预设组${parseInt(patternId) + 1}-行${state.activeRowIndex + 1}-第${state.currentPointer}列`;
    } else {
      const customId = patternId.replace('pattern-', '');
      patternDesc = `自定义牌路${customId}-第${state.currentPointer}列`;
    }

    console.log(`[执行下注] ${patternDesc} 下注: ${message}`);
    placeBet(message);
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
