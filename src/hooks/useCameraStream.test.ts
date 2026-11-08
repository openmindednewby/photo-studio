import { act, renderHook, waitFor } from '@testing-library/react';

import { useCameraStream } from './useCameraStream';
import { CameraFailure } from '../camera/CameraFailure';
import { CameraPhase } from '../camera/CameraPhase';

function fakeStream(capabilities: object = {}): { stream: MediaStream; stop: jest.Mock; applyConstraints: jest.Mock } {
  const stop = jest.fn();
  const applyConstraints = jest.fn().mockResolvedValue(undefined);
  const track = { stop, applyConstraints, getCapabilities: () => capabilities };
  const stream = { getTracks: () => [track], getVideoTracks: () => [track] } as unknown as MediaStream;
  return { stream, stop, applyConstraints };
}

function setMediaDevices(value: unknown): void {
  Object.defineProperty(navigator, 'mediaDevices', { value, configurable: true });
}

describe('useCameraStream', () => {
  afterEach(() => {
    setMediaDevices(undefined);
  });

  it('when permission is refused, ends in the failed phase with the denied reason', async () => {
    setMediaDevices({ getUserMedia: jest.fn().mockRejectedValue({ name: 'NotAllowedError' }) });

    const { result } = renderHook(() => useCameraStream());

    await waitFor(() => expect(result.current.phase).toBe(CameraPhase.Failed));
    expect(result.current.failure).toBe(CameraFailure.Denied);
  });

  it('on a browser with no camera API, fails as unsupported', async () => {
    setMediaDevices(undefined);

    const { result } = renderHook(() => useCameraStream());

    await waitFor(() => expect(result.current.failure).toBe(CameraFailure.Unsupported));
  });

  it('when the track has no torch, reports flash as unavailable', async () => {
    setMediaDevices({ getUserMedia: jest.fn().mockResolvedValue(fakeStream().stream) });

    const { result } = renderHook(() => useCameraStream());

    await waitFor(() => expect(result.current.phase).toBe(CameraPhase.Live));
    expect(result.current.torchAvailable).toBe(false);
  });

  it('when the track has a torch, toggling switches it on', async () => {
    const fake = fakeStream({ torch: true });
    setMediaDevices({ getUserMedia: jest.fn().mockResolvedValue(fake.stream) });
    const { result } = renderHook(() => useCameraStream());
    await waitFor(() => expect(result.current.torchAvailable).toBe(true));

    await act(() => result.current.toggleTorch());

    expect(fake.applyConstraints).toHaveBeenCalledWith({ advanced: [{ torch: true }] });
    expect(result.current.torchOn).toBe(true);
  });

  it('on unmount, stops the camera tracks', async () => {
    const fake = fakeStream();
    setMediaDevices({ getUserMedia: jest.fn().mockResolvedValue(fake.stream) });
    const { result, unmount } = renderHook(() => useCameraStream());
    await waitFor(() => expect(result.current.phase).toBe(CameraPhase.Live));

    unmount();

    expect(fake.stop).toHaveBeenCalledTimes(1);
  });

  it('on flip, stops the old stream and opens the other camera', async () => {
    const fake = fakeStream();
    const getUserMedia = jest.fn().mockResolvedValue(fake.stream);
    setMediaDevices({ getUserMedia });
    const { result } = renderHook(() => useCameraStream());
    await waitFor(() => expect(result.current.phase).toBe(CameraPhase.Live));

    act(() => result.current.flip());

    await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(2));
    expect(fake.stop).toHaveBeenCalledTimes(1);
    expect(getUserMedia.mock.calls[1][0].video.facingMode).toEqual({ ideal: 'user' });
  });
});
