#!/usr/bin/env node
import {
  WATCH_STATUS_DOT,
  collectData,
  divider,
  fmtAgo,
  fmtTs,
  formatEventLine,
  parseArgs,
  relTime,
  renderAgentActivitySections,
  renderOverview,
  renderStream,
  renderSummary,
  sleep,
} from '../src/shared/timeline-core.mjs';

async function runWatch(opts) {
  let seen = new Set();
  let first = true;
  let lastChangeAt = null;
  const startedAt = Date.now();
  while (true) {
    const refreshedAt = new Date();
    const data = collectData(opts);
    const visibleEvents = data.events.filter((e) => e.kind !== 'agent_discovered').slice(-opts.limit);
    const newEvents = first ? visibleEvents : visibleEvents.filter((e) => !seen.has(e.id));
    if (newEvents.length) lastChangeAt = refreshedAt;

    const activeAgents = data.agents.filter((agent) => {
      const currentTask = data.tasks
        .filter((task) => task.agentId === agent.id)
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
      return currentTask && ['running', 'waiting_user', 'blocked'].includes(currentTask.status);
    });
    const activeTaskCount = activeAgents.length;
    const activeMainTask = data.tasks
      .filter((task) => task.agentId === 'main' && ['running', 'waiting_user', 'blocked'].includes(task.status))
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
    const uptime = relTime(Date.now() - startedAt);
    const lastNewText = `最近新增 ${fmtAgo(lastChangeAt ? refreshedAt.getTime() - lastChangeAt.getTime() : null)}`;
    const activityText = activeTaskCount
      ? `当前活跃：${activeTaskCount} 个 agent 正在处理`
      : '当前空闲：无活跃 agent';
    const activityHint = activeMainTask && activeTaskCount === 1
      ? `主会话：${activeMainTask.lastEventTitle || activeMainTask.title}`
      : null;
    const sections = renderAgentActivitySections(data.agents, data.tasks, data.events, newEvents, refreshedAt.getTime());

    process.stdout.write('\x1Bc');
    console.log(`Agent Timeline Watch · ${refreshedAt.toLocaleString('zh-CN')} · 每 ${opts.intervalSec}s 刷新`);
    console.log(`\n${divider()}`);
    console.log('最近进展');
    if (!visibleEvents.length) console.log('(暂无事件)');
    else console.log(renderStream(data.events, opts.limit, { withDetail: true }));

    console.log(`\n${divider()}`);
    console.log('本轮新增');
    if (!newEvents.length) console.log('(本轮无新增，watch 仍在运行)');
    else console.log(newEvents.map((e) => formatEventLine(e, { showKind: false, withDetail: false })).join('\n'));

    console.log(`\n${divider()}`);
    console.log('正在执行');
    console.log(sections.activeText);

    console.log(`\n${divider()}`);
    console.log(sections.otherText);

    console.log(`\n${divider()}`);
    console.log('状态');
    console.log(`${WATCH_STATUS_DOT} ${uptime} · ${lastNewText} · ${activityText}`);
    console.log(activityHint || (lastChangeAt ? `上次变更 ${fmtTs(lastChangeAt.toISOString())}` : '上次变更 -'));

    seen = new Set(visibleEvents.map((e) => e.id));
    first = false;
    await sleep(opts.intervalSec * 1000);
  }
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    console.log('Usage: node projects/agent-timeline/bin/agent-timeline.mjs [overview|stream|summary|watch] [--minutes N] [--warning-sec N] [--blocked-sec N] [--limit N] [--interval-sec N] [--json]');
    process.exit(0);
  }

  if (opts.mode === 'watch') {
    await runWatch(opts);
    return;
  }

  const data = collectData(opts);
  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  if (opts.mode === 'stream') console.log(renderStream(data.events, opts.limit));
  else if (opts.mode === 'summary') console.log(renderSummary(data.agents, data.tasks, data.events));
  else console.log(renderOverview(data.agents, data.tasks));
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
