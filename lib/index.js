/**
 * Host side of `dsh-ui-zoom-regions`.
 *
 * Per-column zoom lives entirely in the browser client (CSS `zoom` on the
 * three app-frame columns plus a small DOM widget), so the host plugin is
 * intentionally a no-op. It exists so the package is a valid cordis plugin on
 * both sides.
 */
export function apply() {}
