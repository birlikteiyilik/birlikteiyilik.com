type Point = { x: number; y: number };
type PageBounds = { left: number; right: number };

export function flipbookGesture(start: Point, end: Point, bounds: PageBounds, duration: number): "next" | "previous" | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const threshold = Math.max(18, Math.min(32, (bounds.right - bounds.left) * 0.06));
  if (Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.2) return dx > 0 ? "next" : "previous";
  if (Math.hypot(dx, dy) <= 10 && duration < 600) return start.x < (bounds.left + bounds.right) / 2 ? "next" : "previous";
  return null;
}
