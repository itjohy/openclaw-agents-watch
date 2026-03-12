# Agent Timeline — STATUS

## Current Stage
当前处于 **CLI P0.95 稳定 + GUI v1 收口中**。

当前已经完成：
- 自动发现 OpenClaw agents
- 读取本地 sessions / subagent runs / config 生成时间线
- `overview / stream / summary / watch` 四种 CLI 模式
- watch 终端排版已基本收口：
  - 最近进展
  - 本轮新增
  - 正在执行
  - Agents 表格（i / Agents / 状态 / 最近活动）
  - 状态栏（`● 运行时长 · 最近新增 xx 前 · 上次变更`）
- 中文状态显示（空闲 / 已完成 / 等待中 / 运行中 / 疑似卡住 / 失败）
- 终端图标/列宽已做一轮适配；Dev 图标当前通过 OpenClaw 配置读取，用户已将其改为 `💻`
- 已抽出共享解析模块：`src/shared/timeline-core.mjs`
- GUI v1 已按“观望台”方向收口到单列观察体验：
  - 顶部只保留一个可拖拽“观望台”标题区
  - 总览已并回顶部，不再单独分出 Summary 面板
  - 顶部总览改成更紧凑的数字徽标块，当前只保留可信状态指标
  - agent 列表合并为同一面板内的“正在执行 / 其余 agent”分组；当没有运行中 agent 时，`正在执行` 分组直接隐藏
  - `任务面板 / 右侧详情承接 / 独立待处理区` 已从主界面移除
  - “全局时间线”已改名为“日志详情”，并保留“简洁 / 详细”切换
  - 范围 / 搜索 / 刷新 已移入“日志详情”顶部作为筛选工具栏
  - waiting / blocked / failed 仍保留底层聚合数据，但主界面不再单独重复展示
- 本轮新增三处稳定性/可用性修正：
  - 自动刷新改为静默刷新，避免高频 loading 闪烁
  - token 统计改为基于当前时间范围内 session jsonl 的 `message.usage` 聚合；“单次估算”当前按范围内平均每条带 usage 的 assistant 消息估算
  - timeline 对 subagent 空跑 / `server_error` / run 表面 `ok` 但 session 内无有效进展 的场景，新增二次判定，不再只盯 `runs.json` 结束态
- 当前 `npm run gui:build` 可通过

## Stable Snapshot
当前稳定备份：
- 本地已做时间戳备份（内部使用，不写入公开说明）

## Important Implementation Notes
- Agent Timeline 会优先读取 OpenClaw 配置中的 agent identity / emoji，因此脚本默认图标会被配置覆盖。
- watch 是长驻进程；每次脚本修改后，必须 `Ctrl + C` 停掉旧进程，再重新启动，才能看到新逻辑。
- 最近几轮小修中，多次出现 LLM request timed out；对这类极小改动，优先直接本地 edit，比重型 subagent 更稳更省 token。

## What Still Needs Work
当前仍需继续收口的点：
1. 用真实 Electron 窗口继续观察自动刷新下是否还有肉眼可见闪烁（代码层已先去掉高频 loading）
2. 再做一轮窄宽度 / 接近手机竖屏宽度下的真实读屏验收
3. 关键词搜索暂时还是筛选，不是高亮
4. 时间区间仍是预设档位，未做自定义区间
5. 桌面通知还只有基础弹出，未做点击回到对应 agent / 任务
6. 打包链路（macOS / Windows）还没补
7. watch 底部状态区刚从“累计活跃 task”改为“按 agent 最新状态去重统计”，还需要继续用真实异常样本验收一轮

## Constraint for Current Plan
- 不推翻现有终端 watch 结构
- CLI 继续保持可直接运行
- GUI 先做骨架与观察体验，不在这一轮追求复杂控制台能力
- 优先复用当前本地可读数据源与解析逻辑

## Recommended Command
```bash
cd ~/.openclaw/workspace
node projects/agent-timeline/bin/agent-timeline.mjs watch --minutes 180 --limit 20 --interval-sec 5
```
