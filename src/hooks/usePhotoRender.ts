import { useCallback, useMemo, useRef, useState } from 'react';

import { createLatestRunner } from './createLatestRunner';
import { failureOf } from '../engine/PhotoEngineError';

import type { PhotoEngine } from '../engine/createPhotoEngine';
import type { PhotoEdits, Raster } from '../types';

export interface RenderedPhoto {
  readonly view: Raster;
  readonly output: Raster;
}

interface RenderJob {
  readonly edits: PhotoEdits;
  readonly generation: number;
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
  const generation = useRef(0);
  const outputCallback = useRef(onOutput);
  outputCallback.current = onOutput;

  const runner = useMemo(
    () =>
      createLatestRunner<RenderJob>(async (job) => {
        const { edits } = job;
        const isStale = (): boolean => job.generation !== generation.current;
        if (isStale()) return;
        try {
          const key = viewKeyOf(edits);
          const view = cache.current?.key === key ? cache.current.raster : await engine.render({ ...edits, quad: null });
          if (isStale()) return;
          cache.current = { key, raster: view };
          const output = edits.quad === null ? view : await engine.render(edits);
          if (isStale()) return;
          setRendered({ view, output });
          outputCallback.current?.(output);
        } catch (error) {
          if (!isStale()) onFailure(failureOf(error));
        }
      }),
    [engine, onFailure],
  );

  const request = useCallback((edits: PhotoEdits) => runner.request({ edits, generation: generation.current }), [runner]);

  const forget = useCallback(() => {
    generation.current += 1;
    cache.current = null;
    setRendered(null);
  }, []);

  return { rendered, request, forget };
}
