// ========== 手动控制功能 ==========

// 模拟下注模式（测试用，发布时必须为false）
window.mockBetting = false;

// 手动下注选择器颜色切换
document.getElementById('manual-bet-select').addEventListener('change', function() {
  // 如果值包含"庄"显示红色，包含"閒"显示蓝色
  this.style.background = this.value.includes('庄') ? 'red' : 'blue';
});

// 手动开奖并开盘按钮事件
document.getElementById('manual-bet-confirm').addEventListener('click', () => {
  const btn = document.getElementById('manual-bet-confirm');

  // 禁用按钮
  btn.disabled = true;
  btn.style.opacity = '0.5';
  btn.style.cursor = 'not-allowed';

  // 获取选择的值（庄 或 閒）
  const selectedResult = document.getElementById('manual-bet-select').value;

  // 计算下一期期号
  let nextPeriod;
  if (window.bthStatus.period) {
    const currentPeriodNum = parseInt(window.bthStatus.period, 10);
    nextPeriod = String(currentPeriodNum + 1).padStart(3, '0');
  } else {
    nextPeriod = '001';
  }

  // 发送开奖消息
  console.log({ msg: [`第${nextPeriod}期结果：${selectedResult}`] });

  // 延迟100ms后发送开盘消息并恢复按钮
  setTimeout(() => {
    console.log({ url: '/jiang/开局.png' });

    // 恢复按钮
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  }, 100);

  console.log(`[手动控制] 第${nextPeriod}期 结果:${selectedResult} → 已开奖并开盘`);
});
