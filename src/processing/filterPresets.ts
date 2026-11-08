import { FilterPreset } from './FilterPreset';

import type { Adjustments, PhotoEdits } from '../types';

export const NEUTRAL_ADJUSTMENTS: Adjustments = { brightness: 0, contrast: 0, sharpen: 0, auto: false, blackAndWhite: false };
export const NEUTRAL_EDITS: PhotoEdits = { quarterTurns: 0, quad: null, adjustments: NEUTRAL_ADJUSTMENTS };
export const FILTER_PRESETS: readonly FilterPreset[] = [
  FilterPreset.Scan,
  FilterPreset.Original,
  FilterPreset.Bright,
  FilterPreset.BlackAndWhite,
];

const SCAN_CONTRAST = 0.15;
const SCAN_SHARPEN = 0.3;
const BRIGHT_BRIGHTNESS = 0.15;
const BRIGHT_CONTRAST = 0.05;

export function adjustmentsFor(preset: FilterPreset): Adjustments {
  switch (preset) {
    case FilterPreset.Scan:
      return { ...NEUTRAL_ADJUSTMENTS, auto: true, contrast: SCAN_CONTRAST, sharpen: SCAN_SHARPEN };
    case FilterPreset.Bright:
      return { ...NEUTRAL_ADJUSTMENTS, brightness: BRIGHT_BRIGHTNESS, contrast: BRIGHT_CONTRAST };
    case FilterPreset.BlackAndWhite:
      return { ...NEUTRAL_ADJUSTMENTS, auto: true, blackAndWhite: true };
    default:
      return NEUTRAL_ADJUSTMENTS;
  }
}
