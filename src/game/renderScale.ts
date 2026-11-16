/** World units stay at 16 px/tile; native texture density never changes physics. */
export function renderDensity(dpr: number) { return Math.max(1, Math.min(2, dpr || 1)) }
export function roomZoom(width: number, height: number) {
  const fit = Math.min(width / 480, height / 384)
  return fit >= 1 ? Math.floor(fit) : fit
}
