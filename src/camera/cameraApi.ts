import { CameraFacing } from './CameraFacing';
import { CameraFailure } from './CameraFailure';

const IDEAL_WIDTH = 1920;
const IDEAL_HEIGHT = 1080;
const JPEG_TYPE = 'image/jpeg';
const JPEG_QUALITY = 0.92;
const DENIED_ERRORS: ReadonlySet<string> = new Set(['NotAllowedError', 'SecurityError', 'PermissionDeniedError']);
const ABSENT_ERRORS: ReadonlySet<string> = new Set(['NotFoundError', 'DevicesNotFoundError', 'OverconstrainedError']);

interface TorchCapabilities {
  readonly torch?: boolean;
}

export class CameraError extends Error {
  public readonly failure: CameraFailure;

  public constructor(failure: CameraFailure) {
    super(`camera unavailable: ${failure}`);
    this.name = 'CameraError';
    this.failure = failure;
  }
}

export function cameraFailureOf(error: unknown): CameraFailure {
  if (error instanceof CameraError) return error.failure;
  const name = (error as { name?: string } | null)?.name ?? '';
  if (DENIED_ERRORS.has(name)) return CameraFailure.Denied;
  if (ABSENT_ERRORS.has(name)) return CameraFailure.Absent;
  return CameraFailure.Failed;
}

export async function openCamera(facing: CameraFacing): Promise<MediaStream> {
  const devices = typeof navigator === 'undefined' ? undefined : navigator.mediaDevices;
  if (devices === undefined) throw new CameraError(CameraFailure.Unsupported);
  return devices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: facing }, width: { ideal: IDEAL_WIDTH }, height: { ideal: IDEAL_HEIGHT } },
  });
}

function videoTrackOf(stream: MediaStream): MediaStreamTrack | undefined {
  return stream.getVideoTracks()[0];
}

export function hasTorch(stream: MediaStream): boolean {
  const track = videoTrackOf(stream);
  if (track === undefined || typeof track.getCapabilities !== 'function') return false;
  return (track.getCapabilities() as TorchCapabilities).torch === true;
}

export async function setTorch(stream: MediaStream, on: boolean): Promise<void> {
  await videoTrackOf(stream)?.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
}

export function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

export function grabFrame(video: HTMLVideoElement): Promise<File | null> {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  if (context === null || canvas.width === 0) return Promise.resolve(null);
  context.drawImage(video, 0, 0);
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob === null ? null : new File([blob], 'camera-photo.jpg', { type: JPEG_TYPE })),
      JPEG_TYPE,
      JPEG_QUALITY,
    );
  });
}
