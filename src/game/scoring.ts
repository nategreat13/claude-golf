export function getScoreName(strokes: number, par: number): string {
  const diff = strokes - par;
  if (strokes === 1) return 'Hole in One!';
  if (diff <= -3) return 'Albatross';
  if (diff === -2) return 'Eagle';
  if (diff === -1) return 'Birdie';
  if (diff === 0) return 'Par';
  if (diff === 1) return 'Bogey';
  if (diff === 2) return 'Double Bogey';
  if (diff === 3) return 'Triple Bogey';
  return `+${diff}`;
}

export function formatScore(strokes: number, par: number): string {
  const diff = strokes - par;
  if (diff === 0) return 'E';
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}

export function isHoledOut(
  ballX: number,
  ballY: number,
  pinX: number,
  pinY: number,
  threshold: number = 5
): boolean {
  const dist = Math.hypot(ballX - pinX, ballY - pinY);
  return dist <= threshold;
}
