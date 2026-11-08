import { CameraFailure } from './CameraFailure';
import { CameraError, cameraFailureOf, hasTorch, setTorch } from './cameraApi';

function streamWith(track: Partial<MediaStreamTrack>): MediaStream {
  return { getVideoTracks: () => [track as MediaStreamTrack] } as unknown as MediaStream;
}

describe('cameraFailureOf', () => {
  it.each([
    ['NotAllowedError', CameraFailure.Denied],
    ['SecurityError', CameraFailure.Denied],
    ['NotFoundError', CameraFailure.Absent],
    ['OverconstrainedError', CameraFailure.Absent],
    ['NotReadableError', CameraFailure.Failed],
  ])('with a %s, maps it to %s', (name, expected) => {
    const error = { name };

    const failure = cameraFailureOf(error);

    expect(failure).toBe(expected);
  });

  it('with a CameraError, keeps its own failure', () => {
    const error = new CameraError(CameraFailure.Unsupported);

    const failure = cameraFailureOf(error);

    expect(failure).toBe(CameraFailure.Unsupported);
  });
});

describe('hasTorch', () => {
  it('when the track reports a torch, returns true', () => {
    const stream = streamWith({ getCapabilities: () => ({ torch: true }) as MediaTrackCapabilities });

    const available = hasTorch(stream);

    expect(available).toBe(true);
  });

  it('on a browser with no capabilities API, returns false', () => {
    const stream = streamWith({});

    const available = hasTorch(stream);

    expect(available).toBe(false);
  });
});

describe('setTorch', () => {
  it('when switching on, asks the track for the torch constraint', async () => {
    const applyConstraints = jest.fn().mockResolvedValue(undefined);

    await setTorch(streamWith({ applyConstraints }), true);

    expect(applyConstraints).toHaveBeenCalledWith({ advanced: [{ torch: true }] });
  });
});
