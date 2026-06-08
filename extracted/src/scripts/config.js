export const STORAGE_KEY = 'tiktok_memory_game_save_v5';
export const APP_VERSION = 'v1.0.0-memory-tower';
export const APP_BRAND_NAME = 'Memory Tower';
export const PREVIEW_BOOST_MS = 1400;
export const FREEZE_DURATION_SECONDS = 6;
export const TIMED_MODE_SECONDS = 60;
export const DAILY_CHALLENGE_TARGET_LEVEL = 3;
export const SIGNIN_STREAK_REWARDS = [0, 0, 0, 0, 0, 0, 0];
export const WIN_STREAK_REWARD_STEP = 2;
export const SPECIAL_CARD_LIFE_PENALTY = 1;
export const SPECIAL_CARD_TIME_BONUS = 5;
export const SPECIAL_CARD_VISUALS = {
  reward: { icon: '💎', label: '奖励牌', className: 'special-reward' },
  bomb: { icon: '💣', label: '炸弹牌', className: 'special-bomb' },
  time: { icon: '⏰', label: '时钟牌', className: 'special-time' }
};

export const DAILY_TOOL_GIFT = {
  revealPair: 2,
  shield: 1,
  freeze: 1,
  hint: 1,
  preview: 1,
  shuffle: 1,
  life: 1
};

export const CHAPTER_TOOL_DROP = {
  revealPair: 1,
  shield: 1,
  freeze: 1,
  hint: 1,
  preview: 1,
  shuffle: 1,
  life: 1
};

export const DAILY_TASK_REWARDS = {
  level: { revealPair: 1, shield: 0, freeze: 0 },
  tool: { revealPair: 0, shield: 1, freeze: 0 },
  streak: { revealPair: 0, shield: 0, freeze: 1 }
};

export const NEWBIE_GROWTH_TASKS = [
  { day: 1, key: 'firstFlip', label: '完成 1 次翻牌', reward: { revealPair: 1, shield: 0, freeze: 0 } },
  { day: 2, key: 'useHint', label: '使用 1 次提示', reward: { revealPair: 0, shield: 1, freeze: 0 } },
  { day: 3, key: 'clearLv2', label: '通关第 2 关', reward: { revealPair: 1, shield: 0, freeze: 0 } },
  { day: 4, key: 'useShield', label: '使用 1 次护盾', reward: { revealPair: 0, shield: 1, freeze: 0 } },
  { day: 5, key: 'dailySign', label: '完成 1 次签到', reward: { revealPair: 0, shield: 0, freeze: 1 } },
  { day: 6, key: 'streak2', label: '达成 2 连胜', reward: { revealPair: 1, shield: 0, freeze: 0 } },
  { day: 7, key: 'clearLv4', label: '通关第 4 关', reward: { revealPair: 1, shield: 1, freeze: 1 } }
];

export const AD_CONFIG = {
  enabled: true,
  mockSuccess: false,
  provider: 'tiktok',
  banner: {
    enabled: false,
    adUnitId: '',
    placement: 'game_bottom'
  },
  interstitial: {
    enabled: true,
    adUnitId: 'ad7639720232982038549',
    placement: 'level_finish',
    cooldownMs: 45000
  },
  rewarded: {
    enabled: true,
    adUnitId: 'ad7639654729953576980',
    placements: {
      revive: 'revive_continue',
      doubleSupply: 'bonus_supply_after_pass',
      homeBonus: 'home_bonus_supply',
      extraLives: 'manual_lives_bonus',
      hint: 'tool_hint',
      preview: 'tool_preview',
      manualLife: 'manual_life_plus_one',
      shuffle: 'tool_shuffle'
    }
  }
};

export const LEVELS = [
  { pairs: 3, cols: 3, previewMs: 2600 },
  { pairs: 4, cols: 4, previewMs: 2350 },
  { pairs: 6, cols: 4, previewMs: 2100 },
  { pairs: 8, cols: 4, previewMs: 1800 },
  { pairs: 10, cols: 5, previewMs: 1650 },
  { pairs: 12, cols: 6, previewMs: 1500 },
  { pairs: 14, cols: 5, previewMs: 1420 },
  { pairs: 16, cols: 6, previewMs: 1340 },
  { pairs: 17, cols: 6, previewMs: 1280 },
  { pairs: 18, cols: 6, previewMs: 1220 },
  { pairs: 19, cols: 6, previewMs: 1160 },
  { pairs: 20, cols: 6, previewMs: 1100 },
  { pairs: 22, cols: 6, previewMs: 1040 },
  { pairs: 24, cols: 6, previewMs: 980 },
  { pairs: 26, cols: 6, previewMs: 930 },
  { pairs: 28, cols: 7, previewMs: 880 },
  { pairs: 30, cols: 7, previewMs: 840 },
  { pairs: 32, cols: 8, previewMs: 800 },
  { pairs: 36, cols: 8, previewMs: 760 },
  { pairs: 40, cols: 8, previewMs: 720 }
];

export const ICONS = [
  '🚀','🪐','👽','🌌','☄️','🌠','🛰️','🔭','🌙','⭐',
  '🛸','🌍','🌞','⚡','💎','🎯','🎁','🧠','🧪','🔮',
  '🧩','🎲','🪄','🧲','🧿','🕹️','🎮','🧬','🔋','📡',
  '🌋','🧊','🔥','🌈','🍀','🐉','🦄','👑','🛡️','⚔️'
];
