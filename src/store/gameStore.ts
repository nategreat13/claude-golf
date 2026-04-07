import { create } from 'zustand';
import { GamePhase, GameState, ShotResult } from '../types/game';
import { Point, TerrainType } from '../types/terrain';
import { HoleDefinition } from '../types/hole';
import { getTerrainAt, nearestPointOnFairway } from '../game/terrain';
import { resolveShot, buildShotResult, calculateRoll } from '../game/shot';
import { getClub, autoSelectClub } from '../data/clubs';
import { TERRAIN } from '../data/terrainTypes';
import { distance } from '../utils/geometry';
import { isHoledOut } from '../game/scoring';

interface GameStore extends GameState {
  hole: HoleDefinition | null;

  // Actions
  loadHole: (hole: HoleDefinition) => void;
  setPhase: (phase: GamePhase) => void;
  setAimAngle: (angle: number) => void;
  setClub: (clubId: string) => void;
  startShot: () => void;
  setPower: (power: number) => void;
  setAccuracy: (accuracy: number) => void;
  executeShot: () => { endPosition: Point; landedOn: TerrainType; isWater: boolean } | null;
  finishShot: (endPosition: Point, landedOn: TerrainType, isWater: boolean) => void;
  reset: () => void;
}

const initialState: GameState = {
  holeId: '',
  ballPosition: { x: 0, y: 0 },
  strokes: 0,
  currentClub: 'driver',
  phase: 'overview',
  aimAngle: -Math.PI / 2, // pointing up
  shotPower: 0,
  shotAccuracy: 0,
  shotHistory: [],
  lastShotResult: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  hole: null,

  loadHole: (hole) => {
    set({
      ...initialState,
      hole,
      holeId: hole.id,
      ballPosition: { ...hole.teePosition },
      phase: 'overview',
    });
  },

  setPhase: (phase) => set({ phase }),

  setAimAngle: (angle) => set({ aimAngle: angle }),

  setClub: (clubId) => set({ currentClub: clubId }),

  startShot: () => set({ phase: 'power', shotPower: 0, shotAccuracy: 0 }),

  setPower: (power) => set({ shotPower: power, phase: 'accuracy' }),

  setAccuracy: (accuracy) => {
    set({ shotAccuracy: accuracy });
    // Immediately execute shot after accuracy is set
    const state = get();
    const result = state.executeShot();
    if (result) {
      set({ phase: 'flying' });
    }
  },

  executeShot: () => {
    const state = get();
    if (!state.hole) return null;

    const club = getClub(state.currentClub);
    const currentTerrain = getTerrainAt(state.ballPosition, state.hole.terrain);

    const { endPosition: rawEnd, distance: shotDist, actualAngle } = resolveShot({
      power: state.shotPower,
      accuracyDeviation: state.shotAccuracy,
      club,
      ballPosition: state.ballPosition,
      aimAngle: state.aimAngle,
      currentTerrain,
    });

    // Apply roll
    const landedTerrain = getTerrainAt(rawEnd, state.hole.terrain);
    const endPosition = calculateRoll(rawEnd, actualAngle, shotDist, landedTerrain, club.loft);

    // Check final terrain
    const finalTerrain = getTerrainAt(endPosition, state.hole.terrain);
    const isWater = finalTerrain === 'water';

    const result = buildShotResult(
      {
        power: state.shotPower,
        accuracyDeviation: state.shotAccuracy,
        club,
        ballPosition: state.ballPosition,
        aimAngle: state.aimAngle,
        currentTerrain,
      },
      endPosition,
      shotDist,
      finalTerrain
    );

    set({ lastShotResult: result });

    return { endPosition, landedOn: finalTerrain, isWater };
  },

  finishShot: (endPosition, landedOn, isWater) => {
    const state = get();
    if (!state.hole) return;

    let newBallPos = endPosition;
    let extraStrokes = 0;

    if (isWater) {
      // Drop near where ball landed in water, on nearest fairway edge
      newBallPos = nearestPointOnFairway(endPosition, state.hole.terrain);
      extraStrokes = TERRAIN.water.strokePenalty;
    }

    // Clamp ball to bounds
    newBallPos = {
      x: Math.max(0, Math.min(state.hole.bounds.width, newBallPos.x)),
      y: Math.max(0, Math.min(state.hole.bounds.height, newBallPos.y)),
    };

    const newStrokes = state.strokes + 1 + extraStrokes;
    const holed = isHoledOut(
      newBallPos.x,
      newBallPos.y,
      state.hole.pinPosition.x,
      state.hole.pinPosition.y
    );

    // Auto-select club for next shot
    const distToPin = distance(newBallPos, state.hole.pinPosition);
    const terrain = getTerrainAt(newBallPos, state.hole.terrain);
    const nextClub = autoSelectClub(distToPin, terrain);

    set({
      ballPosition: newBallPos,
      strokes: newStrokes,
      phase: holed ? 'holed_out' : 'aiming',
      currentClub: nextClub,
      shotHistory: [
        ...state.shotHistory,
        state.lastShotResult!,
      ],
      aimAngle: holed
        ? state.aimAngle
        : Math.atan2(
            state.hole.pinPosition.y - newBallPos.y,
            state.hole.pinPosition.x - newBallPos.x
          ),
    });
  },

  reset: () => {
    const hole = get().hole;
    if (hole) {
      set({
        ...initialState,
        hole,
        holeId: hole.id,
        ballPosition: { ...hole.teePosition },
        phase: 'aiming',
      });
    }
  },
}));
