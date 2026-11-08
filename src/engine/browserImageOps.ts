import { decodeBounded } from '@dloizides/image-decode';

import { PhotoEngineError } from './PhotoEngineError';
import { PhotoEngineFailure } from './PhotoEngineFailure';

import type { StudioImageOps } from './studioSession';
import type { Raster } from '../types';

const PNG_TYPE = 'image/png';

function contextOf(canvas: OffscreenCanvas): OffscreenCanvasRenderingContext2D {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (context === null) throw new PhotoEngineError(PhotoEngineFailure.CanvasUnavailable);
  return context;
}

async function decode(file: Blob, maxSide?: number): Promise<Raster> {
  const result = await decodeBounded(file, maxSide === undefined ? {} : { maxSide });
  if (!result.ok) throw new PhotoEngineError(result.failure);
  const { bitmap } = result;
  const { width, height } = bitmap;
  const context = contextOf(new OffscreenCanvas(width, height));
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  return { width, height, data: context.getImageData(0, 0, width, height).data };
}

async function encodePng(raster: Raster): Promise<Blob> {
  const canvas = new OffscreenCanvas(raster.width, raster.height);
  contextOf(canvas).putImageData(new ImageData(new Uint8ClampedArray(raster.data), raster.width, raster.height), 0, 0);
  return canvas.convertToBlob({ type: PNG_TYPE });
}

export const browserImageOps: StudioImageOps = { decode, encodePng };
