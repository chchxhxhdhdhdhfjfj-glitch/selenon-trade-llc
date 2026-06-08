import { STORAGE_KEY } from './config.js';

const SAVE_VERSION = 1;

function createDefaultSave() {
  return {
    saveVersion: SAVE_VERSION,
    soundOn: true,
    bestLevel: 0,
    dailyClaimAt: '',
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
    signinStreak: 0,
    lastSignInDate: '',
    winStreak: 0,
    dailyChallengeDoneAt: ''
  };
}

function migrateSave(raw) {
  const base = createDefaultSave();
  const data = raw && typeof raw === 'object' ? raw : {};
  return {
    ...base,
    ...data,
    saveVersion: SAVE_VERSION,
    achievements: data.achievements || {},
    dailyTasks: data.dailyTasks || {},
    newbieTasks: data.newbieTasks || {}
  };
}

export function loadSave(state) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = migrateSave(JSON.parse(raw));
    state.soundOn = data.soundOn !== false;
    state.bestLevel = Number(data.bestLevel || 0);
    state.dailyClaimAt = data.dailyClaimAt || '';
    state.bestTimedScore = Number(data.bestTimedScore || 0);
    state.bestEndlessLoop = Number(data.bestEndlessLoop || 0);
    state.bestWinStreak = Number(data.bestWinStreak || 0);
    state.achievements = data.achievements || {};
    state.shieldCharges = Number(data.shieldCharges || 0);
    state.freezeCharges = Number(data.freezeCharges || 0);
    state.revealPairStock = Number(data.revealPairStock || 0);
    state.shieldStock = Number(data.shieldStock || 0);
    state.freezeStock = Number(data.freezeStock || 0);
    state.dailyToolGiftAt = data.dailyToolGiftAt || '';
    state.dailyTasks = data.dailyTasks || {};
    state.dailyTasksAt = data.dailyTasksAt || '';
    state.newbieTasks = data.newbieTasks || {};
    state.tutorialSeen = data.tutorialSeen === true;
    state.tutorialStepDone = Number(data.tutorialStepDone || 0);
    state.guideCompleted = data.guideCompleted === true;
    state.guideRewardClaimed = data.guideRewardClaimed === true;
    state.signinStreak = Number(data.signinStreak || 0);
    state.lastSignInDate = data.lastSignInDate || '';
    state.winStreak = Number(data.winStreak || 0);
    state.dailyChallengeDoneAt = data.dailyChallengeDoneAt || '';
  } catch (e) {
    console.warn('[storage] loadSave failed, ignore broken save', e);
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    saveVersion: SAVE_VERSION,
    soundOn: state.soundOn,
    bestLevel: state.bestLevel,
    dailyClaimAt: state.dailyClaimAt,
    bestTimedScore: state.bestTimedScore || 0,
    bestEndlessLoop: state.bestEndlessLoop || 0,
    bestWinStreak: state.bestWinStreak || 0,
    achievements: state.achievements || {},
    shieldCharges: state.shieldCharges || 0,
    freezeCharges: state.freezeCharges || 0,
    revealPairStock: state.revealPairStock || 0,
    shieldStock: state.shieldStock || 0,
    freezeStock: state.freezeStock || 0,
    dailyToolGiftAt: state.dailyToolGiftAt || '',
    dailyTasks: state.dailyTasks || {},
    dailyTasksAt: state.dailyTasksAt || '',
    newbieTasks: state.newbieTasks || {},
    tutorialSeen: !!state.tutorialSeen,
    tutorialStepDone: state.tutorialStepDone || 0,
    guideCompleted: !!state.guideCompleted,
    guideRewardClaimed: !!state.guideRewardClaimed,
    signinStreak: state.signinStreak || 0,
    lastSignInDate: state.lastSignInDate || '',
    winStreak: state.winStreak || 0,
    dailyChallengeDoneAt: state.dailyChallengeDoneAt || ''
  }));
}

export function clearSave() {
  localStorage.removeItem(STORAGE_KEY);
}
