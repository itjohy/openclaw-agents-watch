# Agent Timeline GUI PRD (V1)

## 1. 目标
把当前终端版 Agent Timeline 演进为一个 **桌面优先的图形界面应用**，支持 **macOS / Windows** 使用，核心解决：

1. 用户能更直观看到各 agent 当前状态
2. 用户不用一直盯终端，也能在关键时刻收到提醒
3. 用户可以快速点进某个 agent，查看详细执行日志
4. 用户可以按时间区间 / 关键词快速筛查任务过程

本阶段重点不是“复杂平台化”，而是先完成一个 **可用、友好、低负担** 的桌面 GUI MVP。

---

## 2. 产品定位
Agent Timeline GUI 是 OpenClaw 多 agent 协作的 **桌面观察与提醒面板**。

它不是后台管理系统，也不是复杂运维控制台。

它更像一个：
- 轻量团队看板
- 任务观察器
- 通知入口
- 审核/介入前的可视化窗口

---

## 3. 设计方向
### 关键词
- 简洁
- 友好
- 可爱一点
- 不压迫
- 不工程后台化

### 风格原则
- 用卡片和分区替代密集表格堆叠
- 多用柔和状态色，不用大面积高对比警报红
- 圆角、留白、轻阴影、适度 emoji / 状态图标可接受
- 信息密度要克制，默认先看懂，再下钻

### 避免
- 过重的监控面板风格
- 满屏日志默认展开
- 复杂到像 DevOps 控制台
- 太技术化的字段直接怼给用户

---

## 4. 平台与技术路线
### 平台目标
- macOS
- Windows

### 推荐技术路线
- Electron
- React
- 本地桌面通知
- 尽量复用当前 `bin/agent-timeline.mjs` 的解析逻辑或其中的数据处理部分

### 本阶段暂不强求
- 原生 iPhone App
- Apple Watch 原生 App
- 复杂账号系统
- 云端多设备同步

---

## 5. MVP 核心能力

### 5.1 Dashboard 总览页
首页展示：

1. **顶部概览区**
   - 当前活跃任务数
   - 等待确认数
   - 最近完成数
   - 最近失败 / 卡住数

2. **Agent 状态区**
   - 每个 agent 一张卡片或一行
   - 显示：
     - agent 名称
     - emoji / 标识
     - 当前状态
     - 最近更新时间
     - 最近动作摘要

3. **全局时间线区**
   - 按时间排序展示事件流
   - 每条显示：
     - 时间
     - agent
     - 事件类型
     - 简短标题

4. **待处理区**
   - 专门聚合：
     - waiting_user
     - blocked
     - failed
   - 让用户一眼知道“是否现在需要我介入”

---

### 5.2 Agent 详情页
点击某个 agent 后进入详情页。

必须支持：
- 查看该 agent 的详细执行日志
- 按时间顺序展示完整时间线
- 显示时间区间
- 显示任务标题 / 当前状态 / 最近更新时间

建议包含：
- 时间线列表
- 当前活跃任务卡片
- 最近已完成任务
- 最近失败/卡住任务

---

### 5.3 搜索与筛选
这是本阶段重点能力，必须做。

#### 支持的筛选项
1. **时间区间筛选**
   - 最近 15 分钟
   - 最近 1 小时
   - 最近 3 小时
   - 最近 24 小时
   - 自定义区间（后续可补）

2. **关键词搜索**
   - 搜索任务标题
   - 搜索日志标题
   - 搜索 detail 内容

3. **事件类型筛选（建议首版就做）**
   - running / completed / waiting_user / failed / blocked
   - milestone / heartbeat / error
   - main_received / main_delivered / main_waiting_user / main_routed / main_reviewing（已有再展示）

---

### 5.4 通知能力（V1）
先做 **本地桌面通知**。

触发事件：
- waiting_user
- task_completed
- task_failed
- blocked
- main_delivered（可选）

通知目标：
- 用户离开屏幕时，仍能知道关键任务状态变化

通知点击行为（理想）：
- 点击通知后打开应用并定位到对应任务/agent

---

## 6. 信息架构建议
### 页面结构
1. Dashboard（首页）
2. Agent Detail（agent 详情页）
3. Notifications / Inbox（可先做成首页一个区块，不必独立页面）

### 首页层级建议
- 第一屏先看状态
- 第二层看时间线
- 第三层看日志细节

也就是：
**概览 > 任务 > 详情日志**

---

## 7. 数据来源
继续优先基于本地 OpenClaw 数据：
- `~/.openclaw/openclaw.json`
- `~/.openclaw/agents/main/sessions/sessions.json`
- `~/.openclaw/subagents/runs.json`
- 对应 session jsonl 文件

要求：
- 优先兼容当前终端版的解析结果
- 不要先改 OpenClaw 内核
- 可以先本地轮询刷新

---

## 8. 交互要求
### Dashboard 卡片点击
- 点击 agent → 进入该 agent 详情页

### 日志交互
- 支持滚动查看
- 支持搜索关键词高亮或筛选
- 支持按时间区间缩小范围

### 待处理任务
- waiting_user 项目要更突出
- 用户要能快速知道“下一步该不该我出手”

---

## 9. V1 不做什么
以下先不做或不强求：
- 远程手机端完整页面
- Apple Watch 原生支持
- iPhone 原生推送 App
- 多人协作账号系统
- 复杂权限体系
- 任务编辑 / 指令下发控制面板
- 真正的双向手机直接回复链路

这些可以作为 V2/V3。

---

## 10. 建议开发顺序
### Step 1
搭 Electron + React 桌面应用骨架

### Step 2
接入现有 timeline 数据解析

### Step 3
完成 Dashboard 首页

### Step 4
完成 Agent 详情页

### Step 5
完成日志搜索 + 时间区间筛选

### Step 6
接入桌面通知

### Step 7
做一轮 UI 收口（简洁、友好、可爱）

---

## 11. 验收标准（V1）
完成时至少满足：

1. 能在 macOS / Windows 上启动桌面 GUI
2. 能看到 agent 总览状态
3. 能点击 agent 查看详细执行日志
4. 能按时间区间筛选日志
5. 能按关键词搜索日志
6. 能在 waiting_user / completed / failed / blocked 时触发桌面通知
7. UI 风格是轻盈友好的，不像工程后台

---

## 12. 后续路线（非本阶段）
### V2
- 手机消息推送桥（Telegram / Discord / Signal / 其他）
- 可远程收到 waiting_user / completed / failed 通知

### V3
- 移动端访问页 / 原生 iOS 方案
- Apple Watch 通知与简单动作响应

---

## 13. 一句话定义
先做一个 **桌面优先、跨平台、可视化、可通知、可搜索日志** 的 Agent Timeline GUI，帮助用户不盯终端也能掌握 agent 工作状态。