import { useCallback } from 'react';

import { failureOf } from '../engine/PhotoEngineError';
import { PhotoEngineFailure } from '../engine/PhotoEngineFailure';
import { adjustmentsFor } from '../processing/filterPresets';
import { rotateQuadClockwise } from '../processing/quad';

import type { PhotoEngine } from '../engine/createPhotoEngine';
import type { FilterPreset } from '../processing/FilterPreset';
import type { Adjustments, PhotoEdits, Quad } from '../types';

export interface EditActionDeps {
  readonly engine: PhotoEngine;
  readonly edits: PhotoEdits;
  readonly apply: (next: PhotoEdits) => void;
  readonly setPreset: (preset: FilterPreset | null) => void;
  readonly setFailure: (failure: string | null) => void;
}

export interface EditActions {
  readonly rotate: () => void;
  readonly setQuad: (quad: Quad) => void;
  readonly findEdges: () => Promise<void>;
  readonly setAdjustments: (adjustments: Adjustments) => void;
  readonly applyPreset: (preset: FilterPreset) => void;
}

export function useEditActions({ engine, edits, apply, setPreset, setFailure }: EditActionDeps): EditActions {
  const rotate = useCallback(() => {
    apply({ ...edits, quarterTurns: edits.quarterTurns + 1, quad: edits.quad === null ? null : rotateQuadClockwise(edits.quad) });
  }, [apply, edits]);

  const setQuad = useCallback((quad: Quad) => apply({ ...edits, quad }), [apply, edits]);

  const findEdges = useCallback(async () => {
    try {
      const quad = await engine.detectEdges(edits.quarterTurns);
      if (quad === null) setFailure(PhotoEngineFailure.NoEdges);
      else apply({ ...edits, quad });
    } catch (error) {
      setFailure(failureOf(error));
    }
  }, [engine, apply, edits, setFailure]);

  const setAdjustments = useCallback(
    (adjustments: Adjustments) => {
      setPreset(null);
      apply({ ...edits, adjustments });
    },
    [apply, edits, setPreset],
  );

  const applyPreset = useCallback(
    (next: FilterPreset) => {
      setPreset(next);
      apply({ ...edits, adjustments: adjustmentsFor(next) });
    },
    [apply, edits, setPreset],
  );

  return { rotate, setQuad, findEdges, setAdjustments, applyPreset };
}
