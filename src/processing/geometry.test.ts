import { downscale, normalizeTurns, rotateRaster } from './geometry';

import type { Raster } from '../types';

function labelled(width: number, height: number): Raster {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < width * height; index += 1) data[index * 4] = index + 1;
  return { width, height, data };
}

function reds(raster: Raster): number[] {
  return Array.from(raster.data).filter((_value, index) => index % 4 === 0);
}

describe('rotateRaster', () => {
  it('with one clockwise turn, swaps the sides and moves the left column to the top', () => {
    const raster = labelled(2, 3);

    const turned = rotateRaster(raster, 1);

    expect(turned.width).toBe(3);
    expect(turned.height).toBe(2);
    expect(reds(turned)).toEqual([5, 3, 1, 6, 4, 2]);
  });

  it('with two turns, reverses the pixel order', () => {
    const raster = labelled(2, 2);

    const turned = rotateRaster(raster, 2);

    expect(reds(turned)).toEqual([4, 3, 2, 1]);
  });

  it('with three turns, equals one turn anticlockwise', () => {
    const raster = labelled(2, 3);

    const turned = rotateRaster(raster, 3);

    expect(reds(turned)).toEqual([2, 4, 6, 1, 3, 5]);
  });
});

describe('normalizeTurns', () => {
  it('with a negative count, wraps into zero to three', () => {
    const turns = -1;

    const normalized = normalizeTurns(turns);

    expect(normalized).toBe(3);
  });
});

describe('downscale', () => {
  it('when already within the limit, returns the same raster', () => {
    const raster = labelled(4, 2);

    const result = downscale(raster, 4);

    expect(result).toBe(raster);
  });

  it('when over the limit, shrinks the longest side to it and keeps the shape', () => {
    const raster = labelled(8, 4);

    const result = downscale(raster, 4);

    expect([result.width, result.height]).toEqual([4, 2]);
  });
});
