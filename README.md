# OpenClaw Agents Watch

一个给 **OpenClaw / 本地多 agent 使用者** 的观察工具原型。

它的目标很直接：

> 当多个 agents 在本地运行时，你不需要再盯着静默终端等结果。
> 你可以直接看到谁在执行、谁在等待确认、谁疑似卡住、谁已经完成。

当前项目提供两种查看方式：

1. **CLI 模式**：适合终端快速查看、持续 watch、低打扰盯盘
2. **GUI 模式**：适合桌面观察、筛选日志、查看 agent 当前状态

## 适合谁

这个项目适合：

- 已经在本地部署 OpenClaw
- 已经跑起来多个 agents
- 想要一个比“静默终端”更直观的观察工具
- 想快速知道当前是“正在运行 / 等待确认 / 异常结束 / 风险状态”

它**不适合**：

- 还没有安装 OpenClaw 的普通终端用户
- 期待双击安装即可独立运行的通用桌面软件用户

## 当前能力

### CLI

CLI 直接读取本机 OpenClaw 配置与会话数据，提供：

- `overview`：agent 概览（谁在跑、谁完成、谁失败、谁疑似卡住）
- `stream`：最近时间线（按真实会话消息回放）
- `summary`：工作纪要（更像晨报，不是机械计数）
- `watch`：持续刷新观察台

### GUI

GUI 当前是单列桌面观察台：

- 顶部总览（执行中 / 等待确认 / 完成 / 风险）
- agent 列表
- 日志详情（简洁 / 详细）
- 范围 / 搜索 / 刷新工具栏
- 类型筛选

## 运行

### CLI

```bash
# 概览
node bin/agent-timeline.mjs overview

# 时间线流
node bin/agent-timeline.mjs stream --minutes 180 --limit 40

# 工作纪要
node bin/agent-timeline.mjs summary --minutes 1440

# 持续刷新（更适合盯多 agent）
node bin/agent-timeline.mjs watch --minutes 180 --limit 20 --interval-sec 5
```

### GUI

```bash
npm install

# 本地开发（Vite + Electron）
npm run gui:dev

# 构建校验
npm run gui:build

# 启动生产模式 GUI
npm run gui:start
```

## 数据来源

当前项目依赖本机已有的 OpenClaw 数据目录，主要读取：

- `~/.openclaw/openclaw.json`
- `~/.openclaw/agents/main/sessions/sessions.json`
- `~/.openclaw/subagents/runs.json`
- `~/.openclaw/agents/main/sessions/*.jsonl`

> 这意味着它目前是一个 **依赖 OpenClaw 本地数据的观察工具**，不是脱离 OpenClaw 就能独立运行的通用应用。

## 当前设计重点

- 用“观察台”而不是“任务后台”的方式呈现多 agent 状态
- 优先让用户知道：
  - 谁在执行
  - 谁在等你回复
  - 谁疑似空跑 / 异常结束
  - 谁已经完成
- 终端和 GUI 两套入口都可用
- 对“run 表面成功、实际没干活”的场景补了二次识别

## 当前限制

- 仍然依赖 OpenClaw 本地目录结构
- 还没有做正式安装包（如 macOS dmg / Windows exe）
- 目前更适合作为 **公开原型 / 本地观察工具**，而不是通用商业桌面产品

## 为什么做它

对于本地多 agent 使用者来说，最大的体验问题之一不是“不能跑”，而是：

- 终端很安静
- 不知道当前到底有没有在执行
- 不知道是在等确认、卡住了，还是其实已经出错

这个项目就是为了解决这个问题：

> 给本地多 agent 环境一个能看、能扫读、能快速判断状态的观察界面。
