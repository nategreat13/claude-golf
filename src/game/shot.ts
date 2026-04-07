import { Point, TerrainType } from '../types/terrain';
import { ClubDefinition } from '../types/club';
import { ShotResult } from '../types/game';
import { TERRAIN } from '../data/terrainTypes';
import { movePoint, distance } from '../utils/geometry';

export interface ShotInput {
  power: number; // 0-1
  accuracyDeviation: number; // -1 to 1, 0 = perfect
  club: ClubDefinition;
  ballPosition: Point;
  aimAngle: number; // radians
  currentTerrain: TerrainType;
}

export function resolveShot(input: ShotInput): {
  endPosition: Point;
  distance: number;
  actualAngle: number;
} {
  const { power, accuracyDeviation, club, ballPosition, aimAngle, currentTerrain } = input;

  // Base distance
  const terrainMult = club.terrainPenalty[currentTerrain] ?? TERRAIN[currentTerrain].distanceMultiplier;
  const baseDistance = club.maxDistance * power * terrainMult;

  // Accuracy affects angle - max deviation of ~15 degrees for worst accuracy
  const maxAngleDeviation = ((1 - club.accuracy) * Math.PI) / 6; // up to 30 deg
  const actualAngle = aimAngle + accuracyDeviation * maxAngleDeviation;

  // Calculate end position
  const endPosition = movePoint(ballPosition, actualAngle, baseDistance);

  return {
    endPosition,
    distance: baseDistance,
    actualAngle,
  };
}

export function buildShotResult(
  input: ShotInput,
  endPosition: Point,
  shotDistance: number,
  landedOn: TerrainType
): ShotResult {
  return {
    club: input.club.id,
    power: input.power,
    accuracy: input.accuracyDeviation,
    startPosition: { ...input.ballPosition },
    endPosition: { ...endPosition },
    distance: shotDistance,
    landedOn,
  };
}

// Calculate the trajectory arc points for animation
export function calculateFlightArc(
  start: Point,
  end: Point,
  loft: number,
  numPoints: number = 30
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Linear interpolation for x,y
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t;
    points.push({ x, y });
  }
  return points;
}

// Calculate how far the ball rolls after landing
export function calculateRoll(
  landingPoint: Point,
  angle: number,
  shotDistance: number,
  terrain: TerrainType,
  loft: number
): Point {
  const friction = TERRAIN[terrain].friction;
  // Higher loft = less roll, higher friction = less roll
  const rollDistance = shotDistance * 0.15 * (1 - loft) * (1 - friction);
  return movePoint(landingPoint, angle, rollDistance);
}
