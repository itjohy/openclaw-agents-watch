import { useEffect, useMemo, useRef, useState } from 'react';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { toSelectionFromEvent, toSelectionFromTask } from './lib/presentation.js';

function OverviewOrb({ label, value, tone = 'neutral', note, title }) {
  return (
    <div className={`overview-orb ${tone}`} title={title || label}>
      <span className="overview-orb-value">{value}</span>
      <span className="overview-orb-label">{label}</span>
      {note ? <span className="overview-orb-note">{note}</span> : null}
    </div>
  );
}

const RANGE_OPTIONS = [15, 60, 180, 1440];

function applyFilters(snapshot, filters) {
  if (!snapshot) return null;
  const keyword = filters.keyword.trim().toLowerCase();
  const allowedKinds = new Set(filters.kinds);
  const matchText = (value = '') => String(value).toLowerCase().includes(keyword);

  const events = snapshot.events.filter((event) => {
    const kindMatch = filters.kinds.length === 0 || allowedKinds.has(event.kind);
    const keywordMatch = !keyword || matchText(event.title) || matchText(event.detail) || matchText(event.agentId);
    return kindMatch && keywordMatch;
  });

  const agents = snapshot.agents.map((agent) => ({
    ...agent,
    recentEvents: agent.recentEvents.filter((event) => {
      const kindMatch = filters.kinds.length === 0 || allowedKinds.has(event.kind);
      const keywordMatch = !keyword || matchText(event.title) || matchText(event.detail) || matchText(event.agentId);
      return kindMatch && keywordMatch;
    }),
    recentTasks: agent.recentTasks.filter((task) => {
      const statusMatch = filters.kinds.length === 0 || allowedKinds.has(task.status);
      const keywordMatch = !keyword || matchText(task.title) || matchText(task.lastEventTitle) || matchText(task.agentId);
      return statusMatch && keywordMatch;
    }),
  }));

  const activeAgentIds = new Set(
    agents.filter((agent) => ['running', 'blocked'].includes(agent.status)).map((agent) => agent.id),
  );

  return {
    ...snapshot,
    events,
    agents,
    activeAgents: agents.filter((agent) => activeAgentIds.has(agent.id)),
    rosterAgents: agents.filter((agent) => !activeAgentIds.has(agent.id)),
  };
}

export default function App() {
  const [snapshot, setSnapshot] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [timelineMode, setTimelineMode] = useState('compact');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [refreshSeconds, setRefreshSeconds] = useState(3);
  const refreshInFlightRef = useRef(false);
  const [filters, setFilters] = useState({
    minutes: 180,
    keyword: '',
    kinds: [],
  });

  const refresh = async (minutes = filters.minutes, { silent = false } = {}) => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const api = window.timelineApi;
      if (!api?.getSnapshot) {
        throw new Error('Electron preload 未注入 timelineApi，请通过 Electron 启动 GUI。');
      }
      const next = await api.getSnapshot({ minutes, limit: 240 });
      setSnapshot(next);
      setSelectedAgentId((prev) => prev && next.agents.find((agent) => agent.id === prev) ? prev : next.agents[0]?.id || null);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      refreshInFlightRef.current = false;
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh(filters.minutes);
    const timer = window.setInterval(() => refresh(filters.minutes, { silent: true }), refreshSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [filters.minutes, refreshSeconds]);

  const filteredSnapshot = useMemo(() => applyFilters(snapshot, filters), [snapshot, filters]);
  const selectedAgent = filteredSnapshot?.agents.find((agent) => agent.id === selectedAgentId) || filteredSnapshot?.agents[0] || null;
  const executingCount = filteredSnapshot?.agents?.filter((agent) => ['running', 'waiting_user', 'blocked'].includes(agent.status)).length ?? 0;

  useEffect(() => {
    if (!filteredSnapshot) {
      setSelectedItem(null);
      return;
    }

    setSelectedItem((prev) => {
      if (prev?.source === 'task') {
        const nextTask = selectedAgent?.recentTasks.find((task) => task.taskId === prev.task?.taskId)
          || filteredSnapshot.agents.flatMap((agent) => agent.recentTasks).find((task) => task.taskId === prev.task?.taskId);
        if (nextTask) return toSelectionFromTask(nextTask);
      }
      if (prev?.source === 'event') {
        const nextEvent = filteredSnapshot.events.find((event) => event.id === prev.event?.id)
          || selectedAgent?.recentEvents.find((event) => event.id === prev.event?.id);
        if (nextEvent) return toSelectionFromEvent(nextEvent);
      }
      if (selectedAgent?.currentTask) return toSelectionFromTask(selectedAgent.currentTask);
      if (selectedAgent?.recentEvents?.[0]) return toSelectionFromEvent(selectedAgent.recentEvents[0]);
      return null;
    });
  }, [filteredSnapshot, selectedAgentId]);

  return (
    <div className="app-shell terminal-shell">
      <header className="topbar terminal-topbar drag-region">
        <div className="topbar-main">
          <div className="drag-strip" aria-hidden="true">
            <span className="drag-strip-label">Agent Timeline</span>
            <span className="drag-strip-meta">拖这里移动窗口</span>
          </div>

          <div className="toolbar-row top-summary-row">
            <div className="toolbar-title merged-toolbar-title">
              <div className="toolbar-title-block">
                <div>
                  <div className="eyebrow">Agent Timeline</div>
                  <h1>观望台</h1>
                </div>
                <span className="toolbar-meta stacked-meta title-meta-below">
                  <span>{loading ? '读取中…' : filteredSnapshot ? `最近 ${filteredSnapshot.overview.windowMinutes} 分钟` : '等待数据'}</span>
                  <span className="toolbar-meta-subline fixed-width-meta">{refreshing ? `静默刷新中 · ${refreshSeconds}s` : snapshot?.overview.updatedAt ? `更新 ${new Date(snapshot.overview.updatedAt).toLocaleTimeString('zh-CN')} · ${refreshSeconds}s` : '等待首轮刷新'}</span>
                </span>
              </div>
            </div>

            <div className="top-summary-metrics top-summary-metrics-4">
              <OverviewOrb label="执行中" value={executingCount ?? '—'} tone="peach" title="按 agent 最新状态去重：running / waiting_user / blocked" />
              <OverviewOrb label="等待确认" value={filteredSnapshot?.overview?.waitingCount ?? '—'} tone="yellow" />
              <OverviewOrb label="完成" value={filteredSnapshot?.overview?.completedCount ?? '—'} tone="mint" />
              <OverviewOrb label="风险" value={filteredSnapshot?.overview?.riskCount ?? '—'} tone="rose" />
            </div>
          </div>
        </div>
      </header>

      {error ? <div className="error-banner">读取本地 timeline 失败：{error}</div> : null}

      <main className="layout-grid terminal-layout-grid">
        <DashboardPage
          snapshot={filteredSnapshot}
          loading={loading}
          refreshing={refreshing}
          refreshSeconds={refreshSeconds}
          setRefreshSeconds={setRefreshSeconds}
          onRefresh={() => refresh(filters.minutes)}
          selectedAgentId={selectedAgentId}
          selectedItem={selectedItem}
          timelineMode={timelineMode}
          onSelectAgent={setSelectedAgentId}
          onSelectItem={setSelectedItem}
          onChangeTimelineMode={setTimelineMode}
          filters={filters}
          setFilters={setFilters}
        />
      </main>
    </div>
  );
}
