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

interface JobTable {
  nextId(): number;
  add(id: number, job: PendingJob): void;
  settle(response: StudioResponse): void;
  rejectAll(failure: PhotoEngineFailure): void;
}

interface LoadedSource {
  readonly file: Blob;
  readonly maxSide: number | undefined;
}

type RequestBody = { [K in StudioRequest['kind']]: Omit<Extract<StudioRequest, { kind: K }>, 'id'> }[StudioRequest['kind']];

function wireWorker(worker: Worker, settle: (response: StudioResponse) => void, crash: () => void): void {
  worker.onmessage = (event: MessageEvent<StudioResponse>): void => settle(event.data);
  worker.onerror = crash;
  worker.onmessageerror = crash;
}

function createJobTable(): JobTable {
  const pending = new Map<number, PendingJob>();
  let lastId = 0;

  return {
    nextId: () => {
      lastId += 1;
      return lastId;
    },
    add: (id, job) => {
      pending.set(id, job);
    },
    settle: (response) => {
      const job = pending.get(response.id);
      if (job === undefined) return;
      pending.delete(response.id);
      clearTimeout(job.timer);
      if (response.ok) job.resolve(response);
      else job.reject(new PhotoEngineError(response.failure));
    },
    rejectAll: (failure) => {
      pending.forEach((job) => {
        clearTimeout(job.timer);
        job.reject(new PhotoEngineError(failure));
      });
      pending.clear();
    },
  };
}

export function createPhotoEngine(spawn: () => Worker, options: PhotoEngineOptions = {}): PhotoEngine {
  const timeoutMs = options.timeoutMs ?? DEFAULT_JOB_TIMEOUT_MS;
  const jobs = createJobTable();
  let worker: Worker | null = null;
  let source: LoadedSource | null = null;
  let disposed = false;

  const failEverything = (failure: PhotoEngineFailure): void => {
    worker?.terminate();
    worker = null;
    jobs.rejectAll(failure);
  };

  const ensureWorker = (next: RequestBody): Worker => {
    if (worker !== null) return worker;
    const created = spawn();
    wireWorker(created, jobs.settle, () => failEverything(PhotoEngineFailure.WorkerFailed));
    worker = created;
    if (source !== null && next.kind !== StudioRequestKind.Load) created.postMessage({ kind: StudioRequestKind.Load, ...source, id: jobs.nextId() });
    return created;
  };

  const send = (body: RequestBody): Promise<StudioSuccess> =>
    new Promise((resolve, reject) => {
      if (disposed) {
        reject(new PhotoEngineError(PhotoEngineFailure.WorkerFailed));
        return;
      }
      const id = jobs.nextId();
      const timer = setTimeout(() => failEverything(PhotoEngineFailure.TimedOut), timeoutMs);
      jobs.add(id, { resolve, reject, timer });
      ensureWorker(body).postMessage({ ...body, id });
    });

  return {
    load: async (file, maxSide) => {
      const { size } = await send({ kind: StudioRequestKind.Load, file, maxSide });
      source = { file, maxSide };
      return size as Size;
    },
    render: async (edits, maxSide) => (await send({ kind: StudioRequestKind.Render, edits, maxSide })).raster as Raster,
    detectEdges: async (quarterTurns) => (await send({ kind: StudioRequestKind.Detect, quarterTurns })).quad ?? null,
    exportPng: async (edits) => (await send({ kind: StudioRequestKind.Export, edits })).blob as Blob,
    dispose: () => {
      disposed = true;
      source = null;
      failEverything(PhotoEngineFailure.WorkerFailed);
    },
  };
}
