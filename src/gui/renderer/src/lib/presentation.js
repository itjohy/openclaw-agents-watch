export const KIND_TEXT = {
  milestone: '阶段进展',
  heartbeat: '状态回报',
  error: '错误',
  warning: '提醒',
  waiting_user: '等待你处理',
  blocked: '疑似卡住',
  task_completed: '任务完成',
  task_failed: '任务失败',
  task_started: '开始处理',
  stage_started: '阶段开始',
  main_received: '主控收到',
  main_routed: '主控分派',
  main_reviewing: '主控审阅',
  main_waiting_user: '主控等你',
  main_delivered: '主控已回传',
  running: '运行中',
  completed: '已完成',
  failed: '失败',
  idle: '空闲',
};

export const STATUS_TEXT = {
  idle: '空闲',
  running: '运行中',
  waiting_user: '等待确认',
  blocked: '疑似卡住',
  failed: '失败',
  completed: '已完成',
};

export function getKindLabel(kind) {
  return KIND_TEXT[kind] || kind || '—';
}

export function getStatusLabel(status) {
  return STATUS_TEXT[status] || status || '—';
}

export function formatDateTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('zh-CN');
}

export function formatCompactNumber(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return '—';
  if (num >= 1000000) return `${(num / 1000000).toFixed(num >= 10000000 ? 0 : 1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}k`;
  return String(Math.round(num));
}

export function summarizeKinds(kinds = []) {
  if (!kinds.length) return '全部类型';
  if (kinds.length <= 2) return kinds.map(getKindLabel).join(' / ');
  return `已选 ${kinds.length} 类`;
}

export function toSelectionFromEvent(event) {
  if (!event) return null;
  return {
    id: `event:${event.id}`,
    source: 'event',
    agentId: event.agentId,
    title: event.title,
    status: event.kind,
    statusLabel: getKindLabel(event.kind),
    updatedAt: event.ts,
    summary: event.detail || event.title,
    detail: event.detail || '—',
    event,
  };
}

export function toSelectionFromTask(task) {
  if (!task) return null;
  return {
    id: `task:${task.taskId}`,
    source: 'task',
    agentId: task.agentId,
    title: task.title,
    status: task.status,
    statusLabel: getStatusLabel(task.status),
    updatedAt: task.updatedAt,
    summary: task.lastEventTitle || task.title,
    detail: task.lastEventDetail || task.lastEventTitle || '—',
    task,
  };
}
