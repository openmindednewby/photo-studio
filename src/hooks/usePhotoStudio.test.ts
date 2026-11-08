import { act, renderHook, waitFor } from '@testing-library/react';

import { StudioStatus } from './StudioStatus';
import { usePhotoStudio } from './usePhotoStudio';
import { PhotoEngineError } from '../engine/PhotoEngineError';
import { PhotoEngineFailure } from '../engine/PhotoEngineFailure';
import { FilterPreset } from '../processing/FilterPreset';
import { adjustmentsFor } from '../processing/filterPresets';
import { insetQuad } from '../processing/quad';

import type { PhotoEngine } from '../engine/createPhotoEngine';
import type { BackgroundRemovalPort, Raster } from '../types';

const RASTER: Raster = { width: 2, height: 2, data: new Uint8ClampedArray(16) };

function fakeEngine(overrides: Partial<PhotoEngine> = {}): jest.Mocked<PhotoEngine> {
  return {
    load: jest.fn().mockResolvedValue({ width: 2, height: 2 }),
    render: jest.fn().mockResolvedValue(RASTER),
    detectEdges: jest.fn().mockResolvedValue(insetQuad(0.1)),
    exportPng: jest.fn().mockResolvedValue(new Blob(['png'])),
    dispose: jest.fn(),
    ...overrides,
  } as jest.Mocked<PhotoEngine>;
}

async function loaded(engine: PhotoEngine, port?: BackgroundRemovalPort, onOutput?: (r: Raster) => void) {
  const hook = renderHook(() => usePhotoStudio({ engine, backgroundRemoval: port, onOutput }));
  await act(() => hook.result.current.loadFile(new Blob(['photo'])));
  await waitFor(() => expect(hook.result.current.output).not.toBeNull());
  return hook;
}

describe('usePhotoStudio', () => {
  it('after a good load, is ready and hands the output to the consumer', async () => {
    const onOutput = jest.fn();

    const { result } = await loaded(fakeEngine(), undefined, onOutput);

    expect(result.current.status).toBe(StudioStatus.Ready);
    expect(onOutput).toHaveBeenCalledWith(RASTER);
  });

  it('when decode fails, returns to empty and exposes the named reason', async () => {
    const engine = fakeEngine({ load: jest.fn().mockRejectedValue(new PhotoEngineError('memory')) });
    const { result } = renderHook(() => usePhotoStudio({ engine }));

    await act(() => result.current.loadFile(new Blob()));

    expect(result.current.status).toBe(StudioStatus.Empty);
    expect(result.current.failure).toBe('memory');
  });

  it('on rotate, adds a quarter turn and re-renders', async () => {
    const engine = fakeEngine();
    const { result } = await loaded(engine);
    const rendersBefore = engine.render.mock.calls.length;

    act(() => result.current.rotate());

    await waitFor(() => expect(engine.render.mock.calls.length).toBeGreaterThan(rendersBefore));
    expect(result.current.edits.quarterTurns).toBe(1);
  });

  it('on find edges with no result, reports no-edges and keeps the current quad', async () => {
    const engine = fakeEngine({ detectEdges: jest.fn().mockResolvedValue(null) });
    const { result } = await loaded(engine);

    await act(() => result.current.findEdges());

    expect(result.current.failure).toBe(PhotoEngineFailure.NoEdges);
    expect(result.current.edits.quad).toBeNull();
  });

  it('on find edges with a result, adopts the suggested corners', async () => {
    const { result } = await loaded(fakeEngine());

    await act(() => result.current.findEdges());

    expect(result.current.edits.quad).toEqual(insetQuad(0.1));
  });

  it('on a preset, sets its adjustments and marks it selected', async () => {
    const { result } = await loaded(fakeEngine());

    act(() => result.current.applyPreset(FilterPreset.Scan));

    expect(result.current.edits.adjustments).toEqual(adjustmentsFor(FilterPreset.Scan));
    expect(result.current.preset).toBe(FilterPreset.Scan);
  });

  it('with a manual adjustment, clears the selected preset', async () => {
    const { result } = await loaded(fakeEngine());

    act(() => result.current.setAdjustments({ ...result.current.edits.adjustments, brightness: 0.1 }));

    expect(result.current.preset).toBeNull();
  });

  it('with normal editing, never calls the background port', async () => {
    const port: BackgroundRemovalPort = { remove: jest.fn() };
    const { result } = await loaded(fakeEngine(), port);

    act(() => result.current.rotate());
    act(() => result.current.applyPreset(FilterPreset.Bright));
    await act(() => result.current.findEdges());

    expect(port.remove).not.toHaveBeenCalled();
  });

  it('on remove background, sends the edited photo and loads the cutout it returns', async () => {
    const cutout = new Blob(['cutout']);
    const port: BackgroundRemovalPort = { remove: jest.fn().mockResolvedValue(cutout) };
    const engine = fakeEngine();
    const { result } = await loaded(engine, port);

    await act(() => result.current.removeBackground());

    expect(port.remove).toHaveBeenCalledTimes(1);
    expect(engine.load).toHaveBeenLastCalledWith(cutout);
    expect(result.current.leftDevice).toBe(true);
  });

  it('when the background port fails, keeps the photo and names the failure', async () => {
    const port: BackgroundRemovalPort = { remove: jest.fn().mockRejectedValue(new Error('down')) };
    const { result } = await loaded(fakeEngine(), port);

    await act(() => result.current.removeBackground());

    expect(result.current.failure).toBe(PhotoEngineFailure.BackgroundFailed);
    expect(result.current.status).toBe(StudioStatus.Ready);
    expect(result.current.leftDevice).toBe(false);
  });

  it('when the background port never answers, gives up at the time limit and names the failure', async () => {
    const port: BackgroundRemovalPort = { remove: jest.fn(() => new Promise<Blob>(() => undefined)) };
    const { result } = await loaded(fakeEngine(), port);
    jest.useFakeTimers();

    await act(async () => {
      const pending = result.current.removeBackground();
      await jest.advanceTimersByTimeAsync(60_000);
      await pending;
    });
    jest.useRealTimers();

    expect(result.current.failure).toBe(PhotoEngineFailure.BackgroundFailed);
  });
});
