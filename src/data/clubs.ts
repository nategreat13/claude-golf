import { ClubDefinition } from '../types/club';

export const CLUBS: ClubDefinition[] = [
  {
    id: 'driver',
    name: 'Driver',
    icon: '🏌️',
    maxDistance: 280,
    accuracy: 0.55,
    loft: 0.3,
    terrainPenalty: {
      rough: 0.6,
      bunker: 0.3,
    },
    canUseFrom: ['tee_box', 'fairway', 'rough'],
  },
  {
    id: 'iron',
    name: 'Iron',
    icon: '🏌️',
    maxDistance: 170,
    accuracy: 0.7,
    loft: 0.5,
    terrainPenalty: {
      rough: 0.75,
      bunker: 0.5,
    },
    canUseFrom: ['tee_box', 'fairway', 'rough', 'bunker'],
  },
  {
    id: 'wedge',
    name: 'Wedge',
    icon: '🏌️',
    maxDistance: 100,
    accuracy: 0.85,
    loft: 0.8,
    terrainPenalty: {
      rough: 0.85,
      bunker: 0.8,
    },
    canUseFrom: ['tee_box', 'fairway', 'rough', 'bunker', 'green'],
  },
  {
    id: 'putter',
    name: 'Putter',
    icon: '🏌️',
    maxDistance: 18,
    accuracy: 0.95,
    loft: 0,
    terrainPenalty: {
      rough: 0.3,
      bunker: 0.1,
      fairway: 0.8,
    },
    canUseFrom: ['green', 'fairway', 'rough', 'bunker', 'tee_box'],
  },
];

export function getClub(id: string): ClubDefinition {
  return CLUBS.find((c) => c.id === id) ?? CLUBS[0];
}

export function autoSelectClub(distance: number, terrain: string): string {
  if (terrain === 'green') return 'putter';
  if (distance > 200) return 'driver';
  if (distance > 100) return 'iron';
  if (distance > 20) return 'wedge';
  return 'putter';
}
