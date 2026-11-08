import { useCallback, useState } from 'react';

import { StudioStatus } from './StudioStatus';
import { failureOf } from '../engine/PhotoEngineError';
import { PhotoEngineFailure } from '../engine/PhotoEngineFailure';
import { FilterPreset } from '../processing/FilterPreset';
import { NEUTRAL_EDITS } from '../processing/filterPresets';

import type { PhotoEngine } from '../engine/createPhotoEngine';
import type { BackgroundRemovalPort, PhotoEdits } from '../types';

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
  readonly leftDevice: boolean;
  readonly loadEpoch: number;
  readonly loadFile: (file: Blob) => Promise<void>;
  readonly removeBackground: () => Promise<void>;
  readonly clear: () => void;
}

async function cutoutOf(engine: PhotoEngine, edits: PhotoEdits, port: BackgroundRemovalPort): Promise<Blob> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BACKGROUND_TIMEOUT_MS);
  const aborted = new Promise<never>((_resolve, reject) => {
    controller.signal.addEventListener('abort', () => reject(new Error(PhotoEngineFailure.TimedOut)), { once: true });
  });
  try {
    const photo = await engine.exportPng(edits);
    return await Promise.race([port.remove(photo, { signal: controller.signal }), aborted]);
  } finally {
    clearTimeout(timer);
  }
}

export function usePhotoLifecycle(deps: PhotoLifecycleDeps): PhotoLifecycle {
  const { engine, edits, backgroundRemoval, apply, forget, setPreset, setFailure, resetEdits } = deps;
  const [status, setStatus] = useState(StudioStatus.Empty);
  const [leftDevice, setLeftDevice] = useState(false);
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
        setLeftDevice(false);
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
      const cutout = await cutoutOf(engine, edits, backgroundRemoval);
      setLeftDevice(true);
      await engine.load(cutout);
      adopt();
    } catch {
      setFailure(PhotoEngineFailure.BackgroundFailed);
    }
  }, [backgroundRemoval, engine, edits, adopt, setFailure]);

  const clear = useCallback(() => {
    forget();
    setFailure(null);
    resetEdits();
    setLeftDevice(false);
    setStatus(StudioStatus.Empty);
  }, [forget, setFailure, resetEdits]);

  return { status, leftDevice, loadEpoch, loadFile, removeBackground, clear };
}
