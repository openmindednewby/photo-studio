import type { Point, Quad, Raster, Size } from '../types';

const STRIDE = 4;
const TURNS = 4;
const HALF_TURN = 2;
const THREE_QUARTER_TURN = 3;

export function normalizeTurns(quarterTurns: number): number {
  return ((quarterTurns % TURNS) + TURNS) % TURNS;
}

function targetOf(x: number, y: number, size: Size, turns: number): Point {
  if (turns === 1) return { x: size.height - 1 - y, y: x };
  if (turns === HALF_TURN) return { x: size.width - 1 - x, y: size.height - 1 - y };
  return { x: y, y: size.width - 1 - x };
}

export function rotateRaster(raster: Raster, quarterTurns: number): Raster {
  const turns = normalizeTurns(quarterTurns);
  if (turns === 0) return raster;
  const swapped = turns === 1 || turns === THREE_QUARTER_TURN;
  const width = swapped ? raster.height : raster.width;
  const height = swapped ? raster.width : raster.height;
  const data = new Uint8ClampedArray(raster.data.length);
  for (let y = 0; y < raster.height; y += 1) {
    for (let x = 0; x < raster.width; x += 1) {
      const target = targetOf(x, y, raster, turns);
      const from = (y * raster.width + x) * STRIDE;
      data.set(raster.data.subarray(from, from + STRIDE), (target.y * width + target.x) * STRIDE);
    }
  }
  return { width, height, data };
}

export function downscale(raster: Raster, maxSide: number): Raster {
  const scale = Math.min(1, maxSide / Math.max(raster.width, raster.height));
  if (scale === 1) return raster;
  const width = Math.max(1, Math.round(raster.width * scale));
  const height = Math.max(1, Math.round(raster.height * scale));
  const data = new Uint8ClampedArray(width * height * STRIDE);
  for (let y = 0; y < height; y += 1) {
    const sourceY = Math.min(raster.height - 1, Math.floor(y / scale));
    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(raster.width - 1, Math.floor(x / scale));
      const from = (sourceY * raster.width + sourceX) * STRIDE;
      data.set(raster.data.subarray(from, from + STRIDE), (y * width + x) * STRIDE);
    }
  }
  return { width, height, data };
}

export function quadToPixels(quad: Quad, size: Size): Quad {
  const scaled = (point: Point): Point => ({ x: point.x * (size.width - 1), y: point.y * (size.height - 1) });
  return {
    topLeft: scaled(quad.topLeft),
    topRight: scaled(quad.topRight),
    bottomRight: scaled(quad.bottomRight),
    bottomLeft: scaled(quad.bottomLeft),
  };
}
