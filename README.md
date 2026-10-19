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
- Range 50 %–200 % for the centre column; the two sidebars (and the header's font) go
  **25 %–300 %**; wheel step 5 %, key/button step 10 %
- The header's **bottom edge** is a second, independent control — **drag it** to change how much
  room the header takes, **without touching the font**; double-click hands the height back to the
  stylesheet

The readout in the bottom-right corner shows all four levels. It is hidden by default and only
appears for about two seconds after a change (`pointer-events: none` while hidden, so it never
blocks the UI). Its last chip cycles the readout mode — auto / always / off — and `Ctrl + Alt + 0`
does the same from the keyboard.

### The header: two independent controls

The conversation header carries **two separate channels** — this is the whole point of 1.2.0:

| | Font size | How much room it takes |
| --- | --- | --- |
| **Control** | `Ctrl` + wheel / `Ctrl` + `+ -` `0` over the header | drag the header's bottom edge |
| **Stored in** | `dsh-ui-zoom-regions/levels` (`top`) | `dsh-ui-zoom-regions/headerHeight` (px) |
| **Range** | 25 % – 300 % | 24 px … half the conversation panel |
| **Effect** | title row + tab row scale | the header's `min-height` only |

They never interfere: shrinking the labels no longer shrinks the bar, and making the bar taller no
longer enlarges the labels.

**The bottom edge.** Its **entire width** is the drag target: an invisible 9 px band that paints
nothing and only switches the cursor to `ns-resize`. No handle to hunt for.

- The pointer moves the edge one pixel per pixel — drag 20 px and the header is 20 px taller or
  shorter.
- Limits are measured on every drag: at least **24 px**, at most **half the conversation panel**
  (the panel is resolved through `*_centerCol`, then the nearest ancestor meaningfully taller than
  the header, then the window). The live numbers are recorded as `headerHeight` / `headerLimits`
  in the diag receipt.
- **Double-click** returns the header to the stylesheet's own height (removes the inline
  `min-height`).

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
| `dsh-ui-zoom-regions/headerHeight` | the header occupancy in px (absent = the stylesheet height) |
| `dsh-ui-zoom-regions/diag` | a small diagnostic receipt (version, timestamp, which regions resolved, applied zoom values, `headerHeight`, `headerLimits`) |

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
- 中栏范围 50%–200%；**左右两个侧栏与顶栏字号 25%–300%**；滚轮步长 5%，快捷键/按钮步长 10%
- 顶栏还有**第二条独立通道**：**拖动它的下边界**改变它占多高，**完全不动字号**；双击交还给样式表高度

右下角读数默认隐藏，只在你调整时浮现约 2 秒（隐藏时不拦截点击）；最后一个按钮切换读数模式
（自动 / 常显 / 关闭），`Ctrl + Alt + 0` 等效。模式只在当次会话有效，刷新必定回到「自动」。

### 顶栏：两条互不干扰的通道

1.2.0 起，顶栏拆成两条独立通道：

| | 字号 | 占多高 |
| --- | --- | --- |
| **怎么调** | 悬停顶栏按 `Ctrl` + 滚轮 / `Ctrl` + `+ -` `0` | 拖动顶栏**下边界** |
| **存在哪** | `dsh-ui-zoom-regions/levels`（`top`） | `dsh-ui-zoom-regions/headerHeight`（px） |
| **范围** | 25% – 300% | 24px … 对话区高度的一半 |
| **影响** | 标题行 + 标签行的缩放 | 只改顶栏自己的 `min-height` |

两者永远不互相牵连：缩字号不会再缩矮顶栏，把顶栏拉高也不会放大文字。

**下边界**：整条宽度都是拖动区 —— 一条透明 9px 带子，不画任何像素，只把光标变成 `ns-resize`，
没有需要寻找的小把手。

- 指针移动多少像素，边界就跟着走多少像素（拖 20px = 顶栏高/矮 20px）。
- 上下限每次拖动都实测：最小 **24px**，最大 **对话区高度的一半**（先取 `*_centerCol`，再沿祖先找
  明显高于顶栏的容器，最后回退窗口高度）。实际值记在 diag 回执的 `headerHeight` / `headerLimits`。
- **双击**把顶栏交还给样式表自己的高度（移除行内 `min-height`）。

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
| `dsh-ui-zoom-regions/headerHeight` | 顶栏占用的像素高度（不存在 = 用样式表高度） |
| `dsh-ui-zoom-regions/diag` | 小型诊断回执（版本、时间、各区域是否解析到、实际写入的缩放、`headerHeight`、`headerLimits`） |

### 署名与许可

MIT。浏览器半边改造自 [`imdeniil/dsh-ui-zoom`](https://github.com/imdeniil/dsh-ui-zoom)（MIT，整页
缩放），上游版权声明保留在 [LICENSE](LICENSE) 中。
