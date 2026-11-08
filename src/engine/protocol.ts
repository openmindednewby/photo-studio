import { StudioRequestKind } from './StudioRequestKind';

import type { PhotoEdits, Quad, Raster, Size } from '../types';

export interface LoadRequest {
  readonly id: number;
  readonly kind: StudioRequestKind.Load;
  readonly file: Blob;
  readonly maxSide?: number;
}

export interface RenderRequest {
  readonly id: number;
  readonly kind: StudioRequestKind.Render;
  readonly edits: PhotoEdits;
  readonly maxSide?: number;
}

export interface DetectRequest {
  readonly id: number;
  readonly kind: StudioRequestKind.Detect;
  readonly quarterTurns: number;
}

export interface ExportRequest {
  readonly id: number;
  readonly kind: StudioRequestKind.Export;
  readonly edits: PhotoEdits;
}

export type StudioRequest = LoadRequest | RenderRequest | DetectRequest | ExportRequest;

export interface StudioSuccess {
  readonly id: number;
  readonly ok: true;
  readonly size?: Size;
  readonly raster?: Raster;
  readonly quad?: Quad | null;
  readonly blob?: Blob;
}

export interface StudioFailure {
  readonly id: number;
  readonly ok: false;
  readonly failure: string;
}

export type StudioResponse = StudioSuccess | StudioFailure;

export function transferablesOf(response: StudioResponse): Transferable[] {
  return response.ok && response.raster !== undefined ? [response.raster.data.buffer as ArrayBuffer] : [];
}
