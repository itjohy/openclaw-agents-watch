import { EventList } from '../components/EventList.jsx';
import { formatDateTime, getKindLabel, getStatusLabel, toSelectionFromEvent } from '../lib/presentation.js';

export function AgentDetailPage({ agent, selectedItem, loading, keyword, onSelectItem }) {
  const relatedEvents = agent?.recentEvents || [];

  return (
    <aside className="detail-column">
      <div className="panel panel-terminal detail-summary-panel">
        <div className="panel-head-row compact-head-row">
          <div>
            <div className="section-kicker">Agent Detail</div>
            <h2>{agent ? `${agent.emoji || '•'} ${agent.name}` : '详情承接区'}</h2>
          </div>
          <div className="panel-hint">{agent ? getStatusLabel(agent.status) : '先从左侧选一个 agent'}</div>
        </div>
        <div className="detail-metadata-grid">
          <div className="detail-meta-line"><span>当前任务</span><strong>{agent?.currentTask?.title || '暂无'}</strong></div>
          <div className="detail-meta-line"><span>最近动作</span><strong>{agent?.lastTitle || '暂无最近动作'}</strong></div>
          <div className="detail-meta-line"><span>更新时间</span><strong>{formatDateTime(agent?.updatedAt)}</strong></div>
          <div className="detail-meta-line"><span>搜索上下文</span><strong>{keyword || '未输入关键词'}</strong></div>
        </div>
      </div>

      <div className="panel panel-terminal unified-detail-panel">
        <div className="panel-head-row compact-head-row">
          <div>
            <div className="section-kicker">Unified Detail</div>
            <h2>详情承接</h2>
          </div>
          <div className="panel-hint">任务与日志共用同一块，不再拆成两区</div>
        </div>

        <div className="selection-summary">
          <div className="selection-title-row">
            <strong>{selectedItem?.title || '先点一条任务或时间线'}</strong>
            <span className={`selection-badge ${selectedItem?.status || 'idle'}`}>{selectedItem?.statusLabel || '等待选择'}</span>
          </div>
          <div className="selection-meta-grid">
            <span>来源：{selectedItem?.source === 'task' ? 'agent 列表 / 任务' : selectedItem?.source === 'event' ? '全局时间线 / 事件' : '—'}</span>
            <span>Agent：{selectedItem?.agentId || agent?.id || '—'}</span>
            <span>时间：{formatDateTime(selectedItem?.updatedAt)}</span>
          </div>
          <div className="selection-detail-block">{selectedItem?.detail || selectedItem?.summary || '选中后在这里承接标题、状态和细节。'}</div>
        </div>

        <div className="panel-subsection">
          <div className="subsection-head">
            <strong>相关日志</strong>
            <span>{selectedItem?.source === 'task' ? '优先显示当前 agent 的事件' : '点击下方任意条继续承接'}</span>
          </div>
          <EventList
            events={relatedEvents.slice(0, 12)}
            emptyText={loading ? '读取中…' : '这个 agent 暂时没有事件。'}
            compact
            selectedEventId={selectedItem?.source === 'event' ? selectedItem.event?.id : undefined}
            onSelect={(event) => onSelectItem(toSelectionFromEvent(event))}
          />
        </div>

        <div className="detail-footnote">当前筛选关键词：{keyword || '无'} · 类型显示：{selectedItem ? getKindLabel(selectedItem.status) : '未选中'}</div>
      </div>
    </aside>
  );
}
