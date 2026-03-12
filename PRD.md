# Agent Timeline

## 1. 产品定位
Agent Timeline 是一个面向 OpenClaw 用户的 **Agent 运行时间线与任务观测层**。

第一阶段不追求复杂 UI，而是先提供一个 **终端文字版 MVP**，让用户可以清楚看到：
- 当前有多少个 agent
- 每个 agent 正在做什么
- 什么时候开始、什么时候阶段完成
- 遇到了什么错误
- 是否疑似卡住
- 一夜跑完之后，早上起来能直接看摘要

它既适用于多 agent 用户，也适用于只有一个 agent 的用户。

---

## 2. 要解决的核心问题

### 当前痛点
1. agent 长任务执行时，用户缺少持续可观察反馈
2. gateway/system 日志不是为“任务进展”设计的，噪音大且不够直观
3. 当 agent 崩溃、静默失败、卡住时，用户容易傻等
4. 多 agent 协同时，用户很难快速知道谁在做什么、做到哪一步
5. 过夜任务结束后，用户难以快速回顾关键过程

### 目标结果
用户打开 Agent Timeline 后，能像看一个小型数字团队的工作看板一样，立刻知道：
- 谁在工作
- 谁空闲
- 谁完成了阶段任务
- 谁报错了
- 谁在等待确认

---

## 3. 第一阶段范围（终端文字版 MVP）

### 必须具备
1. **自动发现 agent**
   - 扫描 OpenClaw 配置中的 agent 列表
   - 获取 agent 名称、id、角色标识、emoji/identity（若存在）

2. **结构化事件记录**
   - 支持以下基础事件类型：
     - `agent_discovered`
     - `task_started`
     - `heartbeat`
     - `stage_started`
     - `milestone`
     - `warning`
     - `error`
     - `blocked`
     - `waiting_user`
     - `review`
     - `task_completed`
     - `task_failed`

3. **终端时间线输出**
   - 按时间顺序展示所有事件
   - 支持按 agent 分组查看
   - 支持查看“最近 N 分钟事件”

4. **心跳与卡住检测**
   - 若某任务超过阈值未产生 heartbeat / milestone，则标记为可能卡住
   - 初始阈值建议：30–60 秒无新进度触发 warning

5. **阶段性摘要**
   - 每个任务完成后自动输出一段阶段小结
   - 支持生成“昨夜摘要 / 今日摘要”

### 本阶段明确不做
1. 复杂 Web UI
2. 手机端可视化界面
3. agent 头像上传/编辑器
4. 完整的 agent-to-agent 对话可视化
5. 跨机器汇总

---

## 4. 典型使用场景

### 场景 A：开发任务执行中
用户让 `dev` 修一个项目。
Agent Timeline 持续输出：
- 11:04:12 Dev 开始读取项目结构
- 11:05:03 Dev 已确认聊天链路
- 11:07:48 Dev 完成第一轮代码修改
- 11:08:31 Dev lint 通过
- 11:08:59 Dev build 失败：Vite 环境异常

### 场景 B：多 agent 夜间协作
夜里同时运行 `dev`、`market`、`ops`。
早上用户打开后直接看到：
- Dev：完成 2 个阶段，1 个环境错误
- Market：研究完成，生成备忘录
- Ops：等待人工确认

### 场景 C：单 agent 长任务
即使只有 main 或 dev 一个 agent，用户也能清楚看到：
- 任务是否活着
- 最近一次进展是什么
- 有没有静默失败

---

## 5. 数据结构（MVP）

```ts
type AgentId = string;
type TaskId = string;

type EventKind =
  | 'agent_discovered'
  | 'task_started'
  | 'heartbeat'
  | 'stage_started'
  | 'milestone'
  | 'warning'
  | 'error'
  | 'blocked'
  | 'waiting_user'
  | 'review'
  | 'task_completed'
  | 'task_failed';

interface AgentProfile {
  id: AgentId;
  name: string;
  emoji?: string;
  theme?: string;
  roleHint?: string;
}

interface TimelineEvent {
  id: string;
  ts: string;
  agentId: AgentId;
  taskId?: TaskId;
  kind: EventKind;
  title: string;
  detail?: string;
  level?: 'info' | 'warn' | 'error';
  tags?: string[];
}

interface TaskState {
  taskId: TaskId;
  agentId: AgentId;
  title: string;
  status: 'running' | 'waiting_user' | 'blocked' | 'completed' | 'failed';
  startedAt: string;
  updatedAt: string;
  lastEventKind?: EventKind;
}
```

---

## 6. 自动发现机制

### 第一版来源
优先从 OpenClaw 主配置读取：
- `agents.list`
- `agents.defaults`
- `identity` 字段（如果有）

### 读取结果
至少得到：
- agent id
- name（若无则退回 id）
- emoji（若有）
- theme/角色提示（若有）

### 后续扩展
未来可继续扫描：
- agent 工作目录
- bootstrap 文件
- role/persona 文件
- agent 历史会话

---

## 7. 终端输出形态

### 7.1 实时时间线模式
示例：

```text
11:04:12 [Dev] task_started   开始处理 ai-demand-translator
11:04:29 [Dev] stage_started  正在读取 App.tsx / vite.config.ts
11:05:03 [Dev] milestone      已确认多模态输入链路
11:06:18 [Dev] heartbeat      正在修改语音交互反馈
11:07:48 [Dev] milestone      已完成第一轮代码修改
11:08:31 [Dev] milestone      lint 通过
11:08:59 [Dev] error          vite build 失败：SecItemCopyMatching failed -50
11:09:14 [Main] review        已接收 Dev 阶段结果并开始审核
```

### 7.2 概览模式
```text
Agents:
- Main    running        最近更新 12s 前
- Dev     running        最近更新 8s 前
- Market  idle           最近更新 2h 前
- Ops     waiting_user   等待确认
```

### 7.3 摘要模式
```text
昨夜摘要
- Dev：完成 3 个阶段；1 个环境错误；最后停在本地预览修复
- Market：完成 1 份投资备忘录
- Ops：无新任务
```

---

## 8. 心跳与卡住检测规则（初版）

### 心跳规则
- 长任务执行时，每 10–30 秒至少生成一条 heartbeat 或 milestone
- 若当前正在执行耗时操作（build、搜索、读取大量文件），也应输出简短 heartbeat

### 卡住判定
初版规则：
- 30 秒无更新：标记为 `warning`
- 60 秒无更新：标记为 `blocked?`
- 若进程已退出，则直接写入 `task_failed`

### 注意
不是所有安静都等于故障，因此 blocked 只是“疑似卡住”，不是直接报死。

---

## 9. 与 OpenClaw 的关系

Agent Timeline 第一版可以先作为：
- 一个本地工具/脚本
- 或一个本地 skill 原型

后续再演进为：
- 可安装 skill
- 可视化控制台
- 社区开源项目

### 开源潜力
长期目标可发布到 GitHub，支持：
- 自动扫描用户 OpenClaw agent 配置
- 生成默认 agent 列表与角色视图
- 支持自定义头像/emoji
- 支持查看 agent 之间的协作轨迹

---

## 10. 路线图

### P0：终端 MVP
- 自动发现 agent
- 事件结构定义
- 本地时间线输出
- 心跳/里程碑/错误记录
- 摘要输出

### P1：增强版 CLI
- 过滤器（按 agent / 按时间 / 按状态）
- 更好的摘要与统计
- 任务树 / 委派链显示
- main 审核事件

### P2：Web UI
- 桌面/手机可视化时间线
- agent 卡片
- 头像/emoji
- 任务关系可视化
- agent 交流轨迹

---

## 11. 当前建议的开发顺序
1. 先做需求草案确认（当前文档）
2. 再由 dev 实现终端文字版 MVP
3. 用我们自己的真实多 agent 任务边做边测
4. 根据实际体验再收敛事件类型与摘要逻辑
5. 最后再进入可视化 UI 阶段

---

## 12. 验收标准（P0）
P0 完成时，应满足：
- 能自动识别当前 OpenClaw 配置中的 agent
- 能记录并输出结构化事件时间线
- 能看到任务开始、心跳、阶段完成、错误、完成状态
- 能识别“疑似卡住”任务
- 能输出一份用户读得懂的摘要
- 即使只有一个 agent，也有明确价值
