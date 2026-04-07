import { Point } from '../types/terrain';

export interface Camera {
  centerX: number; // world X the camera is centered on
  centerY: number; // world Y the camera is centered on
  scale: number; // pixels per world unit
  canvasWidth: number;
  canvasHeight: number;
}

export function worldToScreen(point: Point, camera: Camera): Point {
  return {
    x: (point.x - camera.centerX) * camera.scale + camera.canvasWidth / 2,
    y: (point.y - camera.centerY) * camera.scale + camera.canvasHeight / 2,
  };
}

export function screenToWorld(point: Point, camera: Camera): Point {
  return {
    x: (point.x - camera.canvasWidth / 2) / camera.scale + camera.centerX,
    y: (point.y - camera.canvasHeight / 2) / camera.scale + camera.centerY,
  };
}

export function worldDistToScreen(dist: number, camera: Camera): number {
  return dist * camera.scale;
}

export function fitHoleInView(
  holeBounds: { width: number; height: number },
  canvasWidth: number,
  canvasHeight: number,
  padding: number = 20
): Camera {
  const scaleX = (canvasWidth - padding * 2) / holeBounds.width;
  const scaleY = (canvasHeight - padding * 2) / holeBounds.height;
  const scale = Math.min(scaleX, scaleY);

  return {
    centerX: holeBounds.width / 2,
    centerY: holeBounds.height / 2,
    scale,
    canvasWidth,
    canvasHeight,
  };
}

export function cameraFollowingBall(
  ball: Point,
  pin: Point,
  holeBounds: { width: number; height: number },
  canvasWidth: number,
  canvasHeight: number
): Camera {
  // Frame the view to show both ball and pin, zooming in as they get closer
  const minX = Math.min(ball.x, pin.x);
  const maxX = Math.max(ball.x, pin.x);
  const minY = Math.min(ball.y, pin.y);
  const maxY = Math.max(ball.y, pin.y);

  // Add generous padding around the ball-to-pin bounding box
  const padX = Math.max((maxX - minX) * 0.4, 30);
  const padY = Math.max((maxY - minY) * 0.3, 30);

  const viewWidth = (maxX - minX) + padX * 2;
  const viewHeight = (maxY - minY) + padY * 2;

  // Scale to fit this region, but never zoom in more than ~3x the overview
  const maxScale = (canvasWidth / holeBounds.width) * 3;
  const scaleX = canvasWidth / viewWidth;
  const scaleY = canvasHeight / viewHeight;
  const scale = Math.min(scaleX, scaleY, maxScale);

  // Center between ball and pin, biased slightly toward the ball
  const centerX = (minX + maxX) / 2 + (ball.x - (minX + maxX) / 2) * 0.2;
  const centerY = (minY + maxY) / 2 + (ball.y - (minY + maxY) / 2) * 0.2;

  return {
    centerX,
    centerY,
    scale,
    canvasWidth,
    canvasHeight,
  };
}
