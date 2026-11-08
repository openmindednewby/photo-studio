import { useCallback, useMemo, useRef, useState } from 'react';

import { createLatestRunner } from './createLatestRunner';
import { failureOf } from '../engine/PhotoEngineError';

import type { PhotoEngine } from '../engine/createPhotoEngine';
import type { PhotoEdits, Raster } from '../types';

export interface RenderedPhoto {
  readonly view: Raster;
  readonly output: Raster;
}

interface CachedView {
  readonly key: string;
  readonly raster: Raster;
}

function viewKeyOf(edits: PhotoEdits): string {
  return JSON.stringify([edits.quarterTurns, edits.adjustments]);
}

export function usePhotoRender(
  engine: PhotoEngine,
  onOutput: ((output: Raster) => void) | undefined,
  onFailure: (failure: string) => void,
): { rendered: RenderedPhoto | null; request: (edits: PhotoEdits) => void; forget: () => void } {
  const [rendered, setRendered] = useState<RenderedPhoto | null>(null);
  const cache = useRef<CachedView | null>(null);
  const outputCallback = useRef(onOutput);
  outputCallback.current = onOutput;

  const runner = useMemo(
    () =>
      createLatestRunner<PhotoEdits>(async (edits) => {
        try {
          const key = viewKeyOf(edits);
          const view = cache.current?.key === key ? cache.current.raster : await engine.render({ ...edits, quad: null });
          cache.current = { key, raster: view };
          const output = edits.quad === null ? view : await engine.render(edits);
          setRendered({ view, output });
          outputCallback.current?.(output);
        } catch (error) {
          onFailure(failureOf(error));
        }
      }),
    [engine, onFailure],
  );

  const forget = useCallback(() => {
    cache.current = null;
    setRendered(null);
  }, []);

  return { rendered, request: runner.request, forget };
}
