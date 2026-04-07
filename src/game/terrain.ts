import { Point, TerrainType, TerrainPolygon } from '../types/terrain';
import { pointInPolygon } from '../utils/geometry';

// Detect terrain at a point by checking polygons in reverse order (top layer first)
export function getTerrainAt(point: Point, terrain: TerrainPolygon[]): TerrainType {
  for (let i = terrain.length - 1; i >= 0; i--) {
    if (pointInPolygon(point, terrain[i].points)) {
      return terrain[i].type;
    }
  }
  return 'rough'; // default if outside all polygons
}

// Find the nearest point on a polygon edge to a given point
export function nearestPointOnFairway(
  point: Point,
  terrain: TerrainPolygon[]
): Point {
  const fairway = terrain.find((t) => t.type === 'fairway');
  if (!fairway) return point;

  let nearest = point;
  let minDist = Infinity;

  const pts = fairway.points;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const p = nearestPointOnSegment(point, a, b);
    const d = Math.hypot(p.x - point.x, p.y - point.y);
    if (d < minDist) {
      minDist = d;
      nearest = p;
    }
  }
  return nearest;
}

function nearestPointOnSegment(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return a;

  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  return { x: a.x + t * dx, y: a.y + t * dy };
}
