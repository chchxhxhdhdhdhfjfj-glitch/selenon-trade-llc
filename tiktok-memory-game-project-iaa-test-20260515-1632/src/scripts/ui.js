import { SIGNIN_STREAK_REWARDS, WIN_STREAK_REWARD_STEP, DAILY_CHALLENGE_TARGET_LEVEL, DAILY_TOOL_GIFT, NEWBIE_GROWTH_TASKS, DAILY_TASK_REWARDS, APP_VERSION, APP_BRAND_NAME } from './config.js';

const CHAPTERS = [
  { start: 1, end: 4, name: '新手星区' },
  { start: 5, end: 8, name: '流星回廊' },
  { start: 9, end: 12, name: '银河迷阵' },
  { start: 13, end: 16, name: '量子深空' },
  { start: 17, end: 20, name: '终极记忆塔' }
];

const ACHIEVEMENTS = [
  { key: 'reach4', icon: '🚀', name: '初阶舰长', desc: '通关第 4 关', check: s => s.bestLevel >= 4 },
  { key: 'reach20', icon: '👑', name: '终章征服', desc: '通关第 20 关', check: s => s.bestLevel >= 20 },
  { key: 'endless3', icon: '🌌', name: '无尽新星', desc: '无尽达到第 3 轮', check: s => s.bestEndlessLoop >= 3 },
  { key: 'streak6', icon: '🔥', name: '连胜高手', desc: '连胜达到 6', check: s => (s.bestWinStreak || 0) >= 6 }
];

export function $(id) {
  return document.getElementById(id);
}

export function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getDailyResetCountdown() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const diff = Math.max(0, next.getTime() - now.getTime());
  const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
  const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
  const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  return `${hours}:${mins}:${secs}`;
}

export function showScreen(id) {
  for (const el of document.querySelectorAll('.screen')) el.classList.remove('active');
  $(id).classList.add('active');
}

export function showToast(refs, text, ms = 1800) {
  refs.toast.textContent = text;
  refs.toast.style.display = 'block';
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => refs.toast.style.display = 'none', ms);
}

export function playSpecialFX(refs, type, text) {
  if (!refs.specialFx) return;
  const el = document.createElement('div');
  el.className = `fx-badge fx-${type}`;
  el.textContent = text;
  refs.specialFx.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

export function renderSignGrid(state, refs) {
  if (!refs.signGrid) return;
  refs.signGrid.innerHTML = '';
  SIGNIN_STREAK_REWARDS.forEach((reward, i) => {
    const day = i + 1;
    const cell = document.createElement('div');
    const isDone = state.signinStreak >= day;
    const isActive = Math.min(state.signinStreak + 1, SIGNIN_STREAK_REWARDS.length) === day && state.lastSignInDate !== todayStr();
    cell.className = `sign-day ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`.trim();
    cell.innerHTML = `<div class="d">第 ${day} 天</div><div class="c">🎁</div><div class="r">+${reward}</div>`;
    refs.signGrid.appendChild(cell);
  });
}

export function syncAchievements(state) {
  let unlocked = [];
  state.achievements = state.achievements || {};
  ACHIEVEMENTS.forEach(item => {
    if (!state.achievements[item.key] && item.check(state)) {
      state.achievements[item.key] = true;
      unlocked.push(item);
    }
  });
  return unlocked;
}

export function renderAchievements(state, refs) {
  if (!refs.achievementsWall) return;
  refs.achievementsWall.innerHTML = '';
  ACHIEVEMENTS.forEach(item => {
    const done = !!state.achievements?.[item.key];
    const el = document.createElement('div');
    el.className = `achievement ${done ? 'done' : ''}`;
    el.innerHTML = `<div class="achievement-icon">${item.icon}</div><div class="achievement-name">${item.name}</div><div class="achievement-desc">${item.desc}</div>`;
    refs.achievementsWall.appendChild(el);
  });
}

export function renderDailyTaskCards(state, refs) {
  if (!refs.dailyTaskCards) return;
  const tasks = state.dailyTasks || {};
  renderDailyTaskCards._prev = renderDailyTaskCards._prev || {};
  const defs = [
    {
      key: 'level',
      title: '通关第 3 关',
      done: !!tasks.levelDone,
      reward: DAILY_TASK_REWARDS.level,
      tip: state.bestLevel >= 3 ? '已达到通关目标，可立即领取本项奖励' : `再推进到第 ${Math.max(1, 3 - (state.bestLevel || 0))} 关即可领取`
    },
    {
      key: 'tool',
      title: '使用 1 次道具',
      done: !!tasks.toolDone,
      reward: DAILY_TASK_REWARDS.tool,
      tip: '任意使用一次提示、护盾、冻结或找一对即可完成'
    },
    {
      key: 'streak',
      title: '达成 2 连胜',
      done: !!tasks.streakDone,
      reward: DAILY_TASK_REWARDS.streak,
      tip: state.winStreak >= 2 ? '连胜目标已达成，奖励已经就绪' : `再完成 ${Math.max(1, 2 - (state.winStreak || 0))} 次连胜即可领取`
    }
  ];
  renderDailyTaskCards._defs = defs;
  const recommendedKey = (defs.find(item => !item.done) || {}).key;
  refs.dailyTaskCards.innerHTML = '';
  defs.forEach(item => {
    const chips = [];
    if (item.reward?.revealPair) chips.push(`<span class="reward-chip tool">🎯x${item.reward.revealPair}</span>`);
    if (item.reward?.shield) chips.push(`<span class="reward-chip tool">🛡️x${item.reward.shield}</span>`);
    if (item.reward?.freeze) chips.push(`<span class="reward-chip tool">❄️x${item.reward.freeze}</span>`);
    const justDone = item.done && !renderDailyTaskCards._prev[item.key];
    const recommended = !item.done && item.key === recommendedKey;
    const el = document.createElement('div');
    el.className = `task-card ${item.done ? 'done' : ''} ${justDone ? 'just-done' : ''} ${recommended ? 'recommended' : ''}`.trim();
    el.innerHTML = `<div class="task-top"><span class="task-title">${item.title}</span><span class="task-state">${item.done ? '已完成' : '进行中'}</span></div>${recommended ? '<div class="task-recommend-badge">推荐优先</div>' : ''}${item.done ? '<div class="task-done-badge">✔ 已发放</div>' : ''}<div class="task-tip">${item.done ? '本项每日奖励已自动结算到账' : item.tip}</div><div class="reward-row">${chips.join('')}</div>`;
    refs.dailyTaskCards.appendChild(el);
    renderDailyTaskCards._prev[item.key] = item.done;
  });
}

function getHomeGoal(state) {
  const taskDefs = renderDailyTaskCards._defs || [];
  const nextTask = taskDefs.find(item => !item.done);
  if (nextTask) {
    return {
      kicker: '今日推荐',
      title: nextTask.title,
      desc: nextTask.tip
    };
  }

  const newbieProgress = state.newbieTasks || {};
  const nextNewbie = NEWBIE_GROWTH_TASKS.find(item => !newbieProgress[`${item.key}Claimed`]);
  if (nextNewbie) {
    return {
      kicker: `新手第 ${nextNewbie.day} 天`,
      title: nextNewbie.label,
      desc: '完成七日成长任务可以继续补强背包与起步资源。'
    };
  }

  if ((state.bestLevel || 0) < 20) {
    const nextLevel = Math.min(20, (state.bestLevel || 0) + 1 || 1);
    return {
      kicker: '主线冲刺',
      title: `推进到第 ${nextLevel} 关`,
      desc: nextLevel >= 17 ? '已经进入终章区间，继续推进即可冲击最终征服结算。' : `继续推进主线章节，向 ${formatChapter(nextLevel)} 发起挑战。`
    };
  }

  if ((state.bestEndlessLoop || 0) < 3) {
    return {
      kicker: '无尽挑战',
      title: '冲到无尽第 3 轮',
      desc: '继续提升无尽记录，顺手拿下“无尽新星”成就。'
    };
  }

  return {
    kicker: '高阶目标',
    title: '刷新最佳连胜与无尽记录',
    desc: '你的主线已完成，接下来可以专注刷记录、清成就、打磨无尽表现。'
  };
}

export function renderNewbieProgress(state, refs) {
  if (!refs.newbieProgress) return;
  const progress = state.newbieTasks || {};
  refs.newbieProgress.innerHTML = '';
  NEWBIE_GROWTH_TASKS.forEach(item => {
    const done = !!progress[`${item.key}Done`];
    const claimed = !!progress[`${item.key}Claimed`];
    const active = !claimed && !NEWBIE_GROWTH_TASKS.some(prev => prev.day < item.day && !progress[`${prev.key}Claimed`]);
    const rewardBits = [];
    if (item.reward?.revealPair) rewardBits.push(`<span class="reward-chip tool">🎯x${item.reward.revealPair}</span>`);
    if (item.reward?.shield) rewardBits.push(`<span class="reward-chip tool">🛡️x${item.reward.shield}</span>`);
    if (item.reward?.freeze) rewardBits.push(`<span class="reward-chip tool">❄️x${item.reward.freeze}</span>`);
    const el = document.createElement('div');
    el.className = `newbie-day ${done ? 'done' : ''} ${claimed ? 'claimed' : ''} ${active ? 'active' : ''}`.trim();
    el.innerHTML = `<div class="d">DAY ${item.day}</div><div class="t">${item.label}</div><div class="s">${claimed ? '已领取' : (done ? '已完成' : '进行中')}</div><div class="reward-row">${rewardBits.join('')}</div>`;
    refs.newbieProgress.appendChild(el);
  });
}

export function openModal(refs, { badge = '', title, text, rewards = [], stats = [], buttons = [], rewardDrops = [], chestVariant = 'chapter' }) {
  const isFinal = chestVariant === 'final';
  refs.overlay.querySelector('.modal')?.classList.toggle('final-modal', isFinal);
  refs.overlay.querySelector('#finalEmblem')?.classList.toggle('show', isFinal);
  refs.overlay.querySelector('#finalCrown')?.classList.toggle('show', isFinal);
  refs.overlay.querySelector('#finalSubtitle')?.classList.toggle('show', isFinal);
  if (refs.finalSubtitle) refs.finalSubtitle.textContent = isFinal ? 'FINAL ASCENSION COMPLETE' : '';
  if (refs.modalBadge) {
    refs.modalBadge.textContent = badge || '';
    refs.modalBadge.style.display = badge ? 'inline-block' : 'none';
  }
  refs.modalTitle.textContent = title;
  refs.modalText.textContent = text;
  refs.modalRewards.innerHTML = '';
  refs.modalBtns.innerHTML = '';
  if (refs.modalStats) refs.modalStats.innerHTML = '';
  if (refs.modalDrops) refs.modalDrops.innerHTML = '';
  if (refs.modalChestBox) {
    refs.modalChestBox.style.display = rewardDrops.length ? 'block' : 'none';
    refs.modalChestBox.className = `chest-open-box ${isFinal ? 'final-chest' : ''}`.trim();
    refs.modalChestBox.classList.remove('show');
  }
  if (refs.modalChestBadge) refs.modalChestBadge.textContent = isFinal ? '👑 FINAL TREASURE 👑' : '✨ CHAPTER CHEST ✨';
  if (refs.modalChestText) refs.modalChestText.textContent = rewardDrops.length ? (isFinal ? '终章宝箱解封中...' : '宝箱开启中...') : '';

  rewards.forEach(r => {
    const d = document.createElement('div');
    d.className = `glass rewardCell ${isFinal ? 'final-stat' : ''}`.trim();
    d.innerHTML = `<div class="n">${r.value}</div><div class="t">${r.label}</div>`;
    refs.modalRewards.appendChild(d);
  });

  if (refs.modalStats) {
    stats.forEach(s => {
      const d = document.createElement('div');
      d.className = `glass rewardCell ${isFinal ? 'final-stat' : ''}`.trim();
      d.innerHTML = `<div class="n">${s.value}</div><div class="t">${s.label}</div>`;
      refs.modalStats.appendChild(d);
    });
    refs.modalStats.style.display = stats.length ? 'grid' : 'none';
  }

  if (refs.modalDrops) {
    rewardDrops.forEach(item => {
      const d = document.createElement('div');
      d.className = `glass rewardCell chestDrop ${isFinal ? 'final-drop' : ''}`.trim();
      d.innerHTML = `<div class="n">${item.icon || '🎁'}</div><div class="t">${item.label}</div><div class="t">x${item.amount || 1}</div>`;
      refs.modalDrops.appendChild(d);
    });
    refs.modalDrops.style.display = rewardDrops.length ? 'grid' : 'none';
  }

  refs.modalRewards.style.display = rewards.length ? 'grid' : 'none';

  if (rewardDrops.length) {
    setTimeout(() => refs.modalChestBox?.classList.add('show'), 40);
    setTimeout(() => {
      refs.modalChestText && (refs.modalChestText.textContent = isFinal ? '终章宝箱已开启，终极奖励掉落如下' : '宝箱已开启，掉落如下');
      [...(refs.modalDrops?.children || [])].forEach((item, index) => {
        setTimeout(() => item.classList.add('reveal'), index * (isFinal ? 180 : 140));
      });
    }, isFinal ? 360 : 260);
  }

  buttons.forEach(b => {
    const btn = document.createElement('button');
    const finalTier = isFinal
      ? (b.text.includes('进入无尽模式') ? 'final-primary' : (b.text.includes('重新挑战 20 关') ? 'final-secondary' : 'final-ghost'))
      : '';
    btn.className = `${b.className || 'btn-main'} ${isFinal ? 'final-action-btn' : ''} ${finalTier}`.trim();
    btn.textContent = b.text;
    btn.onclick = b.onClick;
    refs.modalBtns.appendChild(btn);
  });

  refs.overlay.style.display = 'flex';
}

export function closeModal(refs) {
  refs.overlay.style.display = 'none';
}

export function openRewardPopup(refs, { badge = '奖励到账', title = '任务完成', text = '', rewards = [] }) {
  openModal(refs, {
    badge,
    title,
    text,
    rewards,
    stats: [],
    rewardDrops: [],
    chestVariant: 'chapter',
    buttons: [{ text: '收下奖励', className: 'btn-main', onClick: () => closeModal(refs) }]
  });
}

export function maybeShowTutorialTip(state, refs, step = 1) {
  if (state.tutorialSeen) return;
  if ((state.tutorialStepDone || 0) >= step) return;
  const tips = {
    1: '先记住卡牌位置，预览结束后再开始翻牌。',
    2: '一次翻开两张，相同就能消除，不同会扣生命。',
    3: '卡住时可以使用提示、找一对、护盾等道具。'
  };
  if (tips[step]) showToast(refs, `新手提示：${tips[step]}`, 2400);
  state.tutorialStepDone = step;
}

export function getChapterInfo(levelNumber) {
  const lv = Math.max(1, Number(levelNumber || 1));
  return CHAPTERS.find(c => lv >= c.start && lv <= c.end) || CHAPTERS[CHAPTERS.length - 1];
}

export function isChapterEnd(levelNumber) {
  const chapter = getChapterInfo(levelNumber);
  return levelNumber === chapter.end;
}

export function formatChapter(levelNumber) {
  const chapter = getChapterInfo(levelNumber);
  return `${chapter.name} · 第 ${chapter.start}-${chapter.end} 关`;
}

export function updateCostTexts(refs) {
  if (refs.hintCostText) refs.hintCostText.textContent = '观看广告使用';
  if (refs.revealPairCostText) refs.revealPairCostText.textContent = '优先消耗库存';
  if (refs.previewCostText) refs.previewCostText.textContent = '观看广告使用';
  if (refs.buyLifeCostText) refs.buyLifeCostText.textContent = '观看广告使用';
  if (refs.shuffleCostText) refs.shuffleCostText.textContent = '观看广告使用';
  if (refs.shieldCostText) refs.shieldCostText.textContent = '优先消耗库存';
  if (refs.freezeCostText) refs.freezeCostText.textContent = '优先消耗库存';
}

function updateGameHudPanel(state, refs) {
  const currentLevelNumber = Math.max(1, (state.level || 0) + 1);
  const endlessActive = !!state.endless;
  refs.levelText.textContent = endlessActive ? `∞-${state.endlessLoop || 1}` : currentLevelNumber;
  if (refs.chapterText) refs.chapterText.textContent = endlessActive ? `无尽挑战 · 第 ${state.endlessLoop || 1} 轮` : formatChapter(currentLevelNumber);
  refs.movesText.textContent = state.moves;
  refs.errorsText.textContent = state.errors;
  refs.livesText.textContent = state.lives;
  refs.supplyText.textContent = state.playing ? '广告补给' : '待机';
  if (refs.timerText) refs.timerText.textContent = state.timedLeft || 0;
  if (refs.shieldStatusText) refs.shieldStatusText.textContent = state.shieldCharges > 0 ? '已就绪' : '未激活';
  if (refs.freezeStatusText) refs.freezeStatusText.textContent = state.freezeActive ? `${Math.max(0, Math.ceil(state.freezeCharges || 0))}s` : '未激活';
  if (refs.timerBox) refs.timerBox.style.display = state.mode === 'timed' ? 'block' : 'none';
  if (refs.streakText) refs.streakText.textContent = `${state.winStreak % WIN_STREAK_REWARD_STEP} / ${WIN_STREAK_REWARD_STEP}`;
  if (refs.streakFill) refs.streakFill.style.width = `${((state.winStreak % WIN_STREAK_REWARD_STEP) / WIN_STREAK_REWARD_STEP) * 100}%`;
}

function updateHomeSummaryPanel(state, refs) {
  const bestLevelNumber = Math.max(0, Number(state.bestLevel || 0));
  const endlessActive = !!state.endless;
  refs.homeSupply.textContent = '广告补给';
  refs.homeBestLevel.textContent = bestLevelNumber > 0 ? `第 ${bestLevelNumber} 关` : '未通关';
  if (refs.homeBestEndless) refs.homeBestEndless.textContent = state.bestEndlessLoop || 0;
  if (refs.homeBestTimed) refs.homeBestTimed.textContent = state.bestTimedScore || 0;
  if (refs.homeCrownBadge) refs.homeCrownBadge.style.display = bestLevelNumber >= 20 ? 'block' : 'none';
  if (refs.homeCrownText) refs.homeCrownText.textContent = bestLevelNumber >= 20
    ? (endlessActive ? `终章已征服，当前无尽第 ${state.endlessLoop || 1} 轮推进中` : '已征服终极记忆塔，20 关正式版已通关')
    : '继续冲刺终极记忆塔';
  if (refs.homeChapterText) refs.homeChapterText.textContent = endlessActive ? `已进入无尽挑战 · 第 ${state.endlessLoop || 1} 轮` : formatChapter(bestLevelNumber > 0 ? bestLevelNumber : 1);
  if (refs.homeStatsText) refs.homeStatsText.textContent = `最高关卡 ${bestLevelNumber || 0} · 无尽 ${state.bestEndlessLoop || 0} 轮 · 限时 ${state.bestTimedScore || 0} 分`;
  if (refs.homeGrowthText) refs.homeGrowthText.textContent = `成长任务进度持续累积 · 最佳连胜 ${state.bestWinStreak || 0}`;
  if (refs.homeBagText) refs.homeBagText.textContent = `找一对 x${state.revealPairStock || 0} · 护盾 x${state.shieldStock || 0} · 冻结 x${state.freezeStock || 0}`;
  if (refs.homeSignInStreak) refs.homeSignInStreak.textContent = `${state.signinStreak || 0} 天`;
  if (refs.homeWinStreak) refs.homeWinStreak.textContent = state.winStreak || 0;
}

function updateHomeTaskPanel(state, refs, nextSignReward) {
  if (refs.homeTasksText) {
    const tasks = state.dailyTasks || {};
    refs.homeTasksText.textContent = `第3关 ${tasks.levelDone ? '✅' : '⬜'} · 用道具 ${tasks.toolDone ? '✅' : '⬜'} · 2连胜 ${tasks.streakDone ? '✅' : '⬜'}`;
  }
  if (refs.homeDailyStatus) {
    refs.homeDailyStatus.textContent = state.dailyChallengeDoneAt === todayStr() ? '已完成' : `通关第 ${DAILY_CHALLENGE_TARGET_LEVEL} 关`;
  }
  if (refs.dailyChallengeText) refs.dailyChallengeText.textContent = `经典模式通关第 ${DAILY_CHALLENGE_TARGET_LEVEL} 关`;
  if (refs.dailyChallengeRewardText) refs.dailyChallengeRewardText.textContent = '道具补给';
  if (refs.chapterRewardText) refs.chapterRewardText.textContent = '章节通关 + 道具掉落';
  if (refs.signInRewardText) refs.signInRewardText.textContent = `明日可领 道具包 / 每日送 找一对x${DAILY_TOOL_GIFT.revealPair} 护盾x${DAILY_TOOL_GIFT.shield} 冻结x${DAILY_TOOL_GIFT.freeze}`;
  if (refs.winStreakRewardText) refs.winStreakRewardText.textContent = `每 ${WIN_STREAK_REWARD_STEP} 连胜 + 道具补给`;
  if (refs.homeTaskCountdown) refs.homeTaskCountdown.textContent = `任务将在 ${getDailyResetCountdown()} 后刷新`;
}

function updateHomeGoalPanel(state, refs) {
  const goal = getHomeGoal(state);
  if (refs.homeGoalKicker) refs.homeGoalKicker.textContent = goal.kicker;
  if (refs.homeGoalTitle) refs.homeGoalTitle.textContent = goal.title;
  if (refs.homeGoalDesc) refs.homeGoalDesc.textContent = goal.desc;
  if (refs.homeGoalCard) {
    refs.homeGoalCard.classList.toggle('goal-complete', !renderDailyTaskCards._defs?.find(item => !item.done) && !NEWBIE_GROWTH_TASKS.find(item => !(state.newbieTasks || {})[`${item.key}Claimed`]));
  }
}

function updateProgressPanels(state, refs) {
  renderDailyTaskCards(state, refs);
  if (refs.homeNewbieText) {
    const progress = state.newbieTasks || {};
    const current = NEWBIE_GROWTH_TASKS.find(item => !progress[`${item.key}Claimed`]) || NEWBIE_GROWTH_TASKS[NEWBIE_GROWTH_TASKS.length - 1];
    const done = progress[`${current.key}Done`];
    const claimed = progress[`${current.key}Claimed`];
    refs.homeNewbieText.textContent = claimed
      ? `七日成长已完成：继续冲刺章节与无尽挑战`
      : `当前进行：第 ${current.day} 天 · ${current.label} ${done ? '✅ 已完成待领取' : '⬜ 进行中'}`;
  }
  renderSignGrid(state, refs);
  renderAchievements(state, refs);
  renderNewbieProgress(state, refs);
}

function updateModeControls(state, refs) {
  refs.btnSound.textContent = `音效：${state.soundOn ? '开' : '关'}`;
  if (refs.tutorialFab) refs.tutorialFab.textContent = state.tutorialSeen ? '查看玩法' : '新手引导';
  if (refs.btnModeClassic && refs.btnModeTimed) {
    refs.btnModeClassic.classList.toggle('active', state.mode === 'classic');
    refs.btnModeTimed.classList.toggle('active', state.mode === 'timed');
  }
}

function updateActionButtons(state, refs, ads) {
  const inPreviewPhase = !!state.playing && !!state.lock && state.moves === 0 && state.matched === 0;
  const inActiveTurn = !!state.playing && !state.lock;
  const hasOpenPair = (state.opened?.length || 0) > 0;
  const rewardedEnabled = ads?.isEnabled?.('rewarded');
  const interstitialEnabled = ads?.isEnabled?.('interstitial');

  const setBtnState = (btn, enabled, label) => {
    if (!btn) return;
    if (label) btn.textContent = label;
    btn.disabled = !enabled;
    btn.classList.toggle('is-disabled', !enabled);
  };

  setBtnState(refs.btnStart, !state.playing, state.playing ? '游戏进行中' : '立即开玩');
  setBtnState(refs.btnDaily, state.lastSignInDate !== todayStr(), state.lastSignInDate === todayStr() ? '今日已签到' : '签到领道具');
  setBtnState(refs.btnHomeBack, state.playing, '返回首页');
  setBtnState(refs.btnRestartLevel, state.playing, '重开本关');
  setBtnState(refs.btnModeClassic, !state.playing, '经典模式');
  setBtnState(refs.btnModeTimed, !state.playing, '限时模式');
  setBtnState(refs.btnHintBoost, inActiveTurn && !!rewardedEnabled, '提示（广告）');
  setBtnState(refs.btnRevealPair, inActiveTurn && !hasOpenPair && state.revealPairStock > 0, state.revealPairStock > 0 ? `找一对 x${state.revealPairStock}` : '找一对（缺库存）');
  setBtnState(refs.btnPreviewBoost, inPreviewPhase && !!rewardedEnabled, '预览 +1s（广告）');
  setBtnState(refs.btnBuyLife, state.playing && !!rewardedEnabled, '生命 +1（广告）');
  setBtnState(refs.btnShuffleBoost, inActiveTurn && !hasOpenPair && !!rewardedEnabled, '洗牌（广告）');
  setBtnState(refs.btnShieldBoost, state.playing && !state.lock && !hasOpenPair && state.shieldCharges < 1 && state.shieldStock > 0, state.shieldCharges > 0 ? '护盾已生效' : (state.shieldStock > 0 ? `护盾 x${state.shieldStock}` : '护盾（缺库存）'));
  setBtnState(refs.btnFreezeBoost, state.playing && state.mode === 'timed' && state.freezeStock > 0 && !state.freezeActive, state.freezeActive ? '冻结中' : (state.freezeStock > 0 ? `冻结 x${state.freezeStock}` : '冻结（缺库存）'));
  setBtnState(refs.btnShopReward, !!rewardedEnabled, '广告领道具包');
  setBtnState(refs.btnRewardLives, !!rewardedEnabled && state.playing, '广告+2生命');
  setBtnState(refs.btnInterstitialTest, !!interstitialEnabled, '插屏测试');
}

export function updateHUD(state, refs, ads) {
  const nextSignReward = SIGNIN_STREAK_REWARDS[Math.min(state.signinStreak || 0, SIGNIN_STREAK_REWARDS.length - 1)] || SIGNIN_STREAK_REWARDS[SIGNIN_STREAK_REWARDS.length - 1];
  updateCostTexts(refs);
  updateGameHudPanel(state, refs);
  updateHomeSummaryPanel(state, refs);
  updateHomeTaskPanel(state, refs, nextSignReward);
  updateHomeGoalPanel(state, refs);
  updateProgressPanels(state, refs);
  updateModeControls(state, refs);
  updateActionButtons(state, refs, ads);
}

export function applyAdsUIState(ads, refs) {
  const bannerEnabled = ads?.isEnabled?.('banner');
  const rewardedEnabled = ads?.isEnabled?.('rewarded');
  const interstitialEnabled = ads?.isEnabled?.('interstitial');
  const adsEnabled = ads?.isEnabled?.();

  if (refs.btnShopReward) refs.btnShopReward.style.display = rewardedEnabled ? '' : 'none';
  if (refs.btnRewardLives) refs.btnRewardLives.style.display = rewardedEnabled ? '' : 'none';
  if (refs.btnInterstitialTest) refs.btnInterstitialTest.style.display = interstitialEnabled ? '' : 'none';
  if (refs.bannerSlot) {
    refs.bannerSlot.style.display = bannerEnabled ? '' : 'block';
    if (!bannerEnabled) refs.bannerSlot.textContent = 'Banner 广告位已预留（暂未启用）';
  }
  if (refs.adsNoticeHomeText) {
    refs.adsNoticeHomeText.textContent = adsEnabled
      ? `${APP_BRAND_NAME} 广告模块已启用，具体广告位显示取决于对应配置。`
      : '前 3 关更偏新手友好：预览更长、特殊牌更少，道具也更容易买得起。';
  }
  if (refs.adsNoticeGame) {
    refs.adsNoticeGame.textContent = adsEnabled
      ? `${APP_BRAND_NAME} ${APP_VERSION}：广告模块已启用，可按配置逐步接入对应广告位。`
      : (ads?.state?.endless || refs.chapterText?.textContent?.includes('无尽挑战'))
        ? `${APP_BRAND_NAME} ${APP_VERSION}：无尽模式已激活，预览更短、特殊牌更多、奖励更高。`
        : `${APP_BRAND_NAME} ${APP_VERSION}：当前版本已做前期节奏优化，首局容错更高，前几关特殊牌干扰更低。`;
  }
}
