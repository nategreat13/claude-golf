import { Point, TerrainType } from './terrain';

export type GamePhase =
  | 'overview'    // showing hole overview before play
  | 'aiming'      // player choosing aim direction
  | 'power'       // power bar charging
  | 'accuracy'    // accuracy bar oscillating
  | 'flying'      // ball in the air
  | 'rolling'     // ball rolling to stop
  | 'result'      // showing shot result
  | 'holed_out';  // ball in hole, showing final score

export interface ShotResult {
  club: string;
  power: number;
  accuracy: number; // -1 to 1 (0 = perfect)
  startPosition: Point;
  endPosition: Point;
  distance: number;
  landedOn: TerrainType;
}

export interface GameState {
  holeId: string;
  ballPosition: Point;
  strokes: number;
  currentClub: string;
  phase: GamePhase;
  aimAngle: number; // radians
  shotPower: number;
  shotAccuracy: number;
  shotHistory: ShotResult[];
  lastShotResult: ShotResult | null;
}
