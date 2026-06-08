# 开发 TODO 清单（可执行版）

项目：Memory Tower（星际记忆翻翻乐）  
版本：v1.0.0-memory-tower

> 相关文档：
> - `README.md`
> - `HANDOVER_NOTES.md`
> - `QA_REGRESSION_CHECKLIST.md`
> - `PRELAUNCH_CHECKLIST.md`

## 当前策略
本阶段先执行：
- 2 真机测试与回归清单完善
- 3 核心流程回归清单落地
- 4 存档版本化与迁移骨架
- 5 继续模块拆分准备
- 6 正式无金币版本的资源链路回归

广告部分当前只保留预留位与桥接层，不接真实 SDK。
当前产品资源模型已固定为：**广告补给 + 背包库存**。

---

## P0 必做

| ID | 任务 | 文件 | 动作 | 验收 |
|---|---|---|---|---|
| P0-02 | 真机测试主线/终章/无尽 | 全项目 | 在目标设备完整验证 1~20 关、终章、无尽 3 轮，以及正式无金币资源链路 | 无崩溃/无关键布局错位/无金币残留入口 |
| P0-03 | 建立核心回归清单 | PRELAUNCH_CHECKLIST.md / docs | 将关键流程写成可执行 checklist | 至少覆盖开局/失败/通关/签到/存档/道具 |
| P0-04 | 存档版本化 | src/scripts/storage.js | 增加 saveVersion、migrateSave 骨架、异常日志 | 老存档/损坏存档不崩 |
| P0-05 | 模块拆分准备 | src/scripts/game.js / ui.js | 继续减少重复逻辑，准备拆文件 | 主流程函数职责清晰 |

---

## P1 后续

| ID | 任务 | 文件 | 动作 | 验收 |
|---|---|---|---|---|
| P1-01 | 真拆 game.js | src/scripts/game.js | 拆为 core/tools/progression/tasks | 文件职责明确 |
| P1-02 | 真拆 ui.js | src/scripts/ui.js | 拆为 hud/home/modal/progress | updateHUD 成为总调度 |
| P1-03 | 自检脚本增强 | scripts/check-project.js | 增加版本一致性/存档版本检查 | 常见交付失误可自动发现 |
| P1-04 | HUD 刷新优化 | app.js / ui.js | 降低全量刷新依赖 | 倒计时局部刷新 |
| P1-05 | 无金币资源模型回归 | 全项目 | 复查广告补给 / 背包库存 / 奖励说明 / 文档命名一致性 | 无 coins 旧命名回流 |

---

## 广告位策略（当前阶段）

当前不接真实广告 SDK，仅保留：
- banner 占位
- interstitial 桥接入口
- rewarded 桥接入口
- mock 成功模式
- placement 配置与文案

当前阶段验收：
- 关闭真实广告时，玩法完整可跑
- 根据配置正确展示/隐藏广告入口
- 可通过 mock 验证发奖与插屏链路
- 正式无金币版本下，不应再出现金币奖励、金币扣费、金币存档字段回流

---

## 建议执行顺序
1. 完善真机与回归清单
2. 存档版本化
3. 继续模块拆分
4. 做一轮正式无金币资源链路回归
5. 再决定是否接真实广告 SDK
