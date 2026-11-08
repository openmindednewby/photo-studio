import { createStudioSession } from './studioSession';
import { StudioRequestKind } from './StudioRequestKind';
import { NEUTRAL_EDITS } from '../processing/filterPresets';

import type { Raster } from '../types';

const RASTER: Raster = { width: 1, height: 1, data: new Uint8ClampedArray(4) };

describe('createStudioSession.handle', () => {
  it('with a render sent while a load is still decoding, renders the photo that load brings', async () => {
    let finishDecode: (raster: Raster) => void = () => undefined;
    const decode = jest.fn(() => new Promise<Raster>((resolve) => { finishDecode = resolve; }));
    const session = createStudioSession({ decode, encodePng: jest.fn() });
    const loading = session.handle({ id: 1, kind: StudioRequestKind.Load, file: new Blob() });
    const rendering = session.handle({ id: 2, kind: StudioRequestKind.Render, edits: NEUTRAL_EDITS });
    await new Promise((resolve) => setTimeout(resolve, 0));

    finishDecode(RASTER);

    await expect(loading).resolves.toMatchObject({ id: 1, ok: true });
    await expect(rendering).resolves.toMatchObject({ id: 2, ok: true });
  });
});
