(function () {
  // 检查面板是否已经存在
  const existingPanel = document.getElementById('custom-panel');
  if (existingPanel) {
    // 如果面板已存在，切换显示状态
    if (existingPanel.style.display === 'none') {
      existingPanel.style.display = 'block';
      console.log('%c面板已重新显示', 'color: green');
    } else {
      console.log('%c面板已存在，无需重复创建', 'color: orange');
    }
    return; // 退出脚本，不重复执行
  }

  const oldLog = console.log;
  window.logs = []; // 保存捕获的对象日志

  console.log = function (...args) {
    args.forEach(a => {
      // 只处理对象，不处理 null、数组、字符串
      if (a && typeof a === 'object' && !Array.isArray(a) && a.constructor === Object) {
        try {
          const json = JSON.stringify(a);
          window.logs.push(a); // 保存对象日志
          oldLog('[JSON]', json); // 打印 JSON 格式的日志

          // 立即检查是否是开奖消息并解析
          if (a.msg && Array.isArray(a.msg) && a.msg[0] && a.msg[0].includes('期结果')) {
            setTimeout(() => parseDataAndDisplay(a), 100); // 延迟100ms解析，确保已添加到logs
          }
        } catch (e) {
          oldLog('[无法序列化对象]', a);
        }
      }
    });

    // 保持原始输出
    oldLog.apply(console, args);
  };

  oldLog('%c已开启 console.log 对象捕获，数据保存在 window.logs', 'color: green');

  // 保存最新的霸天虎状态
  window.bthStatus = {
    period: '',
    result: '',
    status: '',
    winLose: 0,
    totalScore: 0,
    time: ''
  };

  // 解析和展示最新的期号和结果，并且显示"霸天虎"的输赢情况
  function parseDataAndDisplay(logData) {
    // 如果没有传入数据，使用最新的一条
    const data = logData || (window.logs.length ? window.logs[window.logs.length - 1] : null);
    if (!data) return;

    if (data.msg && Array.isArray(data.msg)) {
      // 获取期号和结果 - 只解析包含"期结果"的消息
      const periodResult = data.msg[0]; // 期号和结果
      if (!periodResult.includes('期结果')) return; // 如果不是期数结果消息，跳过

      const periodMatch = periodResult.split('：');
      const period = periodMatch[0]; // 期号
      const resultRaw = periodMatch[1]; // 结果
      const result = resultRaw ? resultRaw.charAt(0) : resultRaw; // 只取第一个字（閒 或 庄）
      console.log(`第 ${period} 期结果: ${result}`);

      // 更新状态
      window.bthStatus.period = period;
      window.bthStatus.result = result;
      window.bthStatus.time = new Date().toLocaleTimeString();

      // 查找霸天虎信息
      let foundBTH = false;
      data.msg.forEach(m => {
        if (m.includes('(霸天虎)')) {
          foundBTH = true;
          // 匹配格式：(霸天虎)[总分] [本期输赢] 或 (霸天虎)[总分]
          const matches = m.match(/\[([^\]]+)\]/g); // 匹配所有 [xxx]
          if (matches && matches.length >= 2) {
            // 有两个数字，第二个是本期输赢
            const totalScore = parseInt(matches[0].replace(/[\[\]]/g, ''), 10);
            const winLose = parseInt(matches[1].replace(/[\[\]]/g, ''), 10);
            const status = winLose > 0 ? '赢了' : winLose < 0 ? '输了' : '平局';
            console.log(`霸天虎 ${status}, 本期: ${winLose}, 总分: ${totalScore}`);

            window.bthStatus.status = status;
            window.bthStatus.winLose = winLose;
            window.bthStatus.totalScore = totalScore;
          } else if (matches && matches.length === 1) {
            // 只有一个数字，是总分，本期没有输赢
            const totalScore = parseInt(matches[0].replace(/[\[\]]/g, ''), 10);
            console.log(`霸天虎 本期未下注, 总分: ${totalScore}`);

            window.bthStatus.status = '未下注';
            window.bthStatus.winLose = 0;
            window.bthStatus.totalScore = totalScore;
          }
        }
      });

      // 如果消息里没有霸天虎，说明这期没下注
      if (!foundBTH) {
        console.log(`霸天虎 本期未下注`);
        window.bthStatus.status = '未下注';
        window.bthStatus.winLose = 0;
        // 保持上一期的总分
      }

      // 立即更新面板
      updatePanel();
    }
  }

  // 每当新数据进来时，触发解析和显示
  setInterval(parseDataAndDisplay, 5000); // 每隔5秒检查并解析日志

  // 小面板的 HTML 结构
  const panelHtml = `
    <div id="custom-panel" style="position: fixed; top: 20px; right: 20px; width: 420px; height: 600px; background: rgba(128, 128, 128, 0.5); color: black; padding: 15px; border-radius: 10px; z-index: 9999; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 2px solid #4CAF50; padding-bottom: 8px;">
        <h3 style="margin: 0; flex: 1; text-align: center;">霸天虎面板</h3>
        <button id="close-panel" style="width: 25px; height: 25px; background: #f44336; color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 16px; font-weight: bold; line-height: 1; padding: 0;">×</button>
      </div>
      <div id="bth-status" style="background: rgba(255,255,255,0.08); padding: 10px; border-radius: 5px; margin-bottom: 10px; font-size: 13px;">
        <div style="margin-bottom: 5px;">📊 <strong>期数：</strong><span id="period">-</span></div>
        <div style="margin-bottom: 5px;">🎲 <strong>结果：</strong><span id="game-result">-</span></div>
        <div style="margin-bottom: 5px;">💰 <strong>状态：</strong><span id="status">-</span></div>
        <div style="margin-bottom: 5px;">📈 <strong>本期：</strong><span id="win-lose">-</span></div>
        <div style="margin-bottom: 5px;">🏆 <strong>总分：</strong><span id="total-score">-</span></div>
        <div style="font-size: 11px; color: #aaa;">🕐 <span id="update-time">-</span></div>
      </div>
      <button id="add-pattern" style="width: 100%; padding: 8px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">新增牌路并下注</button>
      <div id="pattern-container" style="margin-top: 10px; max-height: 300px; overflow-y: auto; background: rgba(255,255,255,0.03); padding: 5px; border-radius: 5px;"></div>
    </div>
  `;

  // 插入面板到页面中
  document.body.insertAdjacentHTML('beforeend', panelHtml);

  // 隐藏数字输入框的上下箭头（spinner）
  const style = document.createElement('style');
  style.textContent = `
    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  `;
  document.head.appendChild(style);

  // 更新面板内容显示
  function updatePanel() {
    // 更新霸天虎状态
    const bth = window.bthStatus;
    document.getElementById('period').textContent = bth.period || '-';
    document.getElementById('game-result').textContent = bth.result || '-';

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
  }

  // 下注功能（待用）
  // function placeBet(message) {
  //   fetch('http://zzxxyy.shop/doXiazhu.html', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  //     body: new URLSearchParams({
  //       message: message
  //     })
  //   })
  //   .then(res => res.json())
  //   .then(d => {
  //     if (d.msg === null) d.msg = [];
  //     console.log(d);
  //   })
  //   .catch(error => console.error('下注请求出错:', error));
  // }

  // 定时更新面板内容
  setInterval(updatePanel, 5000); // 每5秒更新一次面板

  // 通用组件函数
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
      name: '预设组2',
      patterns: [
        ['庄','庄','庄','閒'],
        ['庄','庄','閒','庄'],
        ['庄','閒','庄','庄'],
        ['閒','庄','庄','庄']
      ]
    }
  ];

  // 创建预设牌路组
  function createPresetPatternGroup(config) {
    const { name, patterns } = config;
    const groupId = patternIdCounter++;
    const container = document.getElementById('pattern-container');

    const rowCount = patterns.length;              // 行数
    const basePatternColCount = patterns[0].length; // 基础模式的列数

    // 自动复制一次基础模式
    const duplicatedPatterns = patterns.map(row => [...row, ...row]);
    const initialColCount = duplicatedPatterns[0].length; // 初始列数（已复制）

    // 创建组容器
    const groupDiv = document.createElement('div');
    groupDiv.id = `preset-group-${groupId}`;
    groupDiv.style.cssText = 'margin-bottom: 8px; background: rgba(0, 0, 0, 0.5); padding: 10px; border-radius: 5px;';

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

    // 底部控制栏
    const controlBar = document.createElement('div');
    controlBar.style.cssText = 'margin-top: 10px; display: flex; align-items: center; gap: 10px; color: white; font-size: 12px;';
    controlBar.innerHTML = `
      <span style="flex: 1;">本组累计盈亏：<span id="profit-preset-${groupId}" style="font-weight: bold; color: #4CAF50;">0</span></span>
      <button id="add-col-${groupId}" style="padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">增</button>
      <button id="delete-col-${groupId}" style="padding: 5px 10px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 14px;" disabled>减</button>
      <input type="checkbox" id="enable-${groupId}" style="width: 20px; height: 20px; cursor: pointer;">
      <label for="enable-${groupId}" style="cursor: pointer;">启用</label>
    `;

    groupDiv.appendChild(tableContainer);
    groupDiv.appendChild(controlBar);
    container.appendChild(groupDiv);

    // 绑定事件
    document.getElementById(`add-col-${groupId}`).addEventListener('click', () => {
      addColumnToPresetGroup(groupId, rowCount, basePatternColCount, patterns);
    });

    document.getElementById(`delete-col-${groupId}`).addEventListener('click', () => {
      deleteLastColumn(groupId, rowCount, initialColCount, basePatternColCount);
    });

    document.getElementById(`enable-${groupId}`).addEventListener('change', (e) => {
      console.log(`预设组 ${groupId} ${e.target.checked ? '已启用' : '已停用'}`);
    });
  }

  // 动态添加列到预设组（一次添加1列）
  function addColumnToPresetGroup(groupId, rowCount, basePatternColCount, patterns) {
    const inputRow = document.getElementById(`input-row-${groupId}`);

    // 添加输入框
    inputRow.appendChild(createAmountInput());

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

  // 牌路管理
  let patternIdCounter = 0;

  // 创建牌路元素
  function createPattern() {
    const patternId = patternIdCounter++;
    const container = document.getElementById('pattern-container');

    const patternDiv = document.createElement('div');
    patternDiv.id = `pattern-${patternId}`;
    patternDiv.style.cssText = 'margin-bottom: 8px; background: rgba(0, 0, 0, 0.5); padding: 10px; border-radius: 5px;';

    // 创建标题
    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = 'color: white; font-size: 12px; margin-bottom: 5px;';
    titleDiv.innerHTML = `本牌路累计盈亏：<span id="profit-${patternId}" style="font-weight: bold; color: #4CAF50;">0</span>`;

    // 创建内容容器
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'display: flex; align-items: center;';

    // 创建可滚动的外层容器
    const scrollContainer = document.createElement('div');
    scrollContainer.style.cssText = 'flex: 1; overflow-x: auto; padding-bottom: 8px;';

    // 创建下拉菜单容器
    const selectsContainer = document.createElement('div');
    selectsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 5px;';

    // 第一行30个数字输入框
    const row1 = document.createElement('div');
    row1.style.cssText = 'display: flex; gap: 3px;';
    for (let i = 0; i < 30; i++) {
      const input = document.createElement('input');
      input.type = 'number';
      input.style.cssText = 'width: 40px; padding: 3px; font-size: 11px; border-radius: 3px; border: 1px solid #666; background: #333; color: white; text-align: center; flex-shrink: 0;';
      input.placeholder = '0';
      row1.appendChild(input);
    }

    // 第二行30个下拉菜单
    const row2 = document.createElement('div');
    row2.style.cssText = 'display: flex; gap: 3px;';
    for (let i = 0; i < 30; i++) {
      const select = document.createElement('select');
      select.style.cssText = 'width: 40px; padding: 3px; font-size: 11px; border-radius: 3px; border: 1px solid #ccc; background: red; color: white; flex-shrink: 0;';
      select.innerHTML = '<option value="庄">庄</option><option value="閒">閒</option>';
      // 根据选中值改变下拉菜单背景颜色
      select.onchange = function() {
        if (this.value === '庄') {
          this.style.background = 'red';
        } else {
          this.style.background = 'blue';
        }
      };
      row2.appendChild(select);
    }

    selectsContainer.appendChild(row1);
    selectsContainer.appendChild(row2);
    scrollContainer.appendChild(selectsContainer);

    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; flex-direction: column; gap: 3px; margin-left: 5px;';

    // 创建勾选框
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.style.cssText = 'width: 30px; height: 30px; cursor: pointer; margin: 0; background: white; border: 2px solid #333; border-radius: 3px; accent-color: #4CAF50;';
    checkbox.onchange = () => {
      console.log('牌路选中状态:', checkbox.checked, 'patternId:', patternId);
    };

    // 创建删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.style.cssText = 'width: 30px; height: 30px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 18px; font-weight: bold;';
    deleteBtn.onclick = () => {
      patternDiv.remove();
    };

    buttonContainer.appendChild(checkbox);
    buttonContainer.appendChild(deleteBtn);

    contentDiv.appendChild(scrollContainer);
    contentDiv.appendChild(buttonContainer);

    patternDiv.appendChild(titleDiv);
    patternDiv.appendChild(contentDiv);
    container.appendChild(patternDiv);
  }

  // 新增牌路按钮事件
  document.getElementById('add-pattern').addEventListener('click', createPattern);

  // 关闭面板按钮事件
  document.getElementById('close-panel').addEventListener('click', () => {
    document.getElementById('custom-panel').style.display = 'none';
    console.log('%c面板已隐藏，所有数据已保留。再次点击书签可重新显示面板。', 'color: orange');
  });

  // 初始化预设牌路组
  createPresetPatternGroup(PRESET_CONFIGS[0]);
  createPresetPatternGroup(PRESET_CONFIGS[1]);
})();
