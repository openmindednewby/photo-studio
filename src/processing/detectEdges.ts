import { downscale } from './geometry';
import { isConvex, quadArea } from './quad';

import type { Point, Quad, Raster, Size } from '../types';

const STRIDE = 4;
const DETECT_SIDE = 256;
const MIN_QUAD_AREA = 0.2;
const LEVELS = 256;
const MAX_LEVEL = 255;
const LUMA_RED = 0.299;
const LUMA_GREEN = 0.587;
const LUMA_BLUE = 0.114;
const BLUE_OFFSET = 2;
const BLUR_DIVISOR = 5;
const SOBEL_WEIGHT = 2;
const SOBEL_SCALE = 4;

function lumaPlane(raster: Raster): Float32Array {
  const plane = new Float32Array(raster.width * raster.height);
  for (let index = 0; index < plane.length; index += 1) {
    const offset = index * STRIDE;
    plane[index] =
      LUMA_RED * (raster.data[offset] ?? 0) + LUMA_GREEN * (raster.data[offset + 1] ?? 0) + LUMA_BLUE * (raster.data[offset + BLUE_OFFSET] ?? 0);
  }
  return plane;
}

function blurred(plane: Float32Array, { width, height }: Size): Float32Array {
  const output = plane.slice();
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const at = y * width + x;
      output[at] = ((plane[at] ?? 0) + (plane[at - 1] ?? 0) + (plane[at + 1] ?? 0) + (plane[at - width] ?? 0) + (plane[at + width] ?? 0)) / BLUR_DIVISOR;
    }
  }
  return output;
}

function gradientMagnitude(plane: Float32Array, { width, height }: Size): Uint8ClampedArray {
  const output = new Uint8ClampedArray(plane.length);
  const at = (x: number, y: number): number => plane[y * width + x] ?? 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const gx = at(x + 1, y - 1) + SOBEL_WEIGHT * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - SOBEL_WEIGHT * at(x - 1, y) - at(x - 1, y + 1);
      const gy = at(x - 1, y + 1) + SOBEL_WEIGHT * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - SOBEL_WEIGHT * at(x, y - 1) - at(x + 1, y - 1);
      output[y * width + x] = Math.hypot(gx, gy) / SOBEL_SCALE;
    }
  }
  return output;
}

export function otsuThreshold(values: Uint8ClampedArray): number {
  const histogram = new Uint32Array(LEVELS);
  values.forEach((value) => {
    histogram[value] = (histogram[value] ?? 0) + 1;
  });
  const total = values.length;
  const sumAll = histogram.reduce((sum, count, level) => sum + count * level, 0);
  let below = 0;
  let sumBelow = 0;
  let bestLevel = 0;
  let bestVariance = 0;
  for (let level = 0; level <= MAX_LEVEL; level += 1) {
    below += histogram[level] ?? 0;
    sumBelow += level * (histogram[level] ?? 0);
    const above = total - below;
    if (below === 0 || above === 0) continue;
    const gap = sumBelow / below - (sumAll - sumBelow) / above;
    const variance = below * above * gap * gap;
    if (variance > bestVariance) {
      bestVariance = variance;
      bestLevel = level;
    }
  }
  return bestLevel;
}

function floodFrom(start: number, mask: Uint8Array, visited: Uint8Array, { width, height }: Size): number[] {
  const members: number[] = [];
  const stack = [start];
  visited[start] = 1;
  while (stack.length > 0) {
    const at = stack.pop() as number;
    members.push(at);
    const x = at % width;
    const y = (at - x) / width;
    for (let ny = Math.max(0, y - 1); ny <= Math.min(height - 1, y + 1); ny += 1) {
      for (let nx = Math.max(0, x - 1); nx <= Math.min(width - 1, x + 1); nx += 1) {
        const next = ny * width + nx;
        if (mask[next] === 1 && visited[next] === 0) {
          visited[next] = 1;
          stack.push(next);
        }
      }
    }
  }
  return members;
}

function boundingArea(members: readonly number[], width: number): number {
  let minX = width;
  let maxX = 0;
  let minY = Infinity;
  let maxY = 0;
  members.forEach((at) => {
    const x = at % width;
    const y = (at - x) / width;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  return (maxX - minX) * (maxY - minY);
}

function largestComponent(mask: Uint8Array, size: Size): readonly number[] {
  const visited = new Uint8Array(mask.length);
  let best: readonly number[] = [];
  let bestArea = -1;
  for (let at = 0; at < mask.length; at += 1) {
    if (mask[at] !== 1 || visited[at] === 1) continue;
    const members = floodFrom(at, mask, visited, size);
    const area = boundingArea(members, size.width);
    if (area > bestArea) {
      bestArea = area;
      best = members;
    }
  }
  return best;
}

function cornersOf(members: readonly number[], { width, height }: Size): Quad {
  const scored = members.map((at): Point => {
    const x = at % width;
    return { x, y: (at - x) / width };
  });
  const pick = (score: (point: Point) => number): Point => {
    const winner = scored.reduce((best, point) => (score(point) > score(best) ? point : best));
    return { x: winner.x / (width - 1), y: winner.y / (height - 1) };
  };
  return {
    topLeft: pick((point) => -point.x - point.y),
    topRight: pick((point) => point.x - point.y),
    bottomRight: pick((point) => point.x + point.y),
    bottomLeft: pick((point) => point.y - point.x),
  };
}

export function detectEdges(raster: Raster): Quad | null {
  const small = downscale(raster, DETECT_SIDE);
  const magnitude = gradientMagnitude(blurred(lumaPlane(small), small), small);
  const threshold = otsuThreshold(magnitude);
  const mask = Uint8Array.from(magnitude, (value) => (value > threshold ? 1 : 0));
  const members = largestComponent(mask, small);
  if (members.length === 0) return null;
  const quad = cornersOf(members, small);
  return isConvex(quad) && quadArea(quad) >= MIN_QUAD_AREA ? quad : null;
}
