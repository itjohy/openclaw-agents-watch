import { getStatusLabel } from '../lib/presentation.js';

function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusTone(status) {
  if (status === 'waiting_user') return 'waiting';
  if (['blocked', 'failed'].includes(status)) return 'danger';
  if (status === 'running') return 'healthy';
  return 'neutral';
}

export function AgentCard({ agent, active, onClick, working = false }) {
  const summary = working
    ? agent.currentTask?.lastEventTitle || agent.currentTask?.title || agent.lastTitle || '正在运行'
    : agent.currentTask?.lastEventTitle || agent.currentTask?.title || agent.lastTitle || '暂无最近动作';
  const statusTone = getStatusTone(agent.status);

  return (
    <button className={`agent-row ${active ? 'active' : ''} status-${statusTone} ${working ? 'working' : ''} ${working ? `working-${statusTone}` : ''}`} onClick={onClick}>
      <span className="agent-row-name">
        <span className={`agent-row-emoji ${working ? 'working-dot-wrap' : ''}`}>
          {working ? <span className={`working-dot ${statusTone}`} aria-hidden="true" /> : null}
          <span>{agent.emoji || '•'}</span>
        </span>
        <span className="agent-row-name-text">{agent.name}</span>
      </span>
      <span className="agent-row-status-wrap">
        <span className={`agent-row-status ${agent.status}`}>{getStatusLabel(agent.status)}</span>
        <span className="agent-row-updated agent-row-updated-mobile">{formatTime(agent.updatedAt)}</span>
      </span>
      <span className="agent-row-updated">{formatTime(agent.updatedAt)}</span>
      <span className="agent-row-summary">{summary}</span>
    </button>
  );
}
