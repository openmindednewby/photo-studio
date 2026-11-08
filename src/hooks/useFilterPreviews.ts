import { useEffect, useState } from 'react';

import { adjustmentsFor, FILTER_PRESETS } from '../processing/filterPresets';

import type { PhotoEngine } from '../engine/createPhotoEngine';
import type { FilterPreset } from '../processing/FilterPreset';
import type { PhotoEdits, Raster } from '../types';

const THUMBNAIL_SIDE = 160;

export type FilterPreviews = Partial<Record<FilterPreset, Raster>>;

export function useFilterPreviews(engine: PhotoEngine, edits: PhotoEdits, loadEpoch: number | null): FilterPreviews {
  const [previews, setPreviews] = useState<FilterPreviews>({});
  const { quarterTurns, quad } = edits;

  useEffect(() => {
    if (loadEpoch === null) {
      setPreviews({});
      return undefined;
    }
    let cancelled = false;
    const renderAll = async (): Promise<void> => {
      for (const preset of FILTER_PRESETS) {
        const raster = await engine.render({ quarterTurns, quad, adjustments: adjustmentsFor(preset) }, THUMBNAIL_SIDE);
        if (cancelled) return;
        setPreviews((current) => ({ ...current, [preset]: raster }));
      }
    };
    void renderAll().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [engine, loadEpoch, quarterTurns, quad]);

  return previews;
}
