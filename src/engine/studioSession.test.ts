import { PhotoEngineError } from './PhotoEngineError';
import { PhotoEngineFailure } from './PhotoEngineFailure';
import { StudioRequestKind } from './StudioRequestKind';
import { createStudioSession } from './studioSession';
import { NEUTRAL_EDITS } from '../processing/filterPresets';

import type { StudioImageOps } from './studioSession';
import type { Raster } from '../types';

const PHOTO: Raster = { width: 4, height: 2, data: new Uint8ClampedArray(4 * 2 * 4).fill(90) };

function opsWith(decode: StudioImageOps['decode']): StudioImageOps {
  return { decode, encodePng: jest.fn().mockResolvedValue(new Blob(['png'])) };
}

describe('createStudioSession', () => {
  it('when rendering before a photo is loaded, answers the no-photo failure', async () => {
    const session = createStudioSession(opsWith(jest.fn()));

    const response = await session.handle({ id: 1, kind: StudioRequestKind.Render, edits: NEUTRAL_EDITS });

    expect(response).toEqual({ id: 1, ok: false, failure: PhotoEngineFailure.NoPhoto });
  });

  it('when decode fails with a named reason, answers that reason', async () => {
    const session = createStudioSession(opsWith(jest.fn().mockRejectedValue(new PhotoEngineError('format'))));

    const response = await session.handle({ id: 2, kind: StudioRequestKind.Load, file: new Blob() });

    expect(response).toEqual({ id: 2, ok: false, failure: 'format' });
  });

  it('after a load, renders at the decoded size', async () => {
    const session = createStudioSession(opsWith(jest.fn().mockResolvedValue(PHOTO)));
    await session.handle({ id: 3, kind: StudioRequestKind.Load, file: new Blob() });

    const response = await session.handle({ id: 4, kind: StudioRequestKind.Render, edits: NEUTRAL_EDITS });

    expect(response.ok && response.raster?.width).toBe(4);
  });

  it('with a maxSide on render, returns a thumbnail and keeps the full source for the next render', async () => {
    const session = createStudioSession(opsWith(jest.fn().mockResolvedValue(PHOTO)));
    await session.handle({ id: 5, kind: StudioRequestKind.Load, file: new Blob() });

    const thumbnail = await session.handle({ id: 6, kind: StudioRequestKind.Render, edits: NEUTRAL_EDITS, maxSide: 2 });
    const full = await session.handle({ id: 7, kind: StudioRequestKind.Render, edits: NEUTRAL_EDITS });

    expect(thumbnail.ok && thumbnail.raster?.width).toBe(2);
    expect(full.ok && full.raster?.width).toBe(4);
  });

  it('on export, encodes the edited photo as a blob', async () => {
    const ops = opsWith(jest.fn().mockResolvedValue(PHOTO));
    const session = createStudioSession(ops);
    await session.handle({ id: 8, kind: StudioRequestKind.Load, file: new Blob() });

    const response = await session.handle({ id: 9, kind: StudioRequestKind.Export, edits: NEUTRAL_EDITS });

    expect(ops.encodePng).toHaveBeenCalledTimes(1);
    expect(response.ok && response.blob).toBeInstanceOf(Blob);
  });
});
