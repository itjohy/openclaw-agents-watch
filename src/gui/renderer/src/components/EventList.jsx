import { getKindLabel } from '../lib/presentation.js';

function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function EventList({ events = [], emptyText = '还没有可展示的事件', compact = false, detailMode = false, selectedEventId, onSelect }) {
  if (!events.length) return <div className="empty-row">{emptyText}</div>;

  return (
    <div className={`event-list ${compact ? 'compact' : ''} ${detailMode ? 'detail-mode' : ''}`}>
      {events.map((event) => {
        const eventKey = event.linkedTask?.taskId || event.id;
        const selected = selectedEventId && selectedEventId === eventKey;
        return (
          <button
            key={event.id}
            className={`event-row ${event.level || 'info'} ${compact ? 'compact' : ''} ${detailMode ? 'detail-mode' : ''} ${selected ? 'active' : ''}`}
            onClick={() => onSelect?.(event)}
            title={event.detail || event.title}
          >
            <div className="event-row-time">{formatTime(event.ts)}</div>
            <div className="event-row-agent">{event.agentId || '—'}</div>
            <div className="event-row-kind">{getKindLabel(event.kind)}</div>
            <div className="event-row-title" title={event.title}>{event.title}</div>
            {detailMode ? <div className="event-row-detail" title={event.detail || '—'}>{event.detail || '—'}</div> : null}
          </button>
        );
      })}
    </div>
  );
}
