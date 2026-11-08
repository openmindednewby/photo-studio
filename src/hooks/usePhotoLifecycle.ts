import { useCallback, useState } from 'react';

import { StudioStatus } from './StudioStatus';
import { failureOf } from '../engine/PhotoEngineError';
import { PhotoEngineFailure } from '../engine/PhotoEngineFailure';
import { FilterPreset } from '../processing/FilterPreset';
import { NEUTRAL_EDITS } from '../processing/filterPresets';

import type { PhotoEngine } from '../engine/createPhotoEngine';
import type { BackgroundRemovalPort, BackgroundRemovalProgress, PhotoEdits } from '../types';

const BACKGROUND_TIMEOUT_MS = 60_000;

export interface PhotoLifecycleDeps {
  readonly engine: PhotoEngine;
  readonly edits: PhotoEdits;
  readonly backgroundRemoval?: BackgroundRemovalPort;
  readonly apply: (next: PhotoEdits) => void;
  readonly forget: () => void;
  readonly setPreset: (preset: FilterPreset | null) => void;
  readonly setFailure: (failure: string | null) => void;
  readonly resetEdits: () => void;
}

export interface PhotoLifecycle {
  readonly status: StudioStatus;
  readonly backgroundProgress: BackgroundRemovalProgress | null;
  readonly isBackgroundDownloaded: () => Promise<boolean>;
  readonly loadEpoch: number;
  readonly loadFile: (file: Blob) => Promise<void>;
  readonly removeBackground: () => Promise<void>;
  readonly clear: () => void;
}

async function cutoutOf(engine: PhotoEngine, edits: PhotoEdits, port: BackgroundRemovalPort, onProgress: (progress: BackgroundRemovalProgress) => void): Promise<Blob> {
  const controller = new AbortController();
  let timer = setTimeout(() => controller.abort(), BACKGROUND_TIMEOUT_MS);
  const report = (progress: BackgroundRemovalProgress): void => {
    clearTimeout(timer);
    timer = setTimeout(() => controller.abort(), BACKGROUND_TIMEOUT_MS);
    onProgress(progress);
  };
  const aborted = new Promise<never>((_resolve, reject) => {
    controller.signal.addEventListener('abort', () => reject(new Error(PhotoEngineFailure.TimedOut)), { once: true });
  });
  try {
    const photo = await engine.exportPng(edits);
    return await Promise.race([port.remove(photo, { signal: controller.signal, onProgress: report }), aborted]);
  } finally {
    clearTimeout(timer);
  }
}

export function usePhotoLifecycle(deps: PhotoLifecycleDeps): PhotoLifecycle {
  const { engine, edits, backgroundRemoval, apply, forget, setPreset, setFailure, resetEdits } = deps;
  const [status, setStatus] = useState(StudioStatus.Empty);
  const [backgroundProgress, setBackgroundProgress] = useState<BackgroundRemovalProgress | null>(null);
  const [loadEpoch, setLoadEpoch] = useState(0);

  const adopt = useCallback(() => {
    forget();
    setPreset(FilterPreset.Original);
    setLoadEpoch((epoch) => epoch + 1);
    apply(NEUTRAL_EDITS);
    setStatus(StudioStatus.Ready);
  }, [forget, setPreset, apply]);

  const loadFile = useCallback(
    async (file: Blob) => {
      setStatus(StudioStatus.Loading);
      setFailure(null);
      try {
        await engine.load(file);
        adopt();
      } catch (error) {
        setFailure(failureOf(error));
        setStatus(StudioStatus.Empty);
      }
    },
    [engine, adopt, setFailure],
  );

  const removeBackground = useCallback(async () => {
    if (backgroundRemoval === undefined) return;
    try {
      const cutout = await cutoutOf(engine, edits, backgroundRemoval, setBackgroundProgress);
      await engine.load(cutout);
      adopt();
    } catch {
      setFailure(PhotoEngineFailure.BackgroundFailed);
    } finally {
      setBackgroundProgress(null);
    }
  }, [backgroundRemoval, engine, edits, adopt, setFailure]);

  const isBackgroundDownloaded = useCallback(async () => (await backgroundRemoval?.isDownloaded?.()) ?? true, [backgroundRemoval]);

  const clear = useCallback(() => {
    forget();
    setFailure(null);
    resetEdits();
    setStatus(StudioStatus.Empty);
  }, [forget, setFailure, resetEdits]);

  return { status, backgroundProgress, isBackgroundDownloaded, loadEpoch, loadFile, removeBackground, clear };
}
