import { createHomography, outputSizeOf, project, warpQuad } from './perspective';
import { insetQuad } from './quad';

import type { Quad, Raster } from '../types';

const SKEWED: Quad = {
  topLeft: { x: 10, y: 20 },
  topRight: { x: 90, y: 5 },
  bottomRight: { x: 110, y: 95 },
  bottomLeft: { x: 0, y: 80 },
};

function gradient(width: number, height: number): Raster {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      data[(y * width + x) * 4] = x * 10;
      data[(y * width + x) * 4 + 1] = y * 10;
      data[(y * width + x) * 4 + 3] = 255;
    }
  }
  return { width, height, data };
}

describe('project', () => {
  it.each([
    [0, 0, SKEWED.topLeft],
    [1, 0, SKEWED.topRight],
    [1, 1, SKEWED.bottomRight],
    [0, 1, SKEWED.bottomLeft],
  ])('with the unit corner %d,%d, lands on the matching quad corner', (u, v, expected) => {
    const homography = createHomography(SKEWED);

    const point = project(homography, u, v);

    expect(point.x).toBeCloseTo(expected.x);
    expect(point.y).toBeCloseTo(expected.y);
  });
});

describe('outputSizeOf', () => {
  it('with uneven opposite sides, takes the longer of each pair', () => {
    const quad: Quad = { topLeft: { x: 0, y: 0 }, topRight: { x: 10, y: 0 }, bottomRight: { x: 20, y: 5 }, bottomLeft: { x: 0, y: 5 } };

    const size = outputSizeOf(quad);

    expect(size).toEqual({ width: 21, height: 12 });
  });
});

describe('warpQuad', () => {
  it('with the whole photo, returns the same pixels', () => {
    const raster = gradient(5, 4);

    const result = warpQuad(raster, insetQuad(0));

    expect(Array.from(result.data)).toEqual(Array.from(raster.data));
  });

  it('with an axis-aligned region, crops to exactly that region', () => {
    const raster = gradient(11, 11);
    const region: Quad = { topLeft: { x: 0.5, y: 0 }, topRight: { x: 1, y: 0 }, bottomRight: { x: 1, y: 0.5 }, bottomLeft: { x: 0.5, y: 0.5 } };

    const result = warpQuad(raster, region);

    expect([result.width, result.height]).toEqual([6, 6]);
    expect(result.data[0]).toBe(50);
    expect(result.data[(6 * 6 - 1) * 4 + 1]).toBe(50);
  });
});
