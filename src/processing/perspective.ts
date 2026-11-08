import { quadToPixels } from './geometry';

import type { Point, Quad, Raster, Size } from '../types';

const STRIDE = 4;

export interface Homography {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
  readonly e: number;
  readonly f: number;
  readonly g: number;
  readonly h: number;
}

export function createHomography(quad: Quad): Homography {
  const { topLeft: p0, topRight: p1, bottomRight: p2, bottomLeft: p3 } = quad;
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const sx = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const sy = p0.y - p1.y + p2.y - p3.y;
  const determinant = dx1 * dy2 - dx2 * dy1;
  const g = determinant === 0 ? 0 : (sx * dy2 - dx2 * sy) / determinant;
  const h = determinant === 0 ? 0 : (dx1 * sy - sx * dy1) / determinant;
  return { a: p1.x - p0.x + g * p1.x, b: p3.x - p0.x + h * p3.x, c: p0.x, d: p1.y - p0.y + g * p1.y, e: p3.y - p0.y + h * p3.y, f: p0.y, g, h };
}

export function project(homography: Homography, u: number, v: number): Point {
  const { a, b, c, d, e, f, g, h } = homography;
  const divisor = g * u + h * v + 1;
  return { x: (a * u + b * v + c) / divisor, y: (d * u + e * v + f) / divisor };
}

function distance(from: Point, to: Point): number {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

export function outputSizeOf(quad: Quad): Size {
  const width = Math.max(distance(quad.topLeft, quad.topRight), distance(quad.bottomLeft, quad.bottomRight));
  const height = Math.max(distance(quad.topLeft, quad.bottomLeft), distance(quad.topRight, quad.bottomRight));
  return { width: Math.max(1, Math.round(width) + 1), height: Math.max(1, Math.round(height) + 1) };
}

function valueAt(source: Raster, x: number, y: number, channel: number): number {
  return source.data[(y * source.width + x) * STRIDE + channel] ?? 0;
}

function lerp(from: number, to: number, share: number): number {
  return from + (to - from) * share;
}

function sampleInto(target: Uint8ClampedArray, at: number, source: Raster, point: Point): void {
  const x = Math.min(source.width - 1, Math.max(0, point.x));
  const y = Math.min(source.height - 1, Math.max(0, point.y));
  const left = Math.floor(x);
  const top = Math.floor(y);
  const right = Math.min(source.width - 1, left + 1);
  const bottom = Math.min(source.height - 1, top + 1);
  const shareX = x - left;
  const shareY = y - top;
  for (let channel = 0; channel < STRIDE; channel += 1) {
    const upper = lerp(valueAt(source, left, top, channel), valueAt(source, right, top, channel), shareX);
    const lower = lerp(valueAt(source, left, bottom, channel), valueAt(source, right, bottom, channel), shareX);
    target[at + channel] = lerp(upper, lower, shareY);
  }
}

export function warpQuad(raster: Raster, quad: Quad): Raster {
  const corners = quadToPixels(quad, raster);
  const { width, height } = outputSizeOf(corners);
  const homography = createHomography(corners);
  const data = new Uint8ClampedArray(width * height * STRIDE);
  const stepU = width > 1 ? 1 / (width - 1) : 0;
  const stepV = height > 1 ? 1 / (height - 1) : 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      sampleInto(data, (y * width + x) * STRIDE, raster, project(homography, x * stepU, y * stepV));
    }
  }
  return { width, height, data };
}
