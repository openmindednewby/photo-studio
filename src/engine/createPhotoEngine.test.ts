import { createPhotoEngine } from './createPhotoEngine';
import { PhotoEngineError } from './PhotoEngineError';
import { PhotoEngineFailure } from './PhotoEngineFailure';
import { NEUTRAL_EDITS } from '../processing/filterPresets';

import type { StudioRequest, StudioResponse } from './protocol';

class FakeWorker {
  public onmessage: ((event: MessageEvent<StudioResponse>) => void) | null = null;
  public onerror: (() => void) | null = null;
  public onmessageerror: (() => void) | null = null;
  public terminated = false;
  public posted: StudioRequest[] = [];

  public postMessage(request: StudioRequest): void {
    this.posted.push(request);
  }

  public terminate(): void {
    this.terminated = true;
  }

  public answer(response: StudioResponse): void {
    this.onmessage?.({ data: response } as MessageEvent<StudioResponse>);
  }
}

function setup(timeoutMs?: number): { fake: FakeWorker; spawn: jest.Mock; engine: ReturnType<typeof createPhotoEngine> } {
  const fake = new FakeWorker();
  const spawn = jest.fn(() => fake as unknown as Worker);
  return { fake, spawn, engine: createPhotoEngine(spawn, { timeoutMs }) };
}

describe('createPhotoEngine', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('when the worker answers failure, rejects with that named reason', async () => {
    const { fake, engine } = setup();
    const pending = engine.load(new Blob());

    fake.answer({ id: fake.posted[0].id, ok: false, failure: 'memory' });

    await expect(pending).rejects.toMatchObject({ failure: 'memory' });
  });

  it('when the worker dies mid-job, rejects and spawns a fresh one for the next job', async () => {
    const { fake, spawn, engine } = setup();
    const pending = engine.render(NEUTRAL_EDITS);

    fake.onerror?.();

    await expect(pending).rejects.toBeInstanceOf(PhotoEngineError);
    const next = engine.render(NEUTRAL_EDITS).catch(() => undefined);
    expect(fake.terminated).toBe(true);
    expect(spawn).toHaveBeenCalledTimes(2);
    engine.dispose();
    await next;
  });

  it('when a job outlives the time limit, rejects as timed out and stops the worker', async () => {
    jest.useFakeTimers();
    const { fake, engine } = setup(1_000);
    const pending = engine.render(NEUTRAL_EDITS);

    jest.advanceTimersByTime(1_000);

    await expect(pending).rejects.toMatchObject({ failure: PhotoEngineFailure.TimedOut });
    expect(fake.terminated).toBe(true);
  });

  it('with two jobs in flight, matches each answer to its own request by id', async () => {
    const { fake, engine } = setup();
    const first = engine.detectEdges(0);
    const second = engine.detectEdges(1);
    const quad = { topLeft: { x: 0, y: 0 }, topRight: { x: 1, y: 0 }, bottomRight: { x: 1, y: 1 }, bottomLeft: { x: 0, y: 1 } };

    fake.answer({ id: fake.posted[1].id, ok: true, quad });
    fake.answer({ id: fake.posted[0].id, ok: true, quad: null });

    await expect(first).resolves.toBeNull();
    await expect(second).resolves.toEqual(quad);
  });
});
