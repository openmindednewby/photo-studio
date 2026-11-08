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

describe('useCameraStream page presence', () => {
  async function liveCamera(capabilities: object = {}): Promise<ReturnType<typeof fakeStream> & { getUserMedia: jest.Mock; camera: { readonly current: ReturnType<typeof useCameraStream> } }> {
    const fake = fakeStream(capabilities);
    const getUserMedia = jest.fn().mockResolvedValue(fake.stream);
    setMediaDevices({ getUserMedia });
    const { result } = renderHook(() => useCameraStream());
    await waitFor(() => expect(result.current.phase).toBe(CameraPhase.Live));
    return { ...fake, getUserMedia, camera: result };
  }

  function setVisibility(state: string): void {
    Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }

  function fire(eventName: string): void {
    window.dispatchEvent(new Event(eventName));
  }

  afterEach(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    setMediaDevices(undefined);
  });

  it.each(['blur', 'pagehide'])('on window %s with a live stream, stops the tracks', async (eventName) => {
    const { stop } = await liveCamera();

    act(() => fire(eventName));

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('when the page is hidden, stops the tracks', async () => {
    const { stop } = await liveCamera();

    act(() => setVisibility('hidden'));

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('after leaving and coming back, opens the camera again and goes live', async () => {
    const { getUserMedia, camera } = await liveCamera();
    act(() => fire('blur'));

    act(() => fire('focus'));

    await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(camera.current.phase).toBe(CameraPhase.Live));
  });

  it('on a blur while the camera is still opening, keeps opening', async () => {
    const fake = fakeStream();
    let finishOpen: (stream: MediaStream) => void = () => undefined;
    setMediaDevices({ getUserMedia: jest.fn(() => new Promise<MediaStream>((resolve) => { finishOpen = resolve; })) });
    const { result } = renderHook(() => useCameraStream());
    act(() => fire('blur'));

    await act(async () => finishOpen(fake.stream));

    await waitFor(() => expect(result.current.phase).toBe(CameraPhase.Live));
    expect(fake.stop).not.toHaveBeenCalled();
  });

  it('with the torch on, reads as off after the camera comes back', async () => {
    const { camera } = await liveCamera({ torch: true });
    await act(() => camera.current.toggleTorch());
    act(() => fire('blur'));

    act(() => fire('focus'));

    await waitFor(() => expect(camera.current.phase).toBe(CameraPhase.Live));
    expect(camera.current.torchOn).toBe(false);
  });
});
