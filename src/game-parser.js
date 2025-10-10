// ========== 游戏数据解析 ==========

// 解析 URL 字段，识别游戏阶段
function parseGamePhase(logData) {
  if (!logData || !logData.url) return;

  const url = logData.url;

  if (url.includes('/jiang/开局.png') || url.includes('/jiang/开宝.png')) {
    window.bthStatus.gamePhase = '可以下注';
    window.bthStatus.time = new Date().toLocaleTimeString();
    console.log(`%c游戏状态: 可以下注`, 'color: green; font-weight: bold');
    updatePanel();

    // 自动下注
    autoPlaceBets();
  } else if (url.includes('/jiang/封盘.png')) {
    window.bthStatus.gamePhase = '已封盘';
    window.bthStatus.time = new Date().toLocaleTimeString();
    console.log(`%c游戏状态: 已封盘`, 'color: red; font-weight: bold');
    updatePanel();
  }
}

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
    const periodRaw = periodMatch[0]; // 原始期号文本（如 "5期结果"）
    // 从期号文本中提取纯数字（如 "5"）
    const periodNumber = periodRaw.match(/\d+/);
    const period = periodNumber ? periodNumber[0] : periodRaw;
    const resultRaw = periodMatch[1]; // 结果
    const result = resultRaw ? resultRaw.charAt(0) : resultRaw; // 只取第一个字（閒 或 庄）
    const numberMatch = resultRaw ? resultRaw.match(/\d+/) : null; // 提取数字
    const resultNumber = numberMatch ? numberMatch[0] : '';
    console.log(`第 ${period} 期结果: ${result}${resultNumber}`);

    // 更新状态
    window.bthStatus.period = period;
    window.bthStatus.result = result;
    window.bthStatus.resultNumber = resultNumber;
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
          window.winLoseHistory.push(winLose); // 追加到输赢历史
        } else if (matches && matches.length === 1) {
          // 只有一个数字，是总分，本期没有输赢
          const totalScore = parseInt(matches[0].replace(/[\[\]]/g, ''), 10);
          console.log(`霸天虎 本期未下注, 总分: ${totalScore}`);

          window.bthStatus.status = '未下注';
          window.bthStatus.winLose = 0;
          window.bthStatus.totalScore = totalScore;
          window.winLoseHistory.push(0); // 追加到输赢历史
        }
      }
    });

    // 如果消息里没有霸天虎，说明这期没下注
    if (!foundBTH) {
      console.log(`霸天虎 本期未下注`);
      window.bthStatus.status = '未下注';
      window.bthStatus.winLose = 0;
      window.winLoseHistory.push(0); // 追加到输赢历史
      // 保持上一期的总分
    }

    // 立即更新面板
    updatePanel();

    // 处理下注记录：补充期号和开奖结果，计算输赢
    if (window.currentBets && window.bthStatus.period && window.bthStatus.result) {
      window.currentBets.period = `第${window.bthStatus.period}期`;
      window.currentBets.openResult = window.bthStatus.result;

      console.log('[开奖] 补充下注记录', window.currentBets);

      // 立即计算本期输赢
      calculateProfits();

      // 保存为上一期记录（可选，用于历史查询）
      window.lastPeriodBets = JSON.parse(JSON.stringify(window.currentBets));

      // 清空当前记录，准备下一期
      window.currentBets = null;
    }

    // 自动下注功能：更新历史、检查激活、推进指针
    updateGameHistory(window.bthStatus.result);
    checkActivation();
    advancePointers(window.bthStatus.result);
    updatePanel(); // 更新UI显示最新历史
  }
}
