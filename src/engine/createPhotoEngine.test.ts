import { createPhotoEngine } from './createPhotoEngine';
import { PhotoEngineError } from './PhotoEngineError';
import { PhotoEngineFailure } from './PhotoEngineFailure';
import { StudioRequestKind } from './StudioRequestKind';
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

describe('createPhotoEngine lifetime', () => {
  function restarting(): { first: FakeWorker; second: FakeWorker; engine: ReturnType<typeof createPhotoEngine> } {
    const first = new FakeWorker();
    const second = new FakeWorker();
    const spawn = jest.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    return { first, second, engine: createPhotoEngine(spawn as unknown as () => Worker) };
  }

  async function loadedThenCrashed(restart: ReturnType<typeof restarting>, file: Blob, maxSide: number): Promise<void> {
    const loading = restart.engine.load(file, maxSide);
    restart.first.answer({ id: restart.first.posted[0].id, ok: true, size: { width: 1, height: 1 } });
    await loading;
    restart.first.onerror?.();
  }

  it('after dispose, rejects a new job and spawns no worker', async () => {
    const { spawn, engine } = setup();
    engine.dispose();

    const pending = engine.render(NEUTRAL_EDITS);

    await expect(pending).rejects.toBeInstanceOf(PhotoEngineError);
    expect(spawn).not.toHaveBeenCalled();
  });

  it('when the worker dies after a load, gives its replacement the photo before the next job', async () => {
    const restart = restarting();
    const file = new Blob(['photo']);
    await loadedThenCrashed(restart, file, 900);

    const next = restart.engine.render(NEUTRAL_EDITS).catch(() => undefined);

    expect(restart.second.posted.map((request) => request.kind)).toEqual([StudioRequestKind.Load, StudioRequestKind.Render]);
    const replayed = restart.second.posted[0] as Extract<StudioRequest, { kind: StudioRequestKind.Load }>;
    expect(replayed.file).toBe(file);
    expect(replayed.maxSide).toBe(900);
    restart.engine.dispose();
    await next;
  });

  it('when the job after a restart is itself a load, sends only that load', async () => {
    const restart = restarting();
    await loadedThenCrashed(restart, new Blob(['old']), 900);

    const next = restart.engine.load(new Blob(['new'])).catch(() => undefined);

    expect(restart.second.posted.map((request) => request.kind)).toEqual([StudioRequestKind.Load]);
    restart.engine.dispose();
    await next;
  });
});
