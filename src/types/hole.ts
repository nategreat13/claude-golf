import { Point, TerrainPolygon } from './terrain';

export interface HoleDefinition {
  id: string;
  name: string;
  par: number;
  teePosition: Point;
  pinPosition: Point;
  bounds: { width: number; height: number };
  terrain: TerrainPolygon[]; // layered bottom-to-top
}
