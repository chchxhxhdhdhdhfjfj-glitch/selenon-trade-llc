import { LEVELS, ICONS, PREVIEW_BOOST_MS, FREEZE_DURATION_SECONDS, TIMED_MODE_SECONDS, DAILY_CHALLENGE_TARGET_LEVEL, WIN_STREAK_REWARD_STEP, SPECIAL_CARD_LIFE_PENALTY, SPECIAL_CARD_TIME_BONUS, SPECIAL_CARD_VISUALS, DAILY_TOOL_GIFT, CHAPTER_TOOL_DROP, NEWBIE_GROWTH_TASKS } from './config.js';
import { saveState, clearSave } from './storage.js';
import { beep } from './audio.js';
import { showScreen, showToast, openModal, closeModal, updateHUD, todayStr, yesterdayStr, playSpecialFX, formatChapter, isChapterEnd, syncAchievements, maybeShowTutorialTip, openRewardPopup } from './ui.js';

const HIGHLIGHT_GUIDE_STEPS = [
  { key: 'start-area', title: '先从这里开始', text: '点击“立即开玩”进入主线闯关；新手建议先玩经典模式。' },
  { key: 'mode-switch', title: '切换游戏模式', text: '经典模式更稳，限时模式更刺激；前期建议先熟悉经典模式。' },
  { key: 'tools-area', title: '这些是你的道具区', text: '卡住时可以用提示、找一对、护盾、冻结时间，道具会放进背包。' },
  { key: 'signin', title: '别忘了每日补给', text: '每天签到都会送找一对、护盾、冻结等免费道具，先把背包补满再冲关。' },
  { key: 'battle-actions', title: '进入对局后看这里', text: '局内操作区负责保命和翻盘：提示、护盾、洗牌、冻结都在这。' }
];

const GUIDE_REWARD = {
  revealPair: 1,
  shield: 1,
  freeze: 1
};

export class MemoryGameApp {
  constructor(state, refs, ads) {
    this.state = state;
    this.refs = refs;
    this.ads = ads;
  }

  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  updateHUD() {
    document.body.classList.toggle('endless-theme', !!this.state.endless && !!this.state.playing);
    updateHUD(this.state, this.refs, this.ads);
  }

  setMode(mode) {
    if (this.state.playing) {
      showToast(this.refs, '请先结束当前对局，再切换模式');
      return;
    }
    this.state.mode = mode;
    this.state.endless = false;
    this.state.endlessLoop = 0;
    this.updateHUD();
    showToast(this.refs, mode === 'timed' ? '已切换到限时模式' : '已切换到经典模式');
  }

  celebrateWin() {
    if (!this.refs.celebrate) return;
    this.refs.celebrate.innerHTML = '';
    for (let i = 0; i < 18; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.animationDelay = `${Math.random() * 0.25}s`;
      piece.style.background = ['#8b5cf6', '#f59e0b', '#22c55e', '#38bdf8'][i % 4];
      this.refs.celebrate.appendChild(piece);
    }
    this.refs.celebrate.classList.add('show');
    setTimeout(() => {
      this.refs.celebrate.classList.remove('show');
      this.refs.celebrate.innerHTML = '';
    }, 1600);
  }

  addCoins(amount) {
    return amount;
  }

  ensureDailyTasks() {
    const today = todayStr();
    if (this.state.dailyTasksAt !== today) {
      this.state.dailyTasksAt = today;
      this.state.dailyTasks = {
        levelDone: false,
        toolDone: false,
        streakDone: false,
        levelClaimed: false,
        toolClaimed: false,
        streakClaimed: false
      };
      saveState(this.state);
    }
  }

  grantTaskReward(type) {
    const reward = DAILY_TASK_REWARDS[type];
    if (!reward) return;
    this.state.revealPairStock = (this.state.revealPairStock || 0) + (reward.revealPair || 0);
    this.state.shieldStock = (this.state.shieldStock || 0) + (reward.shield || 0);
    this.state.freezeStock = (this.state.freezeStock || 0) + (reward.freeze || 0);
    playSpecialFX(this.refs, 'reward', '🎯 任务完成');
    openRewardPopup(this.refs, {
      badge: 'DAILY TASK',
      title: '每日任务完成',
      text: '奖励已收入背包，继续完成更多目标吧。',
      rewards: [
        ...(reward.revealPair ? [{ value: `x${reward.revealPair}`, label: '找一对' }] : []),
        ...(reward.shield ? [{ value: `x${reward.shield}`, label: '护盾' }] : []),
        ...(reward.freeze ? [{ value: `x${reward.freeze}`, label: '冻结' }] : [])
      ]
    });
  }

  ensureNewbieTasks() {
    this.state.newbieTasks = this.state.newbieTasks || {};
  }

  grantNewbieReward(task) {
    const reward = task.reward || {};
    this.state.revealPairStock = (this.state.revealPairStock || 0) + (reward.revealPair || 0);
    this.state.shieldStock = (this.state.shieldStock || 0) + (reward.shield || 0);
    this.state.freezeStock = (this.state.freezeStock || 0) + (reward.freeze || 0);
    playSpecialFX(this.refs, 'reward', `🌟 第${task.day}天完成`);
    openRewardPopup(this.refs, {
      badge: `DAY ${task.day}`,
      title: '七日成长任务完成',
      text: `${task.label} 已完成，奖励已收入背包。`,
      rewards: [
        ...(reward.revealPair ? [{ value: `x${reward.revealPair}`, label: '找一对' }] : []),
        ...(reward.shield ? [{ value: `x${reward.shield}`, label: '护盾' }] : []),
        ...(reward.freeze ? [{ value: `x${reward.freeze}`, label: '冻结' }] : [])
      ]
    });
  }

  checkNewbieTasks() {
    this.ensureNewbieTasks();
    const progress = this.state.newbieTasks;
    NEWBIE_GROWTH_TASKS.forEach(task => {
      if (progress[`${task.key}Done`] && !progress[`${task.key}Claimed`]) {
        progress[`${task.key}Claimed`] = true;
        this.grantNewbieReward(task);
      }
    });
    saveState(this.state);
    this.updateHUD();
  }

  markNewbieTask(key) {
    this.ensureNewbieTasks();
    if (!this.state.newbieTasks[`${key}Done`]) {
      this.state.newbieTasks[`${key}Done`] = true;
      this.checkNewbieTasks();
    }
  }

  checkDailyTasks() {
    this.ensureDailyTasks();
    const tasks = this.state.dailyTasks;
    if (!tasks.levelDone && this.state.mode === 'classic' && this.state.level + 1 >= DAILY_CHALLENGE_TARGET_LEVEL) tasks.levelDone = true;
    if (!tasks.streakDone && (this.state.winStreak || 0) >= WIN_STREAK_REWARD_STEP) tasks.streakDone = true;
    if (this.state.bestLevel >= 2) this.markNewbieTask('clearLv2');
    if (this.state.bestLevel >= 4) this.markNewbieTask('clearLv4');
    if ((this.state.winStreak || 0) >= 2) this.markNewbieTask('streak2');
    if (tasks.levelDone && !tasks.levelClaimed) {
      tasks.levelClaimed = true;
      this.grantTaskReward('level');
    }
    if (tasks.toolDone && !tasks.toolClaimed) {
      tasks.toolClaimed = true;
      this.grantTaskReward('tool');
    }
    if (tasks.streakDone && !tasks.streakClaimed) {
      tasks.streakClaimed = true;
      this.grantTaskReward('streak');
    }
    saveState(this.state);
    this.updateHUD();
  }

  markToolTaskDone() {
    this.ensureDailyTasks();
    if (!this.state.dailyTasks.toolDone) {
      this.state.dailyTasks.toolDone = true;
      this.checkDailyTasks();
    }
  }

  unlockAchievements() {
    const unlocked = syncAchievements(this.state);
    if (unlocked.length) {
      unlocked.forEach(item => showToast(this.refs, `成就解锁：${item.icon} ${item.name}`));
      saveState(this.state);
      this.updateHUD();
    }
  }

  resetSave() {
    clearSave();
    this.stopTimer();
    closeModal(this.refs);
    this.state.soundOn = true;
    this.state.bestLevel = 0;
    this.state.bestTimedScore = 0;
    this.state.bestEndlessLoop = 0;
    this.state.bestWinStreak = 0;
    this.state.achievements = {};
    this.state.shieldCharges = 0;
    this.state.freezeCharges = 0;
    this.state.revealPairStock = 0;
    this.state.shieldStock = 0;
    this.state.freezeStock = 0;
    this.state.dailyToolGiftAt = '';
    this.state.dailyTasks = {};
    this.state.dailyTasksAt = '';
    this.state.newbieTasks = {};
    this.state.freezeActive = false;
    this.state.tutorialSeen = false;
    this.state.tutorialStepDone = 0;
    this.state.guideCompleted = false;
    this.state.guideRewardClaimed = false;
    this.state.guideStepIndex = 0;
    this.clearGuideHighlight();
    this.state.dailyClaimAt = '';
    this.state.dailyChallengeDoneAt = '';
    this.state.signinStreak = 0;
    this.state.lastSignInDate = '';
    this.state.winStreak = 0;
    this.state.playing = false;
    this.state.endless = false;
    this.state.endlessLoop = 0;
    this.state.level = 0;
    this.state.moves = 0;
    this.state.errors = 0;
    this.state.lives = 6;
    this.state.matched = 0;
    this.state.opened = [];
    this.state.deck = [];
    this.state.rewardUsedThisFail = false;
    this.state.interstitialShownAt = 0;
    this.state.bannerVisible = false;
    this.state.timedLeft = 0;
    this.state.timedScore = 0;
    this.state.lock = true;
    this.refs.board.innerHTML = '';
    this.refs.hint.style.display = 'none';
    this.ads.hideBanner();
    showScreen('homeScreen');
    this.updateHUD();
    saveState(this.state);
    showToast(this.refs, '存档已清空');
  }

  startTimer(reset = true) {
    if (this.state.timerId) clearInterval(this.state.timerId);
    if (this.state.freezeTickId) clearInterval(this.state.freezeTickId);
    if (this.state.mode !== 'timed') return;
    if (reset) {
      this.state.timedLeft = TIMED_MODE_SECONDS;
      this.state.timedScore = 0;
    }
    this.updateHUD();
    this.state.timerId = setInterval(() => {
      this.state.timedLeft = Math.max(0, this.state.timedLeft - 1);
      this.updateHUD();
      if (this.state.timedLeft <= 0) {
        clearInterval(this.state.timerId);
        this.state.timerId = null;
        this.onTimedEnd();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.state.timerId) clearInterval(this.state.timerId);
    if (this.state.freezeTickId) clearInterval(this.state.freezeTickId);
    if (this.state.freezeTimeoutId) clearTimeout(this.state.freezeTimeoutId);
    this.state.timerId = null;
    this.state.freezeTickId = null;
    this.state.freezeTimeoutId = null;
  }

  getLevelConfig() {
    const base = LEVELS[this.state.level] || LEVELS[LEVELS.length - 1];
    if (!this.state.endless) return base;
    return {
      ...base,
      previewMs: Math.max(ENDLESS_PREVIEW_MIN_MS, base.previewMs - this.state.endlessLoop * ENDLESS_PREVIEW_STEP_MS)
    };
  }

  buildSpecialMap(cardCount) {
    const map = {};
    if (this.state.level < 2 && !this.state.endless) return map;
    const pool = this.state.mode === 'timed' ? ['reward', 'time', 'bomb'] : ['reward', 'bomb', 'time'];
    const count = this.state.endless
      ? Math.min(5, 2 + this.state.endlessLoop)
      : (this.state.level < 4 ? 1 : Math.min(3, Math.max(1, Math.floor(this.state.level / 2))));
    const indexes = this.shuffle(Array.from({ length: cardCount }, (_, i) => i)).slice(0, count);
    indexes.forEach((idx, i) => { map[idx] = pool[i % pool.length]; });
    return map;
  }

  createBoard() {
    const conf = this.getLevelConfig();
    const icons = ICONS.slice(0, conf.pairs);
    this.state.deck = this.shuffle([...icons, ...icons]);
    this.state.moves = 0;
    this.state.errors = 0;
    this.state.matched = 0;
    this.state.lock = true;
    this.state.opened = [];
    this.state.rewardUsedThisFail = false;
    this.state.specialUsed = {};
    this.state.specialMap = this.buildSpecialMap(this.state.deck.length);
    this.refs.board.innerHTML = '';
    this.refs.board.style.gridTemplateColumns = `repeat(${conf.cols}, minmax(0,1fr))`;

    this.state.deck.forEach((icon, i) => {
      const el = document.createElement('div');
      el.className = 'card';
      el.dataset.icon = icon;
      el.dataset.index = i;
      const specialType = this.state.specialMap[i];
      if (specialType) {
        el.dataset.special = specialType;
        el.classList.add(SPECIAL_CARD_VISUALS[specialType].className);
      }
      el.innerHTML = `<div class="card-inner"><div class="face back">✦</div><div class="face front">${icon}</div></div>`;
      el.addEventListener('click', () => this.onCard(el));
      this.refs.board.appendChild(el);
    });

    this.updateHUD();
    this.previewCards(conf.previewMs);
  }

  previewCards(ms) {
    clearTimeout(this.state.previewTimerId);
    this.refs.hint.style.display = 'block';
    document.querySelectorAll('.card').forEach(c => c.classList.add('flipped'));
    this.state.previewTimerId = setTimeout(() => {
      document.querySelectorAll('.card').forEach(c => c.classList.remove('flipped'));
      this.refs.hint.style.display = 'none';
      this.state.lock = false;
      this.state.previewTimerId = null;
    }, ms);
  }

  triggerSpecial(card) {
    const idx = card.dataset.index;
    const type = card.dataset.special;
    if (!type || this.state.specialUsed[idx] || !this.state.playing) return;
    this.state.specialUsed[idx] = true;
    if (type === 'reward') {
      this.state.revealPairStock = (this.state.revealPairStock || 0) + 1;
      saveState(this.state);
      this.updateHUD();
      showToast(this.refs, '触发奖励牌：找一对 +1');
      playSpecialFX(this.refs, 'reward', '💎 找一对 +1');
      beep(this.state, 'hint');
    } else if (type === 'bomb') {
      this.state.lives = Math.max(0, this.state.lives - SPECIAL_CARD_LIFE_PENALTY);
      this.updateHUD();
      showToast(this.refs, `触发炸弹牌：生命 -${SPECIAL_CARD_LIFE_PENALTY}`);
      playSpecialFX(this.refs, 'bomb', `💣 -${SPECIAL_CARD_LIFE_PENALTY} 命`);
      beep(this.state, 'bad');
      if (this.state.lives <= 0) this.onLevelFail();
    } else if (type === 'time') {
      if (this.state.mode === 'timed') {
        this.state.timedLeft += SPECIAL_CARD_TIME_BONUS;
        this.updateHUD();
        showToast(this.refs, `触发时钟牌：+${SPECIAL_CARD_TIME_BONUS}s`);
        playSpecialFX(this.refs, 'time', `⏰ +${SPECIAL_CARD_TIME_BONUS}s`);
      } else {
        this.state.shieldStock = (this.state.shieldStock || 0) + 1;
        saveState(this.state);
        this.updateHUD();
        showToast(this.refs, '触发时钟牌：护盾 +1');
        playSpecialFX(this.refs, 'time', '⏰ 护盾 +1');
      }
      beep(this.state, 'hint');
    }
  }

  onCard(card) {
    if (!this.state.playing) return;
    if (this.state.lock) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    card.classList.add('flipped');
    this.markNewbieTask('firstFlip');
    this.triggerSpecial(card);
    this.state.opened.push(card);
    beep(this.state, 'flip');
    if (this.state.opened.length === 2) {
      this.state.moves++;
      this.updateHUD();
      this.checkOpened();
    }
  }

  checkOpened() {
    this.state.lock = true;
    const [a, b] = this.state.opened;
    if (!a || !b) {
      this.state.opened = [];
      this.state.lock = false;
      return;
    }
    const ok = a.dataset.icon === b.dataset.icon;
    if (ok) {
      a.classList.add('pulse-ok');
      b.classList.add('pulse-ok');
      setTimeout(() => {
        if (!this.state.playing) return;
        a.classList.add('matched');
        b.classList.add('matched');
        a.classList.remove('pulse-ok');
        b.classList.remove('pulse-ok');
        this.state.opened = [];
        this.state.matched++;
        this.state.lock = false;
        beep(this.state, 'ok');
        if (this.state.matched === LEVELS[this.state.level].pairs) this.onLevelPass();
      }, 320);
    } else {
      this.state.errors++;
      if (this.state.shieldCharges > 0) {
        this.state.shieldCharges = Math.max(0, this.state.shieldCharges - 1);
        showToast(this.refs, '护盾生效：本次失误未扣生命');
        playSpecialFX(this.refs, 'reward', '🛡️ 护盾挡下失误');
        beep(this.state, 'hint');
      } else {
        this.state.lives--;
      }
      this.state.winStreak = 0;
      a.classList.add('shake-bad');
      b.classList.add('shake-bad');
      saveState(this.state);
      this.updateHUD();
      beep(this.state, 'bad');
      setTimeout(() => {
        a.classList.remove('flipped', 'shake-bad');
        b.classList.remove('flipped', 'shake-bad');
        this.state.opened = [];
        if (!this.state.playing) return;
        this.state.lock = false;
        if (this.state.lives <= 0) this.onLevelFail();
      }, 820);
    }
  }

  clearGuideHighlight() {
    document.querySelectorAll('.guide-target').forEach(el => el.classList.remove('guide-target'));
  }

  renderGuideStep() {
    const step = HIGHLIGHT_GUIDE_STEPS[this.state.guideStepIndex] || HIGHLIGHT_GUIDE_STEPS[0];
    this.clearGuideHighlight();
    const target = document.querySelector(`[data-guide="${step.key}"]`);
    if (target) {
      target.classList.add('guide-target');
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    if (this.refs.guideOverlay) this.refs.guideOverlay.style.display = 'block';
    if (this.refs.guideStepText) this.refs.guideStepText.textContent = String(this.state.guideStepIndex + 1);
    if (this.refs.guideTitle) this.refs.guideTitle.textContent = step.title;
    if (this.refs.guideText) this.refs.guideText.textContent = step.text;
    if (this.refs.btnGuideNext) this.refs.btnGuideNext.textContent = this.state.guideStepIndex >= HIGHLIGHT_GUIDE_STEPS.length - 1 ? '完成并领礼包' : '下一步';
  }

  finishGuideReward() {
    if (this.state.guideRewardClaimed) return;
    this.state.revealPairStock = (this.state.revealPairStock || 0) + GUIDE_REWARD.revealPair;
    this.state.shieldStock = (this.state.shieldStock || 0) + GUIDE_REWARD.shield;
    this.state.freezeStock = (this.state.freezeStock || 0) + GUIDE_REWARD.freeze;
    this.state.guideRewardClaimed = true;
    playSpecialFX(this.refs, 'reward', '🎁 新手礼包已到账');
    showToast(this.refs, '新手礼包到账：找一对x1，护盾x1，冻结x1', 2600);
  }

  startHighlightGuide(force = false) {
    if (!force && this.state.tutorialSeen) return;
    this.state.guideStepIndex = 0;
    this.state.tutorialSeen = false;
    showScreen('homeScreen');
    closeModal(this.refs);
    this.renderGuideStep();
  }

  nextHighlightGuide() {
    if (this.state.guideStepIndex >= HIGHLIGHT_GUIDE_STEPS.length - 1) {
      this.clearGuideHighlight();
      if (this.refs.guideOverlay) this.refs.guideOverlay.style.display = 'none';
      this.state.tutorialSeen = true;
      this.state.guideCompleted = true;
      this.finishGuideReward();
      saveState(this.state);
      this.updateHUD();
      return;
    }
    this.state.guideStepIndex += 1;
    this.renderGuideStep();
  }

  skipHighlightGuide() {
    this.clearGuideHighlight();
    if (this.refs.guideOverlay) this.refs.guideOverlay.style.display = 'none';
    this.state.tutorialSeen = true;
    saveState(this.state);
    this.updateHUD();
    showToast(this.refs, '已跳过新手引导，后续可随时重新查看');
  }

  showTutorial(force = false) {
    this.startHighlightGuide(force);
  }

  startGame() {
    this.stopTimer();
    clearTimeout(this.state.previewTimerId);
    closeModal(this.refs);
    this.state.playing = true;
    this.state.endless = false;
    this.state.endlessLoop = 0;
    this.state.level = 0;
    this.state.lives = this.getRunStartLives();
    this.state.lock = true;
    this.state.opened = [];
    this.state.shieldCharges = 0;
    this.state.freezeCharges = 0;
    this.state.freezeActive = false;
    this.state.timedLeft = this.state.mode === 'timed' ? TIMED_MODE_SECONDS : 0;
    this.state.timedScore = 0;
    showScreen('gameScreen');
    this.ads.showBanner({ placement: 'game_bottom' });
    this.createBoard();
    this.startTimer();
    maybeShowTutorialTip(this.state, this.refs, 1);
    if (!this.state.tutorialSeen && this.state.level === 0) {
      setTimeout(() => maybeShowTutorialTip(this.state, this.refs, 2), 1800);
      setTimeout(() => maybeShowTutorialTip(this.state, this.refs, 3), 4200);
      saveState(this.state);
    }
  }

  getRunStartLives() {
    return this.state.mode === 'timed' ? 5 : 7;
  }

  resetTransientRunState() {
    this.state.lock = true;
    this.state.opened = [];
    this.state.rewardUsedThisFail = false;
    this.state.shieldCharges = 0;
    this.state.freezeCharges = 0;
    this.state.freezeActive = false;
    this.state.specialUsed = {};
    this.state.specialMap = {};
  }

  restartCurrentRun() {
    this.stopTimer();
    clearTimeout(this.state.previewTimerId);
    closeModal(this.refs);
    this.state.lives = this.getRunStartLives();
    this.resetTransientRunState();
    this.createBoard();
    if (this.state.mode === 'timed') this.startTimer();
  }

  backHome() {
    this.state.playing = false;
    this.stopTimer();
    clearTimeout(this.state.previewTimerId);
    this.state.previewTimerId = null;
    this.resetTransientRunState();
    this.state.deck = [];
    this.refs.hint.style.display = 'none';
    closeModal(this.refs);
    this.ads.hideBanner();
    showScreen('homeScreen');
    this.updateHUD();
  }

  onTimedEnd() {
    this.state.lock = true;
    this.state.playing = false;
    this.stopTimer();
    clearTimeout(this.state.previewTimerId);
    this.state.previewTimerId = null;
    this.refs.hint.style.display = 'none';
    const finalWinStreak = this.state.winStreak;
    const reachedLevel = this.state.level + 1;
    this.state.winStreak = 0;
    if (this.state.timedScore > this.state.bestTimedScore) {
      this.state.bestTimedScore = this.state.timedScore;
    }
    saveState(this.state);
    this.updateHUD();
    openModal(this.refs, {
      badge: 'TIME OVER',
      title: '限时结束',
      text: `你已冲到 ${formatChapter(reachedLevel)}，继续挑战还能刷新更高成绩。`,
      rewards: [{ value: `+${this.state.timedScore}`, label: '限时得分' }],
      stats: [
        { value: reachedLevel, label: '到达关卡' },
        { value: this.state.bestTimedScore, label: '历史最高分' },
        { value: finalWinStreak, label: '本局连胜' }
      ],
      buttons: [
        { text: '再来一局', className: 'btn-main', onClick: () => { closeModal(this.refs); this.startGame(); } },
        { text: '返回首页', className: 'btn-muted', onClick: () => { closeModal(this.refs); this.backHome(); } }
      ]
    });
  }

  checkDailyChallenge() {
    if (this.state.mode === 'classic' && this.state.level + 1 >= DAILY_CHALLENGE_TARGET_LEVEL && this.state.dailyChallengeDoneAt !== todayStr()) {
      this.state.revealPairStock = (this.state.revealPairStock || 0) + 1;
      this.state.shieldStock = (this.state.shieldStock || 0) + 1;
      this.state.freezeStock = (this.state.freezeStock || 0) + 1;
      this.state.dailyChallengeDoneAt = todayStr();
      saveState(this.state);
      this.updateHUD();
      showToast(this.refs, '每日挑战完成：已发放道具补给');
    }
  }

  applyWinStreakReward() {
    this.state.winStreak += 1;
    if (this.state.winStreak % WIN_STREAK_REWARD_STEP === 0) {
      this.state.revealPairStock = (this.state.revealPairStock || 0) + 1;
      playSpecialFX(this.refs, 'reward', `🔥 ${this.state.winStreak} 连胜`);
      showToast(this.refs, `连胜奖励：${this.state.winStreak} 连胜，找一对 +1`);
      beep(this.state, 'hint');
    }
  }

  getAdvanceLives() {
    return this.state.mode === 'timed' ? 5 : Math.max(5, 7 - Math.min(2, this.state.level));
  }

  finishActiveRound() {
    this.state.playing = false;
    this.state.lock = true;
    clearTimeout(this.state.previewTimerId);
    this.state.previewTimerId = null;
    this.refs.hint.style.display = 'none';
  }

  applyBasePassRewards() {
    const rewardSupply = this.state.endless ? 2 : 1;
    this.state.revealPairStock = (this.state.revealPairStock || 0) + rewardSupply;
    if (this.state.mode === 'timed') this.state.timedScore += rewardSupply;
    this.state.bestLevel = Math.max(this.state.bestLevel, this.state.level + 1);
    this.applyWinStreakReward();
    this.state.bestWinStreak = Math.max(this.state.bestWinStreak || 0, this.state.winStreak || 0);
    saveState(this.state);
    this.updateHUD();
    this.checkDailyChallenge();
    this.checkDailyTasks();
    this.unlockAchievements();
    return rewardSupply;
  }

  applyChapterPassRewards(chapterReward) {
    if (chapterReward <= 0) return;
    this.state.revealPairStock = (this.state.revealPairStock || 0) + CHAPTER_TOOL_DROP.revealPair;
    this.state.shieldStock = (this.state.shieldStock || 0) + CHAPTER_TOOL_DROP.shield;
    this.state.freezeStock = (this.state.freezeStock || 0) + CHAPTER_TOOL_DROP.freeze;
    if (this.state.mode === 'timed') this.state.timedScore += 1;
    saveState(this.state);
    this.updateHUD();
    showToast(this.refs, `章节通关奖励：找一对x${CHAPTER_TOOL_DROP.revealPair}，护盾x${CHAPTER_TOOL_DROP.shield}，冻结x${CHAPTER_TOOL_DROP.freeze}`, 2600);
    playSpecialFX(this.refs, 'reward', '🏆 章节补给');
  }

  buildPassSummary(rewardCoins) {
    const passedLevelNumber = this.state.level + 1;
    const isLast = !this.state.endless && this.state.level >= LEVELS.length - 1;
    const chapterClear = isChapterEnd(passedLevelNumber);
    const chapterReward = chapterClear ? 1 : 0;
    return {
      passedLevelNumber,
      isLast,
      chapterClear,
      chapterReward,
      totalFinalReward: rewardCoins + chapterReward
    };
  }

  async advanceAfterPass(summary) {
    closeModal(this.refs);
    await this.ads.maybeShowLevelInterstitial();
    if (this.state.endless) {
      this.state.endlessLoop += 1;
      this.state.bestEndlessLoop = Math.max(this.state.bestEndlessLoop || 0, this.state.endlessLoop);
      saveState(this.state);
    } else if (summary.isLast) {
      this.state.level = LEVELS.length - 1;
      this.state.endless = true;
      this.state.endlessLoop = 1;
    } else {
      this.state.level = this.state.level + 1;
    }
    this.state.lives = this.getAdvanceLives();
    this.resetTransientRunState();
    this.state.playing = true;
    this.createBoard();
  }

  buildPassButtons(summary, rewardCoins) {
    const nextAction = async () => this.advanceAfterPass(summary);
    const buttons = summary.isLast
      ? [
          { text: '进入无尽模式', className: 'btn-main', onClick: nextAction },
          { text: '重新挑战 20 关', className: 'btn-muted', onClick: () => { closeModal(this.refs); this.startGame(); } }
        ]
      : [{ text: this.state.endless ? '继续无尽挑战' : '下一关', className: 'btn-main', onClick: nextAction }];

    if (this.ads.isEnabled('rewarded')) {
      buttons.push({
        text: '看广告额外领护盾',
        className: 'btn-gold',
        onClick: async () => {
          const ok = await this.ads.showRewarded({ placement: 'bonus_supply_after_pass' });
          if (ok) {
            this.state.shieldStock = (this.state.shieldStock || 0) + 1;
            saveState(this.state);
            this.updateHUD();
            beep(this.state, 'hint');
            showToast(this.refs, '额外奖励到账：护盾 +1');
            await nextAction();
          } else {
            showToast(this.refs, '未完整观看，未获得额外奖励');
          }
        }
      });
    }

    return summary.isLast
      ? [
          ...buttons,
          { text: '返回首页', className: 'btn-muted', onClick: () => { closeModal(this.refs); this.backHome(); } }
        ]
      : buttons;
  }

  buildPassModalModel(summary, rewardCoins) {
    return {
      badge: summary.isLast ? 'FINAL CLEAR' : (summary.chapterClear ? 'CHAPTER CLEAR' : 'MISSION CLEAR'),
      title: summary.isLast ? '终章征服！' : (summary.chapterClear ? '章节通关！' : '过关成功！'),
      text: summary.isLast
        ? `你已征服 ${formatChapter(this.state.level + 1)}，完成了 20 关正式版的最终挑战，并收下终章道具补给。`
        : this.state.endless
          ? `无尽模式第 ${this.state.endlessLoop} 轮完成！本轮已发放补给，继续挑战会遇到更短预览与更多特殊牌。`
          : summary.chapterClear
          ? `你已征服 ${formatChapter(this.state.level + 1)}，并额外获得章节道具补给。`
          : `已突破 ${formatChapter(this.state.level + 1)}，本关补给已到账。`,
      rewards: [{ value: `x${rewardCoins}`, label: this.state.endless ? '本轮找一对补给' : '通关找一对补给' }],
      rewardDrops: summary.chapterReward > 0
        ? [
            { icon: summary.isLast ? '👑' : '🎯', label: summary.isLast ? '终章找一对' : '找一对', amount: CHAPTER_TOOL_DROP.revealPair },
            { icon: '🛡️', label: summary.isLast ? '终章护盾' : '护盾', amount: CHAPTER_TOOL_DROP.shield },
            { icon: '❄️', label: summary.isLast ? '终章冻结' : '冻结', amount: CHAPTER_TOOL_DROP.freeze }
          ]
        : [],
      chestVariant: summary.isLast ? 'final' : 'chapter',
      stats: summary.isLast
        ? [
            { value: 20, label: '通关总关数' },
            { value: this.state.moves, label: '终局步数' },
            { value: this.state.errors, label: '终局失误' },
            { value: this.state.lives, label: '剩余生命' },
            { value: this.state.winStreak, label: '最终连胜' },
            { value: summary.totalFinalReward, label: '本次补给' },
            { value: '背包已更新', label: '补给状态' },
            { value: formatChapter(this.state.level + 1), label: '最终章节' }
          ]
        : this.state.endless
          ? [
              { value: this.state.endlessLoop, label: '当前轮次' },
              { value: this.state.moves, label: '本轮步数' },
              { value: this.state.errors, label: '本轮失误' },
              { value: this.state.lives, label: '剩余生命' },
              { value: this.state.winStreak, label: '当前连胜' },
              { value: rewardCoins, label: '本轮补给' },
              { value: '更短预览 / 更多特殊牌', label: '无尽压力' }
            ]
          : [
              { value: this.state.moves, label: '本关步数' },
              { value: this.state.errors, label: '本关失误' },
              { value: this.state.lives, label: '剩余生命' },
              { value: this.state.winStreak, label: '当前连胜' },
              { value: formatChapter(this.state.level + 1), label: '当前章节' },
              { value: this.state.mode === 'timed' ? this.state.timedLeft : '经典', label: this.state.mode === 'timed' ? '剩余时间' : '当前模式' }
            ]
    };
  }

  getUnmatchedCards() {
    return [...document.querySelectorAll('.card:not(.matched)')];
  }

  spendCoins(_cost, _label) {
    showToast(this.refs, '当前版本已移除资源扣费逻辑');
    return false;
  }

  consumeStockOrCoins(stockKey, _cost, stockLabel, _unusedFallbackLabel, newbieTaskKey = '') {
    const hasStock = (this.state[stockKey] || 0) > 0;
    if (hasStock) {
      this.state[stockKey] = Math.max(0, (this.state[stockKey] || 0) - 1);
      saveState(this.state);
      this.updateHUD();
      if (stockLabel) showToast(this.refs, stockLabel);
      if (newbieTaskKey) this.markNewbieTask(newbieTaskKey);
      return { usedStock: true };
    }
    showToast(this.refs, '库存不足，暂不可使用');
    return { usedStock: false, failed: true };
  }

  applyToolUseFeedback(sound = 'hint') {
    beep(this.state, sound);
    this.markToolTaskDone();
  }

  withLockedCards(cards, effectMs, applyEffect) {
    this.state.lock = true;
    applyEffect(cards);
    setTimeout(() => {
      cards.forEach(card => {
        if (!this.state.opened.includes(card) && !card.classList.contains('matched')) card.classList.remove('flipped');
        card.classList.remove('hint-glow');
      });
      if (this.state.playing) this.state.lock = false;
    }, effectMs);
  }

  getRevealablePair() {
    const groups = new Map();
    this.getUnmatchedCards().forEach(card => {
      const icon = card.dataset.icon;
      if (!groups.has(icon)) groups.set(icon, []);
      groups.get(icon).push(card);
    });
    return [...groups.values()].find(list => list.length >= 2) || null;
  }

  applyFreezeEffect() {
    this.state.freezeActive = true;
    this.state.freezeCharges = FREEZE_DURATION_SECONDS;
    this.stopTimer();
    const freezeEndAt = Date.now() + FREEZE_DURATION_SECONDS * 1000;
    this.state.freezeTickId = setInterval(() => {
      this.state.freezeCharges = Math.max(0, (freezeEndAt - Date.now()) / 1000);
      this.updateHUD();
      if (this.state.freezeCharges <= 0 && this.state.freezeTickId) {
        clearInterval(this.state.freezeTickId);
        this.state.freezeTickId = null;
      }
    }, 200);
    this.state.freezeTimeoutId = setTimeout(() => {
      if (this.state.freezeTickId) {
        clearInterval(this.state.freezeTickId);
        this.state.freezeTickId = null;
      }
      this.state.freezeTimeoutId = null;
      if (!this.state.playing || this.state.mode !== 'timed') {
        this.state.freezeActive = false;
        this.state.freezeCharges = 0;
        this.updateHUD();
        return;
      }
      this.state.freezeActive = false;
      this.state.freezeCharges = 0;
      this.startTimer(false);
      this.updateHUD();
    }, FREEZE_DURATION_SECONDS * 1000);
  }

  getShuffledRemainingCardData() {
    const remainingCards = this.getUnmatchedCards();
    return {
      remainingCards,
      shuffledIcons: this.shuffle(remainingCards.map(card => card.dataset.icon)),
      shuffledSpecials: this.shuffle(remainingCards.map(card => card.dataset.special || ''))
    };
  }

  applyShuffledCardData(remainingCards, shuffledIcons, shuffledSpecials) {
    remainingCards.forEach((card, index) => {
      const icon = shuffledIcons[index];
      const specialType = shuffledSpecials[index];
      const deckIndex = Number(card.dataset.index);
      card.dataset.icon = icon;
      card.querySelector('.front').textContent = icon;
      if (Number.isInteger(deckIndex) && deckIndex >= 0) this.state.deck[deckIndex] = icon;
      card.classList.remove('flipped', 'hint-glow', 'pulse-ok', 'shake-bad');

      delete this.state.specialMap[card.dataset.index];
      delete this.state.specialUsed[card.dataset.index];
      card.classList.remove('special-reward', 'special-bomb', 'special-time');
      if (specialType) {
        card.dataset.special = specialType;
        this.state.specialMap[card.dataset.index] = specialType;
        card.classList.add(SPECIAL_CARD_VISUALS[specialType].className);
      } else {
        delete card.dataset.special;
      }
    });
  }

  buildFailButtons() {
    const buttons = [{ text: '重开本关', className: 'btn-danger', onClick: () => { closeModal(this.refs); this.restartCurrentRun(); } }];
    if (this.ads.isEnabled('rewarded')) {
      buttons.push({ text: '观看广告复活', className: 'btn-good', onClick: async () => {
        if (this.state.rewardUsedThisFail) return showToast(this.refs, '本次失败已使用过复活');
        const ok = await this.ads.showRewarded({ placement: 'revive_continue' });
        if (ok) {
          this.state.rewardUsedThisFail = true;
          this.state.lives = 2;
          this.state.lock = false;
          this.state.playing = true;
          this.updateHUD();
          closeModal(this.refs);
          showToast(this.refs, '复活成功：生命 +2');
        } else showToast(this.refs, '广告未完整观看，无法复活');
      }});
    }
    return buttons;
  }

  buildFailModalModel() {
    const remainingPairs = LEVELS[this.state.level].pairs - this.state.matched;
    return {
      badge: 'TRY AGAIN',
      title: '挑战失败',
      text: `你倒在了 ${formatChapter(this.state.level + 1)}，还差 ${remainingPairs} 对就能通关。可以观看广告复活，也可以直接重开本关。`,
      rewards: [],
      stats: [{ value: this.state.moves, label: '本关步数' }, { value: this.state.errors, label: '失误次数' }, { value: 0, label: '连胜已重置' }],
      buttons: this.buildFailButtons()
    };
  }

  playFinalChestBurst() {
    if (!this.refs.specialFx) return;
    for (let i = 0; i < 14; i += 1) {
      const spark = document.createElement('div');
      spark.className = 'gold-spark';
      spark.style.left = `${38 + Math.random() * 24}%`;
      spark.style.setProperty('--dx', `${-120 + Math.random() * 240}px`);
      spark.style.setProperty('--dy', `${-40 + Math.random() * 140}px`);
      this.refs.specialFx.appendChild(spark);
      setTimeout(() => spark.remove(), 1100);
    }
    playSpecialFX(this.refs, 'reward', '👑 终章宝箱开启');
  }

  async onLevelPass() {
    if (!this.state.playing) return;
    this.finishActiveRound();
    beep(this.state, 'win');
    this.celebrateWin();

    const rewardCoins = this.applyBasePassRewards();
    const summary = this.buildPassSummary(rewardCoins);
    this.applyChapterPassRewards(summary.chapterReward);

    openModal(this.refs, {
      ...this.buildPassModalModel(summary, rewardCoins),
      buttons: this.buildPassButtons(summary, rewardCoins)
    });
    if (summary.isLast) setTimeout(() => this.playFinalChestBurst(), 420);
  }

  onLevelFail() {
    if (!this.state.playing && this.refs.overlay.style.display === 'flex') return;
    this.finishActiveRound();
    this.state.winStreak = 0;
    saveState(this.state);
    openModal(this.refs, this.buildFailModalModel());
  }

  claimDaily() {
    const today = todayStr();
    if (this.state.lastSignInDate === today) return showToast(this.refs, '今天已经签过到了');
    if (this.state.lastSignInDate === yesterdayStr()) this.state.signinStreak += 1;
    else this.state.signinStreak = 1;
    this.state.lastSignInDate = today;
    this.state.dailyClaimAt = today;
    if (this.state.dailyToolGiftAt !== today) {
      this.state.revealPairStock = (this.state.revealPairStock || 0) + (DAILY_TOOL_GIFT.revealPair || 0);
      this.state.shieldStock = (this.state.shieldStock || 0) + (DAILY_TOOL_GIFT.shield || 0);
      this.state.freezeStock = (this.state.freezeStock || 0) + (DAILY_TOOL_GIFT.freeze || 0);
      this.state.dailyToolGiftAt = today;
    }
    this.markNewbieTask('dailySign');
    saveState(this.state);
    this.updateHUD();
    beep(this.state, 'hint');
    playSpecialFX(this.refs, 'reward', '签到道具已到账');
    showToast(this.refs, `签到成功：连续 ${this.state.signinStreak} 天，已领取今日道具补给`);
  }

  async claimRewardSupply() {
    const ok = await this.ads.showRewarded({ placement: 'home_bonus_supply' });
    if (ok) {
      this.state.revealPairStock = (this.state.revealPairStock || 0) + 1;
      this.state.shieldStock = (this.state.shieldStock || 0) + 1;
      this.state.freezeStock = (this.state.freezeStock || 0) + 1;
      saveState(this.state);
      this.updateHUD();
      beep(this.state, 'hint');
      showToast(this.refs, '广告奖励到账：找一对x1、护盾x1、冻结x1');
    } else showToast(this.refs, '未完整观看，奖励取消');
  }

  async useHintBoost() {
    if (this.state.lock) return showToast(this.refs, '当前阶段不能使用提示');
    const ok = await this.ads.showRewarded({ placement: 'tool_hint' });
    if (!ok) return showToast(this.refs, '未完整观看，无法使用提示');
    this.applyToolUseFeedback('hint');
    this.markNewbieTask('useHint');
    const unmatched = this.getUnmatchedCards();
    unmatched.forEach(c => c.classList.add('flipped', 'hint-glow'));
    this.state.lock = true;
    setTimeout(() => {
      unmatched.forEach(c => {
        if (!this.state.opened.includes(c)) c.classList.remove('flipped');
        c.classList.remove('hint-glow');
      });
      this.state.lock = false;
    }, 1200);
  }

  async usePreviewBoost() {
    if (!this.state.playing) return showToast(this.refs, '请先开始游戏');
    if (!this.state.lock) return showToast(this.refs, '额外预览只能在记忆阶段使用');
    if (this.state.opened.length > 0 || this.state.matched > 0 || this.state.moves > 0) return showToast(this.refs, '本关已经开始，不能再追加预览');
    const ok = await this.ads.showRewarded({ placement: 'tool_preview' });
    if (!ok) return showToast(this.refs, '未完整观看，无法获得额外预览');
    this.applyToolUseFeedback('hint');
    this.previewCards(PREVIEW_BOOST_MS);
  }

  async useRevealPair() {
    if (!this.state.playing) return showToast(this.refs, '请先开始游戏');
    if (this.state.lock) return showToast(this.refs, '当前阶段不能使用找一对');
    if (this.state.opened.length > 0) return showToast(this.refs, '请先完成当前翻牌');
    const pair = this.getRevealablePair();
    if (!pair) return showToast(this.refs, '当前没有可揭示的一对');
    const payment = this.consumeStockOrCoins('revealPairStock', 0, '已使用背包道具：找一对', '已揭示一对');
    if (payment.failed) return;
    this.applyToolUseFeedback('hint');
    this.withLockedCards(pair.slice(0, 2), 1100, cards => cards.forEach(card => card.classList.add('flipped', 'hint-glow')));
  }

  useShieldBoost() {
    if (!this.state.playing) return showToast(this.refs, '请先开始游戏');
    if (this.state.lock || this.state.opened.length > 0) return showToast(this.refs, '当前阶段不能开启护盾');
    if (this.state.shieldCharges > 0) return showToast(this.refs, '护盾已经生效中');
    const payment = this.consumeStockOrCoins('shieldStock', 0, '已使用背包道具：护盾', '护盾开启：下次失误不掉命', 'useShield');
    if (payment.failed) return;
    this.state.shieldCharges = 1;
    saveState(this.state);
    this.updateHUD();
    this.applyToolUseFeedback('hint');
    if (payment.usedStock) this.markNewbieTask('useShield');
    playSpecialFX(this.refs, 'reward', '🛡️ 护盾已开启');
  }

  useFreezeBoost() {
    if (!this.state.playing) return showToast(this.refs, '请先开始游戏');
    if (this.state.mode !== 'timed') return showToast(this.refs, '冻结时间仅限时模式可用');
    if (this.state.freezeActive) return showToast(this.refs, '冻结时间已生效');
    const payment = this.consumeStockOrCoins('freezeStock', 0, `已使用背包道具：冻结 ${FREEZE_DURATION_SECONDS} 秒`, `时间冻结 ${FREEZE_DURATION_SECONDS} 秒`);
    if (payment.failed) return;
    this.state.freezeActive = true;
    this.state.freezeCharges = FREEZE_DURATION_SECONDS;
    saveState(this.state);
    this.updateHUD();
    this.applyToolUseFeedback('hint');
    playSpecialFX(this.refs, 'time', `❄️ 冻结 ${FREEZE_DURATION_SECONDS}s`);
    this.applyFreezeEffect();
  }

  async buyLife() {
    if (!this.state.playing) return showToast(this.refs, '请先开始游戏');
    const ok = await this.ads.showRewarded({ placement: 'manual_life_plus_one' });
    if (!ok) return showToast(this.refs, '未完整观看，无法增加生命');
    this.state.lives += 1;
    saveState(this.state);
    this.updateHUD();
    this.applyToolUseFeedback('hint');
    showToast(this.refs, '广告补给成功：生命 +1');
  }

  async shuffleBoard() {
    if (!this.state.playing) return showToast(this.refs, '请先开始游戏');
    if (this.state.lock) return showToast(this.refs, '当前阶段不能洗牌');
    if (this.state.opened.length > 0) return showToast(this.refs, '请先完成当前翻开的卡牌');
    const ok = await this.ads.showRewarded({ placement: 'tool_shuffle' });
    if (!ok) return showToast(this.refs, '未完整观看，无法洗牌');
    const { remainingCards, shuffledIcons, shuffledSpecials } = this.getShuffledRemainingCardData();
    this.applyShuffledCardData(remainingCards, shuffledIcons, shuffledSpecials);
    this.state.opened = [];
    this.applyToolUseFeedback('hint');
    showToast(this.refs, '广告补给成功：洗牌完成');
  }
}
