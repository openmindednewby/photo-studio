import { failureOf, PhotoEngineError } from './PhotoEngineError';
import { PhotoEngineFailure } from './PhotoEngineFailure';
import { StudioRequestKind } from './StudioRequestKind';
import { detectEdges } from '../processing/detectEdges';
import { downscale, rotateRaster } from '../processing/geometry';
import { renderEdits } from '../processing/renderEdits';

import type { StudioRequest, StudioResponse, StudioSuccess } from './protocol';
import type { Raster } from '../types';

export interface StudioImageOps {
  decode(file: Blob, maxSide?: number): Promise<Raster>;
  encodePng(raster: Raster): Promise<Blob>;
}

export interface StudioSession {
  handle(request: StudioRequest): Promise<StudioResponse>;
}

export function createStudioSession(ops: StudioImageOps): StudioSession {
  let source: Raster | null = null;

  const requireSource = (): Raster => {
    if (source === null) throw new PhotoEngineError(PhotoEngineFailure.NoPhoto);
    return source;
  };

  const run = async (request: StudioRequest): Promise<StudioSuccess> => {
    switch (request.kind) {
      case StudioRequestKind.Load: {
        const decoded = await ops.decode(request.file, request.maxSide);
        source = decoded;
        return { id: request.id, ok: true, size: { width: decoded.width, height: decoded.height } };
      }
      case StudioRequestKind.Render: {
        const base = request.maxSide === undefined ? requireSource() : downscale(requireSource(), request.maxSide);
        return { id: request.id, ok: true, raster: renderEdits(base, request.edits) };
      }
      case StudioRequestKind.Detect:
        return { id: request.id, ok: true, quad: detectEdges(rotateRaster(requireSource(), request.quarterTurns)) };
      case StudioRequestKind.Export:
        return { id: request.id, ok: true, blob: await ops.encodePng(renderEdits(requireSource(), request.edits)) };
    }
  };

  return {
    handle: async (request) => {
      try {
        return await run(request);
      } catch (error) {
        return { id: request.id, ok: false, failure: failureOf(error) };
      }
    },
  };
}
