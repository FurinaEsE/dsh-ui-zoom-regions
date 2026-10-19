# Changelog

## 1.1.1

First registry publish. Identical code to 1.1.0, which stayed in npm staging: a granular
token with bypass-2FA stages a brand-new package, and that staged version never showed up
for approval on this account. Bumped to get a clean, directly published release.

## 1.1.0

The header's resize handle is gone; the header's whole bottom edge is the handle now, and it resizes
in both directions.

- **Header edge instead of a pill.** The 64 × 6 grip, its hover fill, its intro pulse and the
  corresponding `@keyframes` are removed. The drag target is an invisible, full-width 9 px band on
  the header's bottom edge (`left: 0; right: 0; bottom: -4px; height: 9px`) that paints nothing and
  only sets `cursor: ns-resize`.
- **The header grows as well as shrinks.** Dragging down raises the header up to **half the
  conversation panel's height**; dragging up goes down to 25 %.
- **Growing never enlarges the labels.** Row zoom is capped at 100 % and the extra height comes from
  the header's own `min-height`, so a tall header keeps normal-size text.
- **The ceiling is measured, not hard-coded.** The panel is resolved through the conversation column,
  then the nearest ancestor that is meaningfully taller than the header, then the window height; a
  4× floor keeps a failed measurement from silently shrinking the range. Recorded as
  `headerCeiling` in the diag receipt.
- **Sidebar zoom range widened** to 25 %–300 % for the left and right sidebar (`REGION_BOUNDS`);
  the centre column stays at 50 %–200 % and the header keeps its measured ceiling.
- **Fixed: the grip reset a zoomed header.** The ceiling used to be a flat `Math.min(1, …)`, so a
  header already above 100 % snapped back to 100 % on the first pointermove.
- **Fixed: the ceiling was measured against a 1:1 wrapper.** The header's parent is often only as
  tall as the header, which collapsed the measured ceiling to 2× and left ~81 px of downward travel.
- **Fixed: a header loaded while shrunk would not grow.** Its natural height is now measured with
  the applied row zoom divided out.
- Small: persistent header levels above 200 % survive a reload (`clampStored`).

## 1.0.0

First public release. Per-region zoom plus the header grip.

- Four independently persisted zoom levels — conversation header (`top`), left sidebar (`left`),
  conversation body (`centre`), right sidebar (`right`) — between 50 % and 200 %.
- `Ctrl` + wheel zooms the region under the pointer; `Ctrl` + `+` / `-` / `0` zoom or reset it.
  Wheel steps 5 %, key and button steps 10 %.
- The centre level targets the conversation body rather than the whole column, so zooming the
  conversation can never scale the header above it.
- A grip on the header's bottom edge scales the header down proportionally (labels stay visible,
  `min-height` and padding scale with it). Drag is 1:1, floors at 50 %, cannot enlarge past 100 %,
  double-click restores.
- The corner readout is hidden by default and appears for ~2 s after a change; its mode
  (auto / always / off) is session-only and `Ctrl + Alt + 0` cycles it.
- Collapsed sidebar rail is exempt from zoom; departing targets never keep a stale `zoom`.
- Local state only: `dsh-ui-zoom-regions/levels` and a small `dsh-ui-zoom-regions/diag` receipt
  (the structural probe inside it requires `dsh-ui-zoom-regions/debug = 1`).

## Pre-release history (local iteration)

The versions below existed only as local builds while the plugin was shaped against a running shell.

- **0.11.0** — the grip drives the shared `top` level and the header's own `min-height` and padding
  scale with it, so shrinking keeps every label visible and reclaims real height.
- **0.10.0** — the grip became shrink-only (dragging down cannot push the header into a gap).
- **0.9.0** — readable grip: solid fill, white edge and an intro pulse, after the theme's border
  token proved nearly invisible at low opacity.
- **0.8.0** — the grip attaches to the `<header>` box instead of a `display: contents` slot outlet
  (which has no box, so an absolutely positioned grip landed nowhere visible).
- **0.7.0** — the header grip itself.
- **0.6.0** — the centre region retargeted to the conversation body; two-pass region resolution so a
  region can never be applied against a previous sync's element.
- **0.5.0** — counter-zoom attempt for the header (superseded by 0.6.0).
- **0.4.0** — the `top` region (conversation header rows) became its own zoom level.
- **0.3.0** — the readout mode became session-only.
- **0.2.0** — the readout became transient (`auto` / `always` / `off`) instead of always visible.
- **0.1.0** — initial per-column zoom (left / centre / right) derived from `dsh-ui-zoom`.
