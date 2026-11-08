import { act, renderHook, waitFor } from '@testing-library/react';

import { usePhotoRender } from './usePhotoRender';
import { PhotoEngineError } from '../engine/PhotoEngineError';
import { PhotoEngineFailure } from '../engine/PhotoEngineFailure';
import { NEUTRAL_EDITS } from '../processing/filterPresets';

import type { PhotoEngine } from '../engine/createPhotoEngine';
import type { Raster } from '../types';

const RASTER: Raster = { width: 1, height: 1, data: new Uint8ClampedArray(4) };
const NEXT_RASTER: Raster = { width: 2, height: 1, data: new Uint8ClampedArray(8) };
const OTHER_EDITS = { ...NEUTRAL_EDITS, quarterTurns: 1 };

interface Harness {
  readonly render: jest.Mock;
  readonly onOutput: jest.Mock;
  readonly onFailure: jest.Mock;
  readonly finish: (index: number, raster: Raster) => Promise<void>;
  readonly fail: (index: number) => Promise<void>;
  readonly hook: { readonly current: ReturnType<typeof usePhotoRender> };
}

function harness(): Harness {
  const runs: Array<{ resolve: (raster: Raster) => void; reject: (error: Error) => void }> = [];
  const render = jest.fn(() => new Promise<Raster>((resolve, reject) => runs.push({ resolve, reject })));
  const onOutput = jest.fn();
  const onFailure = jest.fn();
  const engine = { render } as unknown as PhotoEngine;
  const { result } = renderHook(() => usePhotoRender(engine, onOutput, onFailure));
  return {
    render,
    onOutput,
    onFailure,
    hook: result,
    finish: (index, raster) => act(async () => runs[index].resolve(raster)),
    fail: (index) => act(async () => runs[index].reject(new PhotoEngineError(PhotoEngineFailure.RenderFailed))),
  };
}

describe('usePhotoRender', () => {
  it('when forget lands during a render, drops that render', async () => {
    const run = harness();
    act(() => run.hook.current.request(NEUTRAL_EDITS));
    act(() => run.hook.current.forget());

    await run.finish(0, RASTER);

    expect(run.hook.current.rendered).toBeNull();
    expect(run.onOutput).not.toHaveBeenCalled();
  });

  it('when forget lands during a render that then fails, reports no failure', async () => {
    const run = harness();
    act(() => run.hook.current.request(NEUTRAL_EDITS));
    act(() => run.hook.current.forget());

    await run.fail(0);

    expect(run.onFailure).not.toHaveBeenCalled();
  });

  it('with a request queued before forget, never renders the queued edits', async () => {
    const run = harness();
    act(() => run.hook.current.request(NEUTRAL_EDITS));
    act(() => run.hook.current.request(OTHER_EDITS));
    act(() => run.hook.current.forget());

    await run.finish(0, RASTER);

    expect(run.render).toHaveBeenCalledTimes(1);
  });

  it('with a request after forget, renders and hands over that new result', async () => {
    const run = harness();
    act(() => run.hook.current.request(NEUTRAL_EDITS));
    act(() => run.hook.current.forget());
    act(() => run.hook.current.request(OTHER_EDITS));
    await run.finish(0, RASTER);
    await waitFor(() => expect(run.render).toHaveBeenCalledTimes(2));

    await run.finish(1, NEXT_RASTER);

    expect(run.onOutput).toHaveBeenCalledTimes(1);
    expect(run.onOutput).toHaveBeenCalledWith(NEXT_RASTER);
  });
});
