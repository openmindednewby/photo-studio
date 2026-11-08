import { PhotoEngineError } from './PhotoEngineError';
import { PhotoEngineFailure } from './PhotoEngineFailure';
import { StudioRequestKind } from './StudioRequestKind';

import type { StudioRequest, StudioResponse, StudioSuccess } from './protocol';
import type { PhotoEdits, Quad, Raster, Size } from '../types';

export const DEFAULT_JOB_TIMEOUT_MS = 30_000;

export interface PhotoEngine {
  load(file: Blob, maxSide?: number): Promise<Size>;
  render(edits: PhotoEdits, maxSide?: number): Promise<Raster>;
  detectEdges(quarterTurns: number): Promise<Quad | null>;
  exportPng(edits: PhotoEdits): Promise<Blob>;
  dispose(): void;
}

export interface PhotoEngineOptions {
  readonly timeoutMs?: number;
}

interface PendingJob {
  readonly resolve: (response: StudioSuccess) => void;
  readonly reject: (error: PhotoEngineError) => void;
  readonly timer: ReturnType<typeof setTimeout>;
}

type RequestBody = { [K in StudioRequest['kind']]: Omit<Extract<StudioRequest, { kind: K }>, 'id'> }[StudioRequest['kind']];

function wireWorker(worker: Worker, settle: (response: StudioResponse) => void, crash: () => void): void {
  worker.onmessage = (event: MessageEvent<StudioResponse>): void => settle(event.data);
  worker.onerror = crash;
  worker.onmessageerror = crash;
}

export function createPhotoEngine(spawn: () => Worker, options: PhotoEngineOptions = {}): PhotoEngine {
  const timeoutMs = options.timeoutMs ?? DEFAULT_JOB_TIMEOUT_MS;
  const pending = new Map<number, PendingJob>();
  let worker: Worker | null = null;
  let nextId = 1;

  const failEverything = (failure: PhotoEngineFailure): void => {
    worker?.terminate();
    worker = null;
    pending.forEach((job) => {
      clearTimeout(job.timer);
      job.reject(new PhotoEngineError(failure));
    });
    pending.clear();
  };

  const settle = (response: StudioResponse): void => {
    const job = pending.get(response.id);
    if (job === undefined) return;
    pending.delete(response.id);
    clearTimeout(job.timer);
    if (response.ok) job.resolve(response);
    else job.reject(new PhotoEngineError(response.failure));
  };

  const ensureWorker = (): Worker => {
    if (worker !== null) return worker;
    const created = spawn();
    wireWorker(created, settle, () => failEverything(PhotoEngineFailure.WorkerFailed));
    worker = created;
    return created;
  };

  const send = (body: RequestBody): Promise<StudioSuccess> =>
    new Promise((resolve, reject) => {
      const id = nextId;
      nextId += 1;
      const timer = setTimeout(() => failEverything(PhotoEngineFailure.TimedOut), timeoutMs);
      pending.set(id, { resolve, reject, timer });
      ensureWorker().postMessage({ ...body, id });
    });

  return {
    load: async (file, maxSide) => (await send({ kind: StudioRequestKind.Load, file, maxSide })).size as Size,
    render: async (edits, maxSide) => (await send({ kind: StudioRequestKind.Render, edits, maxSide })).raster as Raster,
    detectEdges: async (quarterTurns) => (await send({ kind: StudioRequestKind.Detect, quarterTurns })).quad ?? null,
    exportPng: async (edits) => (await send({ kind: StudioRequestKind.Export, edits })).blob as Blob,
    dispose: () => failEverything(PhotoEngineFailure.WorkerFailed),
  };
}
