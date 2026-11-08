import { applyAdjustments } from './adjust';
import { rotateRaster } from './geometry';
import { warpQuad } from './perspective';

import type { PhotoEdits, Raster } from '../types';

export function renderEdits(source: Raster, edits: PhotoEdits): Raster {
  const turned = rotateRaster(source, edits.quarterTurns);
  const framed = edits.quad === null ? turned : warpQuad(turned, edits.quad);
  return applyAdjustments(framed, edits.adjustments);
}
