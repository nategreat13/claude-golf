import { HoleDefinition } from '../../types/hole';

// Par 4, dogleg-left, ~400 yards
// Coordinate system: (0,0) top-left, Y increases downward
// World units = yards, hole is 450 tall x 160 wide
const hole1: HoleDefinition = {
  id: 'hole1',
  name: 'The Dogleg',
  par: 4,
  teePosition: { x: 80, y: 420 },
  pinPosition: { x: 45, y: 55 },
  bounds: { width: 160, height: 450 },
  terrain: [
    // Layer 1: Rough (entire playable area background)
    {
      id: 'rough-main',
      type: 'rough',
      points: [
        { x: 0, y: 0 },
        { x: 160, y: 0 },
        { x: 160, y: 450 },
        { x: 0, y: 450 },
      ],
    },
    // Layer 2: Fairway - starts wide at tee, narrows, doglegs left
    {
      id: 'fairway-main',
      type: 'fairway',
      points: [
        // Starting from tee area, going up
        { x: 55, y: 430 },
        { x: 105, y: 430 },
        { x: 110, y: 380 },
        { x: 115, y: 320 },
        { x: 110, y: 260 },
        { x: 100, y: 200 },
        // Dogleg left
        { x: 85, y: 150 },
        { x: 70, y: 110 },
        { x: 60, y: 85 },
        // Approaching green
        { x: 55, y: 75 },
        { x: 30, y: 75 },
        // Left side back down
        { x: 25, y: 110 },
        { x: 35, y: 150 },
        { x: 45, y: 200 },
        { x: 55, y: 260 },
        { x: 60, y: 320 },
        { x: 60, y: 380 },
        { x: 55, y: 430 },
      ],
    },
    // Layer 3: Tee box
    {
      id: 'tee-box',
      type: 'tee_box',
      points: [
        { x: 65, y: 430 },
        { x: 95, y: 430 },
        { x: 95, y: 410 },
        { x: 65, y: 410 },
      ],
    },
    // Layer 4: Water hazard - pond on left side before green
    {
      id: 'water-pond',
      type: 'water',
      points: [
        { x: 15, y: 130 },
        { x: 30, y: 120 },
        { x: 35, y: 130 },
        { x: 32, y: 155 },
        { x: 22, y: 160 },
        { x: 12, y: 150 },
      ],
    },
    // Layer 5: Fairway bunker - right side at the dogleg bend
    {
      id: 'bunker-fairway',
      type: 'bunker',
      points: [
        { x: 105, y: 235 },
        { x: 120, y: 230 },
        { x: 125, y: 245 },
        { x: 120, y: 265 },
        { x: 108, y: 260 },
      ],
    },
    // Layer 6: Greenside bunker - front-left of green
    {
      id: 'bunker-greenside',
      type: 'bunker',
      points: [
        { x: 25, y: 68 },
        { x: 35, y: 63 },
        { x: 40, y: 70 },
        { x: 35, y: 78 },
        { x: 25, y: 76 },
      ],
    },
    // Layer 7: Green
    {
      id: 'green-main',
      type: 'green',
      points: [
        { x: 30, y: 42 },
        { x: 50, y: 35 },
        { x: 65, y: 42 },
        { x: 68, y: 58 },
        { x: 60, y: 70 },
        { x: 42, y: 73 },
        { x: 28, y: 65 },
        { x: 25, y: 50 },
      ],
    },
  ],
};

export default hole1;
