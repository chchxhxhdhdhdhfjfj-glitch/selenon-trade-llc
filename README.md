# 星际记忆翻翻乐（20 关正式版 + 无尽模式）

**当前版本：v1.0.0-memory-tower**

## 文档导航

建议阅读顺序：
1. `HANDOVER_NOTES.md`：项目现状 / 交接说明
2. `DEVELOPMENT_TODO.md`：开发任务清单
3. `QA_REGRESSION_CHECKLIST.md`：真机 / 回归测试清单
4. `TEST_REPORT_TEMPLATE.md`：测试记录模板
5. `TEST_REPORT_ROUND1.md`：第一轮测试报告实例
6. `TEST_REPORT_ROUND2.md`：第二轮结构回归报告
7. `TEST_REPORT_ROUND3.md`：第三轮交互级 smoke 报告
8. `TEST_REPORT_ROUND4.md`：第四轮局内功能级回归报告
9. `TEST_REPORT_ROUND4_TEMPLATE.md`：第四轮局内功能级测试模板
10. `ROUND4_REGRESSION_PLAN.md`：第四轮局内功能级回归计划
11. `BUG_LOG.md`：缺陷跟踪台账
12. `PRELAUNCH_CHECKLIST.md`：发布前检查项
13. `DELIVERY_CHECKLIST.md`：交付打包说明

这是一个已经完成主线包装、成长系统补强与终章收尾的 H5 记忆翻牌小游戏项目。
当前版本目标不是“玩法原型”，而是一个更接近 **可提测、可继续商业化接入、可继续做产品包装** 的正式版基础包。

---

## 当前版本特性

### 主线内容
- 20 关正式版关卡曲线
- 5 章节包装（每章 4 关）
- 首页章节进度展示
- 游戏内章节展示
- 章节奖励
- 章节通关弹窗
- 第 20 关最终结局页
- 终章专属徽印 / 金色结算 / 王冠标题层

### 玩法与成长
- 正式无金币资源模型（广告补给 + 背包库存）
- 道具系统：提示 / 找一对 / 额外预览 / 生命补给 / 洗牌 / 护盾 / 冻结时间
- 七日签到
- 每日挑战
- 每日任务（3 卡片展示）
- 七日新手成长任务
- 连胜奖励
- 特殊牌机制（奖励 / 炸弹 / 时钟）
- 新手引导与引导礼包

### 留存与记录
- 成就墙
- 成长记录展示
- 战绩总览展示
- 首页当前目标聚焦卡
- 道具背包展示
- 无尽最高轮次记录
- 最佳连胜记录
- 背包补给记录

### 收尾扩展
- 第 20 关后可进入无尽模式
- 无尽模式轮次推进
- 无尽模式预览时间递减
- 无尽模式特殊牌密度增加
- 无尽模式奖励额外加成
- 首页显示无尽最高轮次

### 广告接入状态
- 已保留 Banner / 插屏 / 激励广告桥接层
- 默认关闭真实广告，不影响本地纯玩法测试
- 已提供 Mock 成功模式，便于本地验证发奖 / 插屏链路
- 后续可在 `src/scripts/ads.js` 接 TikTok 官方广告 API

---

## 项目结构

- `index.html`：页面入口
- `minigame.config.json`：小游戏基础配置
- `src/styles/main.css`：页面样式
- `src/scripts/config.js`：玩法数值 / 关卡 / 奖励 / 广告配置
- `src/scripts/storage.js`：本地存档读写
- `src/scripts/audio.js`：音效
- `src/scripts/ads.js`：广告桥接层
- `src/scripts/ui.js`：HUD / 弹窗 / 首页展示 / 章节展示
- `src/scripts/game.js`：核心玩法逻辑
- `src/scripts/app.js`：应用启动与事件绑定
- `DELIVERY_CHECKLIST.md`：交付打包说明
- `PRELAUNCH_CHECKLIST.md`：发布前检查项
- `scripts/check-project.js`：自动化项目自检脚本

---

## 当前关键数值

### 核心资源模型
- 已移除金币结算、金币消耗与金币存档字段
- 当前资源来源：签到 / 每日挑战 / 章节奖励 / 特殊牌 / 激励广告
- 当前资源使用：广告触发型能力 + 背包库存型道具（当前库存持久化字段已覆盖 `revealPair / shield / freeze`）
- `PREVIEW_BOOST_MS = 1400`
- `FREEZE_DURATION_SECONDS = 6`

### 奖励相关
- 每日签到：发放每日道具补给
- 每日挑战：发放找一对 / 护盾 / 冻结奖励
- 章节通关：发放章节道具补给
- 特殊牌：奖励牌给道具、时钟牌给时间或护盾
- `SPECIAL_CARD_TIME_BONUS = 5`

### 无尽模式
- `ENDLESS_PREVIEW_STEP_MS = 20`
- `ENDLESS_PREVIEW_MIN_MS = 420`

---

## 章节划分

1. 新手星区：第 1–4 关
2. 流星回廊：第 5–8 关
3. 银河迷阵：第 9–12 关
4. 量子深空：第 13–16 关
5. 终极记忆塔：第 17–20 关

章节末关：
- 第 4 关
- 第 8 关
- 第 12 关
- 第 16 关
- 第 20 关

这些关卡通关时会触发额外章节奖励与宝箱掉落展示。

---

## 无尽模式说明

当玩家打通第 20 关后，最终结局页会提供：
- 进入无尽模式
- 重新挑战 20 关
- 返回首页

无尽模式特性：
- HUD 显示为 `∞-轮次`
- 首页显示当前已进入无尽状态
- 记录无尽最高轮次
- 每轮预览时间继续压缩
- 特殊牌数量逐渐增加
- 奖励会体现为更高的补给收益

---

## 当前存档内容

本地存档当前会保存：
- 音效开关 `soundOn`
- 最高关卡 `bestLevel`
- 限时最高分 `bestTimedScore`
- 无尽最高轮次 `bestEndlessLoop`
- 最佳连胜 `bestWinStreak`
- 成就解锁状态 `achievements`
- 护盾状态 `shieldCharges`
- 冻结状态 `freezeCharges`
- 背包库存：
  - `revealPairStock`
  - `shieldStock`
  - `freezeStock`
- 每日道具补给日期 `dailyToolGiftAt`
- 每日任务状态 `dailyTasks`
- 每日任务刷新日期 `dailyTasksAt`
- 新手成长任务状态 `newbieTasks`
- 引导状态：
  - `tutorialSeen`
  - `tutorialStepDone`
  - `guideCompleted`
  - `guideRewardClaimed`
- 连续签到 `signinStreak`
- 最后签到日期 `lastSignInDate`
- 当前连胜 `winStreak`
- 每日挑战完成日期 `dailyChallengeDoneAt`

---

## 提测重点清单

建议至少验证以下链路：

### A. 主线流程
- 首页进入经典模式
- 从第 1 关正常打到后续关卡
- 章节文案是否随关卡正确变化
- 第 4 / 8 / 12 / 16 / 20 关是否触发章节奖励

### B. 第 20 关结局
- 第 20 关通关后是否出现最终结局页
- 是否显示终章奖励与终章宝箱
- 是否显示终章金色视觉样式
- 是否可选择“进入无尽模式”
- 是否可选择“重新挑战 20 关”

### C. 无尽模式
- 进入无尽后 HUD 是否显示 `∞-1`
- 通关后是否进入 `∞-2 / ∞-3`
- 首页是否记录无尽最高轮次
- 无尽奖励是否高于普通关卡
- 无尽预览是否逐轮变短

### D. 道具与失败恢复
- 提示道具
- 找一对
- 额外预览
- 生命补给（广告补给）
- 洗牌
- 护盾
- 冻结时间
- 失败后重开本关
- 返回首页
- 切换经典 / 限时模式

### E. 限时模式
- 倒计时是否正常
- 冻结时间是否实时倒数
- 限时结束弹窗是否正常
- 限时最高分是否刷新

### F. 存档一致性
- 刷新页面后最高关卡、无尽最高轮次、背包库存是否保留
- 道具库存是否保留
- 成就与成长记录是否保留
- 清空存档后是否恢复初始状态

---

## 自动检查

可运行：

```bash
cd ./tiktok-memory-game-project
node scripts/check-project.js
```

当前检查内容：
- `LEVELS` 与 `ICONS` 是否安全匹配
- 关键 DOM id 是否存在
- `app.js` 默认 state 与 `storage.js` 保存字段是否基本对齐
- README 是否包含当前版本号
- 品牌名与广告 Mock 配置是否存在

---

## 已知限制 / 已知问题

- 当前版本仍以 H5 本地回归为主，未完成真实 TikTok 广告 SDK 接入验证。
- 广告层为预留桥接状态，尚未接入真实 TikTok 广告 API。
- 存档当前基于 `localStorage`，未接入云存档。
- 尚未加入埋点分析、分享裂变、远程活动配置等商业化能力。
- 当前没有正式的单元测试 / E2E 测试，主要依赖静态检查、headless smoke 与手工提测。
- Round 4 局内功能级回归材料已准备，但完整真机/手工回归仍需继续执行。

---

## 广告接入说明

当前版本广告逻辑为“正式接入预留模式”：
- 已保留广告按钮与桥接层
- 默认不启用真实广告
- 已提供 Mock 成功模式，便于本地验证奖励与插屏链路
- 不影响纯玩法测试

主要关注文件：
- `src/scripts/config.js`
- `src/scripts/ads.js`

后续接入 TikTok 广告时，重点实现：
- `showBanner()`
- `hideBanner()`
- `showInterstitial()`
- `showRewarded()`
- `maybeShowLevelInterstitial()`

---

## 当前定位

这版已经不是最初原型，而是一个：
- 可继续本地试玩
- 可做功能提测
- 可继续接广告 SDK
- 可继续做平台包装
- 已完成正式无金币化清理
- 可继续做商业化深化

的正式基础版本。
