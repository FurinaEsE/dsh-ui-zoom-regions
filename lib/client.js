window.__ModuleLoader__.load({
	id: "dsh-ui-zoom-regions",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		//#region constants
		/** Dictionary namespace owned by this plugin. */
		const NS = "ui-zoom-regions";
		/** Persisted per-region levels, one JSON object. */
		const LEVELS_KEY = "dsh-ui-zoom-regions/levels";
		/** Readout mode key an earlier version persisted; cleared on every load. */
		const WIDGET_KEY = "dsh-ui-zoom-regions/widget";
		/** Small diagnostic record; the structural probe inside it is opt-in. */
		const DIAG_KEY = "dsh-ui-zoom-regions/diag";
		/** Set this to `1` to include the structural probe in the diagnostic record. */
		const DEBUG_KEY = "dsh-ui-zoom-regions/debug";
		/** Key an earlier version persisted a header drag offset under; cleared on load. */
		const HEADER_KEY = "dsh-ui-zoom-regions/header-offset";
		const VERSION = "1.0.0";
		const MIN = 0.5;
		const MAX = 2;
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
		/** How long the new drag handle pulses when it first appears (ms). */
		const INTRO_MS = 3600;
		/** Readout modes, cycled in order by the mode chip and Ctrl+Alt+0. */
		const WIDGET_MODES = ["auto", "always", "off"];
		/** How small the grip may squeeze the header (matches the zoom floor). */
		const HEADER_MIN_SCALE = MIN;
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
			"grip.label": "收起顶栏",
			"grip.hint": "按住向上拖：顶栏等比例缩小（文字全部保留、一起变小），最多缩到 50%；双击复位"
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
			"grip.label": "Shrink the header",
			"grip.hint": "Drag up to scale the whole header down (labels stay visible, just smaller), down to 50%; double-click to restore"
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
/* Slim collapse bar on the header's bottom edge: drag it up to shrink the
 * header, double-click to restore. No dots, no pill — it reads as an edge. */
.duzrGrip{position:absolute;left:50%;bottom:-3px;transform:translateX(-50%);width:64px;height:6px;border-radius:3px;background:#9aa3b5;box-shadow:0 1px 4px rgba(0,0,0,.4);opacity:.75;cursor:ns-resize;z-index:9;touch-action:none;transition:opacity .15s,background .15s,height .15s,bottom .15s}
.duzrGrip:hover,.duzrGrip:focus-visible{background:#4c7dff;opacity:1;height:9px;bottom:-5px}
.duzrGrip.is-dragging{background:#4c7dff;opacity:1;height:9px;bottom:-5px}
.duzrGrip.is-intro{animation:duzrGripPulse 1.1s ease-in-out 3}
@keyframes duzrGripPulse{0%,100%{box-shadow:0 1px 4px rgba(0,0,0,.4)}50%{background:#4c7dff;box-shadow:0 0 0 4px rgba(76,125,255,.55)}}
`;
		//#endregion

		//#region state
		/** Clamp to [MIN, MAX] and snap to the 5% wheel grid. */
		function clamp(level) {
			return Math.min(MAX, Math.max(MIN, Math.round(level * 20) / 20));
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
					if (Number.isFinite(value)) levels[id] = clamp(value);
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
		/** The heavy structural probe is opt-in: `localStorage['dsh-ui-zoom-regions/debug'] = '1'`. */
		function isDebugEnabled() {
			try {
				return window.localStorage.getItem(DEBUG_KEY) === "1";
			} catch { /* storage unavailable: stay quiet */ }
			return false;
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
			/** Readout mode for THIS load only: `auto` pops up after a change, `always` pins it, `off` never shows it. */
			let mode = "auto";
			clearStoredWidgetMode();
			/** The region the pointer last entered; the shortcut target. */
			let hovered = "center";
			/** Live elements per region (the top region has several), re-resolved on every sync. */
			const current = {};
			for (const id of REGION_IDS) current[id] = [];
			const teardown = [];
			/** Vertical shrink driven by the grip, expressed through the `top` level. */
			clearStoredHeaderOffset();
			/** The live header container the grip is attached to. */
			let headerEl = null;
			/** Whether this plugin set `position: relative` on that header. */
			let positionPatched = false;
			/** Whether the handle already drew attention to itself this load. */
			let introShown = false;
			/** The header's own CSS box metrics, measured once per header element. */
			let headerBase = null;

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
			/** The header's own box metrics, read once while it is still unpatched. */
			const measureHeaderBase = (element) => {
				if (element === null || typeof window.getComputedStyle !== "function") return null;
				const style = window.getComputedStyle(element);
				const px = (value) => {
					const parsed = Number.parseFloat(String(value ?? ""));
					return Number.isFinite(parsed) ? parsed : 0;
				};
				return {
					minHeight: px(style.minHeight),
					paddingTop: px(style.paddingTop),
					paddingRight: px(style.paddingRight),
					paddingBottom: px(style.paddingBottom),
					paddingLeft: px(style.paddingLeft)
				};
			};
			/**
			 * Shrink the header proportionally. The title row and the tab row are
			 * scaled by the shared `top` zoom (so every label stays visible, just
			 * smaller); the header's own min-height and padding are scaled by the
			 * same factor so the space is genuinely reclaimed instead of left blank.
			 * Anything at or above 100% restores the stylesheet's own values.
			 */
			const applyHeaderMetrics = () => {
				if (headerEl === null || headerBase === null) return;
				const scale = levels.top;
				const shrink = scale < 1;
				const set = (property, base) => {
					const wanted = shrink ? `${String(Math.round(base * scale))}px` : "";
					if (headerEl.style[property] !== wanted) headerEl.style[property] = wanted;
				};
				set("minHeight", headerBase.minHeight);
				set("paddingTop", headerBase.paddingTop);
				set("paddingRight", headerBase.paddingRight);
				set("paddingBottom", headerBase.paddingBottom);
				set("paddingLeft", headerBase.paddingLeft);
			};
			/** Attach the grip to the current header, moving it across remounts. */
			const mountHeaderHandle = () => {
				const next = resolveHeader();
				if (next !== headerEl) {
					gripEl.remove();
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
						/* Announce the handle once per load: a thin bar is easy to
						 * miss the first time, and the readout is transient anyway. */
						if (introShown === false) {
							introShown = true;
							gripEl.classList.add("is-intro");
							if (canTime) setTimeout(() => gripEl.classList.remove("is-intro"), INTRO_MS);
						}
					}
				}
				applyHeaderMetrics();
			};
			let gripDrag = null;
			/**
			 * Begin a shrink drag. The grip only ever removes height: dragging up
			 * scales the header down one-to-one (drag 20px up, lose 20px of header),
			 * and the scale stops at 100% so the header can never be enlarged or
			 * pushed into a gap from here.
			 */
			function onGripDown(event) {
				if (headerEl === null) return;
				event.preventDefault();
				event.stopPropagation();
				const rect = typeof headerEl.getBoundingClientRect === "function" ? headerEl.getBoundingClientRect() : null;
				gripDrag = {
					startY: Number(event.clientY ?? 0),
					startScale: levels.top,
					height: rect === null || rect.height === 0 ? 76 : rect.height
				};
				gripEl.classList.add("is-dragging");
				if (typeof gripEl.setPointerCapture === "function" && event.pointerId !== void 0) {
					try {
						gripEl.setPointerCapture(event.pointerId);
					} catch { /* capture is a nicety; the document listeners do the work */ }
				}
				document.addEventListener("pointermove", onGripMove, true);
				document.addEventListener("pointerup", onGripUp, true);
			}
			function onGripMove(event) {
				if (gripDrag === null) return;
				event.preventDefault();
				const dy = Number(event.clientY ?? 0) - gripDrag.startY;
				const next = gripDrag.startScale * (1 + dy / gripDrag.height);
				setLevel("top", Math.min(1, Math.max(HEADER_MIN_SCALE, next)));
			}
			function onGripUp() {
				if (gripDrag === null) return;
				gripDrag = null;
				gripEl.classList.remove("is-dragging");
				document.removeEventListener("pointermove", onGripMove, true);
				document.removeEventListener("pointerup", onGripUp, true);
				writeDiag();
			}
			/** Double-click the grip to give the header its full height back. */
			function onGripReset() {
				setLevel("top", 1);
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
				const level = levels[id];
				const center = current.center[0];
				if (id !== "top" || center === void 0 || !center.contains(element)) return level === 1 ? "" : String(level);
				const effective = Math.round((level / levels.center) * 10000) / 10000;
				return effective === 1 ? "" : String(effective);
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
				levels[id] = clamp(next);
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
						frameClass: frame === null ? null : String(frame.className),
						found,
						levels,
						applied,
						...(isDebugEnabled() ? { probe: {
							top: current.top.map(describe),
							topChain: current.top.length === 0 ? [] : chainOf(current.top[0]),
							center: current.center.map(describe),
							centerChain: current.center.length === 0 ? [] : chainOf(current.center[0]),
							columnChildren: childrenOf(resolveOne(CENTER_SELECTORS), 6),
							header: headerEl === null ? null : describe(headerEl),
							headerStyle: headerEl === null ? null : {
								minHeight: String(headerEl.style.minHeight ?? ""),
								paddingTop: String(headerEl.style.paddingTop ?? ""),
								scale: levels.top
							},
							grip: {
								attached: gripEl.parentElement !== null && gripEl.parentElement !== void 0,
								parent: String(gripEl.parentElement?.className ?? ""),
								rect: rectOf(gripEl)
							}
						} } : {})
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
					 * keep a stale zoom when it is still on screen. */
					for (const element of current[region.id]) {
						if (!elements.includes(element) && element.isConnected === true) element.style.zoom = "";
					}
					current[region.id] = elements;
					changed = true;
				}
				for (const id of REGION_IDS) applyRegion(id);
				mountHeaderHandle();
				if (changed) writeDiag();
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
				clearHide();
				for (const dispose of teardown) dispose();
				for (const id of REGION_IDS) {
					for (const element of current[id]) element.style.zoom = "";
				}
				gripEl.remove();
				if (headerEl !== null) {
					headerEl.style.minHeight = "";
					headerEl.style.paddingTop = "";
					headerEl.style.paddingRight = "";
					headerEl.style.paddingBottom = "";
					headerEl.style.paddingLeft = "";
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
