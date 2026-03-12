import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const HOME = os.homedir();
const OPENCLAW_DIR = path.join(HOME, '.openclaw');
const CONFIG_PATH = path.join(OPENCLAW_DIR, 'openclaw.json');
const MAIN_SESSIONS_PATH = path.join(OPENCLAW_DIR, 'agents', 'main', 'sessions', 'sessions.json');
const SUBAGENT_RUNS_PATH = path.join(OPENCLAW_DIR, 'subagents', 'runs.json');

export function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

export function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
}

export function relTime(ms) {
  if (ms == null) return '-';
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

export function fmtTs(iso) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const WATCH_STATUS_DOT = '●';

export function fmtAgo(ms) {
  if (ms == null) return '尚无';
  return `${relTime(ms)} 前`;
}

export function parseArgs(argv) {
  const opts = {
    mode: 'overview',
    minutes: 12 * 60,
    warningSec: 45,
    blockedSec: 120,
    limit: 80,
    intervalSec: 15,
    json: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (['overview', 'summary', 'stream', 'watch'].includes(a)) opts.mode = a;
    else if (a === '--minutes') opts.minutes = Number(argv[++i]);
    else if (a === '--warning-sec') opts.warningSec = Number(argv[++i]);
    else if (a === '--blocked-sec') opts.blockedSec = Number(argv[++i]);
    else if (a === '--limit') opts.limit = Number(argv[++i]);
    else if (a === '--interval-sec') opts.intervalSec = Number(argv[++i]);
    else if (a === '--json') opts.json = true;
    else if (a === '--help' || a === '-h') opts.help = true;
  }
  return opts;
}

const AGENT_DISPLAY = {
  main: { name: 'Main', emoji: '🤝' },
  dev: { name: 'Dev', emoji: '💻' },
  finance: { name: 'Finance', emoji: '📊' },
  market: { name: 'Market', emoji: '📈' },
  ops: { name: 'Ops', emoji: '🧭' },
  trade: { name: 'Trade', emoji: '🧪' },
};

export function discoverAgents(config) {
  const list = config?.agents?.list || [];
  return list.map((agent) => {
    const preset = AGENT_DISPLAY[agent.id] || {};
    return {
      id: agent.id,
      name: agent.identity?.name || agent.name || preset.name || agent.id,
      emoji: agent.identity?.emoji || preset.emoji || '',
      theme: agent.identity?.theme || '',
    };
  });
}

export function getSessionMap() {
  return readJson(MAIN_SESSIONS_PATH, {}) || {};
}

export function getSubagentRuns() {
  const raw = readJson(SUBAGENT_RUNS_PATH, { runs: {} }) || { runs: {} };
  return raw.runs || {};
}

export function inferAgentId(sessionKey, run) {
  if (sessionKey?.includes(':subagent:')) {
    const task = run?.task || '';
    const match = task.match(/你是\s*@?(\w+)/);
    if (match) return match[1];
  }
  const m = sessionKey?.match(/^agent:([^:]+):/);
  return m ? m[1] : 'unknown';
}

export function extractText(content = []) {
  return content
    .filter((c) => c?.type === 'text')
    .map((c) => c.text || '')
    .join('\n')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncate(text = '', max = 120) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export function singleLine(text = '') {
  return String(text).replace(/\s+/g, ' ').trim();
}

export function charDisplayWidth(ch) {
  const cp = ch.codePointAt(0) || 0;
  if (cp === 0xfe0e || cp === 0xfe0f) return 0;
  if (
    cp >= 0x1100 && (
      cp <= 0x115f ||
      cp === 0x2329 ||
      cp === 0x232a ||
      (cp >= 0x2e80 && cp <= 0xa4cf && cp !== 0x303f) ||
      (cp >= 0xac00 && cp <= 0xd7a3) ||
      (cp >= 0xf900 && cp <= 0xfaff) ||
      (cp >= 0xfe10 && cp <= 0xfe19) ||
      (cp >= 0xfe30 && cp <= 0xfe6f) ||
      (cp >= 0xff00 && cp <= 0xff60) ||
      (cp >= 0xffe0 && cp <= 0xffe6) ||
      (cp >= 0x1f300 && cp <= 0x1fadf)
    )
  ) return 2;
  return 1;
}

export function displayWidth(text = '') {
  return Array.from(String(text)).reduce((sum, ch) => sum + charDisplayWidth(ch), 0);
}

export function padCell(text = '', width = 0) {
  const value = String(text);
  return `${value}${' '.repeat(Math.max(0, width - displayWidth(value)))}`;
}

export function shortTitle(text = '', max = 30) {
  const clean = singleLine(text)
    .replace(/^(继续收口[:：]?|结论[:：]?|说明[:：]?|更新[:：]?)/, '')
    .trim();
  return truncate(clean || '（无标题）', max);
}

export function shortDetail(text = '', max = 72) {
  const clean = singleLine(text)
    .replace(/^(完成后给我修改文件清单、最终运行命令、示例输出[。；，]?)/, '')
    .trim();
  return clean ? truncate(clean, max) : undefined;
}

export function normalizeTaskTitle(run) {
  const label = run?.label?.trim();
  if (label) return label;
  const task = (run?.task || '').replace(/\s+/g, ' ').trim();
  if (!task) return run?.runId || '未命名任务';
  const m = task.match(/继续[^，。]*?([\w./-]*agent-timeline[\w./-]*)/i);
  if (m) return `继续收口 ${m[1]}`;
  return truncate(task, 48);
}

export function toolCallTitle(name, args = {}) {
  const p = args.path || args.file_path;
  if (name === 'read') return p ? `查看文件 ${path.basename(p)}` : '查看文件内容';
  if (name === 'write') return p ? `写入文件 ${path.basename(p)}` : '写入文件';
  if (name === 'edit') return p ? `修改文件 ${path.basename(p)}` : '修改文件';
  if (name === 'exec') {
    const cmd = String(args.command || '').trim();
    if (/\b(node|npm|pnpm|yarn|bun)\b/.test(cmd)) return '运行项目命令';
    if (/\b(rg|grep|find|ls|cat|head|tail|sed|awk)\b/.test(cmd)) return '检查项目与日志';
    return cmd ? `执行命令：${truncate(cmd, 28)}` : '执行命令';
  }
  if (name === 'browser') return '检查浏览器页面';
  if (name === 'web_search' || name === 'tavily_local_search') return '搜索资料';
  return `调用 ${name}`;
}

export function toolResultTitle(name, isError) {
  if (isError) {
    if (name === 'exec') return '命令执行失败';
    if (name === 'read') return '读取文件失败';
    if (name === 'write' || name === 'edit') return '文件改动失败';
    return `${name} 执行失败`;
  }
  if (name === 'exec') return '命令结果已返回';
  if (name === 'read') return '已读到文件内容';
  if (name === 'write') return '文件已写入';
  if (name === 'edit') return '文件已修改';
  if (name === 'browser') return '页面结果已返回';
  return `${name} 已返回结果`;
}

export function classifyAssistantText(text) {
  const s = singleLine(text);
  if (!s) return null;
  const title = shortTitle(s);
  if (/^(我先|先|正在|下面|接下来)/.test(s)) return ['heartbeat', title, 'info'];
  if (/完成后给我|待确认|请确认|需要你|等你|等你确认|等待你的/.test(s)) return ['waiting_user', title, 'warn'];
  if (/已完成|完成了|完成如下|我完成了|验证通过|已修复|已经修好|已收口|跑通/.test(s)) return ['task_completed', title, 'info'];
  if (/(失败|报错|异常|超时|timeout|未通过|无法|崩溃)/i.test(s)) return ['error', title, 'error'];
  if (/风险|注意|限制|当前问题|还没|未处理|待补/.test(s)) return ['warning', title, 'warn'];
  if (/修复|新增|补充|改成|优化|调整|确认|发现|定位|验证|排查|实现|重写|收口/.test(s)) return ['milestone', title, 'info'];
  return ['heartbeat', title, 'info'];
}

export function isInternalMainUserText(text = '') {
  const s = singleLine(text);
  return /OpenClaw runtime context|\[Internal task completion event\]|source:\s*subagent|session_key:\s*agent:main:subagent:/i.test(s);
}

export function inferAgentFromText(text = '') {
  const s = String(text);
  const taskMatch = s.match(/task:\s*([a-z]+)-/i);
  if (taskMatch) return String(taskMatch[1]).toLowerCase();
  const roleMatch = s.match(/你是\s*@?(\w+)/);
  if (roleMatch) return String(roleMatch[1]).toLowerCase();
  const mentionMatch = s.match(/@\s*(dev|finance|market|ops|trade)\b/i);
  if (mentionMatch) return String(mentionMatch[1]).toLowerCase();
  const m = s.match(/\b(dev|finance|market|ops|trade|main)\b/i);
  return m ? String(m[1]).toLowerCase() : null;
}

export function normalizeMainUserText(text = '') {
  const s = String(text || '');
  const noSender = s.replace(/Sender \(untrusted metadata\):[\s\S]*?```[\s\S]*?```/g, '').trim();
  const oneLine = singleLine(noSender);
  return oneLine.replace(/^\[[^\]]+\]\s*/, '').trim();
}

export function mainEventTitle(kind, text = '', agentId = null) {
  const target = agentId ? ` → ${agentId}` : '';
  const clean = shortTitle(text, 40);
  if (kind === 'main_received') return `收到用户任务：${clean}`;
  if (kind === 'main_routed') return `已分派给${target || ' 子 agent'}：${clean}`;
  if (kind === 'main_reviewing') return `正在审核${target || ' 子 agent'}结果`;
  if (kind === 'main_waiting_user') return `等待用户确认：${clean}`;
  if (kind === 'main_delivered') return `已向用户交付：${clean}`;
  return clean;
}

export function classifyMainAssistantText(text = '', { hasSpawn = false, afterInternal = false, hasReply = false, hasExplicitRoute = false } = {}) {
  const s = singleLine(text);
  if (!s) return null;
  if (hasSpawn || hasExplicitRoute) return ['main_routed', mainEventTitle('main_routed', s, inferAgentFromText(s)), 'info'];
  if (/完成后给我|待确认|请确认|需要你|等你|等你确认|等待你的|你直接回我|你点头|你选一个|你现在重新|是否继续|要不要继续|你定|你决定|选一个/.test(s)) {
    return ['main_waiting_user', mainEventTitle('main_waiting_user', s), 'warn'];
  }
  if (hasReply || /^\[\[\s*reply_to_current\s*\]\]/.test(s) || afterInternal || /改好了|已经让 .* 去改了|已经开干了|我已经直接替你做了|现在可以|这轮我正式让/.test(s)) {
    return ['main_delivered', mainEventTitle('main_delivered', s.replace(/^\[\[[^\]]+\]\]\s*/, '')), 'info'];
  }
  return null;
}

export function pushMainEvent(events, state, { id, ts, kind, title, detail, level = 'info' }) {
  events.push({ id, ts, agentId: 'main', taskId: state.taskId, kind, title, detail, level });
  state.updatedAt = ts;
  state.lastEventKind = kind;
  state.lastEventTitle = title;
  if (kind === 'main_waiting_user') state.status = 'waiting_user';
  else if (kind === 'main_delivered') state.status = 'completed';
  else state.status = 'running';
}

export function parseMainSessionEvents({ sessionMap, minutes }) {
  const now = Date.now();
  const cutoff = now - minutes * 60 * 1000;
  const sessionFile = sessionMap['agent:main:main']?.sessionFile;
  if (!sessionFile || !fs.existsSync(sessionFile)) return { events: [], tasks: [] };

  const events = [];
  const tasks = [];
  const lines = readJsonl(sessionFile);
  let state = null;
  let pendingInternalAgent = null;

  for (const line of lines) {
    if (line.type !== 'message' || !line.message) continue;
    const ts = line.timestamp || line.message.timestamp;
    const tsMs = Date.parse(ts);
    if (!tsMs || tsMs < cutoff) continue;
    const role = line.message.role;
    const text = extractText(line.message.content || []);

    if (role === 'user') {
      if (isInternalMainUserText(text)) {
        const agentId = inferAgentFromText(text) || pendingInternalAgent || 'subagent';
        pendingInternalAgent = agentId;
        if (state) {
          pushMainEvent(events, state, {
            id: `${line.id}:review`,
            ts,
            kind: 'main_reviewing',
            title: mainEventTitle('main_reviewing', text, agentId),
            detail: shortDetail(text, 120),
          });
        }
        continue;
      }

      const userText = normalizeMainUserText(text);
      if (!userText) continue;
      state = {
        taskId: `main:${line.id}`,
        agentId: 'main',
        title: shortTitle(userText, 48),
        status: 'running',
        startedAt: ts,
        updatedAt: ts,
        warning: false,
        silenceSec: 0,
        lastEventKind: 'main_received',
        lastEventTitle: mainEventTitle('main_received', userText),
      };
      tasks.push(state);
      events.push({
        id: `${line.id}:received`,
        ts,
        agentId: 'main',
        taskId: state.taskId,
        kind: 'main_received',
        title: mainEventTitle('main_received', userText),
        detail: shortDetail(userText, 120),
        level: 'info',
      });
      continue;
    }

    if (role !== 'assistant' || !state) continue;
    const content = line.message.content || [];
    const text2 = extractText(content);
    const finalReplyText = content
      .filter((c) => c.type === 'text' && c.textSignature?.phase === 'final_answer')
      .map((c) => c.text || '')
      .join('\n');
    const candidateText = finalReplyText || text2;
    const toolCalls = content.filter((c) => c.type === 'toolCall');
    const spawnCall = toolCalls.find((c) => c.name === 'sessions_spawn');
    const commentaryText = content
      .filter((c) => c.type === 'text' && c.textSignature?.phase === 'commentary')
      .map((c) => c.text || '')
      .join('\n');
    const routeText = singleLine(commentaryText || candidateText);
    const explicitRoute = /(分派给\s*@?(dev|finance|market|ops|trade)\b|交给\s*@?(dev|finance|market|ops|trade)\b|让\s*@?(dev|finance|market|ops|trade)\b|已分派给\s*@?(dev|finance|market|ops|trade)\b|转给\s*@?(dev|finance|market|ops|trade)\b)/i.test(routeText);
    if (spawnCall || explicitRoute) {
      const routeSource = spawnCall ? JSON.stringify(spawnCall.arguments || {}) : routeText;
      const routedAgent = inferAgentFromText(routeSource) || 'subagent';
      pushMainEvent(events, state, {
        id: `${line.id}:routed`,
        ts,
        kind: 'main_routed',
        title: mainEventTitle('main_routed', routeText || spawnCall?.arguments?.label || spawnCall?.arguments?.task || '已分派', routedAgent),
        detail: shortDetail(spawnCall?.arguments?.task || routeText, 120),
      });
      pendingInternalAgent = routedAgent;
      continue;
    }

    const info = classifyMainAssistantText(candidateText, { afterInternal: Boolean(pendingInternalAgent), hasReply: Boolean(finalReplyText), hasExplicitRoute: explicitRoute });
    pendingInternalAgent = null;
    if (!info) continue;
    const [kind, title, level] = info;
    pushMainEvent(events, state, { id: `${line.id}:${kind}`, ts, kind, title, detail: shortDetail(candidateText, 120), level });
  }

  return { events, tasks };
}

export function outcomeStatus(run) {
  const ended = Boolean(run?.endedAt || run?.endedReason || run?.outcome?.status);
  const raw = String(run?.outcome?.status || '').toLowerCase();
  if (!ended) return null;
  if (['ok', 'success', 'completed'].includes(raw)) return 'completed';
  if (['error', 'failed', 'timeout', 'cancelled', 'canceled'].includes(raw)) return 'failed';
  if (/timeout|error|failed|cancel/i.test(String(run?.endedReason || ''))) return 'failed';
  return 'completed';
}

function inspectRunLines(lines = []) {
  const summary = {
    hasServerError: false,
    hasAnyError: false,
    hasToolError: false,
    hasProgress: false,
    hasToolCall: false,
    hasFinalAnswer: false,
    assistantTextCount: 0,
    toolResultCount: 0,
    firstErrorText: '',
  };

  for (const line of lines) {
    if (line.type !== 'message' || !line.message) continue;
    const role = line.message.role;
    const content = line.message.content || [];
    const text = extractText(content);

    if (role === 'assistant') {
      if (text) summary.assistantTextCount += 1;
      if (content.some((c) => c.type === 'toolCall')) summary.hasToolCall = true;
      if (content.some((c) => c.type === 'text' && c.textSignature?.phase === 'final_answer')) summary.hasFinalAnswer = true;
      if (/(server_error|An error occurred while processing your request)/i.test(text)) {
        summary.hasServerError = true;
        summary.hasAnyError = true;
        summary.firstErrorText ||= text;
      } else if (/(失败|报错|异常|超时|timeout|崩溃|error)/i.test(text)) {
        summary.hasAnyError = true;
        summary.firstErrorText ||= text;
      }
      if (classifyAssistantText(text)?.[0] && !/(error|waiting_user)/.test(classifyAssistantText(text)?.[0] || '')) {
        summary.hasProgress = true;
      }
    }

    if (role === 'toolResult') {
      summary.toolResultCount += 1;
      if (line.message.isError) {
        summary.hasToolError = true;
        summary.hasAnyError = true;
        summary.firstErrorText ||= text;
      } else {
        summary.hasProgress = true;
      }
    }
  }

  summary.looksLikeEmptyFailure = summary.hasAnyError && !summary.hasProgress && !summary.hasToolCall && !summary.hasFinalAnswer;
  summary.looksLikeEmptySuccess = !summary.hasAnyError && !summary.hasProgress && !summary.hasToolCall && !summary.hasFinalAnswer && summary.assistantTextCount <= 1 && summary.toolResultCount === 0;
  return summary;
}

function deriveRunStatus(run, lineSummary) {
  const endedStatus = outcomeStatus(run);
  if (lineSummary.hasServerError || lineSummary.hasToolError || lineSummary.looksLikeEmptyFailure) return 'failed';
  if (endedStatus === 'completed' && lineSummary.looksLikeEmptySuccess) return 'blocked';
  return endedStatus;
}

function failureDetailFromRun(run, lineSummary) {
  return shortDetail(
    lineSummary.firstErrorText
      || run?.endedReason
      || run?.frozenResultText
      || run?.outcome?.status
      || '',
    160,
  );
}

export function finalizeState(state, run, lineSummary, now, warningSec, blockedSec) {
  const endedStatus = deriveRunStatus(run, lineSummary);
  if (endedStatus) {
    state.status = endedStatus;
    state.endedAt = new Date(run.endedAt || now).toISOString();
    return;
  }

  if (state.status === 'waiting_user' || state.status === 'failed' || state.status === 'completed') return;

  const lastMs = Date.parse(state.updatedAt || state.startedAt);
  const gapSec = Math.floor((now - lastMs) / 1000);
  if (gapSec >= blockedSec) state.status = 'blocked';
  else state.status = 'running';
  state.warning = gapSec >= warningSec;
  state.silenceSec = gapSec;
}

export function parseEvents({ agents, sessionMap, runs, minutes, warningSec, blockedSec }) {
  const now = Date.now();
  const cutoff = now - minutes * 60 * 1000;
  const events = [];
  const taskStates = new Map();

  const mainData = parseMainSessionEvents({ sessionMap, minutes });
  for (const task of mainData.tasks) taskStates.set(task.taskId, task);

  for (const agent of agents) {
    events.push({
      id: `discover:${agent.id}`,
      ts: new Date(now).toISOString(),
      agentId: agent.id,
      kind: 'agent_discovered',
      title: `已发现 ${agent.name}`,
      detail: agent.theme || undefined,
      level: 'info',
      synthetic: true,
    });
  }

  for (const runId of Object.keys(runs)) {
    const run = runs[runId];
    const sessionKey = run.childSessionKey;
    const sessionMeta = sessionMap[sessionKey];
    const sessionFile = sessionMeta?.sessionFile;
    if (!sessionFile || !fs.existsSync(sessionFile)) continue;

    const agentId = inferAgentId(sessionKey, run);
    const taskId = run.runId;
    const title = normalizeTaskTitle(run);
    const startedIso = new Date(run.startedAt || run.createdAt || now).toISOString();
    const state = {
      taskId,
      agentId,
      title,
      status: 'running',
      startedAt: startedIso,
      updatedAt: startedIso,
      warning: false,
      silenceSec: 0,
      lastEventKind: 'task_started',
      lastEventTitle: title,
    };

    if (Date.parse(startedIso) >= cutoff) {
      events.push({ id: `task:${taskId}:start`, ts: startedIso, agentId, taskId, kind: 'task_started', title: `开始处理：${shortTitle(title, 36)}`, detail: shortDetail(run.task, 120), level: 'info' });
    }

    const lines = readJsonl(sessionFile);
    const lineSummary = inspectRunLines(lines);
    for (const line of lines) {
      if (line.type !== 'message' || !line.message) continue;
      const ts = line.timestamp || line.message.timestamp;
      const tsMs = Date.parse(ts);
      if (!tsMs || tsMs < cutoff) continue;

      const role = line.message.role;
      const content = line.message.content || [];
      if (role === 'assistant') {
        const toolCalls = content.filter((c) => c.type === 'toolCall');
        const text = extractText(content);

        for (const call of toolCalls) {
          const toolName = call.name || 'tool';
          const title2 = toolCallTitle(toolName, call.arguments || {});
          events.push({ id: `${line.id}:${call.id || toolName}`, ts, agentId, taskId, kind: 'stage_started', title: title2, detail: text || undefined, level: 'info' });
          state.updatedAt = ts;
          state.lastEventKind = 'stage_started';
          state.lastEventTitle = title2;
        }

        if (text) {
          const info = classifyAssistantText(text);
          if (info) {
            const [kind, title2, level] = info;
            events.push({ id: `${line.id}:text`, ts, agentId, taskId, kind, title: title2, detail: shortDetail(text, 120), level });
            state.updatedAt = ts;
            state.lastEventKind = kind;
            state.lastEventTitle = title2;
            if (kind === 'task_completed') state.status = 'completed';
            else if (kind === 'error') state.status = state.status === 'completed' ? 'completed' : 'failed';
            else if (kind === 'waiting_user') state.status = 'waiting_user';
            else if (kind === 'milestone' || kind === 'heartbeat') state.status = 'running';
          }
        }
      } else if (role === 'toolResult') {
        const text = extractText(content);
        const toolName = line.message.toolName || 'tool';
        const isError = Boolean(line.message.isError);
        const title2 = toolResultTitle(toolName, isError, text);
        events.push({
          id: `${line.id}:tool`,
          ts,
          agentId,
          taskId,
          kind: isError ? 'error' : 'heartbeat',
          title: title2,
          detail: text ? truncate(text, 160) : undefined,
          level: isError ? 'error' : 'info',
        });
        state.updatedAt = ts;
        state.lastEventKind = isError ? 'error' : 'heartbeat';
        state.lastEventTitle = title2;
        if (isError) state.status = 'failed';
        else if (!['completed', 'waiting_user'].includes(state.status)) state.status = 'running';
      }
    }

    finalizeState(state, run, lineSummary, now, warningSec, blockedSec);

    if (!deriveRunStatus(run, lineSummary) && state.status === 'blocked') {
      events.push({ id: `blocked:${taskId}`, ts: new Date(now).toISOString(), agentId, taskId, kind: 'blocked', title: `疑似卡住：${state.silenceSec}s 没有新进展`, level: 'warn', synthetic: true });
      state.lastEventKind = 'blocked';
      state.lastEventTitle = `疑似卡住：${state.silenceSec}s 没有新进展`;
    } else if (!deriveRunStatus(run, lineSummary) && state.warning) {
      events.push({ id: `warning:${taskId}`, ts: new Date(now).toISOString(), agentId, taskId, kind: 'warning', title: `提醒：${state.silenceSec}s 没有新进展`, level: 'warn', synthetic: true });
    }

    if (deriveRunStatus(run, lineSummary) === 'completed' && Date.parse(run.endedAt || now) >= cutoff && !events.some((e) => e.taskId === taskId && e.kind === 'task_completed')) {
      events.push({ id: `complete:${taskId}`, ts: new Date(run.endedAt || now).toISOString(), agentId, taskId, kind: 'task_completed', title: `任务完成：${shortTitle(title, 36)}`, detail: shortDetail(run.frozenResultText, 120), level: 'info', synthetic: true });
      state.lastEventKind = 'task_completed';
      state.lastEventTitle = `任务完成：${title}`;
    }

    if (deriveRunStatus(run, lineSummary) === 'failed' && Date.parse(run.endedAt || now) >= cutoff && !events.some((e) => e.taskId === taskId && (e.kind === 'task_failed' || e.kind === 'error'))) {
      events.push({ id: `failed:${taskId}`, ts: new Date(run.endedAt || now).toISOString(), agentId, taskId, kind: 'task_failed', title: `任务失败：${shortTitle(title, 36)}`, detail: failureDetailFromRun(run, lineSummary), level: 'error', synthetic: true });
      state.lastEventKind = 'task_failed';
      state.lastEventTitle = `任务失败：${title}`;
    }

    if (deriveRunStatus(run, lineSummary) === 'blocked' && Date.parse(run.endedAt || now) >= cutoff && !events.some((e) => e.taskId === taskId && e.kind === 'blocked')) {
      events.push({ id: `empty:${taskId}`, ts: new Date(run.endedAt || now).toISOString(), agentId, taskId, kind: 'blocked', title: `异常结束：${shortTitle(title, 36)}`, detail: 'run 记录已结束，但 session 内没有足够有效进展，疑似空跑 / 假成功', level: 'warn', synthetic: true });
      state.lastEventKind = 'blocked';
      state.lastEventTitle = `异常结束：${title}`;
    }

    taskStates.set(taskId, state);
  }

  events.push(...mainData.events);
  events.sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts) || String(a.id).localeCompare(String(b.id)));
  return { events, tasks: [...taskStates.values()] };
}

export function renderOverview(agents, tasks) {
  return agents.map((agent) => {
    const related = tasks.filter((t) => t.agentId === agent.id).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    const current = related[0];
    const status = current?.status || 'idle';
    return `${agent.id} ${status}`;
  }).join(' | ');
}

export function pickCurrentTask(tasks, agentId) {
  return tasks
    .filter((t) => t.agentId === agentId)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0] || null;
}

export function statusLabel(status) {
  if (status === 'waiting_user') return '等待中';
  if (status === 'completed') return '已完成';
  if (status === 'failed') return '失败';
  if (status === 'blocked') return '疑似卡住';
  if (status === 'running') return '运行中';
  return '空闲';
}

export function activeTaskVerb(task) {
  if (!task) return '运行中';
  const title = String(task.lastEventTitle || task.title || '').trim();
  const cleaned = title
    .replace(/^开始处理：/, '')
    .replace(/^开始处理:/, '')
    .replace(/^任务完成：/, '')
    .replace(/^任务失败：/, '')
    .replace(/^提醒：/, '')
    .replace(/^疑似卡住：/, '')
    .replace(/^已发现\s+/, '')
    .trim();
  return shortTitle(cleaned || '运行中', 24);
}

export function latestAgentEvent(events, agentId) {
  return [...events].reverse().find((e) => e.agentId === agentId && e.kind !== 'agent_discovered') || null;
}

export function renderAgentActivitySections(agents, tasks, events, newEvents, now) {
  const activeStatuses = new Set(['running', 'waiting_user', 'blocked']);
  const activeLines = [];
  const otherRows = [];

  const iconWidth = Math.max(displayWidth('i'), 2, ...agents.map((agent) => displayWidth(agent.emoji || '•')));
  const agentWidth = Math.max(displayWidth('Agents'), 12, ...agents.map((agent) => displayWidth(agent.name || '-')));

  for (const agent of agents) {
    const current = pickCurrentTask(tasks, agent.id);
    const emoji = agent.emoji || '•';
    const latestEvent = latestAgentEvent(events, agent.id);
    const latestNew = [...newEvents].reverse().find((e) => e.agentId === agent.id) || null;
    if (current && activeStatuses.has(current.status)) {
      const activeLabel = `${padCell(emoji, iconWidth)}  ${padCell(agent.name, agentWidth)}`;
      const parts = [`${activeLabel}  ${activeTaskVerb(current)}`];
      if (latestNew) parts.push(`新增 ${shortTitle(latestNew.title, 18)}`);
      else if (latestEvent) parts.push(`最近 ${shortTitle(latestEvent.title, 18)}`);
      activeLines.push(parts.join(' · '));
    } else {
      otherRows.push({
        icon: emoji,
        agent: agent.name,
        status: statusLabel(current?.status),
        recent: latestEvent ? `${fmtAgo(now - Date.parse(latestEvent.ts))}` : '-',
      });
    }
  }

  const statusWidth = Math.max(displayWidth('状态'), 8, ...otherRows.map((row) => displayWidth(row.status)));
  const recentWidth = Math.max(displayWidth('最近活动'), 12, ...otherRows.map((row) => displayWidth(row.recent)));
  const otherLines = otherRows.length
    ? [
        `${padCell('i', iconWidth)}  ${padCell('Agents', agentWidth)}  ${padCell('状态', statusWidth)}  ${padCell('最近活动', recentWidth)}`,
        ...otherRows.map((row) => `${padCell(row.icon, iconWidth)}  ${padCell(row.agent, agentWidth)}  ${padCell(row.status, statusWidth)}  ${padCell(row.recent, recentWidth)}`),
      ]
    : ['i  Agents'];

  return {
    activeText: activeLines.length ? activeLines.join('\n') : '(当前无活跃 agent)',
    otherText: otherLines.join('\n'),
  };
}

export function divider() {
  return '────────────────────────────────────────';
}

export function formatEventLine(e, { showKind = true, withDetail = false } = {}) {
  const head = `${fmtTs(e.ts)} [${e.agentId}]`;
  const kind = showKind ? ` ${String(e.kind || '').padEnd(14)}` : '';
  const title = shortTitle(e.title, showKind ? 28 : 24);
  const detail = withDetail && e.detail ? `\n    ↳ ${shortDetail(e.detail, 68)}` : '';
  return `${head}${kind} ${title}${detail}`;
}

export function renderStream(events, limit, options = {}) {
  const filtered = events.filter((e) => e.kind !== 'agent_discovered').slice(-limit);
  return filtered.map((e) => formatEventLine(e, options)).join('\n');
}

export function renderSummary(agents, tasks, events) {
  const lines = ['工作纪要'];
  for (const agent of agents) {
    const relatedTasks = tasks.filter((t) => t.agentId === agent.id);
    const relatedEvents = events.filter((e) => e.agentId === agent.id && e.kind !== 'agent_discovered');
    if (!relatedTasks.length) {
      lines.push(`- ${agent.name}：今天暂无活跃任务。`);
      continue;
    }
    const completed = relatedTasks.filter((t) => t.status === 'completed').length;
    const failed = relatedTasks.filter((t) => t.status === 'failed').length;
    const blocked = relatedTasks.filter((t) => t.status === 'blocked').length;
    const running = relatedTasks.filter((t) => t.status === 'running').length;
    const waiting = relatedTasks.filter((t) => t.status === 'waiting_user').length;
    const latestTask = [...relatedTasks].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
    const latestEvent = relatedEvents.slice(-1)[0];
    const milestoneCount = relatedEvents.filter((e) => e.kind === 'milestone').length;

    const parts = [];
    if (completed) parts.push(`已交付 ${completed} 个`);
    if (running) parts.push(`进行中 ${running} 个`);
    if (waiting) parts.push(`待你确认 ${waiting} 个`);
    if (failed) parts.push(`失败 ${failed} 个`);
    if (blocked) parts.push(`疑似卡住 ${blocked} 个`);
    if (!parts.length) parts.push(`共跟到 ${relatedTasks.length} 个任务`);

    let line = `- ${agent.name}：${parts.join('，')}。`;
    if (latestTask) line += ` 当前主线是「${latestTask.title}」`;
    if (milestoneCount) line += `，累计记到 ${milestoneCount} 个阶段性进展`;
    if (latestEvent) line += `；最近动作：${latestEvent.title}`;
    line += '。';
    lines.push(line);
  }
  return lines.join('\n');
}

export function collectData(opts) {
  const config = readJson(CONFIG_PATH, {});
  const agents = discoverAgents(config);
  const sessionMap = getSessionMap();
  const runs = getSubagentRuns();
  const data = parseEvents({ agents, sessionMap, runs, minutes: opts.minutes, warningSec: opts.warningSec, blockedSec: opts.blockedSec });
  return { agents, ...data };
}

function cleanPendingPhrase(value = '') {
  return singleLine(value)
    .replace(/^(继续收口|结论|说明|更新|回复|反馈|同步)[:：]?/g, '')
    .replace(/^(已分派给|主控收到|主控审阅|主控等你|主控已回传)[:：\s-]*/g, '')
    .replace(/^(开始处理|任务完成|任务失败|提醒|疑似卡住)[:：]/g, '')
    .replace(/（.*?）|\(.*?\)/g, ' ')
    .replace(/[【\[][^】\]]+[】\]]/g, ' ')
    .replace(/[#*`>]+/g, ' ')
    .replace(/\b(agent:[^\s]+|run:[^\s]+|session:[^\s]+|task:[^\s]+)\b/gi, ' ')
    .replace(/\bdev-agent-timeline[\w-]*\b/gi, ' ')
    .replace(/\b[a-f0-9]{8,}\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizePendingKey(task) {
  const statusBucket = task.status === 'failed' ? 'risk' : task.status === 'blocked' ? 'risk' : 'waiting';
  const sources = [
    cleanPendingPhrase(task.title || ''),
    cleanPendingPhrase(task.lastEventTitle || ''),
    cleanPendingPhrase(task.lastEventDetail || ''),
  ].filter(Boolean);
  const canonical = sources.find((text) => text.length >= 6) || sources[0] || task.taskId || 'pending';
  const shortened = canonical.split(/[，。:：|/]/)[0].trim();
  return `${task.agentId}:${statusBucket}:${shortened || canonical}`;
}

function sumUsageUsage(lines = [], cutoffMs = 0) {
  const totals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, countedMessages: 0 };
  for (const line of lines) {
    const tsMs = Date.parse(line.timestamp || line.message?.timestamp || 0);
    if (!tsMs || tsMs < cutoffMs) continue;
    const usage = line.message?.usage;
    if (!usage) continue;
    totals.input += Number(usage.input || 0);
    totals.output += Number(usage.output || 0);
    totals.cacheRead += Number(usage.cacheRead || 0);
    totals.cacheWrite += Number(usage.cacheWrite || 0);
    totals.totalTokens += Number(usage.totalTokens || 0);
    totals.countedMessages += 1;
  }
  return totals;
}

function addUsageTotals(target, usage) {
  target.input += Number(usage.input || 0);
  target.output += Number(usage.output || 0);
  target.cacheRead += Number(usage.cacheRead || 0);
  target.cacheWrite += Number(usage.cacheWrite || 0);
  target.totalTokens += Number(usage.totalTokens || 0);
  target.countedMessages += Number(usage.countedMessages || 0);
}

function finalizeTokenStats(totals, cutoffMs) {
  const avgPerMessage = totals.countedMessages ? Math.round(totals.totalTokens / totals.countedMessages) : 0;
  return {
    ...totals,
    avgPerMessage,
    estimatedSingleTurnTokens: avgPerMessage,
    rangeStartedAt: new Date(cutoffMs).toISOString(),
  };
}

function collectRangeTokenStats(minutes) {
  const now = Date.now();
  const cutoffMs = now - minutes * 60 * 1000;
  const sessionMap = getSessionMap();
  const runs = getSubagentRuns();
  const seenFiles = new Set();
  const totals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, countedMessages: 0, sessions: 0 };

  const mainFile = sessionMap['agent:main:main']?.sessionFile;
  if (mainFile && fs.existsSync(mainFile)) {
    addUsageTotals(totals, sumUsageUsage(readJsonl(mainFile), cutoffMs));
    totals.sessions += 1;
    seenFiles.add(mainFile);
  }

  for (const run of Object.values(runs)) {
    const sessionFile = sessionMap[run.childSessionKey]?.sessionFile;
    if (!sessionFile || seenFiles.has(sessionFile) || !fs.existsSync(sessionFile)) continue;
    addUsageTotals(totals, sumUsageUsage(readJsonl(sessionFile), cutoffMs));
    totals.sessions += 1;
    seenFiles.add(sessionFile);
  }

  return finalizeTokenStats(totals, cutoffMs);
}

function collectAgentTokenStats(minutes, agentId) {
  const now = Date.now();
  const cutoffMs = now - minutes * 60 * 1000;
  const sessionMap = getSessionMap();
  const runs = getSubagentRuns();
  const seenFiles = new Set();
  const totals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, countedMessages: 0, sessions: 0 };

  if (agentId === 'main') {
    const mainFile = sessionMap['agent:main:main']?.sessionFile;
    if (mainFile && fs.existsSync(mainFile)) {
      addUsageTotals(totals, sumUsageUsage(readJsonl(mainFile), cutoffMs));
      totals.sessions += 1;
      seenFiles.add(mainFile);
    }
  }

  for (const run of Object.values(runs)) {
    const inferredAgentId = inferAgentId(run.childSessionKey, run);
    if (inferredAgentId !== agentId) continue;
    const sessionFile = sessionMap[run.childSessionKey]?.sessionFile;
    if (!sessionFile || seenFiles.has(sessionFile) || !fs.existsSync(sessionFile)) continue;
    addUsageTotals(totals, sumUsageUsage(readJsonl(sessionFile), cutoffMs));
    totals.sessions += 1;
    seenFiles.add(sessionFile);
  }

  return finalizeTokenStats(totals, cutoffMs);
}

export function buildGuiSnapshot(raw, opts = {}) {
  const minutes = opts.minutes ?? 180;
  const limit = opts.limit ?? 200;
  const agentMap = new Map(raw.agents.map((agent) => [agent.id, agent]));
  const events = raw.events.filter((event) => event.kind !== 'agent_discovered').slice(-limit).reverse();

  const agents = raw.agents.map((agent) => {
    const tasks = raw.tasks.filter((task) => task.agentId === agent.id).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    const currentTask = tasks[0] || null;
    const latestEvent = raw.events.filter((event) => event.agentId === agent.id && event.kind !== 'agent_discovered').slice(-1)[0] || null;
    return {
      ...agent,
      status: currentTask?.status || 'idle',
      updatedAt: currentTask?.updatedAt || latestEvent?.ts || null,
      lastTitle: currentTask?.lastEventTitle || latestEvent?.title || '还没有动态',
      currentTask,
      recentTasks: tasks.slice(0, 6),
      recentEvents: raw.events.filter((event) => event.agentId === agent.id && event.kind !== 'agent_discovered').slice(-30).reverse(),
      tokenStats: collectAgentTokenStats(minutes, agent.id),
    };
  });

  const activeAgentIds = new Set(
    agents
      .filter((agent) => ['running', 'blocked'].includes(agent.status))
      .map((agent) => agent.id),
  );

  const pendingMap = new Map();
  raw.tasks
    .filter((task) => ['waiting_user', 'blocked', 'failed'].includes(task.status))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .forEach((task) => {
      const key = normalizePendingKey(task);
      if (!pendingMap.has(key)) pendingMap.set(key, task);
    });
  const pending = [...pendingMap.values()];

  const tokenStats = collectRangeTokenStats(minutes);

  const overview = {
    activeCount: raw.tasks.filter((task) => task.status === 'running').length,
    executingCount: agents.filter((agent) => ['running', 'waiting_user', 'blocked'].includes(agent.status)).length,
    waitingCount: agents.filter((agent) => agent.status === 'waiting_user').length,
    completedCount: raw.tasks.filter((task) => task.status === 'completed').length,
    riskCount: agents.filter((agent) => ['failed', 'blocked'].includes(agent.status)).length,
    windowMinutes: minutes,
    updatedAt: new Date().toISOString(),
    tokenStats,
  };

  return {
    overview,
    agents,
    activeAgents: agents.filter((agent) => activeAgentIds.has(agent.id)),
    rosterAgents: agents.filter((agent) => !activeAgentIds.has(agent.id)),
    events,
    pending,
    filters: {
      keyword: '',
      rangeOptions: [15, 60, 180, 1440],
      selectedMinutes: minutes,
      kinds: ['running', 'completed', 'waiting_user', 'failed', 'blocked', 'milestone', 'heartbeat', 'error', 'main_received', 'main_delivered', 'main_waiting_user', 'main_routed', 'main_reviewing'],
    },
    meta: {
      generatedAt: new Date().toISOString(),
      agentCount: raw.agents.length,
      eventCount: raw.events.length,
      taskCount: raw.tasks.length,
      agentMap: Object.fromEntries(agentMap),
    },
  };
}

export function getTimelineSnapshot(opts = {}) {
  const normalized = {
    minutes: opts.minutes ?? 180,
    warningSec: opts.warningSec ?? 45,
    blockedSec: opts.blockedSec ?? 120,
    limit: opts.limit ?? 200,
  };
  const raw = collectData(normalized);
  return buildGuiSnapshot(raw, normalized);
}
