import { loadSave, saveState } from './storage.js';
import { TikTokAdsBridge } from './ads.js';
import { MemoryGameApp } from './game.js';
import { $, updateHUD, applyAdsUIState } from './ui.js';

const state = {
  level: 0,
  moves: 0,
  errors: 0,
  lives: 6,
  matched: 0,
  opened: [],
  deck: [],
  soundOn: true,
  bestLevel: 0,
  bestTimedScore: 0,
  bestEndlessLoop: 0,
  bestWinStreak: 0,
  achievements: {},
  shieldCharges: 0,
  freezeCharges: 0,
  revealPairStock: 0,
  shieldStock: 0,
  freezeStock: 0,
  dailyToolGiftAt: '',
  dailyTasks: {},
  dailyTasksAt: '',
  newbieTasks: {},
  tutorialSeen: false,
  tutorialStepDone: 0,
  guideCompleted: false,
  guideRewardClaimed: false,
  rewardUsedThisFail: false,
  dailyClaimAt: '',
  dailyChallengeDoneAt: '',
  signinStreak: 0,
  lastSignInDate: '',
  winStreak: 0,
  interstitialShownAt: 0,
  bannerVisible: false,
  playing: false,
  endless: false,
  endlessLoop: 0,
  mode: 'classic',
  timedLeft: 0,
  timedScore: 0,
  timerId: null,
  freezeTickId: null,
  freezeTimeoutId: null,
  previewTimerId: null,
  lock: true
};

const refs = {
  board: $('board'),
  overlay: $('overlay'),
  hint: $('hint'),
  toast: $('toast'),
  celebrate: $('celebrate'),
  specialFx: $('specialFx'),
  signGrid: $('signGrid'),
  streakFill: $('streakFill'),
  streakText: $('streakText'),
  modalBadge: $('modalBadge'),
  modalTitle: $('modalTitle'),
  modalText: $('modalText'),
  modalRewards: $('modalRewards'),
  modalDrops: $('modalDrops'),
  modalChestBox: $('modalChestBox'),
  modalChestBadge: $('modalChestBadge'),
  modalChestText: $('modalChestText'),
  finalCrown: $('finalCrown'),
  finalSubtitle: $('finalSubtitle'),
  modalStats: $('modalStats'),
  modalBtns: $('modalBtns'),
  bannerSlot: $('bannerSlot'),
  adsNoticeHome: $('adsNoticeHome'),
  adsNoticeHomeText: $('adsNoticeHomeText'),
  adsNoticeGame: $('adsNoticeGame'),
  dailyChallengeText: $('dailyChallengeText'),
  dailyChallengeRewardText: $('dailyChallengeRewardText'),
  signInRewardText: $('signInRewardText'),
  winStreakRewardText: $('winStreakRewardText'),
  chapterRewardText: $('chapterRewardText'),
  homeSignInStreak: $('homeSignInStreak'),
  homeWinStreak: $('homeWinStreak'),
  homeDailyStatus: $('homeDailyStatus'),
  homeCrownBadge: $('homeCrownBadge'),
  homeCrownText: $('homeCrownText'),
  homeChapterText: $('homeChapterText'),
  hintCostText: $('hintCostText'),
  revealPairCostText: $('revealPairCostText'),
  previewCostText: $('previewCostText'),
  buyLifeCostText: $('buyLifeCostText'),
  shuffleCostText: $('shuffleCostText'),
  shieldCostText: $('shieldCostText'),
  freezeCostText: $('freezeCostText'),
  levelText: $('levelText'),
  chapterText: $('chapterText'),
  movesText: $('movesText'),
  errorsText: $('errorsText'),
  livesText: $('livesText'),
  supplyText: $('supplyText'),
  homeSupply: $('homeSupply'),
  homeBestLevel: $('homeBestLevel'),
  homeBestTimed: $('homeBestTimed'),
  homeBestEndless: $('homeBestEndless'),
  homeStatsText: $('homeStatsText'),
  homeGrowthText: $('homeGrowthText'),
  homeBagText: $('homeBagText'),
  homeTasksText: $('homeTasksText'),
  homeGoalCard: $('homeGoalCard'),
  homeGoalKicker: $('homeGoalKicker'),
  homeGoalTitle: $('homeGoalTitle'),
  homeGoalDesc: $('homeGoalDesc'),
  dailyTaskCards: $('dailyTaskCards'),
  homeTaskCountdown: $('homeTaskCountdown'),
  homeNewbieText: $('homeNewbieText'),
  newbieProgress: $('newbieProgress'),
  achievementsWall: $('achievementsWall'),
  timerBox: $('timerBox'),
  timerText: $('timerText'),
  shieldStatusText: $('shieldStatusText'),
  freezeStatusText: $('freezeStatusText'),
  guideOverlay: $('guideOverlay'),
  guideCard: $('guideCard'),
  guideStepText: $('guideStepText'),
  guideTitle: $('guideTitle'),
  guideText: $('guideText'),
  btnGuideSkip: $('btnGuideSkip'),
  btnGuideNext: $('btnGuideNext'),
  tutorialFab: $('tutorialFab'),
  btnStart: $('btnStart'),
  btnDaily: $('btnDaily'),
  btnSound: $('btnSound'),
  btnHomeBack: $('btnHomeBack'),
  btnRestartLevel: $('btnRestartLevel'),
  btnShopReward: $('btnShopReward'),
  btnRewardLives: $('btnRewardLives'),
  btnInterstitialTest: $('btnInterstitialTest'),
  btnHintBoost: $('btnHintBoost'),
  btnRevealPair: $('btnRevealPair'),
  btnPreviewBoost: $('btnPreviewBoost'),
  btnBuyLife: $('btnBuyLife'),
  btnShuffleBoost: $('btnShuffleBoost'),
  btnShieldBoost: $('btnShieldBoost'),
  btnFreezeBoost: $('btnFreezeBoost'),
  btnModeClassic: $('btnModeClassic'),
  btnModeTimed: $('btnModeTimed')
};


loadSave(state);
const ads = new TikTokAdsBridge(state, refs);
ads.init();
const app = new MemoryGameApp(state, refs, ads);
updateHUD(state, refs, ads);
applyAdsUIState(ads, refs);
setInterval(() => updateHUD(state, refs, ads), 1000);
if (!state.tutorialSeen) {
  setTimeout(() => app.startHighlightGuide(), 260);
}

$('btnStart').addEventListener('click', () => app.startGame());
$('tutorialFab')?.addEventListener('click', () => app.startHighlightGuide(true));
$('btnGuideSkip')?.addEventListener('click', () => app.skipHighlightGuide());
$('btnGuideNext')?.addEventListener('click', () => app.nextHighlightGuide());
$('btnDaily').addEventListener('click', () => app.claimDaily());
$('btnShopReward').addEventListener('click', () => app.claimRewardSupply());
$('btnSound').addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  saveState(state);
  updateHUD(state, refs, ads);
});
$('btnResetSave').addEventListener('click', () => {
  if (confirm('确定清空本地存档吗？')) app.resetSave();
});
$('btnHomeBack').addEventListener('click', () => app.backHome());
$('btnRestartLevel').addEventListener('click', () => app.restartCurrentRun());
$('btnHintBoost').addEventListener('click', () => app.useHintBoost());
$('btnRevealPair').addEventListener('click', () => app.useRevealPair());
$('btnPreviewBoost').addEventListener('click', () => app.usePreviewBoost());
$('btnBuyLife').addEventListener('click', () => app.buyLife());
$('btnShuffleBoost').addEventListener('click', () => app.shuffleBoard());
$('btnShieldBoost').addEventListener('click', () => app.useShieldBoost());
$('btnFreezeBoost').addEventListener('click', () => app.useFreezeBoost());
$('btnRewardLives').addEventListener('click', async () => {
  const ok = await ads.showRewarded({ placement: 'manual_lives_bonus' });
  if (ok) {
    state.lives += 2;
    updateHUD(state, refs, ads);
  }
});
$('btnInterstitialTest').addEventListener('click', async () => {
  await ads.showInterstitial({ placement: 'manual_test' });
});
$('btnModeClassic').addEventListener('click', () => app.setMode('classic'));
$('btnModeTimed').addEventListener('click', () => app.setMode('timed'));
