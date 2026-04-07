import { TerrainType } from './terrain';

export interface ClubDefinition {
  id: string;
  name: string;
  icon: string;
  maxDistance: number; // max distance in world units (yards) at full power
  accuracy: number; // 0-1, higher = slower/easier accuracy bar
  loft: number; // arc height multiplier for flight animation
  terrainPenalty: Partial<Record<TerrainType, number>>; // distance multiplier per terrain
  canUseFrom: TerrainType[]; // terrains this club can be used from
}
