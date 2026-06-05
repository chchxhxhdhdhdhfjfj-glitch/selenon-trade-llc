# 第二轮测试报告（ROUND 2 TEST REPORT）

项目：Memory Tower（星际记忆翻翻乐）  
版本：v1.0.0-memory-tower

> 配套文档：
> - `README.md`
> - `HANDOVER_NOTES.md`
> - `DEVELOPMENT_TODO.md`
> - `QA_REGRESSION_CHECKLIST.md`
> - `TEST_REPORT_TEMPLATE.md`
> - `TEST_REPORT_ROUND1.md`
> - `BUG_LOG.md`
> - `PRELAUNCH_CHECKLIST.md`

---

## 1. 测试基本信息

- 测试轮次：Round 2
- 测试日期：2026-05-09
- 测试人：OpenClaw / xiao
- 测试环境：本机 Linux Host，本地源码静态检查 + 启动链检查
- 设备型号：ming-Virtual-Machine
- 系统版本：Linux 6.17.0-23-generic (x64)
- 测试目标：执行一轮“正式无金币版本回归清单”落地检查
- 备注：本轮重点验证无金币结构是否彻底落地、关键入口是否仍绑定正确、存档是否不再写出金币字段、广告补给链路命名是否一致。

---

## 2. 本轮目标

本轮重点：
- 验证正式无金币资源模型是否在代码与文档层一致落地
- 验证旧金币命名是否已从主流程中清除
- 验证广告补给 / 背包库存 / 存档链路没有明显结构回流
- 验证关键入口绑定未因命名调整而断裂

---

## 3. 本轮执行项

### A. 无金币残留扫描
已检查：
- `state.coins`
- `totalCoinsEarned`
- `homeCoins`
- `coinsText`
- `claimRewardCoins`
- `home_bonus_coin`
- 旧金币 UI 文案 / 结算入口 / 奖励文案

### B. 启动与结构检查
已执行：
- `node --check` 全量脚本语法检查
- `node scripts/check-project.js` 项目自检
- 关键按钮绑定检查
- 激励广告 placement 检查
- 存档字段检查

### C. 本轮附加修复
本轮检查中发现并已立即修复：
1. 通关后额外奖励 placement 仍命名为 `double_coin_after_pass`
2. 兼容提示文案仍写为“已移除金币消耗”
3. `consumeStockOrCoins()` 仍保留 `_coinLabel` 兼容参数名

已统一改为补给/中性资源语义。

---

## 4. 测试结果汇总

- 总检查项：12
- 通过：12
- 失败：0
- 阻塞：0
- 未执行：0（本轮为结构/静态/绑定级检查）

### 总体结论
- [x] 正式无金币版本结构检查通过
- [x] 可继续进入手工/真机回归
- [ ] 存在阻塞问题，不建议继续推进

---

## 5. 分项结论

### A. 正式无金币结构
| 检查项 | 结果 | 备注 |
|---|---|---|
| `state.coins` 已移除 | 通过 | `app.js` 默认状态中已无 coins 字段。 |
| `totalCoinsEarned` 已移除 | 通过 | 运行态与新存档均不再使用该字段。 |
| `homeCoins / coinsText / claimRewardCoins` 已移除 | 通过 | DOM id / 方法命名已改为 supply 语义。 |
| 旧金币 placement 已清理 | 通过 | `home_bonus_coin` 已改为 `home_bonus_supply`，本轮又清除了 `double_coin_after_pass` 残留。 |
| 旧金币提示文案已清理 | 通过 | 本轮已将“已移除金币消耗”改为中性资源提示。 |

### B. 关键入口绑定
| 检查项 | 结果 | 备注 |
|---|---|---|
| 开始游戏按钮绑定正常 | 通过 | `btnStart -> app.startGame()` 存在。 |
| 模式切换按钮绑定正常 | 通过 | `btnModeClassic / btnModeTimed` 绑定存在。 |
| 签到与首页补给入口绑定正常 | 通过 | `btnDaily -> claimDaily()`；`btnShopReward -> claimRewardSupply()`。 |
| 返回首页 / 重开本关绑定正常 | 通过 | `btnHomeBack / btnRestartLevel` 绑定存在。 |
| 道具与生命补给按钮绑定正常 | 通过 | hint / reveal / preview / shuffle / shield / freeze / reward lives 均已绑定。 |

### C. 存档与版本化
| 检查项 | 结果 | 备注 |
|---|---|---|
| `saveVersion` 存在 | 通过 | `storage.js` 已声明并写出。 |
| 新版本不再写出 coins 字段 | 通过 | `saveState()` 不再持久化 `coins / totalCoinsEarned`。 |
| 旧存档兼容迁移骨架存在 | 通过 | `migrateSave()` 仍保留，旧数据可安全过渡。 |
| 库存字段保存/读取存在 | 通过 | `revealPairStock / shieldStock / freezeStock` 已纳入存档。 |

### D. 广告补给链路
| 检查项 | 结果 | 备注 |
|---|---|---|
| 首页补给 placement 正常 | 通过 | `home_bonus_supply`。 |
| 生命补给 placement 正常 | 通过 | `manual_life_plus_one`。 |
| 提示/预览/洗牌 placement 正常 | 通过 | `tool_hint / tool_preview / tool_shuffle`。 |
| 通关额外补给 placement 正常 | 通过 | 本轮已统一为 `bonus_supply_after_pass`。 |

---

## 6. 本轮发现的问题

| 编号 | 严重级别 | 模块 | 现象 | 状态 |
|---|---|---|---|---|
| BUG-004 | 低 | 无金币结构残留 | 通关额外补给 placement 仍使用 `double_coin_after_pass` 旧命名 | 已修复 |
| BUG-005 | 低 | 无金币结构残留 | 兼容提示文案仍写为“已移除金币消耗” | 已修复 |
| BUG-006 | 低 | 无金币结构残留 | `consumeStockOrCoins()` 参数仍名为 `_coinLabel` | 已修复 |

> 注：以上 3 项为本轮结构回归中即查即修的问题，未形成阻塞。

---

## 7. 本轮结论与建议

### 结论
- 正式无金币版本的**代码结构、命名结构、存档结构、文档结构**已基本统一。
- 本轮未再发现 coins / totalCoinsEarned 等旧金币结构仍参与主流程的证据。
- 仍需继续补做**真实交互级**与**真机级**验证，因为本轮主要是静态/结构/绑定检查。

### 下一步建议
1. 按 `QA_REGRESSION_CHECKLIST.md` 做手工回归。
2. 重点验证：
   - 立即开玩
   - 模式切换
   - 签到
   - 首页广告补给
   - 生命补给
   - 找一对 / 护盾 / 冻结
   - 章节奖励 / 终章 / 无尽模式
3. 若交互回归通过，可将当前版本标记为：
   - **正式无金币版可继续提测基线**

---

## 8. 建议同步

建议后续将本轮结论同步到：
- `BUG_LOG.md`（如需保留 BUG-004~006 记录）
- `PRELAUNCH_CHECKLIST.md`（记录执行状态）
- 后续 `TEST_REPORT_ROUND3.md`（如继续做真机回归）
