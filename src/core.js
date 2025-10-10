// ========== Console 拦截和全局状态初始化 ==========

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

        // 立即检查是否包含 url 字段并解析游戏阶段
        if (a.url) {
          parseGamePhase(a);
        }

        // 立即检查是否是开奖消息并解析
        if (a.msg && Array.isArray(a.msg) && a.msg[0] && a.msg[0].includes('期结果')) {
          parseDataAndDisplay(a); // 立即解析，确保历史数据在下注前更新
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

// 初始化全局状态
window.gameHistory = [];      // 存储开奖历史
window.winLoseHistory = [];   // 存储每期输赢记录
window.patternStates = {};    // 管理所有牌路的激活状态
window.currentBets = null;    // 当前期的下注记录
window.lastPeriodBets = null; // 上一期的下注记录（含输赢结果）

// 保存最新的霸天虎状态
window.bthStatus = {
  period: '',
  result: '',
  resultNumber: '', // 结果后面的数字（如"閒6"中的"6"）
  status: '',
  winLose: 0,
  totalScore: 0,
  time: '',
  gamePhase: '' // 游戏阶段：可以下注 / 已封盘
};
