# Changelog

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
