import { applyAdjustments, autoLevels } from './adjust';
import { NEUTRAL_ADJUSTMENTS } from './filterPresets';

import type { Raster } from '../types';

function greyRaster(values: number[], width = values.length): Raster {
  const data = new Uint8ClampedArray(values.flatMap((value) => [value, value, value, 255]));
  return { width, height: values.length / width, data };
}

describe('applyAdjustments', () => {
  it('with positive brightness, lifts each channel by that share of full scale', () => {
    const raster = greyRaster([100]);

    const result = applyAdjustments(raster, { ...NEUTRAL_ADJUSTMENTS, brightness: 0.2 });

    expect(Array.from(result.data)).toEqual([151, 151, 151, 255]);
  });

  it('with contrast of one, doubles the distance from mid grey', () => {
    const raster = greyRaster([100]);

    const result = applyAdjustments(raster, { ...NEUTRAL_ADJUSTMENTS, contrast: 1 });

    expect(result.data[0]).toBe(72);
  });

  it('with black and white on, gives all three channels the luma of the pixel', () => {
    const raster: Raster = { width: 1, height: 1, data: new Uint8ClampedArray([255, 0, 0, 200]) };

    const result = applyAdjustments(raster, { ...NEUTRAL_ADJUSTMENTS, blackAndWhite: true });

    expect(Array.from(result.data)).toEqual([76, 76, 76, 200]);
  });

  it('with auto on, stretches the darkest and lightest levels to full range', () => {
    const raster = greyRaster([...Array<number>(100).fill(50), ...Array<number>(100).fill(200)]);

    const result = applyAdjustments(raster, { ...NEUTRAL_ADJUSTMENTS, auto: true });

    expect(result.data[0]).toBe(0);
    expect(result.data[(200 - 1) * 4]).toBe(255);
  });

  it('with sharpen, raises a bright centre above its flat neighbours', () => {
    const raster = greyRaster([100, 100, 100, 100, 120, 100, 100, 100, 100], 3);

    const result = applyAdjustments(raster, { ...NEUTRAL_ADJUSTMENTS, sharpen: 1 });

    expect(result.data[4 * 4]).toBe(200);
    expect(result.data[0]).toBe(100);
  });

  it('with neutral settings, leaves the source buffer untouched and returns a new one', () => {
    const raster = greyRaster([100]);

    const result = applyAdjustments(raster, NEUTRAL_ADJUSTMENTS);

    expect(result.data).not.toBe(raster.data);
    expect(Array.from(result.data)).toEqual(Array.from(raster.data));
  });
});

describe('autoLevels', () => {
  it('with a single flat level, keeps the full range instead of dividing by zero', () => {
    const raster = greyRaster([90, 90, 90]);

    const levels = autoLevels(raster.data);

    expect(levels).toEqual({ low: 0, high: 255 });
  });
});
