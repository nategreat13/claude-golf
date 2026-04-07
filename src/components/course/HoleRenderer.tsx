import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, {
  Polygon,
  Circle,
  Line,
  Rect,
  G,
  Defs,
  Pattern,
  Ellipse,
} from 'react-native-svg';
import { HoleDefinition } from '../../types/hole';
import { Point } from '../../types/terrain';
import { Camera, worldToScreen, worldDistToScreen } from '../../utils/coordinates';
import { TERRAIN } from '../../data/terrainTypes';
import { COLORS } from '../../utils/colors';
import { movePoint } from '../../utils/geometry';

interface HoleRendererProps {
  hole: HoleDefinition;
  camera: Camera;
  ballPosition: Point;
  aimAngle: number;
  showAimLine: boolean;
  selectedClubMaxDist: number;
  width: number;
  height: number;
  animatedBallPosition?: Point | null;
  showBall?: boolean;
}

// Simple seeded random for deterministic tree placement
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function pointInPolygonSimple(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Check if a point is on a non-rough terrain
function isOnPlayableArea(point: Point, hole: HoleDefinition): boolean {
  for (let i = hole.terrain.length - 1; i >= 1; i--) {
    if (pointInPolygonSimple(point, hole.terrain[i].points)) {
      return true;
    }
  }
  return false;
}

interface TreeData {
  x: number;
  y: number;
  size: number;
  shade: number; // 0-1 for color variation
}

function generateTrees(hole: HoleDefinition, camera: Camera): TreeData[] {
  const trees: TreeData[] = [];
  const spacing = 11;

  for (let wx = -20; wx < hole.bounds.width + 20; wx += spacing) {
    for (let wy = -20; wy < hole.bounds.height + 20; wy += spacing) {
      const seed = wx * 1000 + wy;
      const jx = wx + (seededRandom(seed) - 0.5) * spacing * 0.7;
      const jy = wy + (seededRandom(seed + 1) - 0.5) * spacing * 0.7;

      if (isOnPlayableArea({ x: jx, y: jy }, hole)) continue;

      const screen = worldToScreen({ x: jx, y: jy }, camera);
      const baseSize = worldDistToScreen(5, camera);
      const size = baseSize * (0.85 + seededRandom(seed + 2) * 0.3);

      if (
        screen.x > -size && screen.x < camera.canvasWidth + size &&
        screen.y > -size && screen.y < camera.canvasHeight + size
      ) {
        trees.push({
          x: screen.x,
          y: screen.y,
          size,
          shade: seededRandom(seed + 3),
        });
      }
    }
  }
  // Sort by Y so trees in front overlap trees behind
  trees.sort((a, b) => a.y - b.y);
  return trees;
}

export default function HoleRenderer({
  hole,
  camera,
  ballPosition,
  aimAngle,
  showAimLine,
  selectedClubMaxDist,
  width,
  height,
  animatedBallPosition,
  showBall = true,
}: HoleRendererProps) {
  const terrainPolygons = useMemo(() => {
    return hole.terrain.map((polygon) => {
      const screenPoints = polygon.points.map((p) => worldToScreen(p, camera));
      const pointsStr = screenPoints.map((p) => `${p.x},${p.y}`).join(' ');
      return {
        pointsStr,
        color: TERRAIN[polygon.type].color,
        id: polygon.id,
        type: polygon.type,
      };
    });
  }, [hole.terrain, camera]);

  const trees = useMemo(() => generateTrees(hole, camera), [hole, camera]);

  const greenPoly = terrainPolygons.find((p) => p.type === 'green');

  // Ball
  const displayBall = animatedBallPosition ?? ballPosition;
  const ballScreen = worldToScreen(displayBall, camera);
  const ballRadius = Math.max(worldDistToScreen(1.8, camera), 3);

  // Pin
  const pinScreen = worldToScreen(hole.pinPosition, camera);
  const flagHeight = worldDistToScreen(10, camera);
  const flagWidth = worldDistToScreen(6, camera);

  // Aim line points
  const aimEnd = movePoint(ballPosition, aimAngle, selectedClubMaxDist);
  const aimStartScreen = worldToScreen(ballPosition, camera);
  const aimEndScreen = worldToScreen(aimEnd, camera);

  // Aim dots (small red squares like Pixel Golf)
  const aimDots: Point[] = [];
  const numDots = 8;
  for (let i = 1; i <= numDots; i++) {
    const t = i / (numDots + 1);
    aimDots.push(worldToScreen({
      x: ballPosition.x + (aimEnd.x - ballPosition.x) * t,
      y: ballPosition.y + (aimEnd.y - ballPosition.y) * t,
    }, camera));
  }

  // Aim direction chevrons (> markers along the line)
  const chevrons: { pos: Point; angle: number }[] = [];
  if (showAimLine) {
    for (let t = 0.15; t < 0.85; t += 0.25) {
      const pos = worldToScreen({
        x: ballPosition.x + (aimEnd.x - ballPosition.x) * t,
        y: ballPosition.y + (aimEnd.y - ballPosition.y) * t,
      }, camera);
      chevrons.push({ pos, angle: aimAngle });
    }
  }

  // Green grid dot spacing
  const gridSpacing = Math.max(worldDistToScreen(4, camera), 6);

  // Trunk height
  const trunkH = (size: number) => size * 0.3;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <Pattern id="greenGrid" x="0" y="0" width={gridSpacing} height={gridSpacing} patternUnits="userSpaceOnUse">
            <Circle cx={gridSpacing / 2} cy={gridSpacing / 2} r={1} fill="rgba(255,255,255,0.12)" />
          </Pattern>
        </Defs>

        {/* Background */}
        <Rect x={0} y={0} width={width} height={height} fill="#1a3a0f" />

        {/* Terrain polygons */}
        {terrainPolygons.map(({ pointsStr, color, id, type }) => (
          <Polygon key={id} points={pointsStr} fill={color} />
        ))}

        {/* Green grid dots */}
        {greenPoly && (
          <Polygon points={greenPoly.pointsStr} fill="url(#greenGrid)" />
        )}

        {/* Trees - rendered with trunk + canopy for depth */}
        {trees.map((tree, i) => {
          const darkGreen = tree.shade < 0.5 ? '#2a6b1a' : '#287518';
          const lightGreen = tree.shade < 0.5 ? '#3d9928' : '#45a830';
          const trunkColor = '#5d4e37';
          const th = trunkH(tree.size);

          return (
            <G key={`tree-${i}`}>
              {/* Trunk shadow */}
              <Rect
                x={tree.x - tree.size * 0.08}
                y={tree.y + tree.size * 0.1}
                width={tree.size * 0.16}
                height={th}
                fill="rgba(0,0,0,0.15)"
                rx={1}
              />
              {/* Trunk */}
              <Rect
                x={tree.x - tree.size * 0.07}
                y={tree.y}
                width={tree.size * 0.14}
                height={th}
                fill={trunkColor}
                rx={1}
              />
              {/* Canopy shadow */}
              <Ellipse
                cx={tree.x + tree.size * 0.06}
                cy={tree.y + tree.size * 0.06}
                rx={tree.size * 0.52}
                ry={tree.size * 0.45}
                fill="rgba(0,0,0,0.18)"
              />
              {/* Main canopy */}
              <Ellipse
                cx={tree.x}
                cy={tree.y - tree.size * 0.1}
                rx={tree.size * 0.52}
                ry={tree.size * 0.45}
                fill={darkGreen}
              />
              {/* Canopy highlight */}
              <Ellipse
                cx={tree.x - tree.size * 0.12}
                cy={tree.y - tree.size * 0.2}
                rx={tree.size * 0.32}
                ry={tree.size * 0.28}
                fill={lightGreen}
              />
            </G>
          );
        })}

        {/* Flag pole */}
        <Line
          x1={pinScreen.x}
          y1={pinScreen.y}
          x2={pinScreen.x}
          y2={pinScreen.y - flagHeight}
          stroke="#EEE"
          strokeWidth={1.5}
        />
        {/* Flag (rectangle like Pixel Golf) */}
        <Rect
          x={pinScreen.x}
          y={pinScreen.y - flagHeight}
          width={flagWidth}
          height={flagWidth * 0.6}
          fill="#D32F2F"
        />
        {/* Pin hole */}
        <Circle
          cx={pinScreen.x}
          cy={pinScreen.y}
          r={Math.max(worldDistToScreen(0.8, camera), 2)}
          fill="#222"
        />

        {/* Aim line - small red square dots */}
        {showAimLine && (
          <G>
            {aimDots.map((dot, i) => (
              <Rect
                key={`dot-${i}`}
                x={dot.x - 2}
                y={dot.y - 2}
                width={4}
                height={4}
                fill="#E53935"
                opacity={0.85}
              />
            ))}
            {/* Direction chevrons */}
            {chevrons.map((ch, i) => {
              const dx = Math.cos(ch.angle);
              const dy = Math.sin(ch.angle);
              const perpX = -dy;
              const perpY = dx;
              const sz = 5;
              return (
                <G key={`chev-${i}`}>
                  <Line
                    x1={ch.pos.x - perpX * sz - dx * sz}
                    y1={ch.pos.y - perpY * sz - dy * sz}
                    x2={ch.pos.x}
                    y2={ch.pos.y}
                    stroke="#E53935"
                    strokeWidth={1.5}
                    opacity={0.7}
                  />
                  <Line
                    x1={ch.pos.x + perpX * sz - dx * sz}
                    y1={ch.pos.y + perpY * sz - dy * sz}
                    x2={ch.pos.x}
                    y2={ch.pos.y}
                    stroke="#E53935"
                    strokeWidth={1.5}
                    opacity={0.7}
                  />
                </G>
              );
            })}
          </G>
        )}

        {/* Golfer sprite — compact pixel figure */}
        {showBall && (
          <G>
            {/* Shadow */}
            <Ellipse
              cx={ballScreen.x}
              cy={ballScreen.y + 4}
              rx={4}
              ry={1.5}
              fill="rgba(0,0,0,0.25)"
            />
            {/* Body */}
            <Rect
              x={ballScreen.x - 2.5}
              y={ballScreen.y - 4}
              width={5}
              height={7}
              fill="#F5F5F5"
              rx={1}
            />
            {/* Head */}
            <Circle cx={ballScreen.x} cy={ballScreen.y - 6.5} r={3} fill="#FFE0B2" />
            {/* Hat */}
            <Rect
              x={ballScreen.x - 3.5}
              y={ballScreen.y - 9}
              width={7}
              height={2.5}
              fill="#FAFAFA"
              rx={0.5}
            />
            {/* Legs */}
            <Rect x={ballScreen.x - 2} y={ballScreen.y + 3} width={1.8} height={3} fill="#444" />
            <Rect x={ballScreen.x + 0.2} y={ballScreen.y + 3} width={1.8} height={3} fill="#444" />
          </G>
        )}

        {/* Ball */}
        {showBall && (
          <Circle
            cx={ballScreen.x + 5}
            cy={ballScreen.y + 4}
            r={Math.max(ballRadius * 0.5, 2)}
            fill="#FFF"
          />
        )}
      </Svg>
    </View>
  );
}
