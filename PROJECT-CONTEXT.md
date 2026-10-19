# dsh-ui-zoom-regions · 项目上下文（对话迁移摘要）

> 这份文件是 **2026-10-19 那次对话** 的沉淀：把"这个项目是什么、做到哪一步、为什么这么做、坑在哪、怎么继续"压成一份可独立阅读的上下文。
> 换到新会话/新电脑时，先读它能省掉重新摸索。
>
> 生成时间：2026-10-19 · 对应版本 **1.2.0** · 仓库提交 `5074b31`
> （之后另有未发布的 **1.2.1** 维护改动，见 §5 第 9 条）

---

## 1. 项目速览

| 项 | 值 |
|---|---|
| 包名 | `dsh-ui-zoom-regions` |
| 做什么 | DSH（DeepSeek Harness）Web/桌面界面插件：**四区独立缩放** + **顶栏双通道**（字号 / 占用高度） |
| 仓库 | https://github.com/FurinaEsE/dsh-ui-zoom-regions （public，MIT） |
| npm | `dsh-ui-zoom-regions`，latest = **1.2.0**（2026-10-19 05:09Z） |
| 上游 | 衍生自 [`imdeniil/dsh-ui-zoom`](https://github.com/imdeniil/dsh-ui-zoom)（MIT，整页单比例），上游版权声明保留在 `LICENSE` |
| 市场 | [PR #8027](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/8027)（awesome-dsh-plugin，category `ui`） |
| 账户 | GitHub `FurinaEsE` / npm `cannee1`（同一个人） |
| 形态 | 纯 JavaScript，无构建、无安装脚本；宿主半边为空，全部逻辑在浏览器半边 |

安装（任选其一）：

```bash
dsh plugin --profile desktop add dsh-ui-zoom-regions            # npm
dsh plugin --profile desktop add github:FurinaEsE/dsh-ui-zoom-regions   # GitHub
dsh plugin --profile desktop add file:D:\projects\dsh-ui-zoom-regions   # 本地目录
```

---

## 2. 当前状态（继续之前先看这里）

```
GitHub  main = 5074b31   (feat(1.2.0): header font and header occupancy are separate channels)
                             之后有 a75aa06 docs: add PROJECT-CONTEXT.md and refresh PUBLISH.md status
npm     latest = 1.2.0   versions: 0.0.0-stage(占位), 1.1.0, 1.1.1, 1.2.0
市场    PR #8027 open / mergeable clean / CI: check=success, Submission gate=neutral
本地    D 盘克隆 = a75aa06 + 未提交的 1.2.1 维护改动（package.json / client.js / CHANGELOG 已到 1.2.1，未发布）
```

- **本机安装方式**：`C:\Users\Cannee1\.dsh\profiles\desktop` 里是 `file:` 依赖，**指向本仓库
  `D:\projects\dsh-ui-zoom-regions`**（2026-10-19 实测，原文档写的 `.dsh\plugins\...` 是过时的）；
  pnpm 把内容**拷贝**进 `profiles\desktop\node_modules\dsh-ui-zoom-regions`（nlink=1，普通拷贝），
  所以**改完源码必须同步一份到那个 `node_modules` 目录**，否则页面拿到的还是旧包。
  `C:\Users\Cannee1\.dsh\plugins\dsh-ui-zoom-regions` 是早先的克隆，**已无任何 profile 引用**，
  内容停在 1.2.0，别改错地方。
- 本项目在 **D 盘的这份克隆** 是同一提交，`origin` 已配好，可以直接在这里开发 + `git push`。

---

## 3. 交互契约（最终形态，1.2.0）

### 3.1 四区缩放（Ctrl 通道）

| 区域 | DOM 钩子 | 范围 |
|---|---|---|
| 顶（= 顶栏**字号**） | `[class*="_titleRow"]` + `[data-conversation-tabs]` | 25% – 300% |
| 左（侧栏） | `[class*="_sidebarCol"]` | 25% – 300% |
| 中（会话正文） | `[data-conversation-content]` | 50% – 200% |
| 右（右侧面板） | `[data-rightbar-col]` | 25% – 300% |

- `Ctrl` + 滚轮：缩放**指针所在区域**（捕获阶段拦截，不滚页面）
- `Ctrl` + `+` / `-` / `0`：放大 / 缩小 / 重置该区域（步长 10%；滚轮 5%）
- `Ctrl` + `Alt` + `0`：切换右下角读数模式（自动 → 常显 → 关，仅当次会话有效）

### 3.2 顶栏的第二条通道（鼠标拖动）

顶栏**整条下边界**是拖动区：一条 `left:0;right:0;bottom:0;height:9px` 的**透明**带子（贴在盒内底边，因为收起时会被 `overflow:hidden` 裁掉），不画任何像素，只把光标变成 `ns-resize`。

| | 字号 | 占多高 |
|---|---|---|
| 怎么调 | `Ctrl` + 滚轮（悬停顶栏） | 拖下边界 |
| 存哪 | `levels.top` | `headerHeight`（px，独立 key） |
| 范围 | 25% – 300% | 24px … 对话区高度的一半 |
| 影响面 | 只缩放标题行 + 标签行 | 放大用 `min-height`；收起时改 `height`，放不下的行整行隐藏 |
| 复位 | `Ctrl + 0` / 点读数里的「顶」 | 双击边界 |

**两者绝不互相牵连**：缩字号不会缩矮顶栏，拉高顶栏不会放大文字。这是 1.2.0 的核心。

**向上拖是真收缩，整行整行地收**（1.2.1 修）：`min-height` 只是下限，压不到内容高以下，所以 1.2.0 往上拖其实是空操作。现在低于自然高度时改 `height`（+ `min-height:0`），把放不下的行**整行 `display:none`**（先标签行、再标题行），留下的行字号/内边距/占位都不变，不会出现半行字；最低 24px，`overflow:hidden` 只作兜底。

拖动 1:1（指针 20px = 顶栏 20px）；上下限每次按下实测（对话区取 `*_centerCol` → 沿祖先找明显高于顶栏的容器 → 窗口高度）。

---

## 4. 代码地图（`lib/client.js`，约 1030 行，唯一有逻辑的文件）

| 位置 | 作用 |
|---|---|
| `REGION_BOUNDS` | 按区域的字号上下限（top/left/right 25%–300%，center 50%–200%） |
| `TOP_HEIGHT_SHARE / TOP_HEIGHT_MAX / TOP_HEIGHT_MIN_PX` | 占用的三个常量（0.5 / 12 / 24px） |
| `LEVELS_KEY` / `HEADER_HEIGHT_KEY` / `WIDGET_KEY` / `DIAG_KEY` | localStorage 键 |
| `readLevels` / `saveLevels` / `readHeaderHeight` / `saveHeaderHeight` | 持久化 |
| `createZoomControls(t)` | 整个插件的装配点：状态、样式、读数、监听 |
| `resolveTop / resolveCenter / resolveHeader` | 三个区域的元素解析 + 顶栏容器（`closest("header")`，跳过 `display:contents`） |
| `measureHeaderBase` | 顶栏**自然高度**（把已应用的字号 zoom 除掉；只留 `{height}`） |
| `measureHeaderLimits` | 拖动的上下限（px），每次按下重测 |
| `applyHeaderMetrics` / `setHeaderHeight` | 两条写路径：放大写 `min-height`，低于自然高写 `height` 并调 `applyHeaderRows`；持久化 + diag + 读数闪一下 |
| `applyHeaderRows` / `showAllHeaderRows` | 收起时把放不下的行整行 `display:none`（后缀式，先标签行再标题行），`hiddenRows` 记录自己隐藏过谁 |
| `onGripDown / Move / Up / Reset` | 边界拖动（px 通道）；Move 只改行内属性，Up/Cancel 才落盘 |
| `wantedZoom` | 字号通道（顶栏还要除以中栏比例，抵消 zoom 相乘） |
| `applyTrackWidth` | 侧栏缩放后补偿宽度，让栏盒仍与 grid track 对齐 |
| `applyRegion / applyAll / setLevel / sync` | 应用与 700ms 兜底重同步 |
| `writeDiag` | 写 `diag` 回执（版本、解析结果、实际 zoom、`headerHeight`、`headerLimits`） |

宿主半边 `lib/index.js` 是空实现；`cordis.patch.yml` 只插入一行：

```yaml
- insert:
    - id: ui-zoom-regions
      name: 'dsh-ui-zoom-regions'
```

---

## 5. 这次对话里修了什么（按时间顺序，都是实测出来的）

1. **「缩放过之后一拖把手就跳回 100%」** —— 上限写死 `Math.min(1, …)`，任何 >100% 的顶栏第一帧就被拍回 100%。改成以拖动起点为上限（`Math.max(1, startScale)`）。
2. **收缩下限 50% → 25%** —— 顶栏只有约 80px，50% 意味着指针只能拖 40px，手感像"没幅度"。
3. **允许向下拖动放大**（当时的模型）—— 引入 `TOP_GROW_SHARE` / 实测上限 / `clampStored`（刷新不被打回）。
4. **「只加高不放大字」** —— 行内 `zoom` 封顶 100%，高度全部由 `min-height` 驱动；并把测量得到的自然高度按已应用 zoom 归一化，否则"缩着刷新后拉不动"。
5. **「下拉幅度还是太小」** —— 上限原来按 `headerEl.parentElement` 测，而这个壳里父节点常常只是和顶栏一样高的包装层 ⇒ 上限退化成 2×（只有 81px 行程）。改成三级取样 + 4× 兜底，并把 `headerCeiling` 写进 diag 便于核对。
6. **删掉小方块** —— 从 64×6 的圆角把手改成"整条下边界"的透明带（含删掉 hover 变蓝、intro 闪烁、`@keyframes`）。
7. **侧栏缩放范围放宽到 25%–300%** —— `REGION_BOUNDS` 按区域配置。
8. **1.2.0：顶栏拆成两条通道** —— 字号（Ctrl）与占用（拖动）各自独立存储、互不影响。
9. **1.2.1：向上拖真收缩（整行隐藏）+ 三处维护改动** —— ① **`min-height` 只是下限，压不到内容高以下**，所以 1.2.0 往上拖是空操作；低于自然高度时改 `height`（`min-height:0`），放不下的行**整行 `display:none`**（先标签行再标题行），留下的行字号/内边距/占位不变、不切半行，最低 24px，`overflow:hidden` 仅兜底；`hiddenRows` 只恢复自己藏过的行（同步丢出区域、header 重挂、teardown 都会恢复）。拖动带从 `bottom:-4px` 挪到 `bottom:0`，否则收起时被裁掉、再也拉不回来；② 拖动时每个 pointermove 只改行内属性，`headerHeight` 落盘与 diag 回执挪到 `pointerup`（含 `pointercancel`）：之前每像素一次 localStorage 写 + 全量 DOM 探针；③ `trackSize` 在行内 `grid-template-columns` 缺失时回退到 computed，并把 `trackSource`（`inline`/`computed`）写进 diag，避免宿主改用 class/CSS 变量后补宽静默失效只表现为一道缝；④ 清掉 1.2.0 遗留的死代码（`INTRO_MS`、`introShown`、`headerBase` 的 min-height/padding 字段、`headerStyle.paddingTop`），并修掉 teardown 会**清掉宿主行内 padding** 的隐患。

---

## 6. 存储与诊断

| 键 | 内容 |
|---|---|
| `dsh-ui-zoom-regions/levels` | `{ top, left, center, right }` 字号比例 |
| `dsh-ui-zoom-regions/headerHeight` | 顶栏占用像素高（不存在 = 用样式表高度） |
| `dsh-ui-zoom-regions/diag` | 回执：`version`、`at`、`href`、解析到的元素、实际 zoom、`headerHeight`、`headerLimits` |
| `dsh-ui-zoom-regions/widget` | 旧版读数模式，每次加载清掉（模式只当次会话有效） |

排查"改动没生效"：先看 `JSON.parse(localStorage["dsh-ui-zoom-regions/diag"]).version`。
客户端包 URL 带 `rev`（由 mtime/size 算），宿主没重新组装时 rev 不变 —— 看到旧版本号就说明包没换，需要刷新页面，必要时完全退出应用再开。

---

## 7. 发布流程（已验证可跑）

```bash
# 1) GitHub
git add -A && git commit -m "feat(x.y.z): ..." && git push origin main

# 2) npm（token 已在本机 ~/.npmrc，7 天有效）
npm publish
npm view dsh-ui-zoom-regions version     # 注意：先从 0.0.0-stage → 真实版本要等 1~3 分钟

# 3) 市场：只有首次要提 PR（之后沿用已合并的条目）
#    data/plugins/FurinaEsE__dsh-ui-zoom-regions.yml 里只写 url/name/category/description
```

### npm 两个必须知道的坑

- **新包首发会被 staged**：bypass-2FA 的 granular token 发布新包 → registry 只建 `0.0.0-stage` 占位，真实版本在 staging 里等审批，而**网页 Staged Packages 页面可能看不到它**（本次就是空的）。
- 解法：把包的 publishing access 改成 **"Require two-factor authentication or a granular access token with bypass 2fa enabled"**（包 Settings → Publishing access）。改完后续 `npm publish` 直接发布，不再 staged。本次 1.1.0 是改完后被自动放行，1.1.1 / 1.2.0 都是直接发布。
- `npm access set mfa=automation` 这种"用 CLI 改包设置"对 bypass token 会被 **403**，必须在网页点。

### 市场条目的硬规则（来自 contributing.md）

- 一个 PR 只加一个 `data/plugins/<owner>__<repo>.yml`，**不手改 README**；
- 仓库要有 `dsh.bundle` 声明（只有 `dsh.client` 会被拒）；
- 仓库创建满 **1 天**；加 `dsh-plugin` topic；
- 描述里的 `: `（冒号+空格）必须给 YAML 加引号（本次踩过）；
- 描述会被逐句对着代码核，不能夸大。

---

## 8. 踩坑清单（都是这次真踩到的）

1. **PowerShell 5.1 读写 UTF-8 会毁中文**：`Get-Content -Raw | Set-Content -Encoding utf8` 会把 UTF-8 当 ANSI 读，写回去就是乱码，`node --check` 直接报 `Invalid or unexpected token`。改文件一律用 `node fs` 或编辑器工具，别用 PS 管道。
2. **仓库工作区是 CRLF**：按行号/按字符串替换的脚本必须按 `\r\n` 处理，否则 `includes()` 永远 false。
3. **`node -e "..."` 里嵌双引号会被 PowerShell 吃掉**：写进 `.mjs` 文件再跑，别硬塞内联脚本。
4. **宿主半边改了要重启，客户端半边改了要刷新**；`diaq.version` 是唯一可靠的"到底加载了哪一版"。
5. **`display: contents` 的 slot 出口没有盒子**：往它里面绝对定位会飘到别处 —— 顶栏把手必须挂到真正的 `<header>`。
6. **顶栏的父节点常常不是对话区**：量"对话区高度"必须三级取样，否则上限被量成 1:1。
7. **`querySelector` 会命中聊天记录里的同名元素**：选择器要限定容器（`_centerCol` 内）。
8. **页面加载的是 `dsh-app://app/`**，不是 `http://127.0.0.1:19387`（所以宿主 tapIndex 注入对窗口无效）。

---

## 9. 待办 / 可选项

- [ ] `npm unpublish dsh-ui-zoom-regions@0.0.0-stage` —— 清掉首发留下的占位版本（不可逆，需确认）
- [ ] 等 PR #8027 合并（CI 已绿，无阻塞）
- [ ] npm token 10-26 过期；建议发布完成后到 tokens 页面删掉
- [ ] 可选：GitHub Release 附预构建 tgz（asset 名**不带版本**，配合 `latest/download` 才不会 404），再给市场条目加 `tarball:` 字段
- [ ] 可选：`screenshots.json`（1–8 张相对路径图），市场详情页展示

---

## 10. 与其它插件的关系

- **`dsh-plugin-wallpaper-engine`（壁纸 + 液态玻璃）才是"材质"插件**；本项目只管缩放/尺寸，两者互不重叠。
- 曾经存在的 `dsh-page-css` 是给已停用的 `dsh-any-background` 用的画布补丁，与本项目无关。
- 顶栏/侧栏的"底色不一致"属于壁纸插件的配置（`glassMode.leftSidebar` / `sidebarContent`），不属于本仓库。
