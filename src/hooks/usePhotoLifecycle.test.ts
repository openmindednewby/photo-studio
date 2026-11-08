import { act, renderHook } from '@testing-library/react';

import { usePhotoLifecycle } from './usePhotoLifecycle';
import { PhotoEngineFailure } from '../engine/PhotoEngineFailure';
import { NEUTRAL_EDITS } from '../processing/filterPresets';

import type { PhotoEngine } from '../engine/createPhotoEngine';
import type { BackgroundRemovalPort, BackgroundRemovalProgress } from '../types';

const HALF: BackgroundRemovalProgress = { loadedBytes: 5, totalBytes: 10 };

function setup(port?: BackgroundRemovalPort): { hook: ReturnType<typeof renderHook<ReturnType<typeof usePhotoLifecycle>, unknown>>; setFailure: jest.Mock } {
  const setFailure = jest.fn();
  const engine = { exportPng: jest.fn().mockResolvedValue(new Blob()), load: jest.fn().mockResolvedValue(undefined) } as unknown as PhotoEngine;
  const hook = renderHook(() => usePhotoLifecycle({ engine, edits: NEUTRAL_EDITS, backgroundRemoval: port, apply: jest.fn(), forget: jest.fn(), setPreset: jest.fn(), setFailure, resetEdits: jest.fn() }));
  return { hook, setFailure };
}

function hangingPort(): { port: BackgroundRemovalPort; report: (progress: BackgroundRemovalProgress) => void } {
  let listener: ((progress: BackgroundRemovalProgress) => void) | undefined;
  const port: BackgroundRemovalPort = {
    remove: (_photo, options) => {
      listener = options.onProgress;
      return new Promise<Blob>(() => undefined);
    },
  };
  return { port, report: (progress) => listener?.(progress) };
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('usePhotoLifecycle.removeBackground', () => {
  it('while the port downloads, exposes the latest progress', async () => {
    const { port, report } = hangingPort();
    const { hook } = setup(port);
    await act(async () => {
      void hook.result.current.removeBackground();
      await jest.advanceTimersByTimeAsync(0);
    });

    act(() => report(HALF));

    expect(hook.result.current.backgroundProgress).toEqual(HALF);
  });

  it('when the cut ends, clears the progress', async () => {
    const port: BackgroundRemovalPort = {
      remove: (_photo, options) => {
        options.onProgress?.(HALF);
        return Promise.resolve(new Blob());
      },
    };
    const { hook } = setup(port);

    await act(() => hook.result.current.removeBackground());

    expect(hook.result.current.backgroundProgress).toBeNull();
  });

  it('with progress still arriving past the limit, keeps waiting', async () => {
    const { port, report } = hangingPort();
    const { hook, setFailure } = setup(port);

    await act(async () => {
      void hook.result.current.removeBackground();
      await jest.advanceTimersByTimeAsync(59_000);
      report(HALF);
      await jest.advanceTimersByTimeAsync(59_000);
    });

    expect(setFailure).not.toHaveBeenCalledWith(PhotoEngineFailure.BackgroundFailed);
  });

  it('when progress stops for the whole limit, names the failure', async () => {
    const { port, report } = hangingPort();
    const { hook, setFailure } = setup(port);

    await act(async () => {
      void hook.result.current.removeBackground();
      await jest.advanceTimersByTimeAsync(59_000);
      report(HALF);
      await jest.advanceTimersByTimeAsync(60_000);
    });

    expect(setFailure).toHaveBeenCalledWith(PhotoEngineFailure.BackgroundFailed);
  });
});

describe('usePhotoLifecycle.isBackgroundDownloaded', () => {
  it('with a port that has nothing to download, is true', async () => {
    const { hook } = setup({ remove: jest.fn() });

    const downloaded = await hook.result.current.isBackgroundDownloaded();

    expect(downloaded).toBe(true);
  });

  it('with a port still missing its assets, is false', async () => {
    const { hook } = setup({ remove: jest.fn(), isDownloaded: () => Promise.resolve(false) });

    const downloaded = await hook.result.current.isBackgroundDownloaded();

    expect(downloaded).toBe(false);
  });
});
