import { AgentCard } from '../components/AgentCard.jsx';
import { EventList } from '../components/EventList.jsx';
import { getKindLabel, summarizeKinds, toSelectionFromEvent, toSelectionFromTask } from '../lib/presentation.js';

const FILTER_KINDS = ['milestone', 'heartbeat', 'error', 'waiting_user', 'blocked', 'task_completed', 'task_failed', 'main_received', 'main_routed', 'main_reviewing', 'main_waiting_user', 'main_delivered'];

function toggleKind(filters, setFilters, kind) {
  setFilters((prev) => ({
    ...prev,
    kinds: prev.kinds.includes(kind) ? prev.kinds.filter((item) => item !== kind) : [...prev.kinds, kind],
  }));
}

function AgentSection({ title, hint, agents, loading, emptyText, selectedAgentId, onSelectAgent, onSelectItem, working = false, hideWhenEmpty = false, hideHeading = false }) {
  if (hideWhenEmpty && !loading && !agents.length) return null;

  return (
    <div className="agent-section-block">
      {!hideHeading ? (
        <div className="agent-section-head">
          <span className="agent-section-title">{title}</span>
          <span className="agent-section-hint">{hint}</span>
        </div>
      ) : null}
      <div className="agent-list">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            active={agent.id === selectedAgentId}
            working={working}
            onClick={() => {
              onSelectAgent(agent.id);
              if (working && agent.currentTask) onSelectItem(toSelectionFromTask(agent.currentTask));
            }}
          />
        ))}
        {!loading && !agents.length ? <div className="empty-row">{emptyText}</div> : null}
      </div>
    </div>
  );
}

export function DashboardPage({ snapshot, loading, refreshing, refreshSeconds, setRefreshSeconds, onRefresh, selectedAgentId, selectedItem, onSelectAgent, onSelectItem, timelineMode, onChangeTimelineMode, filters, setFilters }) {
  const activeAgents = snapshot?.activeAgents || [];
  const rosterAgents = snapshot?.rosterAgents || [];

  return (
    <section className="dashboard-column">
      <div className="panel panel-terminal agent-panel">
        <div className="panel-head-row compact-head-row">
          <div>
            <h2>agent 列表</h2>
          </div>
          <div className="panel-hint">按状态分组，没在跑就不显示“正在执行”</div>
        </div>
        <div className="list-head agent-head">
          <span>Agent</span>
          <span>状态</span>
          <span>更新</span>
          <span>最近动作</span>
        </div>
        <AgentSection
          title="正在执行"
          hint="运行中 / 风险中"
          agents={activeAgents}
          loading={loading}
          emptyText="当前没有正在执行的 agent。"
          selectedAgentId={selectedAgentId}
          onSelectAgent={onSelectAgent}
          onSelectItem={onSelectItem}
          working
          hideWhenEmpty
        />
        <AgentSection
          title={activeAgents.length ? '其余 agent' : ''}
          hint={activeAgents.length ? '空闲 / 等待确认 / 已完成 / 失败' : ''}
          agents={rosterAgents}
          loading={loading}
          emptyText="当前没有额外 agent 数据。"
          selectedAgentId={selectedAgentId}
          onSelectAgent={onSelectAgent}
          onSelectItem={onSelectItem}
          hideHeading={!activeAgents.length}
        />
      </div>

      <div className="panel panel-terminal">
        <div className="panel-head-row compact-head-row timeline-panel-head">
          <div>
            <h2>日志详情</h2>
          </div>
          <div className="timeline-toolbar">
            <span className="panel-hint">倒序显示</span>
            <div className="segmented-toggle">
              <button className={timelineMode === 'compact' ? 'active' : ''} onClick={() => onChangeTimelineMode('compact')}>简洁</button>
              <button className={timelineMode === 'detail' ? 'active' : ''} onClick={() => onChangeTimelineMode('detail')}>详细</button>
            </div>
          </div>
        </div>

        <div className="timeline-toolbar-shell">
          <div className="timeline-filter-toolbar" role="toolbar" aria-label="日志筛选工具栏">
            <div className="timeline-filter-group timeline-filter-group-card">
              <span className="toolbar-group-label">范围</span>
              <label className="control-field inline-field slim-field">
                <select value={filters.minutes} onChange={(e) => setFilters((prev) => ({ ...prev, minutes: Number(e.target.value) }))}>
                  {[15, 60, 180, 1440].map((minutes) => <option key={minutes} value={minutes}>最近 {minutes >= 60 ? `${minutes / 60} 小时` : `${minutes} 分钟`}</option>)}
                </select>
              </label>
            </div>

            <div className="timeline-filter-group timeline-filter-group-card">
              <span className="toolbar-group-label">搜索</span>
              <label className="control-field inline-field grow timeline-search-field">
                <input value={filters.keyword} onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))} placeholder="搜标题 / 日志 / detail" />
              </label>
            </div>

            <div className="timeline-filter-group timeline-filter-group-card timeline-filter-group-right">
              <span className="toolbar-group-label">刷新</span>
              <label className="control-field inline-field slim-field">
                <select value={refreshSeconds} onChange={(e) => setRefreshSeconds(Number(e.target.value))}>
                  {[3, 5, 10, 15].map((seconds) => <option key={seconds} value={seconds}>{seconds} 秒</option>)}
                </select>
              </label>
              <button className="refresh-btn terminal-refresh-btn no-drag" onClick={onRefresh}>{loading || refreshing ? '刷新中…' : '立即刷新'}</button>
            </div>
          </div>

          <details className="filter-collapse" open>
            <summary>
              <span>类型筛选</span>
              <span className="filter-collapse-meta">{summarizeKinds(filters.kinds)}</span>
            </summary>
            <div className="filter-check-grid">
              {FILTER_KINDS.map((kind) => (
                <label key={kind} className={`filter-check ${filters.kinds.includes(kind) ? 'active' : ''}`}>
                  <input type="checkbox" checked={filters.kinds.includes(kind)} onChange={() => toggleKind(filters, setFilters, kind)} />
                  <span>{getKindLabel(kind)}</span>
                </label>
              ))}
            </div>
          </details>
        </div>
        <div className={`list-head event-head compact-event-head ${timelineMode === 'compact' ? 'timeline-head-compact' : ''}`}>
          <span>时间</span>
          <span>Agent</span>
          <span>类型</span>
          <span>标题</span>
          {timelineMode === 'detail' ? <span>细节</span> : null}
        </div>
        <EventList
          events={snapshot?.events?.slice(0, 20) || []}
          emptyText="还没有时间线事件。"
          compact={timelineMode === 'compact'}
          detailMode={timelineMode === 'detail'}
          selectedEventId={selectedItem?.source === 'event' ? selectedItem.event?.id : selectedItem?.task?.taskId}
          onSelect={(event) => onSelectItem(toSelectionFromEvent(event))}
        />
      </div>
    </section>
  );
}
