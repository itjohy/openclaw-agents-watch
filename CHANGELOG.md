# Changelog

## v0.1.1 - 2026-03-13

### What changed
- Continued productizing the GUI watchboard instead of expanding it into a task admin panel.
- Tightened the meaning of the running section so `正在执行` only reflects agents actually in `running` state.
- Reduced dashboard noise by removing redundant agent-list header copy.
- Switched the top token summary to prefer the currently selected agent's average tokens per message, with global average as fallback.
- Relaxed several hard-coded widths in the renderer so narrow layouts behave more like true responsive panels.
- Reworked the top refresh area into fixed slots (`状态 / 周期 / 更新`) to stop time changes from causing header layout jitter.
- Kept `已开启` stable during automatic refresh and moved refresh feedback to fixed-size activity indicators.
- Kept the `立即刷新` button label stable to avoid flashing caused by loading-text swaps.

### Result
- The GUI now feels more stable during automatic refresh.
- The watchboard is closer to a usable product iteration, with fewer obvious visual rough edges.
- `npm run gui:build` passes for this version.

### Notes
- This is still a local OpenClaw watch tool, not a packaged standalone desktop product yet.
- The next iteration should focus on higher-level product polish, such as main-focus storytelling and denser but cleaner agent summaries.
