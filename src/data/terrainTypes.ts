import { TerrainType, TerrainProperties } from '../types/terrain';

export const TERRAIN: Record<TerrainType, TerrainProperties> = {
  rough: {
    color: '#2d5a1e',
    friction: 0.8,
    distanceMultiplier: 0.7,
    strokePenalty: 0,
    label: 'Rough',
  },
  fairway: {
    color: '#4CAF50',
    friction: 0.3,
    distanceMultiplier: 1.0,
    strokePenalty: 0,
    label: 'Fairway',
  },
  green: {
    color: '#66BB6A',
    friction: 0.15,
    distanceMultiplier: 1.0,
    strokePenalty: 0,
    label: 'Green',
  },
  bunker: {
    color: '#D2B48C',
    friction: 0.9,
    distanceMultiplier: 0.5,
    strokePenalty: 0,
    label: 'Bunker',
  },
  water: {
    color: '#4FC3F7',
    friction: 1.0,
    distanceMultiplier: 0,
    strokePenalty: 1,
    label: 'Water',
  },
  tee_box: {
    color: '#81C784',
    friction: 0.2,
    distanceMultiplier: 1.0,
    strokePenalty: 0,
    label: 'Tee Box',
  },
};
