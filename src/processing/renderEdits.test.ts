import { NEUTRAL_EDITS } from './filterPresets';
import { renderEdits } from './renderEdits';

import type { Raster } from '../types';

describe('renderEdits', () => {
  it('with a neutral edit, returns a copy so the source can never be transferred away', () => {
    const source: Raster = { width: 1, height: 1, data: new Uint8ClampedArray([1, 2, 3, 255]) };

    const result = renderEdits(source, NEUTRAL_EDITS);

    expect(result.data).not.toBe(source.data);
  });

  it('with a turn and a crop, applies the crop on the turned photo', () => {
    const source: Raster = { width: 2, height: 1, data: new Uint8ClampedArray([10, 0, 0, 255, 20, 0, 0, 255]) };
    const topOfTurned = { topLeft: { x: 0, y: 0 }, topRight: { x: 1, y: 0 }, bottomRight: { x: 1, y: 0 }, bottomLeft: { x: 0, y: 0 } };

    const result = renderEdits(source, { ...NEUTRAL_EDITS, quarterTurns: 1, quad: topOfTurned });

    expect([result.width, result.height]).toEqual([1, 1]);
    expect(result.data[0]).toBe(10);
  });
});
