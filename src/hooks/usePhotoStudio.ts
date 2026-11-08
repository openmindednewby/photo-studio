import { useCallback, useState } from 'react';

import { StudioStatus } from './StudioStatus';
import { useEditActions } from './useEditActions';
import { useFilterPreviews } from './useFilterPreviews';
import { usePhotoLifecycle } from './usePhotoLifecycle';
import { usePhotoRender } from './usePhotoRender';
import { FilterPreset } from '../processing/FilterPreset';
import { NEUTRAL_EDITS } from '../processing/filterPresets';

import type { EditActions } from './useEditActions';
import type { FilterPreviews } from './useFilterPreviews';
import type { PhotoLifecycle } from './usePhotoLifecycle';
import type { PhotoEngine } from '../engine/createPhotoEngine';
import type { BackgroundRemovalPort, PhotoEdits, Raster } from '../types';

export interface UsePhotoStudioOptions {
  readonly engine: PhotoEngine;
  readonly backgroundRemoval?: BackgroundRemovalPort;
  readonly onOutput?: (output: Raster) => void;
}

export interface PhotoStudioController extends EditActions, Omit<PhotoLifecycle, 'loadEpoch'> {
  readonly failure: string | null;
  readonly edits: PhotoEdits;
  readonly preset: FilterPreset | null;
  readonly view: Raster | null;
  readonly output: Raster | null;
  readonly previews: FilterPreviews;
}

export function usePhotoStudio({ engine, backgroundRemoval, onOutput }: UsePhotoStudioOptions): PhotoStudioController {
  const [failure, setFailure] = useState<string | null>(null);
  const [edits, setEdits] = useState(NEUTRAL_EDITS);
  const [preset, setPreset] = useState<FilterPreset | null>(FilterPreset.Original);
  const { rendered, request, forget } = usePhotoRender(engine, onOutput, setFailure);

  const apply = useCallback(
    (next: PhotoEdits) => {
      setEdits(next);
      setFailure(null);
      request(next);
    },
    [request],
  );
  const resetEdits = useCallback(() => setEdits(NEUTRAL_EDITS), []);
  const lifecycle = usePhotoLifecycle({ engine, edits, backgroundRemoval, apply, forget, setPreset, setFailure, resetEdits });
  const actions = useEditActions({ engine, edits, apply, setPreset, setFailure });
  const previews = useFilterPreviews(engine, edits, lifecycle.status === StudioStatus.Ready ? lifecycle.loadEpoch : null);

  return { ...lifecycle, ...actions, failure, edits, preset, view: rendered?.view ?? null, output: rendered?.output ?? null, previews };
}
