export type Point = { x: number; y: number };

export type TerrainType = 'rough' | 'fairway' | 'green' | 'bunker' | 'water' | 'tee_box';

export interface TerrainPolygon {
  id: string;
  type: TerrainType;
  points: Point[];
}

export interface TerrainProperties {
  color: string;
  friction: number; // 0-1, higher = more friction (less roll)
  distanceMultiplier: number; // multiplier on shot distance when hitting from this terrain
  strokePenalty: number; // extra strokes added (water = 1)
  label: string;
}
