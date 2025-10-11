// ========== 自动下注核心功能 ==========

// 下注功能
function placeBet(message, patternId) {
  // 模拟模式：直接返回成功响应，不发送网络请求
  if (window.mockBetting) {
    const mockResponse = {code: 0, msg: [], message: "操作成功（模拟）"};
    console.log('[下注结果-模拟]', mockResponse);

    if (window.currentBets && window.currentBets.bets[patternId]) {
      window.currentBets.bets[patternId].betSuccess = true;
      console.log(`[下注状态更新] ${patternId} betSuccess=true (模拟模式)`);
    }
    return;  // 不发送真实请求
  }

  // 真实模式：发送网络请求
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

    // 根据返回的code更新下注成功状态
    if (window.currentBets && window.currentBets.bets[patternId]) {
      window.currentBets.bets[patternId].betSuccess = (d.code === 0);
      console.log(`[下注状态更新] ${patternId} betSuccess=${d.code === 0}, code=${d.code}`);
    }
  })
  .catch(error => {
    console.error('下注请求出错:', error);
    // 出错也更新为失败
    if (window.currentBets && window.currentBets.bets[patternId]) {
      window.currentBets.bets[patternId].betSuccess = false;
      console.log(`[下注状态更新] ${patternId} betSuccess=false (网络错误)`);
    }
  });
}

// 动态获取牌路的总列数
function getTotalColumns(patternId, state) {
  const inputRow = document.getElementById(`input-row-${patternId}`);
  return inputRow ? inputRow.children.length : 0;
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

  // 统一处理：在累计盈亏后面添加状态显示（展开容器）
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
  collapsedStatusElement = document.getElementById(`status-collapsed-${patternId}`);

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
    statusElement.style.color = 'black';

    if (collapsedStatusElement) {
      collapsedStatusElement.textContent = '[未激活]';
      collapsedStatusElement.style.color = 'black';
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
    const selectRow = document.getElementById(`select-row-${patternId}`);
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
  console.log(`[调试] 尝试激活自定义牌路 ${patternId}`);

  const inputRow = document.getElementById(`input-row-${patternId}`);
  const selectRow = document.getElementById(`select-row-${patternId}`);

  console.log(`[调试] inputRow=${inputRow}, selectRow=${selectRow}`);

  if (!inputRow || !selectRow) {
    console.log(`[调试] 未找到元素，退出`);
    return;
  }

  // 找到第一个数字不为0的列
  let entryPoint = -1;
  for (let col = 0; col < inputRow.children.length; col++) {
    const amount = parseInt(inputRow.children[col].value) || 0;
    if (amount !== 0) {
      entryPoint = col;
      break;
    }
  }

  console.log(`[调试] entryPoint=${entryPoint}`);
  if (entryPoint === -1) {
    console.log(`[调试] 没有找到入场点，退出`);
    return;
  }

  // 检查历史匹配
  const requiredHistory = [];
  for (let col = 0; col < entryPoint; col++) {
    requiredHistory.push(selectRow.children[col].value);
  }

  console.log(`[调试] requiredHistory=${JSON.stringify(requiredHistory)}, gameHistory长度=${window.gameHistory.length}`);

  if (window.gameHistory.length < requiredHistory.length) {
    console.log(`[调试] 历史长度不够，需要${requiredHistory.length}条，实际${window.gameHistory.length}条`);
    return;
  }

  const recentHistory = window.gameHistory.slice(-requiredHistory.length);
  console.log(`[调试] recentHistory=${JSON.stringify(recentHistory)}`);

  const isMatch = requiredHistory.every((val, idx) => val === recentHistory[idx]);
  console.log(`[调试] 匹配结果=${isMatch}`);

  if (isMatch) {
    state.isActivated = true;
    state.justActivated = true; // 标记为刚激活，本期不推进
    state.currentPointer = entryPoint;
    console.log(`[激活] 自定义牌路 ${patternId} 激活，指针在第 ${entryPoint} 列`);
    updatePatternUI(patternId, state);
  } else {
    console.log(`[调试] 历史不匹配，无法激活`);
  }
}

// 检查所有未激活的牌路是否满足激活条件
function checkActivation() {
  for (let patternId in window.patternStates) {
    const state = window.patternStates[patternId];

    // 跳过已激活的牌路
    if (state.isActivated) continue;

    // 检查是否勾选
    const checkbox = document.getElementById(`enable-${patternId}`);
    if (!checkbox || !checkbox.checked) continue;

    // 尝试激活
    if (state.type === 'preset') {
      tryActivatePresetGroup(patternId, state);
    } else {
      tryActivateCustomPattern(patternId, state);
    }
  }
}

// 准备下注数据
function prepareBets() {
  const betsToPlace = [];

  // 初始化本期下注记录
  window.currentBets = {
    period: null,
    openResult: null,
    bets: {}
  };

  // 遍历所有牌路
  for (let patternId in window.patternStates) {
    const state = window.patternStates[patternId];

    // 必须已激活
    if (!state.isActivated) continue;

    // 必须勾选
    const checkbox = document.getElementById(`enable-${patternId}`);
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
      const inputRow = document.getElementById(`input-row-${patternId}`);
      const selectRow = document.getElementById(`select-row-${patternId}`);

      if (!inputRow || !selectRow || state.currentPointer >= inputRow.children.length) continue;

      amount = parseInt(inputRow.children[state.currentPointer].value) || 0;
      betType = selectRow.children[state.currentPointer].value;
    }

    // 金额为0，记录为未下注
    if (amount === 0) {
      window.currentBets.bets[patternId] = { betPlaced: false };
      console.log(`[跳过下注] ${patternId} 第 ${state.currentPointer} 列金额为0`);
      continue;
    }

    // 记录到 currentBets（用于盈亏计算）
    window.currentBets.bets[patternId] = {
      betPlaced: true,
      betType: betType,
      betAmount: amount,
      betSuccess: false
    };

    // 加入下注队列
    betsToPlace.push({
      patternId: patternId,
      betType: betType,
      betAmount: amount
    });
  }

  console.log(`[准备下注] 找到 ${betsToPlace.length} 个牌路需要下注`);
  return betsToPlace;
}

// 智能合并矛盾下注
function mergeConflictingBets(betsToPlace) {
  // 统计庄和闲的总金额
  let zhuangTotal = 0;
  let xianTotal = 0;

  betsToPlace.forEach(bet => {
    if (bet.betType === '庄') {
      zhuangTotal += bet.betAmount;
    } else if (bet.betType === '閒') {
      xianTotal += bet.betAmount;
    }
  });

  console.log(`[智能合并] 庄总计: ${zhuangTotal}, 闲总计: ${xianTotal}`);

  // 决策
  let finalBetType;
  if (zhuangTotal > xianTotal) {
    finalBetType = '庄';
    console.log(`[智能合并] 庄更大，只下庄`);
  } else if (xianTotal > zhuangTotal) {
    finalBetType = '閒';
    console.log(`[智能合并] 闲更大，只下闲`);
  } else {
    finalBetType = betsToPlace[0].betType;
    console.log(`[智能合并] 金额相同，选择第一个: ${finalBetType}`);
  }

  // 过滤
  const finalBets = betsToPlace.filter(bet => bet.betType === finalBetType);

  // 更新 currentBets：移除被过滤的牌路
  for (let patternId in window.currentBets.bets) {
    const bet = window.currentBets.bets[patternId];
    if (bet.betPlaced && bet.betType !== finalBetType) {
      // 标记为未下注（被过滤）
      window.currentBets.bets[patternId].betPlaced = false;
      console.log(`[智能合并] ${patternId} 被过滤（${bet.betType}）`);
    }
  }

  console.log(`[智能合并] 过滤后剩余 ${finalBets.length} 个牌路`);
  return finalBets;
}

// 延迟批量下注
function placeQueuedBets(finalBets) {
  // 初始延迟（可配置）
  const initialDelay = window.initialBetDelay || 0;

  setTimeout(() => {
    console.log(`[批量下注] 开始下注 ${finalBets.length} 个牌路`);

    finalBets.forEach((bet, index) => {
      // 每个下注之间的延迟（可配置）
      const intervalDelay = window.betInterval || 0;
      const delay = index * intervalDelay;

      setTimeout(() => {
        // 临时生成 message
        const serverBetType = bet.betType === '閒' ? '闲' : bet.betType;
        const message = `${serverBetType}${bet.betAmount}`;

        // 生成牌路描述
        const state = window.patternStates[bet.patternId];
        let patternDesc;
        if (state.type === 'preset') {
          const numericId = bet.patternId.split('-')[1];
          patternDesc = `预设组${parseInt(numericId) + 1}-行${state.activeRowIndex + 1}-第${state.currentPointer}列`;
        } else {
          const numericId = bet.patternId.split('-')[1];
          patternDesc = `自定义牌路${numericId}-第${state.currentPointer}列`;
        }

        console.log(`[执行下注] ${patternDesc} 下注: ${message}`);
        placeBet(message, bet.patternId);
      }, delay);
    });
  }, initialDelay);
}

// 自动下注（重构后）
function autoPlaceBets() {
  console.log('[自动下注] 开始检查所有牌路...');

  // 第一步：准备下注数据
  const betsToPlace = prepareBets();

  if (betsToPlace.length === 0) {
    console.log('[自动下注] 没有需要下注的牌路');
    console.log('[下注记录] 已生成', window.currentBets);
    return;
  }

  // 第二步：智能合并（可选，根据配置开关）
  const finalBets = window.smartMerge
    ? mergeConflictingBets(betsToPlace)
    : betsToPlace;

  // 第三步：延迟批量下注
  placeQueuedBets(finalBets);

  console.log('[下注记录] 已生成', window.currentBets);
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
      const selectRow = document.getElementById(`select-row-${patternId}`);
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

// 计算输赢并更新累计盈亏
function calculateProfits() {
  if (!window.currentBets || !window.currentBets.openResult) {
    console.log('[计算输赢] 没有有效的下注记录');
    return;
  }

  const openResult = window.currentBets.openResult;  // "庄"或"閒"
  console.log(`[计算输赢] 开奖结果: ${openResult}`);

  let totalPeriodProfit = 0;  // 本期所有牌路的总盈亏

  for (let patternId in window.currentBets.bets) {
    const bet = window.currentBets.bets[patternId];

    // 跳过未下注或下注失败的
    if (!bet.betPlaced || !bet.betSuccess) {
      console.log(`[计算输赢] ${patternId} 跳过（未下注或失败）`);
      continue;
    }

    // 计算盈亏
    let profit = 0;
    if (bet.betType === openResult) {
      profit = bet.betAmount;  // 赢

      // 特殊处理：庄6赢只赔一半
      if (openResult === '庄' && window.bthStatus.resultNumber === '6') {
        profit = Math.round(profit / 2);
        console.log(`[庄6规则] ${patternId} 赢的金额减半: ${bet.betAmount} → ${profit}`);
      }

      console.log(`[计算输赢] ${patternId} 赢 +${profit}`);
    } else {
      profit = -bet.betAmount;  // 输（不受庄6影响）
      console.log(`[计算输赢] ${patternId} 输 ${profit}`);
    }

    // 累加本期总盈亏
    totalPeriodProfit += profit;

    // 更新累计盈亏
    if (window.patternStates[patternId]) {
      if (!window.patternStates[patternId].totalProfit) {
        window.patternStates[patternId].totalProfit = 0;
      }
      window.patternStates[patternId].totalProfit += profit;

      // 更新UI显示
      updateProfitUI(patternId);
    }
  }

  // 只在手动模式下追加本期总盈亏到历史
  if (window.bettingMode === 'manual') {
    window.winLoseHistory.push(totalPeriodProfit);
    console.log(`[手动模式] 本期总盈亏: ${totalPeriodProfit}`);
  }
}

// 更新盈亏UI显示
function updateProfitUI(patternId) {
  const state = window.patternStates[patternId];
  if (!state) return;

  const totalProfit = state.totalProfit || 0;

  // 更新展开状态的盈亏显示
  const profitSpan = document.getElementById(`profit-${patternId}`);
  if (profitSpan) {
    profitSpan.textContent = totalProfit;
    // 设置颜色
    if (totalProfit > 0) {
      profitSpan.style.color = '#4CAF50';  // 绿色
    } else if (totalProfit < 0) {
      profitSpan.style.color = '#f44336';  // 红色
    } else {
      profitSpan.style.color = '#4CAF50';  // 默认绿色
    }
  }

  // 更新收起状态的盈亏显示
  const collapsedProfitSpan = document.getElementById(`profit-collapsed-${patternId}`);
  if (collapsedProfitSpan) {
    collapsedProfitSpan.textContent = totalProfit;
    collapsedProfitSpan.style.color = profitSpan ? profitSpan.style.color : '#4CAF50';
  }
}
