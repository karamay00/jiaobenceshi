const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// 游戏状态
let gameState = {
  period: 1,
  phase: 'waiting', // 'waiting', 'betting', 'closed', 'drawing'
  result: null,
  resultNumber: '',
  players: {
    '飞翔': {
      totalScore: 850,
      bets: [],
      lastWinLose: 0
    },
    '阳光': {
      totalScore: 10100,
      bets: [],
      lastWinLose: 0
    },
    '渡仙': {
      totalScore: 4700,
      bets: [],
      lastWinLose: 0
    }
  },
  mode: 'auto', // 'auto', 'pattern', 'manual'
  pattern: ['庄','庄','閒','庄','庄','閒'],
  cycleTime: 70000, // 周期时长（毫秒）
  messages: [], // 消息队列（供客户端轮询）
  betRecords: [], // 下注记录
  isPaused: false, // 游戏是否暂停
  timers: [] // 存储所有定时器ID
};

// 添加消息到队列
function addMessage(msg) {
  gameState.messages.push(msg);
  console.log('[广播消息]', JSON.stringify(msg).substring(0, 100) + '...');
}

// 下注接口
app.post('/doXiazhu.html', (req, res) => {
  const { message } = req.body; // 例如: "庄100" 或 "闲100"

  console.log('[收到下注]', message);

  if (gameState.phase !== 'betting') {
    console.log('[下注失败] 不在下注时间');
    return res.json({code: -1, msg: ['已封盘'], message: '下注失败'});
  }

  // 解析下注
  let betType = '庄';
  if (message.includes('闲')) {
    betType = '閒';
  } else if (message.includes('庄')) {
    betType = '庄';
  }

  const amountMatch = message.match(/\d+/);
  const amount = amountMatch ? parseInt(amountMatch[0]) : 0;

  if (amount === 0) {
    return res.json({code: -1, msg: ['金额错误'], message: '下注失败'});
  }

  // 记录下注（默认记录到"飞翔"账户）
  const playerName = '飞翔';
  if (!gameState.players[playerName]) {
    gameState.players[playerName] = { totalScore: 1000, bets: [], lastWinLose: 0 };
  }

  gameState.players[playerName].bets.push({
    type: betType,
    amount: amount,
    time: new Date()
  });

  gameState.betRecords.push({
    period: gameState.period,
    player: playerName,
    type: betType,
    amount: amount,
    time: new Date().toLocaleTimeString()
  });

  console.log(`[下注成功] ${playerName} 下注 ${betType}${amount}`);
  res.json({code: 0, msg: [], message: '操作成功'});
});

// 获取消息接口（客户端轮询）
app.get('/api/messages', (req, res) => {
  const messages = [...gameState.messages];
  gameState.messages = []; // 清空已读消息
  res.json({ messages });
});

// 获取游戏状态
app.get('/api/status', (req, res) => {
  res.json({
    period: gameState.period,
    phase: gameState.phase,
    result: gameState.result,
    mode: gameState.mode,
    betRecords: gameState.betRecords.slice(-20) // 最近20条
  });
});

// 控制接口
app.post('/api/control', (req, res) => {
  const { action, data } = req.body;

  switch(action) {
    case 'setMode':
      gameState.mode = data.mode;
      console.log('[模式切换]', data.mode);
      break;
    case 'setPattern':
      gameState.pattern = data.pattern.split(',');
      console.log('[设置牌路]', gameState.pattern);
      break;
    case 'manualDraw':
      if (gameState.phase === 'closed') {
        gameState.result = data.result;
        executeDraw();
      }
      break;
    case 'setCycleTime':
      gameState.cycleTime = data.time;
      console.log('[周期时长]', data.time);
      break;
    case 'pause':
      pauseGame();
      break;
    case 'restart':
      restartGame();
      break;
  }

  res.json({ success: true });
});

// 计算输赢
function calculateWinnings() {
  const result = gameState.result;

  for (let playerName in gameState.players) {
    const player = gameState.players[playerName];
    let winLose = 0;

    player.bets.forEach(bet => {
      if (bet.type === result) {
        // 赢
        let profit = bet.amount;
        // 庄6赢只赔一半
        if (result === '庄' && gameState.resultNumber === '6') {
          profit = Math.round(profit / 2);
        }
        winLose += profit;
      } else {
        // 输
        winLose -= bet.amount;
      }
    });

    player.totalScore += winLose;
    player.lastWinLose = winLose;

    console.log(`[结算] ${playerName}: ${winLose > 0 ? '+' : ''}${winLose}, 总分: ${player.totalScore}`);

    // 清空本期下注
    player.bets = [];
  }
}

// 生成开奖消息
function buildDrawMessage() {
  const result = gameState.result;
  const resultNumber = gameState.resultNumber || Math.floor(Math.random() * 9) + 1;
  gameState.resultNumber = resultNumber;

  const msg = [
    `${gameState.period}期结果：${result}${resultNumber}`,
    '________',
    ' 总榜：【48540】'
  ];

  // 添加玩家信息
  for (let playerName in gameState.players) {
    const player = gameState.players[playerName];
    if (player.lastWinLose !== 0) {
      msg.push(`(${playerName})[${player.totalScore}] [${player.lastWinLose}]`);
    } else {
      msg.push(`(${playerName})[${player.totalScore}]`);
    }
  }

  return msg;
}

// 执行开奖
function executeDraw() {
  gameState.phase = 'drawing';

  // 生成结果
  if (gameState.mode === 'auto') {
    gameState.result = Math.random() > 0.5 ? '庄' : '閒';
  } else if (gameState.mode === 'pattern') {
    gameState.result = gameState.pattern[(gameState.period - 1) % gameState.pattern.length];
  }
  // manual 模式下 result 已经设置好了

  // 计算输赢
  calculateWinnings();

  // 广播开奖消息
  const msg = buildDrawMessage();
  addMessage({
    nickname: '机器人',
    headimg: 'http://localhost:3000/images/jqr.png',
    msg: msg,
    from: 0,
    to: 0
  });

  console.log(`[${gameState.period}期] 开奖: ${gameState.result}${gameState.resultNumber}`);
}

// 暂停游戏
function pauseGame() {
  if (gameState.isPaused) {
    console.log('[控制] 游戏已经暂停');
    return;
  }

  gameState.isPaused = true;

  // 清除所有定时器
  gameState.timers.forEach(timer => clearTimeout(timer));
  gameState.timers = [];

  console.log('[控制] ⏸️  游戏已暂停');
}

// 重启游戏
function restartGame() {
  console.log('[控制] 🔄 重启游戏...');

  // 清除所有定时器
  gameState.timers.forEach(timer => clearTimeout(timer));
  gameState.timers = [];

  // 重置游戏状态
  gameState.period = 1;
  gameState.phase = 'waiting';
  gameState.result = null;
  gameState.resultNumber = '';
  gameState.isPaused = false;
  gameState.messages = [];
  gameState.betRecords = [];

  // 重置玩家数据
  gameState.players = {
    '飞翔': {
      totalScore: 850,
      bets: [],
      lastWinLose: 0
    },
    '阳光': {
      totalScore: 10100,
      bets: [],
      lastWinLose: 0
    },
    '渡仙': {
      totalScore: 4700,
      bets: [],
      lastWinLose: 0
    }
  };

  console.log('[控制] ✅ 游戏已重置，从第1期重新开始');

  // 延迟1秒后启动游戏
  setTimeout(() => {
    gameLoop();
  }, 1000);
}

// 游戏循环
function gameLoop() {
  if (gameState.isPaused) {
    console.log('[游戏] 已暂停，不执行循环');
    return;
  }

  const cycle = gameState.cycleTime;

  // 阶段1: 开局（立即）
  const timer1 = setTimeout(() => {
    if (gameState.isPaused) return;
    gameState.phase = 'betting';
    addMessage({url: '/jiang/开局.png'});
    console.log(`\n========== [${gameState.period}期] 开始下注 ==========`);
  }, 0);
  gameState.timers.push(timer1);

  // 阶段2: 封盘（cycle - 8秒，留5秒给开奖、3秒给下一期准备）
  const timer2 = setTimeout(() => {
    if (gameState.isPaused) return;
    gameState.phase = 'closed';
    addMessage({url: '/jiang/封盘.png'});
    console.log(`[${gameState.period}期] 封盘`);
  }, cycle - 8000);
  gameState.timers.push(timer2);

  // 阶段3: 开奖（cycle - 3秒，留3秒给下一期准备）
  const timer3 = setTimeout(() => {
    if (gameState.isPaused) return;
    if (gameState.mode !== 'manual') {
      executeDraw();
    } else {
      console.log(`[${gameState.period}期] 等待手动开奖...`);
    }
  }, cycle - 3000);
  gameState.timers.push(timer3);

  // 阶段4: 下一期（cycle）
  const timer4 = setTimeout(() => {
    if (gameState.isPaused) return;
    gameState.period++;
    gameState.phase = 'waiting';
    gameState.timers = []; // 清空已完成的定时器
    gameLoop(); // 递归调用
  }, cycle);
  gameState.timers.push(timer4);
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🚀 游戏测试服务器启动成功！`);
  console.log(`📍 访问地址: http://localhost:${PORT}`);
  console.log(`🎮 游戏模式: ${gameState.mode}`);
  console.log(`⏱️  周期时长: ${gameState.cycleTime}ms\n`);

  // 启动游戏循环
  setTimeout(() => {
    console.log('🎲 游戏开始运行...\n');
    gameLoop();
  }, 2000);
});
