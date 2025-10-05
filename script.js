(function () {
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
    <div id="custom-panel" style="position: fixed; top: 20px; right: 20px; width: 280px; height: 400px; background: rgba(0, 0, 0, 0.85); color: white; padding: 15px; border-radius: 10px; z-index: 9999; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
      <h3 style="margin: 0 0 10px 0; text-align: center; border-bottom: 2px solid #4CAF50; padding-bottom: 8px;">霸天虎面板</h3>
      <div id="bth-status" style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px; margin-bottom: 10px; font-size: 13px;">
        <div style="margin-bottom: 5px;">📊 <strong>期数：</strong><span id="period">-</span></div>
        <div style="margin-bottom: 5px;">🎲 <strong>结果：</strong><span id="game-result">-</span></div>
        <div style="margin-bottom: 5px;">💰 <strong>状态：</strong><span id="status">-</span></div>
        <div style="margin-bottom: 5px;">📈 <strong>本期：</strong><span id="win-lose">-</span></div>
        <div style="margin-bottom: 5px;">🏆 <strong>总分：</strong><span id="total-score">-</span></div>
        <div style="font-size: 11px; color: #aaa;">🕐 <span id="update-time">-</span></div>
      </div>
      <div id="log-content" style="overflow-y: auto; height: 120px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 5px; margin-bottom: 10px; font-size: 11px;"></div>
      <button id="clear-logs" style="width: 100%; padding: 8px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">清理日志</button>
      <button id="place-bet" style="width: 100%; padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 5px; margin-top: 8px; cursor: pointer; font-weight: bold;">下注</button>
    </div>
  `;

  // 插入面板到页面中
  document.body.insertAdjacentHTML('beforeend', panelHtml);

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

    // 更新日志显示（只显示最近3条）
    const logContent = document.getElementById('log-content');
    logContent.innerHTML = '';

    const recentLogs = window.logs.slice(-3); // 只显示最近3条
    recentLogs.forEach((log, index) => {
      const logDiv = document.createElement('div');
      logDiv.style.marginBottom = '5px';
      logDiv.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
      logDiv.style.paddingBottom = '5px';

      if (log.msg && log.msg[0]) {
        logDiv.textContent = `${log.msg[0]}`;
      } else {
        logDiv.textContent = JSON.stringify(log).substring(0, 50) + '...';
      }

      logContent.appendChild(logDiv);
    });
  }

  // 清理日志按钮点击事件
  document.getElementById('clear-logs').addEventListener('click', () => {
    window.logs = []; // 清空 logs
    updatePanel(); // 更新面板
    console.log('%c日志已清空', 'color: red');
  });

  // 下注按钮点击事件
  document.getElementById('place-bet').addEventListener('click', () => {
    const message = '庄20'; // 在此处修改下注的消息内容
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
      console.log(d);
    })
    .catch(error => console.error('下注请求出错:', error));
  });

  // 定时更新面板内容
  setInterval(updatePanel, 5000); // 每5秒更新一次面板
})();
