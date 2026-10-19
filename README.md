# dsh-ui-zoom-regions

Per-region UI zoom for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`).
The shell's regions get **independent zoom levels** instead of one page-wide scale, and the
conversation header's whole bottom edge can be dragged — nothing is painted there, the cursor just
changes — to make that header shorter or taller.

[中文说明](#中文说明) · [Install](#install) · [Controls](#controls) · [How it works](#how-it-works)

## Regions

| Region | What it zooms | Notes |
| --- | --- | --- |
| Top | the conversation header: title row (session title, preset badge, header actions) and the view tab row (`Chat` / trajectory / plugin views) | one level for both rows, so every label stays on screen |
| Left | the sidebar column | skipped while the sidebar is collapsed to the icon rail, restored on expand |
| Centre | the conversation body (scroll area + composer) | deliberately **not** the whole column, so the header above it can never be dragged along |
| Right | the right sidebar column (files, terminal, browser, document preview …) | independent of the centre column |

Zoom is applied as CSS `zoom` on the target element, so a region keeps its width: content reflows
and scales, neighbouring columns are untouched, and the splitter drag handles stay where they are.

## Controls

- `Ctrl` + mouse wheel — zoom **the region under the pointer** (captured, so the page never scrolls)
- `Ctrl` + `+` / `=` — zoom that region in · `Ctrl` + `-` — out · `Ctrl` + `0` — reset it to 100%
- Range 50 %–200 % for the centre column; the two sidebars go **25 %–300 %**; wheel step 5 %,
  key/button step 10 %
- The header edge — **drag the boundary on the header's bottom edge**: up shrinks it, down grows
  it, double-click restores 100 %

The readout in the bottom-right corner shows all four levels. It is hidden by default and only
appears for about two seconds after a change (`pointer-events: none` while hidden, so it never
blocks the UI). Its last chip cycles the readout mode — auto / always / off — and `Ctrl + Alt + 0`
does the same from the keyboard.

### The header edge

The conversation header is the tallest fixed piece of the shell, and its **entire bottom edge** is
the drag target: an invisible, full-width 9 px band that paints nothing and only switches the cursor
to `ns-resize`. No handle to hunt for, no hover glow.

- **Drag up** to shrink the header to 25 % of its height; the labels shrink with it and stay on
  screen, and the header's own `min-height` and padding scale too, so the space is genuinely
  reclaimed.
- **Drag down** to grow it back — past 100 % if you want. Growing only adds height: the rows are
  capped at CSS `zoom: 100 %`, so the labels keep their normal size and the extra space comes from
  the header's `min-height`.
- The ceiling is **half the conversation panel's height**, measured on every drag (the panel is
  resolved through `*_centerCol`, then the nearest ancestor that is meaningfully taller than the
  header, then the window), with a 4× floor so a bad measurement can never silently shorten the
  range. The value in use is recorded as `headerCeiling` in the diag receipt.
- The drag is 1:1 at any zoom level: 20 px of pointer travel is 20 px of header.
- **Double-click** restores 100 %.
- Because the edge drives the same value as the *Top* zoom, the readout chip, `Ctrl + wheel` over
  the header and the edge drag always agree.

## Install

```sh
dsh plugin --profile web add github:FurinaEsE/dsh-ui-zoom-regions
# desktop profile
dsh plugin --profile desktop add github:FurinaEsE/dsh-ui-zoom-regions
```

The package ships plain JavaScript and runs no install scripts, so there is no build-approval step.

## Storage

Everything is local and per browser origin:

| Key | Contents |
| --- | --- |
| `dsh-ui-zoom-regions/levels` | `{ top, left, center, right }` zoom factors |
| `dsh-ui-zoom-regions/diag` | a small diagnostic receipt (version, timestamp, which regions resolved, applied zoom values, `headerCeiling`) |

The readout mode is deliberately session-only: every page load starts in `auto`, so a mode picked
earlier can never lock you out of the readout.

## How it works

`lib/index.js` is an empty host half. All behaviour lives in the browser half, which resolves the
shell's regions from stable hooks — `[class*="_sidebarCol"]`, `[class*="_centerCol"]`,
`[data-rightbar-col]`, `[class*="_titleRow"]`, `[data-conversation-tabs"]` — and re-resolves them on
a slow interval plus a mutation observer, so panels that React re-creates (the right sidebar, the
header after a session switch) get their level re-applied and a target that disappears never leaves a
stale `zoom` behind.

## Credit and licence

MIT. The browser half started from [`imdeniil/dsh-ui-zoom`](https://github.com/imdeniil/dsh-ui-zoom)
(MIT), which zooms the whole document. This package reworks it into per-region zoom with its own
grip, persistence and readout; the upstream copyright notice is kept in [LICENSE](LICENSE).

---

## 中文说明

给 DeepSeek Harness 的界面做**分区缩放**：不再只有一个整页比例，而是会话顶栏、左侧栏、会话正文、
右侧面板各自独立；顶栏的**整条下边界**还可以直接拖动，把顶栏调矮或调高——边界上不画任何东西，
只有鼠标靠近时光标变化。

### 区域

| 区域 | 缩放对象 | 说明 |
| --- | --- | --- |
| 顶 | 会话头部：标题行（会话名、预设徽章、右侧动作图标）+ 视图标签行（对话 / 轨迹 / 插件视图…） | 两行共用一个比例，标签一个都不会消失 |
| 左 | 左侧栏 | 折叠成图标栏时自动跳过，展开后恢复 |
| 中 | **会话正文**（滚动区 + 输入区） | 刻意不缩整栏，所以上方的顶栏永远不会被带着放大 |
| 右 | 右侧面板（文件、终端、浏览器、文档预览…） | 与中栏互不影响 |

缩放用 CSS `zoom` 作用在目标元素上：**区域宽度不变**（内容重排并缩放，不抢相邻区域的空间，也不移动
拖动分隔线）。

### 操作

- `Ctrl` + 滚轮：缩放**鼠标指针所在区域**（捕获阶段拦截，不会滚动页面）
- `Ctrl` + `+` / `=` 放大、`Ctrl` + `-` 缩小、`Ctrl` + `0` 重置该区域
- 中栏范围 50%–200%；**左右两个侧栏 25%–300%**；滚轮步长 5%，快捷键/按钮步长 10%
- 顶栏边界：**拖动顶栏下边界** —— 向上缩、向下加高，双击复位到 100%

右下角读数默认隐藏，只在你调整时浮现约 2 秒（隐藏时不拦截点击）；最后一个按钮切换读数模式
（自动 / 常显 / 关闭），`Ctrl + Alt + 0` 等效。模式只在当次会话有效，刷新必定回到「自动」。

### 顶栏边界

顶栏是壳里最高的一块固定区域，它的**整条下边界**就是拖动区：一条透明、横跨整宽的 9px 带子，
不画任何像素，只负责把光标变 `ns-resize`。没有要去寻找的小把手，也没有悬停高光。

- **向上拖**：顶栏缩到自身高度的 25%，文字跟着变小但全部留在视窗内，`min-height` 与内边距同步缩，
  省出来的是真实高度。
- **向下拖**：把它拉高，可以超过 100%。**放大方向只加高不加字** —— 行内 `zoom` 封顶 100%，多出来的
  高度全部来自顶栏自己的 `min-height`。
- 上限 = **对话区高度的一半**，每次按下都实测（先取 `*_centerCol`，再沿祖先找明显高于顶栏的容器，
  最后回退窗口高度），并带 4× 兜底；实际生效的值写在 diag 回执的 `headerCeiling` 里。
- 任何缩放档位下都是 1:1：指针移动 20px，顶栏就多/少 20px。
- **双击**复位到 100%。
- 它与「顶」是同一个比例，所以读数、`Ctrl + 滚轮` 与边界拖动永远一致。

### 安装

```sh
dsh plugin --profile web add github:FurinaEsE/dsh-ui-zoom-regions
dsh plugin --profile desktop add github:FurinaEsE/dsh-ui-zoom-regions
```

纯 JavaScript，无安装脚本，无需构建授权。

### 存储

| 键 | 内容 |
| --- | --- |
| `dsh-ui-zoom-regions/levels` | `{ top, left, center, right }` 四个比例 |
| `dsh-ui-zoom-regions/diag` | 小型诊断回执（版本、时间、各区域是否解析到、实际写入的缩放、`headerCeiling`） |

### 署名与许可

MIT。浏览器半边改造自 [`imdeniil/dsh-ui-zoom`](https://github.com/imdeniil/dsh-ui-zoom)（MIT，整页
缩放），上游版权声明保留在 [LICENSE](LICENSE) 中。
