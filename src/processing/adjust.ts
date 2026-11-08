import type { Adjustments, Raster } from '../types';

const STRIDE = 4;
const LEVELS = 256;
const MAX_LEVEL = 255;
const MID_LEVEL = 128;
const TAIL_SHARE = 0.01;
const LUMA_RED = 0.299;
const LUMA_GREEN = 0.587;
const LUMA_BLUE = 0.114;
const GREEN_OFFSET = 1;
const BLUE_OFFSET = 2;
const ALPHA_OFFSET = 3;
const SHARPEN_NEIGHBOURS = 4;

interface Levels {
  readonly low: number;
  readonly high: number;
}

function lumaAt(data: Uint8ClampedArray, offset: number): number {
  const red = data[offset] ?? 0;
  const green = data[offset + GREEN_OFFSET] ?? 0;
  const blue = data[offset + BLUE_OFFSET] ?? 0;
  return Math.round(LUMA_RED * red + LUMA_GREEN * green + LUMA_BLUE * blue);
}

function histogramOf(data: Uint8ClampedArray): Uint32Array {
  const histogram = new Uint32Array(LEVELS);
  for (let offset = 0; offset < data.length; offset += STRIDE) {
    const luma = lumaAt(data, offset);
    histogram[luma] = (histogram[luma] ?? 0) + 1;
  }
  return histogram;
}

function firstLevelPast(histogram: Uint32Array, tail: number, step: number): number {
  let seen = 0;
  for (let level = step > 0 ? 0 : MAX_LEVEL; level >= 0 && level < LEVELS; level += step) {
    seen += histogram[level] ?? 0;
    if (seen > tail) return level;
  }
  return step > 0 ? 0 : MAX_LEVEL;
}

export function autoLevels(data: Uint8ClampedArray): Levels {
  const tail = Math.floor((data.length / STRIDE) * TAIL_SHARE);
  const histogram = histogramOf(data);
  const low = firstLevelPast(histogram, tail, 1);
  const high = firstLevelPast(histogram, tail, -1);
  return high > low ? { low, high } : { low: 0, high: MAX_LEVEL };
}

function buildToneTable(adjustments: Adjustments, data: Uint8ClampedArray): Uint8ClampedArray {
  const { low, high } = adjustments.auto ? autoLevels(data) : { low: 0, high: MAX_LEVEL };
  const table = new Uint8ClampedArray(LEVELS);
  for (let level = 0; level < LEVELS; level += 1) {
    const stretched = ((level - low) / (high - low)) * MAX_LEVEL;
    const brightened = stretched + adjustments.brightness * MAX_LEVEL;
    table[level] = (brightened - MID_LEVEL) * (1 + adjustments.contrast) + MID_LEVEL;
  }
  return table;
}

function applyTones(data: Uint8ClampedArray, table: Uint8ClampedArray, blackAndWhite: boolean): Uint8ClampedArray {
  const toned = new Uint8ClampedArray(data.length);
  for (let offset = 0; offset < data.length; offset += STRIDE) {
    const luma = lumaAt(data, offset);
    toned[offset] = table[blackAndWhite ? luma : (data[offset] ?? 0)] ?? 0;
    toned[offset + GREEN_OFFSET] = table[blackAndWhite ? luma : (data[offset + GREEN_OFFSET] ?? 0)] ?? 0;
    toned[offset + BLUE_OFFSET] = table[blackAndWhite ? luma : (data[offset + BLUE_OFFSET] ?? 0)] ?? 0;
    toned[offset + ALPHA_OFFSET] = data[offset + ALPHA_OFFSET] ?? 0;
  }
  return toned;
}

function sharpened(data: Uint8ClampedArray, width: number, height: number, amount: number): Uint8ClampedArray {
  const output = data.slice();
  const rowStride = width * STRIDE;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const offset = (y * width + x) * STRIDE;
      for (let channel = 0; channel < ALPHA_OFFSET; channel += 1) {
        const at = offset + channel;
        const around =
          (data[at - STRIDE] ?? 0) + (data[at + STRIDE] ?? 0) + (data[at - rowStride] ?? 0) + (data[at + rowStride] ?? 0);
        output[at] = (data[at] ?? 0) * (1 + SHARPEN_NEIGHBOURS * amount) - around * amount;
      }
    }
  }
  return output;
}

export function applyAdjustments(raster: Raster, adjustments: Adjustments): Raster {
  const toned = applyTones(raster.data, buildToneTable(adjustments, raster.data), adjustments.blackAndWhite);
  const data = adjustments.sharpen > 0 ? sharpened(toned, raster.width, raster.height, adjustments.sharpen) : toned;
  return { width: raster.width, height: raster.height, data };
}
