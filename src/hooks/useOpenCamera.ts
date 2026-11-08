import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';

import { CameraPhase } from '../camera/CameraPhase';
import { cameraFailureOf, hasTorch, openCamera, stopStream } from '../camera/cameraApi';
import { watchPagePresence } from '../camera/watchPagePresence';

import type { CameraFacing } from '../camera/CameraFacing';
import type { CameraFailure } from '../camera/CameraFailure';

export interface OpenCamera {
  readonly phase: CameraPhase;
  readonly failure: CameraFailure | null;
  readonly torchAvailable: boolean;
  readonly streamRef: MutableRefObject<MediaStream | null>;
}

export function connectVideo(video: HTMLVideoElement | null, stream: MediaStream | null): void {
  if (video === null || stream === null) return;
  video.srcObject = stream;
  void video.play()?.catch(() => undefined);
}

export function useOpenCamera(facing: CameraFacing, videoRef: MutableRefObject<HTMLVideoElement | null>): OpenCamera {
  const [phase, setPhase] = useState(CameraPhase.Starting);
  const [failure, setFailure] = useState<CameraFailure | null>(null);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [away, setAway] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(
    () =>
      watchPagePresence({
        hasStream: () => streamRef.current !== null,
        onAway: () => {
          stopStream(streamRef.current);
          streamRef.current = null;
          setAway(true);
        },
        onBack: () => setAway(false),
      }),
    [],
  );

  useEffect(() => {
    setPhase(CameraPhase.Starting);
    setFailure(null);
    if (away) return undefined;
    let cancelled = false;
    openCamera(facing)
      .then((stream) => {
        if (cancelled) {
          stopStream(stream);
          return;
        }
        streamRef.current = stream;
        connectVideo(videoRef.current, stream);
        setTorchAvailable(hasTorch(stream));
        setPhase(CameraPhase.Live);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setFailure(cameraFailureOf(error));
        setPhase(CameraPhase.Failed);
      });
    return () => {
      cancelled = true;
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, [facing, videoRef, away]);

  return { phase, failure, torchAvailable, streamRef };
}
