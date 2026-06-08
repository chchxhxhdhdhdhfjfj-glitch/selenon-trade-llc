# 项目交接 / 现状说明（HANDOVER NOTES）

项目：Memory Tower（星际记忆翻翻乐）  
当前版本：v1.0.0-memory-tower

> 相关文档：
> - `README.md`
> - `DEVELOPMENT_TODO.md`
> - `QA_REGRESSION_CHECKLIST.md`
> - `PRELAUNCH_CHECKLIST.md`

---

## 1. 项目定位

当前项目定位为：

> 一个完成度较高的 H5 记忆翻牌小游戏基础包，已具备主线、成长、任务、成就、终章、无尽模式等内容层；广告部分保留桥接与预留位，但暂不接真实 SDK；当前资源体系已完成正式无金币化，采用“广告补给 + 背包库存”模型。

它适合继续做：
- 真机提测
- 平台包装
- 广告 SDK 接入
- 后续工程化拆分

它当前不适合直接被视为：
- 已完成 TikTok 商业上线包
- 已完成云存档/埋点/正式运营能力的产品

---

## 2. 当前目录关注点

核心文件：
- `index.html`：页面入口与结构
- `src/scripts/config.js`：数值、关卡、广告配置
- `src/scripts/storage.js`：本地存档（已加入 saveVersion/migrate 骨架）
- `src/scripts/ads.js`：广告桥接层（当前为预留位 + mock）
- `src/scripts/ui.js`：HUD / 首页 / 弹窗 / 进度展示
- `src/scripts/game.js`：核心玩法、道具、任务、结算、推进
- `src/scripts/app.js`：应用初始化与事件绑定
- `scripts/check-project.js`：静态项目自检

项目内新增文档：
- `DEVELOPMENT_TODO.md`：开发任务清单
- `QA_REGRESSION_CHECKLIST.md`：真机 / 回归测试清单
- `PRELAUNCH_CHECKLIST.md`：发布前检查项

---

## 3. 最近已完成的整理

### 已修复 / 已整理
1. 修复 `restartCurrentRun()` 生命值逻辑不一致
2. 修复 freeze 缺少可取消 timeout 的问题
3. 修复 `shuffleBoard()` 仅改 DOM 不改 `state.deck`
4. 补充局内临时状态清理
5. 文档版本号、路径说明同步到 `v1.0.0-memory-tower`
6. 拆分 `game.js` 中的通关 / 失败结算逻辑
7. 拆分道具 / 消费 / 卡牌局内状态逻辑
8. 拆分 `ui.js` 中的 `updateHUD()` 为多个小面板更新函数
9. 为 `storage.js` 增加 `saveVersion` 与 `migrateSave()` 骨架
10. 增加开发 TODO 与 QA 回归文档
11. 完成正式无金币化改造：移除金币结算、金币消费、金币存档字段与 coins 旧命名
12. 统一资源模型为“广告补给 + 背包库存”，并同步到 UI / 存档 / 文档命名

### 当前代码状态
- 比原始交付包更清晰、更稳
- 仍是原生 H5 单页项目
- 仍未正式拆分为多个脚本模块文件

---

## 4. 当前广告状态（非常重要）

当前广告层状态：

- 已保留：
  - Banner 预留位
  - 插屏桥接入口
  - 激励广告桥接入口
  - placement 配置
  - mockSuccess 成功模式
- 未完成：
  - 真实 TikTok 广告 SDK 接入
  - 加载失败/取消/无库存广告的真实回调策略
  - 商业化级别的发奖幂等与稳定性校验

### 结论
当前广告层应被理解为：

> 预留位 + 骨架 + 本地 mock 验证链路

而不是：

> 已真实接入广告 SDK

---

## 5. 当前存档状态

当前存档使用：
- `localStorage`

当前已具备：
- `saveVersion`
- `migrateSave(raw)` 骨架
- 默认值合并策略
- 损坏存档的警告输出
- 旧版本含金币字段存档的兼容读取（新版本已不再读取/写出 coins 相关字段）

当前仍缺少：
- 云存档
- 多版本迁移策略细化
- 更强的 schema 校验
- 账号或平台侧同步能力

---

## 6. 已知风险点

### 工程层
- `game.js` / `ui.js` 虽然已拆函数，但仍偏大
- 仍未真正拆文件模块
- `renderDailyTaskCards._defs/_prev` 仍是隐式状态设计
- 全量 HUD 刷新机制仍比较粗

### 产品层
- 未做真机完整回归
- 未接真实广告
- 未接云存档
- 未接埋点系统
- 正式无金币版本已完成，但仍需继续验证补给/库存链路在真机上的完整稳定性

### 测试层
- 目前仍以静态检查 + 手工 QA 为主
- 没有正式 E2E / 单元测试体系

---

## 7. 下一步建议顺序

### 第一优先：进入提测准备
1. 按 `QA_REGRESSION_CHECKLIST.md` 跑一轮完整真机 / 手工回归
2. 把回归结果记录为缺陷列表
3. 只修阻塞问题，不急着无限重构

### 第二优先：继续工程化
1. 拆 `game.js`
2. 拆 `ui.js`
3. 强化 `storage.js`
4. 增强 `scripts/check-project.js`

### 第三优先：平台与商业化
1. 决定是否接真实广告 SDK
2. 决定是否接埋点
3. 决定是否做云存档 / 远程配置

---

## 8. 建议接手人先读哪些文件

按顺序建议：
1. `README.md`
2. `DEVELOPMENT_TODO.md`
3. `QA_REGRESSION_CHECKLIST.md`
4. `PRELAUNCH_CHECKLIST.md`
5. `src/scripts/config.js`
6. `src/scripts/game.js`
7. `src/scripts/ui.js`
8. `src/scripts/ads.js`
9. `src/scripts/storage.js`

---

## 9. 当前建议原则

当前阶段建议遵循：

- 先保证可提测，再继续大拆
- 广告先预留，不急着硬接真实 SDK
- 先跑真机验证，再决定哪些问题优先修
- 如果继续开发，优先把问题记录化、清单化

---

## 10. 一句话总结

这个项目现在最适合被当成：

> 一个已完成较高内容层、已做过一轮结构整理、已切换为正式无金币资源模型、适合继续提测与工程化推进的 H5 小游戏基础工程。
