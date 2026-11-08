import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useUi } from '@dloizides/ui-feedback';

import { BandButton } from './BandButton';
import { bandColors } from './bandColors';
import { CameraPhase } from '../camera/CameraPhase';
import { useCameraStream } from '../hooks/useCameraStream';

import type { CameraFailure } from '../camera/CameraFailure';
import type { CameraLabels } from '../labels';

const RADIUS = 8;
const GAP = 8;
const PADDING = 12;
const NOTE_SIZE = 13;
const SHUTTER_SIZE = 68;
const SHUTTER_RING = 4;
const VIEW_RATIO = 4 / 3;
const GUIDE_INSET = '8%';
const GUIDE_BORDER = 2;
const VIDEO_STYLE = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } as const;

const styles = StyleSheet.create({
  root: { borderRadius: RADIUS, overflow: 'hidden' },
  top: { flexDirection: 'row', alignItems: 'center', gap: GAP, padding: PADDING },
  note: { flex: 1, flexShrink: 1, fontSize: NOTE_SIZE, textAlign: 'right' },
  view: { width: '100%', aspectRatio: VIEW_RATIO, justifyContent: 'center', alignItems: 'center' },
  guide: { position: 'absolute', top: GUIDE_INSET, bottom: GUIDE_INSET, left: GUIDE_INSET, right: GUIDE_INSET, borderWidth: GUIDE_BORDER },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: PADDING },
  shutter: { width: SHUTTER_SIZE, height: SHUTTER_SIZE, borderRadius: SHUTTER_SIZE / 2, borderWidth: SHUTTER_RING, alignItems: 'center', justifyContent: 'center' },
});

export interface LiveCameraProps {
  readonly labels: CameraLabels;
  readonly onCapture: (photo: File) => void;
  readonly onClose: () => void;
  readonly onGallery: () => void;
  readonly onFailed: (failure: CameraFailure) => void;
  readonly testID: string;
}

export function LiveCamera({ labels, onCapture, onClose, onGallery, onFailed, testID }: LiveCameraProps): ReactElement {
  const { theme } = useUi();
  const { band, ink } = bandColors(theme);
  const camera = useCameraStream();
  const shutterRef = useRef<View>(null);
  const [capturing, setCapturing] = useState(false);
  const isLive = camera.phase === CameraPhase.Live;

  useEffect(() => {
    if (camera.failure !== null) onFailed(camera.failure);
  }, [camera.failure, onFailed]);

  useEffect(() => {
    if (isLive) shutterRef.current?.focus();
  }, [isLive]);

  const shoot = useCallback(async () => {
    setCapturing(true);
    const photo = await camera.capture();
    setCapturing(false);
    if (photo !== null) onCapture(photo);
  }, [camera, onCapture]);

  return (
    <View style={[styles.root, { backgroundColor: band }]} testID={testID}>
      <View style={styles.top}>
        <BandButton hint={labels.closeHint} ink={ink} label={labels.close} testID={`${testID}-close`} onPress={onClose} />
        {camera.torchAvailable ? (
          <BandButton hint={labels.flashHint} ink={ink} label={camera.torchOn ? labels.flashOff : labels.flashOn} testID={`${testID}-flash`} onPress={() => void camera.toggleTorch()} />
        ) : null}
        <Text style={[styles.note, { color: ink }]}>{labels.sessionNote}</Text>
      </View>
      <View style={styles.view}>
        <video ref={camera.attachVideo} autoPlay muted playsInline aria-label={labels.viewfinder} data-testid={`${testID}-video`} style={VIDEO_STYLE} />
        <View pointerEvents="none" style={[styles.guide, { borderColor: ink }]} testID={`${testID}-guide`} />
        {isLive ? null : <Text style={{ color: ink, position: 'absolute' }}>{labels.starting}</Text>}
      </View>
      <View style={styles.bottom}>
        <BandButton hint={labels.galleryHint} ink={ink} label={labels.gallery} testID={`${testID}-gallery`} onPress={onGallery} />
        <Pressable
          ref={shutterRef}
          accessibilityHint={labels.shutterHint}
          accessibilityLabel={labels.shutter}
          accessibilityRole="button"
          disabled={!isLive || capturing}
          style={[styles.shutter, { borderColor: ink }]}
          testID={`${testID}-shutter`}
          onPress={() => void shoot()}
        >
          {capturing ? <ActivityIndicator color={ink} /> : null}
        </Pressable>
        <BandButton hint={labels.flipHint} ink={ink} label={labels.flip} testID={`${testID}-flip`} onPress={camera.flip} />
      </View>
    </View>
  );
}
