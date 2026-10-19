window.__ModuleLoader__.load({
	id: "dsh-ui-zoom-regions",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		//#region constants
		/** Dictionary namespace owned by this plugin. */
		const NS = "ui-zoom-regions";
		/** Persisted per-region FONT levels, one JSON object. */
		const LEVELS_KEY = "dsh-ui-zoom-regions/levels";
		/** Persisted header OCCUPANCY in px (absent = auto height). */
		const HEADER_HEIGHT_KEY = "dsh-ui-zoom-regions/headerHeight";
		/** Readout mode key an earlier version persisted; cleared on every load. */
		const WIDGET_KEY = "dsh-ui-zoom-regions/widget";
		/** Small rotation-proof diagnostic record (used to verify the client half loaded). */
		const DIAG_KEY = "dsh-ui-zoom-regions/diag";
		/** Legacy key: an earlier version persisted the header drag offset under it. It is
		 * only DELETED on load — nothing reads it — so an upgraded install does not keep a
		 * stale key in storage. */
		const HEADER_KEY = "dsh-ui-zoom-regions/header-offset";
		const VERSION = "1.2.1";
		const MIN = 0.5;
		const MAX = 2;
		/**
		 * Per-region FONT zoom bounds. The header occupancy is a SEPARATE pixel
		 * channel (TOP_HEIGHT_* below): Ctrl + wheel changes the font here, dragging
		 * the header bottom edge changes how much room it takes.
		 *
		 * The sidebars get a wider box than the default: they are narrow columns where
		 * 50%-200% is not enough to make the file / session list genuinely comfortable,
		 * and the compensated track width keeps the column itself from moving (only the
		 * content scales).
		 */
		const REGION_BOUNDS = {
			top: { min: 0.25, max: 3 },
			left: { min: 0.25, max: 3 },
			center: { min: MIN, max: MAX },
			right: { min: 0.25, max: 3 }
		};
		/** Keyboard / button step. */
		const STEP = 0.1;
		/** Wheel step: finer, the way browsers feel. */
		const WHEEL_STEP = 0.05;
		/** Safety re-sync interval (ms) for columns React re-creates. */
		const SYNC_MS = 700;
		/** How long the transient readout stays up after a change (ms). */
		const HIDE_MS = 2000;
		/** How long the readout stays up as mode-change feedback (ms). */
		const FEEDBACK_MS = 1400;
		/** Readout modes, cycled in order by the mode chip and Ctrl+Alt+0. */
		const WIDGET_MODES = ["auto", "always", "off"];
		/**
		 * The header SECOND channel: occupancy, in pixels.
		 *
		 * Font zoom lives in `levels.top` (Ctrl + wheel / Ctrl + − 0 over the header)
		 * and only scales the title row and the tab row. How much room the header takes
		 * is `headerHeight` — a pixel min-height set by dragging the header bottom
		 * edge, persisted on its own and independent of the font: shrinking the labels
		 * no longer shrinks the bar, and growing the bar no longer grows the labels.
		 */
		const TOP_HEIGHT_SHARE = 0.5;
		const TOP_HEIGHT_MAX = 12;
		const TOP_HEIGHT_MIN_PX = 24;
		/**
		 * The independently zoomable regions of the DSH shell.
		 *
		 * Selectors avoid CSS-module hashes where a stable hook exists
		 * (`data-rightbar-col`, `data-conversation-tabs`) and fall back to the
		 * stable *suffix* of a hashed class name otherwise (`*_sidebarCol`,
		 * `*_centerCol`, `*_titleRow`), so they survive app rebuilds.
		 *
		 * `top` is not a single box — the title row and the tab row are separate
		 * grid children — so it resolves to a list of elements.
		 */
		const REGIONS = [
			{ id: "top", labelKey: "region.top" },
			{ id: "left", labelKey: "region.left", selectors: ["[class*=\"_sidebarCol\"]"] },
			{ id: "center", labelKey: "region.center", selectors: ["[class*=\"_centerCol\"]"] },
			{ id: "right", labelKey: "region.right", selectors: ["[data-rightbar-col]", "[class*=\"_rightbarCol\"]"] }
		];
		const REGION_IDS = REGIONS.map((region) => region.id);
		/** Centre-column selectors, re-used to resolve the top region and the pointer target. */
		const CENTER_SELECTORS = ["[class*=\"_centerCol\"]"];
		/** The conversation scroll body: header rows never live inside it. */
		const CONTENT_SELECTOR = "[data-conversation-content]";
		/** Conversation title row (hashed class, stable suffix). */
		const TOP_TITLE_SELECTOR = "[class*=\"_titleRow\"]";
		/** Conversation view tab row (stable hook). */
		const TOP_TABS_SELECTOR = "[data-conversation-tabs]";
		/**
		 * Frame grid track each column region occupies: the sidebar is track 1 and
		 * the right sidebar is track 3 (`${sidebar}px minmax(...) minmax(0px, ...)`).
		 * Their boxes have to be kept as wide as the track, or `zoom` shrinks the
		 * box and leaves a seam in front of the splitter handle.
		 */
		const TRACKED_REGIONS = { left: 0, right: 2 };
		const zh = {
			"widget.aria": "区域缩放",
			"widget.hint": "Ctrl + 滚轮：缩放鼠标所在的区域（顶栏 / 左栏 / 中栏 / 右栏）；Ctrl + + / − / 0：放大 / 缩小 / 重置该区域；Ctrl + Alt + 0：切换读数显示（自动 / 常显 / 关闭）",
			"region.top": "顶",
			"region.left": "左",
			"region.center": "中",
			"region.right": "右",
			"chip.title": "点击重置本区域为 100%",
			"action.reset": "全部重置",
			"mode.title": "读数显示方式：点击切换「自动 → 常显 → 关闭」（快捷键 Ctrl + Alt + 0）；刷新后回到「自动」",
			"mode.auto": "自动",
			"mode.always": "常显",
			"mode.off": "关",
			"grip.label": "顶栏下边界（拖动改高度）",
			"grip.hint": "拖动顶栏下边界 = 改它占多高（字号不变）；想改字号用 Ctrl + 滚轮或 Ctrl + − 0；双击恢复自动高度"
		};
		const en = {
			"widget.aria": "Region zoom",
			"widget.hint": "Ctrl + wheel: zoom the region under the pointer (top / left / centre / right); Ctrl + + / − / 0: zoom in / out / reset that region; Ctrl + Alt + 0: cycle the readout (auto / always / off)",
			"region.top": "T",
			"region.left": "L",
			"region.center": "C",
			"region.right": "R",
			"chip.title": "Click to reset this region to 100%",
			"action.reset": "Reset all",
			"mode.title": "Readout mode: click to cycle auto → always → off (shortcut Ctrl + Alt + 0); a reload returns to auto",
			"mode.auto": "auto",
			"mode.always": "always",
			"mode.off": "off",
			"grip.label": "Header bottom edge (drag to resize)",
			"grip.hint": "Drag the header bottom edge to change how much room it takes (font size is untouched); use Ctrl + wheel or Ctrl + - 0 for the font; double-click returns to the auto height"
		};
		const css = `
.duzrWidget{position:fixed;right:14px;bottom:14px;z-index:9999;display:flex;align-items:center;gap:2px;height:28px;padding:0 6px;border:1px solid var(--dsw-alias-border-l2,#3a3a44);border-radius:14px;background:var(--dsw-specific-menu,#26262e);box-shadow:var(--dsw-shadow-lv2,0 4px 16px rgba(0,0,0,.25));font:inherit;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#b9b9c3);opacity:0;pointer-events:none;transition:opacity .18s}
.duzrWidget.is-visible{opacity:.6;pointer-events:auto}
.duzrWidget.is-visible:hover,.duzrWidget.is-visible:focus-within{opacity:1}
.duzrChip{display:flex;align-items:center;gap:4px;height:22px;padding:0 6px;background:0 0;border:none;border-radius:6px;color:inherit;font:inherit;font-size:12px;cursor:pointer;outline:none}
.duzrChip:hover,.duzrChip:focus-visible{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}
.duzrChip.is-active{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08));color:var(--dsw-alias-label-primary,#fff)}
.duzrName{color:var(--dsw-alias-label-tertiary,#8f8f9a)}
.duzrChip.is-active .duzrName{color:inherit}
.duzrPct{font-variant-numeric:tabular-nums;white-space:nowrap}
.duzrSep{opacity:.45}
.duzrMode{height:22px;padding:0 6px;background:0 0;border:none;border-radius:6px;color:var(--dsw-alias-label-tertiary,#8f8f9a);font:inherit;font-size:11px;cursor:pointer;outline:none;opacity:.8}
.duzrMode:hover,.duzrMode:focus-visible{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08));color:var(--dsw-alias-label-primary,#fff);opacity:1}
.duzrReset{opacity:0;width:0;overflow:hidden;white-space:nowrap;background:0 0;border:none;border-radius:6px;color:inherit;font:inherit;font-size:12px;padding:0;cursor:pointer;outline:none;transition:opacity .15s,width .15s}
.duzrWidget:hover .duzrReset,.duzrWidget:focus-within .duzrReset{opacity:1;width:auto;padding:0 6px}
.duzrReset:hover,.duzrReset:focus-visible{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08));color:var(--dsw-alias-label-primary,#fff)}
/* The header's WHOLE bottom edge is the resize boundary: an invisible band that
 * only shows the ns-resize cursor. No pill, no dots, nothing painted — approach
 * the line with the mouse and drag.
 *
 * It sits INSIDE the header rather than straddling the edge (bottom: 0, not
 * -4px): pulling the header up clips it with overflow: hidden, and a band
 * hanging outside the box would be clipped away exactly when the user needs it
 * to grow back. */
.duzrGrip{position:absolute;left:0;right:0;bottom:0;height:9px;width:auto;transform:none;border:0;padding:0;margin:0;border-radius:0;background:transparent;box-shadow:none;opacity:1;cursor:ns-resize;z-index:9;touch-action:none}
.duzrGrip.is-dragging{cursor:ns-resize}
.duzrGrip:focus-visible{outline:2px solid var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.14));outline-offset:-2px}
`;
		//#endregion

		//#region state
		/** Clamp a font level to its region bounds, snapping to the 5% wheel grid. */
		function clamp(level, id) {
			const bounds = REGION_BOUNDS[id];
			const floor = bounds === void 0 ? MIN : bounds.min;
			const ceiling = bounds === void 0 ? MAX : bounds.max;
			return Math.min(ceiling, Math.max(floor, Math.round(level * 20) / 20));
		}
		/** Read the saved per-region levels, defaulting every region to 100%. */
		function readLevels() {
			const levels = {};
			for (const id of REGION_IDS) levels[id] = 1;
			try {
				const raw = window.localStorage.getItem(LEVELS_KEY);
				if (raw === null) return levels;
				const parsed = JSON.parse(raw);
				for (const id of REGION_IDS) {
					const value = Number(parsed === null || parsed === void 0 ? void 0 : parsed[id]);
					if (Number.isFinite(value)) levels[id] = clamp(value, id);
				}
			} catch { /* corrupt or unavailable storage: fall back to 100% */ }
			return levels;
		}
		/** Persist the per-region levels. */
		function saveLevels(levels) {
			try {
				window.localStorage.setItem(LEVELS_KEY, JSON.stringify(levels));
			} catch { /* private mode: keep the levels for this session only */ }
		}
		/** Read the persisted header occupancy in px (0 = auto). */
		function readHeaderHeight() {
			try {
				const value = Number(window.localStorage.getItem(HEADER_HEIGHT_KEY));
				return Number.isFinite(value) && value > 0 ? value : 0;
			} catch { return 0; }
		}
		/** Persist the header occupancy (0 removes the key = auto). */
		function saveHeaderHeight(px) {
			try {
				if (px > 0) window.localStorage.setItem(HEADER_HEIGHT_KEY, String(Math.round(px)));
				else window.localStorage.removeItem(HEADER_HEIGHT_KEY);
			} catch { /* private mode: keep it for this session only */ }
		}
		/**
		 * Drop any readout mode an earlier version persisted. The mode is
		 * deliberately session-only: every page load starts in `auto`, so a mode
		 * picked before a reload can never lock the user out of the readout.
		 */
		function clearStoredWidgetMode() {
			try {
				window.localStorage.removeItem(WIDGET_KEY);
			} catch { /* storage unavailable: nothing to clear */ }
		}
		/**
		 * Drop the drag offset an earlier version persisted. The handle shrinks the
		 * header through the shared `top` level now, which is persisted with the
		 * other regions, so that key must not linger.
		 */
		function clearStoredHeaderOffset() {
			try {
				window.localStorage.removeItem(HEADER_KEY);
			} catch { /* storage unavailable: nothing to clear */ }
		}
		//#endregion

		//#region controls
		/**
		 * Install the per-column zoom layer: apply the saved levels, mount the
		 * corner readout, and bind the browser-style shortcuts to the column
		 * under the pointer.
		 * @param t - bound translator for the widget's labels.
		 * @returns a disposer that unmounts everything.
		 */
		function createZoomControls(t) {
			if (typeof document === "undefined") return () => {};
			const levels = readLevels();
			/** Header occupancy in px (0 = auto, the stylesheet own height). */
			let headerHeight = readHeaderHeight();
			/** Where the edge may travel right now; measured on every drag. */
			let headerLimits = { min: 0, max: 0 };
			/** Readout mode for THIS load only: `auto` pops up after a change, `always` pins it, `off` never shows it. */
			let mode = "auto";
			clearStoredWidgetMode();
			/** The region the pointer last entered; the shortcut target. */
			let hovered = "center";
			/** Live elements per region (the top region has several), re-resolved on every sync. */
			const current = {};
			for (const id of REGION_IDS) current[id] = [];
			const teardown = [];
			/* One-way migration cleanup: the grip no longer drives the `top` level (the
			 * occupancy is `headerHeight`), so the key that version persisted must go. */
			clearStoredHeaderOffset();
			/** The live header container the grip is attached to. */
			let headerEl = null;
			/** Whether this plugin set `position: relative` on that header. */
			let positionPatched = false;
			/** The header's natural (font 100 %) height, measured once per header element. */
			let headerBase = null;
			/** Header rows this plugin hid while collapsing (only these are ever restored). */
			const hiddenRows = new Set();
			/** Regions whose box width this plugin compensated (so teardown only clears its own writes). */
			const widthPatched = new Set();

			const styleTag = document.createElement("style");
			styleTag.dataset.plugin = "dsh-ui-zoom-regions";
			styleTag.dataset.pluginCss = "dsh-ui-zoom-regions/styles";
			styleTag.textContent = css;
			document.head.appendChild(styleTag);

			const widget = document.createElement("div");
			widget.className = "duzrWidget";
			widget.setAttribute("role", "group");
			widget.setAttribute("aria-label", t("widget.aria"));
			widget.title = t("widget.hint");
			const chips = {};
			REGIONS.forEach((region, index) => {
				if (index > 0) {
					const sep = document.createElement("span");
					sep.className = "duzrSep";
					sep.setAttribute("aria-hidden", "true");
					sep.textContent = "·";
					widget.append(sep);
				}
				const chip = document.createElement("button");
				chip.type = "button";
				chip.className = "duzrChip";
				chip.dataset.region = region.id;
				const name = document.createElement("span");
				name.className = "duzrName";
				name.textContent = t(region.labelKey);
				const pct = document.createElement("span");
				pct.className = "duzrPct";
				chip.append(name, pct);
				chip.addEventListener("click", () => setLevel(region.id, 1));
				chip.addEventListener("pointerenter", () => {
					if (hovered === region.id) return;
					hovered = region.id;
					render();
				});
				widget.append(chip);
				chips[region.id] = { chip, name, pct };
			});
			const resetAll = document.createElement("button");
			resetAll.type = "button";
			resetAll.className = "duzrReset";
			resetAll.textContent = t("action.reset");
			resetAll.addEventListener("click", () => {
				for (const id of REGION_IDS) levels[id] = 1;
				saveLevels(levels);
				applyAll();
				flash();
			});
			widget.append(resetAll);
			const modeChip = document.createElement("button");
			modeChip.type = "button";
			modeChip.className = "duzrMode";
			modeChip.title = t("mode.title");
			modeChip.addEventListener("click", () => cycleMode());
			widget.append(modeChip);
			document.body.appendChild(widget);
			/* The readout is transient by default: it must never sit on top of the
			 * UI the user is working in, so while hidden it also ignores pointer
			 * events entirely. */
			widget.addEventListener("pointerenter", () => {
				if (hideTimer === null) return;
				clearTimeout(hideTimer);
				hideTimer = null;
			});
			widget.addEventListener("pointerleave", () => {
				if (mode === "auto") scheduleHide();
			});

			/** Repaint the readout: one chip per column, the hovered one active. */
			const render = () => {
				for (const region of REGIONS) {
					const entry = chips[region.id];
					const percent = Math.round(levels[region.id] * 100);
					entry.pct.textContent = `${String(percent)}%`;
					entry.chip.classList.toggle("is-active", region.id === hovered);
					entry.chip.title = t("chip.title");
					entry.chip.setAttribute("aria-label", `${t(region.labelKey)} ${String(percent)}%`);
					entry.name.textContent = t(region.labelKey);
				}
				modeChip.textContent = t(`mode.${mode}`);
				modeChip.title = t("mode.title");
			};

			/*#region readout visibility */
			let hideTimer = null;
			const canTime = typeof setTimeout === "function" && typeof clearTimeout === "function";
			const clearHide = () => {
				if (hideTimer === null) return;
				clearTimeout(hideTimer);
				hideTimer = null;
			};
			const setVisible = (visible) => {
				widget.classList.toggle("is-visible", visible);
			};
			/** Auto mode: hide again after the last change. */
			const scheduleHide = () => {
				if (!canTime || mode !== "auto") return;
				clearHide();
				hideTimer = setTimeout(() => {
					hideTimer = null;
					setVisible(false);
				}, HIDE_MS);
			};
			/** Pop the readout up for a change the user just made. */
			const flash = () => {
				render();
				if (mode === "off") {
					setVisible(false);
					return;
				}
				setVisible(true);
				scheduleHide();
			};
			/** Apply the current mode: pin, auto-hide, or stay hidden. */
			const applyMode = (feedback) => {
				clearHide();
				render();
				if (mode === "always") {
					setVisible(true);
					return;
				}
				if (mode === "off") {
					/* Show the new state once, so cycling modes is not a blind click. */
					if (feedback === true && canTime) {
						setVisible(true);
						hideTimer = setTimeout(() => {
							hideTimer = null;
							setVisible(false);
						}, FEEDBACK_MS);
					} else {
						setVisible(false);
					}
					return;
				}
				if (feedback === true) setVisible(true);
				scheduleHide();
			};
			/** auto → always → off → auto. Session-only: never persisted. */
			const cycleMode = () => {
				mode = WIDGET_MODES[(WIDGET_MODES.indexOf(mode) + 1) % WIDGET_MODES.length];
				applyMode(true);
			};
			//#endregion

			/*#region header drag */
			const gripEl = document.createElement("div");
			gripEl.className = "duzrGrip";
			gripEl.setAttribute("role", "separator");
			gripEl.setAttribute("aria-label", t("grip.label"));
			gripEl.title = t("grip.hint");
			gripEl.addEventListener("pointerdown", onGripDown);
			gripEl.addEventListener("dblclick", onGripReset);

			/**
			 * The header box the grip attaches to. The title row's own parent is a
			 * slot outlet — an anonymous `display: contents` div that generates no
			 * box — so absolute positioning inside it lands anywhere but here.
			 * Climb to the real header element (a `<header>`) instead, skipping
			 * box-less wrappers as a fallback.
			 */
			const resolveHeader = () => {
				if (current.top.length === 0) return null;
				const row = current.top.find((element) => String(element.className).includes("_titleRow"));
				const anchor = row ?? current.top[0];
				if (typeof anchor.closest === "function") {
					const semantic = anchor.closest("header");
					if (semantic !== null && semantic !== void 0) return semantic;
				}
				let node = anchor.parentElement;
				for (let depth = 0; depth < 4 && node !== null && node !== void 0; depth += 1) {
					const display = typeof window.getComputedStyle === "function" ? String(window.getComputedStyle(node).display ?? "") : "";
					const rect = typeof node.getBoundingClientRect === "function" ? node.getBoundingClientRect() : null;
					if (display !== "contents" && (rect === null || rect.height > 0)) return node;
					node = node.parentElement;
				}
				return anchor;
			};
			/**
			 * The header's NATURAL height in px, read once while it is still unpatched.
			 *
			 * Only the height is kept. The occupancy channel writes `min-height` and
			 * nothing else, so the header's own padding and min-height are not this
			 * plugin's business (1.2.0 removed the padding scaling).
			 */
			const measureHeaderBase = (element) => {
				if (element === null || typeof element.getBoundingClientRect !== "function") return null;
				const rect = element.getBoundingClientRect();
				/* sync() applies the row zoom BEFORE this runs, so the rendered height
				 * already carries levels.top. Divide it out: this must be the header
				 * height at font 100 %, the unit the occupancy clamps are in. */
				const rowZoom = levels.top > 0 ? levels.top : 1;
				const natural = rect === null || !Number.isFinite(rect.height) ? 0 : rect.height / rowZoom;
				return { height: natural > 0 ? natural : 0 };
			};
			/**
			 * Collapse by WHOLE ROWS. A row that does not fit inside the current
			 * occupancy is hidden outright, so the text is never sliced through the middle
			 * of a line: every row that is still on screen keeps its own font size, its
			 * own padding and its own share of the layout, exactly as before the drag.
			 *
			 * The rows are treated as a stack: once one does not fit, it and everything
			 * below it go. Hiding a row in the middle instead would pull the next one up
			 * into view and make the whole header jump.
			 */
			const applyHeaderRows = (px) => {
				if (headerEl === null) return;
				const rows = current.top.filter((row) => headerEl.contains(row));
				if (rows.length === 0) return;
				/*
				 * Pass 1: put every row back and measure it. A row hidden with `display:
				 * none` reports a ZERO box, so its geometry cannot be read while it is
				 * hidden — judging by that box would make every collapsed row look like it
				 * fits, and the next apply (the 700 ms sync alone) would pop them all open
				 * again. Unhiding and measuring inside one synchronous call never reaches
				 * the screen, so nothing flickers.
				 */
				for (const row of rows) {
					if (row.style.display !== "") row.style.display = "";
					hiddenRows.delete(row);
				}
				const headerTop = headerEl.getBoundingClientRect().top;
				const bottoms = rows.map((row) => row.getBoundingClientRect().bottom - headerTop);
				/*
				 * Pass 2: drop the suffix that does not fit. The rows are a stack, so once
				 * one is too low, it and everything under it go — hiding a row in the middle
				 * would pull the next one up and make the header jump.
				 */
				const cut = bottoms.findIndex((bottom) => bottom > px + 0.5);
				if (cut === -1) return;
				for (let index = cut; index < rows.length; index += 1) {
					rows[index].style.display = "none";
					hiddenRows.add(rows[index]);
				}
			};
			/** Put every row this plugin hid back on screen. */
			const showAllHeaderRows = () => {
				for (const row of hiddenRows) row.style.display = "";
				hiddenRows.clear();
			};
			/**
			 * Apply the header OCCUPANCY, in px. Never padding, never a font multiplier.
			 * `0` hands the header back to the stylesheet.
			 *
			 * Two regimes, because the two directions are not symmetric:
			 *
			 * - **Growing** (px >= natural) is `min-height`: the header keeps its own
			 *   layout and simply gains empty room below its rows.
			 * - **Shrinking** (px < natural) must be `height`, because `min-height` is only
			 *   a FLOOR — it can never make a box shorter than its content. That is why
			 *   dragging the edge up used to do nothing at all: the header sat at its
			 *   content height no matter what was written. The rows that no longer fit are
			 *   then dropped whole (`applyHeaderRows`), and `overflow: hidden` is only the
			 *   backstop for anything else that still spills.
			 */
			const applyHeaderMetrics = () => {
				if (headerEl === null || headerBase === null) return;
				let px = headerHeight;
				if (px > 0 && headerLimits.max > 0) px = Math.min(px, headerLimits.max);
				if (px > 0 && headerLimits.min > 0) px = Math.max(px, headerLimits.min);
				px = px > 0 ? Math.round(px) : 0;
				const natural = headerBase.height;
				/* Half a pixel of slack: the natural height is a fractional measurement, and
				 * a sub-pixel difference must not flip the header into collapsing mode. */
				const shrinking = px > 0 && natural > 0 && px < natural - 0.5;
				const wantedMinHeight = px === 0 ? "" : shrinking ? "0px" : `${String(px)}px`;
				const wantedHeight = shrinking ? `${String(px)}px` : "";
				const wantedOverflow = shrinking ? "hidden" : "";
				if (headerEl.style.minHeight !== wantedMinHeight) headerEl.style.minHeight = wantedMinHeight;
				if (headerEl.style.height !== wantedHeight) headerEl.style.height = wantedHeight;
				if (headerEl.style.overflow !== wantedOverflow) headerEl.style.overflow = wantedOverflow;
				if (shrinking) applyHeaderRows(px);
				else showAllHeaderRows();
			};
			/** Persist and apply one occupancy value (0 = auto). */
			const setHeaderHeight = (px) => {
				headerHeight = Number.isFinite(px) && px > 0 ? px : 0;
				saveHeaderHeight(headerHeight);
				applyHeaderMetrics();
				writeDiag();
				flash();
			};
			/**
			 * Where the edge may travel, in pixels, measured on every drag because the
			 * conversation panel follows the window: at least TOP_HEIGHT_MIN_PX and a
			 * quarter of the natural height, at most TOP_HEIGHT_SHARE of the panel (and
			 * never more than TOP_HEIGHT_MAX × the natural height).
			 */
			const measureHeaderLimits = () => {
				if (headerEl === null || headerBase === null) { headerLimits = { min: 0, max: 0 }; return; }
				const base = headerBase.height;
				const headerRect = typeof headerEl.getBoundingClientRect === "function" ? headerEl.getBoundingClientRect() : null;
				const shownH = headerRect === null ? 0 : headerRect.height;
				/*
				 * Which box is "the conversation panel"? The header PARENT is not good
				 * enough: in this shell the header often sits in a wrapper that is only as
				 * tall as the header itself, so a 1:1 measurement collapsed the range.
				 * Try the conversation column, then the first ancestor meaningfully taller
				 * than the header, then the window height.
				 */
				const resolvePanelHeight = () => {
					const candidates = [];
					const column = resolveOne(CENTER_SELECTORS);
					if (column !== null) candidates.push(column);
					let node = headerEl.parentElement;
					for (let depth = 0; depth < 6 && node !== null && node !== void 0; depth += 1) {
						candidates.push(node);
						node = node.parentElement;
					}
					const taller = (base > 0 ? base : shownH) * 2;
					for (const element of candidates) {
						const rect = typeof element.getBoundingClientRect === "function" ? element.getBoundingClientRect() : null;
						const height = rect === null ? 0 : rect.height;
						if (height > taller) return height;
					}
					return typeof window.innerHeight === "number" ? window.innerHeight : 0;
				};
				const panelH = resolvePanelHeight();
				const min = Math.max(TOP_HEIGHT_MIN_PX, Math.round(base * 0.25));
				const cap = base > 0
					? Math.min(Math.round(panelH * TOP_HEIGHT_SHARE), Math.round(base * TOP_HEIGHT_MAX))
					: Math.round(panelH * TOP_HEIGHT_SHARE);
				headerLimits = { min, max: Math.max(min, cap) };
			};
			/** Attach the grip to the current header, moving it across remounts. */
			const mountHeaderHandle = () => {
				const next = resolveHeader();
				if (next !== headerEl) {
					gripEl.remove();
					/* The new header has its own rows; whatever the old one hid comes back
					 * (and a stored occupancy gets re-applied against the new rows below). */
					showAllHeaderRows();
					headerEl = next;
					positionPatched = false;
					headerBase = null;
					if (headerEl !== null) {
						if (!headerEl.style.position) {
							headerEl.style.position = "relative";
							positionPatched = true;
						}
						headerBase = measureHeaderBase(headerEl);
						headerEl.appendChild(gripEl);
						/* Nothing is painted on the boundary: approach the line and drag. */
					}
				}
				measureHeaderLimits();
				applyHeaderMetrics();
			};
			let gripDrag = null;
			/**
			 * Begin an occupancy drag. The pointer moves the header bottom edge one
			 * pixel per pixel; the font is not touched (that is the Ctrl + wheel
			 * channel), so this is the only control that changes how much room the
			 * header takes.
			 */
			function onGripDown(event) {
				if (headerEl === null) return;
				event.preventDefault();
				event.stopPropagation();
				measureHeaderLimits();
				const rect = typeof headerEl.getBoundingClientRect === "function" ? headerEl.getBoundingClientRect() : null;
				const shown = rect !== null && rect.height > 0 ? rect.height : headerBase === null ? 0 : headerBase.height;
				gripDrag = {
					startY: Number(event.clientY ?? 0),
					startHeight: shown
				};
				gripEl.classList.add("is-dragging");
				if (typeof gripEl.setPointerCapture === "function" && event.pointerId !== void 0) {
					try {
						gripEl.setPointerCapture(event.pointerId);
					} catch { /* capture is a nicety; the document listeners do the work */ }
				}
				document.addEventListener("pointermove", onGripMove, true);
				document.addEventListener("pointerup", onGripUp, true);
				document.addEventListener("pointercancel", onGripUp, true);
			}
			function onGripMove(event) {
				if (gripDrag === null) return;
				event.preventDefault();
				const dy = Number(event.clientY ?? 0) - gripDrag.startY;
				const next = gripDrag.startHeight + dy;
				const max = headerLimits.max > 0 ? headerLimits.max : next;
				const min = headerLimits.min > 0 ? headerLimits.min : 0;
				/* Follow the pointer with the inline min-height ONLY. Persisting and
				 * rewriting the diagnostic receipt in here would mean a localStorage
				 * write plus a full DOM probe for every pixel of the drag. */
				headerHeight = Math.min(max, Math.max(min, next));
				applyHeaderMetrics();
			}
			function onGripUp() {
				if (gripDrag === null) return;
				gripDrag = null;
				gripEl.classList.remove("is-dragging");
				document.removeEventListener("pointermove", onGripMove, true);
				document.removeEventListener("pointerup", onGripUp, true);
				document.removeEventListener("pointercancel", onGripUp, true);
				/* One write per drag: the value the pointer settled on. */
				saveHeaderHeight(headerHeight);
				writeDiag();
				flash();
			}
			/** Double-click the edge to hand the header back to the stylesheet height. */
			function onGripReset() {
				setHeaderHeight(0);
			}
			//#endregion

			/** The first element matching one of `selectors`, or null. */
			const resolveOne = (selectors) => {
				for (const selector of selectors) {
					const element = document.querySelector(selector);
					if (element !== null) return element;
				}
				return null;
			};
			/**
			 * The conversation header: the title row plus the view tab row. Both
			 * sit in the header grid, outside `[data-conversation-content]`.
			 * Scoped to the centre column so a conversation embedded in the right
			 * sidebar keeps its own zoom.
			 */
			const resolveTop = () => {
				const center = resolveOne(CENTER_SELECTORS);
				if (center === null) return [];
				/* Only the Conversation panel has a conversation body; without one
				 * this region stays empty so another panel's title row is never
				 * mistaken for the conversation header. */
				if (center.querySelector(CONTENT_SELECTOR) === null) return [];
				const elements = [];
				for (const row of center.querySelectorAll(TOP_TITLE_SELECTOR)) {
					if (row.closest(CONTENT_SELECTOR) === null) elements.push(row);
				}
				const tabs = center.querySelector(TOP_TABS_SELECTOR);
				if (tabs !== null) elements.push(tabs);
				return elements;
			};
			/**
			 * The centre region targets the conversation body, not the whole
			 * column: the header is a sibling of that body, so this keeps the top
			 * bar out of the zoomed subtree entirely (no reliance on zoom
			 * composition). Other panels — settings, market … — have no
			 * conversation body and fall back to the whole column.
			 */
			const resolveCenter = () => {
				const column = resolveOne(CENTER_SELECTORS);
				if (column === null) return [];
				const body = column.querySelector(CONTENT_SELECTOR);
				return [body === null ? column : body];
			};
			/** Every live element of one region. */
			const resolve = (region) => {
				if (region.id === "top") return resolveTop();
				if (region.id === "center") return resolveCenter();
				const element = resolveOne(region.selectors);
				return element === null ? [] : [element];
			};
			const sameElements = (left, right) => left.length === right.length && left.every((element, index) => element === right[index]);
			/**
			 * The CSS `zoom` one region needs right now (empty string = 100%).
			 *
			 * The top rows are descendants of the centre column, so the centre's
			 * own zoom would scale them as well. Dividing by the centre level
			 * cancels that: `zoom` composes multiplicatively, so the top rows end
			 * up at exactly their own level no matter what the centre does, while
			 * still spanning the full column width (auto width follows the parent's
			 * local box).
			 */
			const wantedZoom = (id, element) => {
				/* Font zoom only. The header occupancy is a pixel channel of its own
				 * (`headerHeight`), so this never changes the bar height. */
				const level = levels[id];
				const center = current.center[0];
				if (id !== "top" || center === void 0 || !center.contains(element)) return level === 1 ? "" : String(level);
				const effective = Math.round((level / levels.center) * 10000) / 10000;
				return effective === 1 ? "" : String(effective);
			};
			/**
			 * Split a CSS track list on top-level whitespace, so the space inside
			 * `minmax(400px, 1fr)` does not split its own track.
			 */
			const splitTracks = (value) => {
				const out = [];
				let depth = 0;
				let current = "";
				for (const char of String(value ?? "")) {
					if (char === "(") depth += 1;
					if (char === ")") depth -= 1;
					if (depth === 0 && /\s/.test(char)) {
						if (current !== "") out.push(current);
						current = "";
						continue;
					}
					current += char;
				}
				if (current !== "") out.push(current);
				return out;
			};
			/** Which track list the last successful width read came from (diagnostic only). */
			let trackSource = null;
			/**
			 * The px size of one frame grid track, or null when it cannot be read.
			 * A `1fr` track has no px size of its own, so it is reported as null.
			 *
			 * The host writes the track list inline today. If it ever drives the layout
			 * from a class or a CSS variable instead, the inline value is gone and the
			 * compensated column width would silently stop being applied — a seam in
			 * front of the splitter, with no error anywhere. Fall back to the computed
			 * track list, where every track is already resolved to its used pixel size.
			 */
			const trackSize = (index) => {
				const anchor = current.left[0] ?? current.right[0] ?? null;
				const frame = anchor === null ? null : anchor.parentElement;
				if (frame === null || frame === void 0) return null;
				let track = splitTracks(frame.style.gridTemplateColumns)[index];
				let source = "inline";
				if (track === void 0 && typeof window.getComputedStyle === "function") {
					track = splitTracks(window.getComputedStyle(frame).gridTemplateColumns)[index];
					source = "computed";
				}
				if (track === void 0) return null;
				/* Which list the width was derived from — surfaced in the diag receipt so a
				 * silently degraded compensation is visible instead of only visible as a seam. */
				trackSource = source;
				if (track.includes("fr") && !track.startsWith("minmax(")) return null;
				const numbers = [...String(track).matchAll(/(-?\d+(?:\.\d+)?)px/g)].map((match) => Number(match[1]));
				if (numbers.length === 0) return null;
				/* `300px` is the track; `minmax(0px, 500px)` occupies its maximum. */
				return track.startsWith("minmax(") ? numbers[numbers.length - 1] : numbers[0];
			};
			/**
			 * Keep a zoomed column's *box* as wide as the grid track it sits in.
			 *
			 * `zoom` also scales the element's own box, so a sidebar at 0.8 stopped
			 * 20 % short of its track and the splitter handle (placed by the host at
			 * the track boundary) no longer touched the column's edge. Writing
			 * `track / level` as the width makes the rendered box exactly the track
			 * again, while the content still lays out magnified inside it.
			 */
			const applyTrackWidth = (id, index) => {
				const element = current[id][0];
				if (element === void 0) return;
				const frame = element.parentElement;
				const collapsed = id === "left" && frame !== null && frame.hasAttribute("data-sidebar-collapsed");
				const track = collapsed || levels[id] === 1 ? null : trackSize(index);
				const wanted = track === null || track <= 0 ? "" : `${String(Math.round(track / levels[id]))}px`;
				if (element.style.width !== wanted) element.style.width = wanted;
				if (wanted === "") widthPatched.delete(id);
				else widthPatched.add(id);
			};
			/**
			 * Write one region's zoom. The collapsed sidebar rail is exempt: it has
			 * no room to lay out a magnified box, so its saved level waits for
			 * expansion.
			 */
			const applyRegion = (id) => {
				for (const element of current[id]) {
					let next = wantedZoom(id, element);
					const frame = element.parentElement;
					if (id === "left" && frame !== null && frame.hasAttribute("data-sidebar-collapsed")) next = "";
					if (element.style.zoom !== next) element.style.zoom = next;
				}
				/* The top level doubles as the header's shrink factor. */
				if (id === "top") applyHeaderMetrics();
				if (TRACKED_REGIONS[id] !== void 0) applyTrackWidth(id, TRACKED_REGIONS[id]);
			};
			const applyAll = () => {
				for (const id of REGION_IDS) applyRegion(id);
			};
			/**
			 * Change one region's level, persist it, and pop the readout up. The
			 * centre column also drives the top region's counter-zoom, so it is
			 * re-applied whenever the centre level moves.
			 */
			const setLevel = (id, next) => {
				levels[id] = clamp(next, id);
				saveLevels(levels);
				applyRegion(id);
				if (id === "center") applyRegion("top");
				writeDiag();
				flash();
			};
			/*#region receipt probes */
			/** Real rendered box of one element, or null when the DOM cannot report it. */
			const rectOf = (element) => {
				if (typeof element.getBoundingClientRect !== "function") return null;
				const rect = element.getBoundingClientRect();
				return [Math.round(rect.width), Math.round(rect.height), Math.round(rect.left), Math.round(rect.top)];
			};
			/** Tag, class, inline zoom, used zoom, and rendered box — the ground truth. */
			const describe = (element) => ({
				tag: String(element.tagName).toLowerCase(),
				cls: String(element.className).slice(0, 90),
				zoom: String(element.style.zoom ?? ""),
				used: typeof window.getComputedStyle === "function" ? String(window.getComputedStyle(element).zoom ?? "") : null,
				cssLeft: String(element.style.left ?? ""),
				rect: rectOf(element)
			});
			/** Ancestor chain with each level's tag, class, and inline zoom. */
			const chainOf = (element) => {
				const out = [];
				let node = element;
				for (let depth = 0; depth < 10 && node !== null && node !== void 0; depth += 1) {
					out.push(`${String(node.tagName).toLowerCase()}.${String(node.className).slice(0, 44)}|${String(node.style.zoom ?? "")}|${String(rectOf(node)?.[1] ?? "?")}`);
					node = node.parentElement;
				}
				return out;
			};
			/** Direct children of one element, described (bounded). */
			const childrenOf = (element, max) => {
				if (element === null || element === void 0) return [];
				return [...element.children].slice(0, max).map(describe);
			};
			//#endregion

			/** Record how the client half resolved the shell — a file-readable receipt. */
			const writeDiag = () => {
				try {
					const anchor = current.left[0] ?? current.center[0] ?? current.right[0] ?? null;
					const frame = anchor === null ? null : anchor.parentElement;
					const found = {};
					const applied = {};
					for (const id of REGION_IDS) {
						found[id] = current[id].length;
						applied[id] = current[id].length === 0 ? null : String(current[id][0].style.zoom ?? "");
					}
					window.localStorage.setItem(DIAG_KEY, JSON.stringify({
						version: VERSION,
						at: new Date().toISOString(),
						href: window.location.href,
						mode,
						headerHeight,
						headerLimits,
						trackSource,
						frameClass: frame === null ? null : String(frame.className),
						found,
						levels,
						applied,
						probe: {
							top: current.top.map(describe),
							topChain: current.top.length === 0 ? [] : chainOf(current.top[0]),
							center: current.center.map(describe),
							centerChain: current.center.length === 0 ? [] : chainOf(current.center[0]),
							left: current.left.map(describe),
							leftChain: current.left.length === 0 ? [] : chainOf(current.left[0]),
							right: current.right.map(describe),
							frameClass: frame === null ? null : `${String(frame.tagName).toLowerCase()}.${String(frame.className)}`,
							frameRect: frame === null ? null : rectOf(frame),
							/* The splitter handles carry their own inline `left`; comparing their box
							 * with the zoomed column's box is how a zoom-induced gap becomes visible. */
							handles: typeof document.querySelectorAll === "function"
								? [...document.querySelectorAll("[class*=\"_handle\"]")].slice(0, 4).map(describe)
								: [],
							columnChildren: childrenOf(resolveOne(CENTER_SELECTORS), 6),
							header: headerEl === null ? null : describe(headerEl),
							headerStyle: headerEl === null ? null : {
								minHeight: String(headerEl.style.minHeight ?? ""),
								height: String(headerEl.style.height ?? ""),
								overflow: String(headerEl.style.overflow ?? ""),
								natural: headerBase === null ? null : Math.round(headerBase.height),
								scale: levels.top
							},
							/* Rows dropped whole by the collapse, so "why is the tab row gone"
							 * is answerable from the receipt. */
							hiddenRows: [...hiddenRows].map((row) => `${String(row.tagName).toLowerCase()}.${String(row.className).slice(0, 40)}`),
							grip: {
								attached: gripEl.parentElement !== null && gripEl.parentElement !== void 0,
								parent: String(gripEl.parentElement?.className ?? ""),
								rect: rectOf(gripEl)
							}
						}
					}));
				} catch { /* storage unavailable: skip the receipt */ }
			};
			/**
			 * Re-resolve the regions and re-assert every level React may have
			 * dropped. Resolution runs for every region first: the top region's
			 * counter-zoom reads the centre target, so a single pass could compare
			 * against the previous centre element.
			 */
			const sync = () => {
				let changed = false;
				for (const region of REGIONS) {
					const elements = resolve(region);
					if (sameElements(current[region.id], elements)) continue;
					/* A target that left the region (panel switch, remount) must not
					 * keep a stale zoom when it is still on screen. A top row that left
					 * must also get its `display` back: this plugin may have hidden it a
					 * moment ago, and a reused node would stay invisible for good. */
					for (const element of current[region.id]) {
						if (!elements.includes(element) && element.isConnected === true) element.style.zoom = "";
						if (region.id === "top" && !elements.includes(element)) {
							/* Clear the hide even if the node is already detached: React may
							 * reuse it, and an inline `display: none` would travel with it. */
							hiddenRows.delete(element);
							element.style.display = "";
						}
					}
					current[region.id] = elements;
					changed = true;
				}
				for (const id of REGION_IDS) applyRegion(id);
				mountHeaderHandle();
				watchFrame();
				if (changed) writeDiag();
			};
			/**
			 * Follow the frame element so a dragged splitter recomputes the
			 * compensated column widths immediately: the host rewrites the frame's
			 * `grid-template-columns` while dragging, and waiting for the next sync
			 * tick would let the seam flicker back during the drag.
			 */
			let frameObserver = null;
			let frameEl = null;
			const watchFrame = () => {
				const anchor = current.left[0] ?? current.right[0] ?? null;
				const next = anchor === null ? null : anchor.parentElement;
				if (next === frameEl) return;
				if (frameObserver !== null) {
					frameObserver.disconnect();
					frameObserver = null;
				}
				frameEl = next;
				if (frameEl === null || typeof MutationObserver !== "function") return;
				frameObserver = new MutationObserver(() => {
					if (TRACKED_REGIONS.left !== void 0) applyTrackWidth("left", TRACKED_REGIONS.left);
					if (TRACKED_REGIONS.right !== void 0) applyTrackWidth("right", TRACKED_REGIONS.right);
				});
				frameObserver.observe(frameEl, { attributes: true, attributeFilter: ["style"] });
			};
			/** The region owning a DOM node, ignoring the widget itself. */
			const regionOf = (node) => {
				if (node === null || node === void 0) return null;
				if (widget.contains(node)) return null;
				for (const region of REGIONS) {
					for (const element of current[region.id]) {
						if (element.contains(node)) return region.id;
					}
				}
				return null;
			};

			const onPointerMove = (event) => {
				const id = regionOf(event.target);
				if (id === null || id === hovered) return;
				hovered = id;
				render();
			};
			const onKeyDown = (event) => {
				/* Ctrl+Alt+0 cycles the readout itself, so a hidden readout is
				 * always recoverable without touching storage by hand. */
				if ((event.ctrlKey || event.metaKey) && event.altKey && event.key === "0") {
					event.preventDefault();
					event.stopPropagation();
					cycleMode();
					return;
				}
				if (!event.ctrlKey && !event.metaKey) return;
				if (event.altKey) return;
				let delta = null;
				let reset = false;
				if (event.key === "=" || event.key === "+") delta = STEP;
				else if (event.key === "-" || event.key === "_") delta = -STEP;
				else if (event.key === "0") reset = true;
				else return;
				event.preventDefault();
				event.stopPropagation();
				setLevel(hovered, reset ? 1 : levels[hovered] + delta);
			};
			const onWheel = (event) => {
				if (!event.ctrlKey && !event.metaKey) return;
				const direct = regionOf(event.target);
				const id = direct ?? hovered;
				const direction = event.deltaY < 0 ? 1 : event.deltaY > 0 ? -1 : 0;
				if (direction === 0) return;
				event.preventDefault();
				event.stopPropagation();
				if (id !== hovered) {
					hovered = id;
					render();
				}
				setLevel(id, levels[id] + direction * WHEEL_STEP);
			};

			document.addEventListener("pointermove", onPointerMove, true);
			document.addEventListener("keydown", onKeyDown, true);
			document.addEventListener("wheel", onWheel, { passive: false, capture: true });
			teardown.push(() => document.removeEventListener("pointermove", onPointerMove, true));
			teardown.push(() => document.removeEventListener("keydown", onKeyDown, true));
			teardown.push(() => document.removeEventListener("wheel", onWheel, true));

			sync();
			/* Startup stays quiet: only the pinned mode shows a readout before the
			 * user has changed anything. */
			applyMode(false);

			/* React re-creates the right column as it opens and closes, and the
			 * conversation header mounts with each Session; a cheap observer plus a
			 * slow interval re-assert the levels, and the observer short-circuits
			 * while both columns of the shell are alive. */
			let observer = null;
			if (typeof MutationObserver === "function" && document.body !== null) {
				observer = new MutationObserver(() => {
					const left = current.left[0];
					const center = current.center[0];
					const top = current.top[0];
					if (left !== void 0 && center !== void 0 && top !== void 0 && left.isConnected && center.isConnected && top.isConnected) return;
					sync();
				});
				observer.observe(document.body, { childList: true, subtree: true });
			}
			let timer = null;
			if (typeof setInterval === "function") timer = setInterval(sync, SYNC_MS);

			return () => {
				if (timer !== null) clearInterval(timer);
				if (observer !== null) observer.disconnect();
				if (frameObserver !== null) frameObserver.disconnect();
				clearHide();
				for (const dispose of teardown) dispose();
				for (const id of REGION_IDS) {
					for (const element of current[id]) {
						element.style.zoom = "";
						if (widthPatched.has(id)) element.style.width = "";
					}
				}
				widthPatched.clear();
				gripEl.remove();
				/* Rows are hidden by an inline `display`; put them back before letting go. */
				showAllHeaderRows();
				if (headerEl !== null) {
					/* Clear exactly what applyHeaderMetrics can write: the occupancy channel
					 * touches `min-height` / `height` / `overflow` and nothing else. Clearing
					 * the paddings here would wipe inline values the HOST owns. */
					headerEl.style.minHeight = "";
					headerEl.style.height = "";
					headerEl.style.overflow = "";
					if (positionPatched) headerEl.style.position = "";
				}
				widget.remove();
				styleTag.remove();
			};
		}
		//#endregion

		//#region plugin
		/**
		 * Client plugin body: register the `ui-zoom-regions` dictionaries, then
		 * install the per-column zoom layer once the document body exists.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			const locale = ctx.locale ?? (typeof ctx.get === "function" ? ctx.get("locale") : void 0);
			const translate = (key) => (locale !== void 0 && typeof locale.bind === "function" ? locale.bind(NS)(key) : (zh[key] ?? key));
			if (locale !== void 0 && typeof locale.register === "function") {
				ctx.effect(() => locale.register(NS, { zh, en }), "ui-zoom-regions: dictionaries");
			}
			ctx.effect(() => {
				const t = translate;
				if (document.body !== null && document.body !== void 0) return createZoomControls(t);
				let disposer = () => {};
				const start = () => {
					disposer = createZoomControls(t);
				};
				document.addEventListener("DOMContentLoaded", start);
				return () => {
					document.removeEventListener("DOMContentLoaded", start);
					disposer();
				};
			}, "ui-zoom-regions: controls");
		}
		exports.apply = apply;
		exports.inject = ["locale"];
		return module.exports;
		//#endregion
	}
});
