import { useCallback, useEffect, useRef, useState } from 'react';

import { connectVideo, useOpenCamera } from './useOpenCamera';
import { CameraFacing } from '../camera/CameraFacing';
import { grabFrame, setTorch } from '../camera/cameraApi';

import type { CameraFailure } from '../camera/CameraFailure';
import type { CameraPhase } from '../camera/CameraPhase';

export interface CameraStream {
  readonly phase: CameraPhase;
  readonly failure: CameraFailure | null;
  readonly torchAvailable: boolean;
  readonly torchOn: boolean;
  readonly attachVideo: (video: HTMLVideoElement | null) => void;
  readonly flip: () => void;
  readonly toggleTorch: () => Promise<void>;
  readonly capture: () => Promise<File | null>;
}

export function useCameraStream(): CameraStream {
  const [facing, setFacing] = useState(CameraFacing.Back);
  const [torchOn, setTorchOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { phase, failure, torchAvailable, streamRef } = useOpenCamera(facing, videoRef);

  useEffect(() => setTorchOn(false), [facing]);

  const attachVideo = useCallback(
    (video: HTMLVideoElement | null) => {
      videoRef.current = video;
      connectVideo(video, streamRef.current);
    },
    [streamRef],
  );

  const flip = useCallback(() => {
    setFacing((current) => (current === CameraFacing.Back ? CameraFacing.Front : CameraFacing.Back));
  }, []);

  const toggleTorch = useCallback(async () => {
    if (streamRef.current === null) return;
    await setTorch(streamRef.current, !torchOn);
    setTorchOn(!torchOn);
  }, [streamRef, torchOn]);

  const capture = useCallback(async () => (videoRef.current === null ? null : grabFrame(videoRef.current)), []);

  return { phase, failure, torchAvailable, torchOn, attachVideo, flip, toggleTorch, capture };
}
