import { useCallback, useState } from 'react';
import type { ReactElement } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@dloizides/ui-buttons';
import { useUi } from '@dloizides/ui-feedback';

import { LiveCamera } from './LiveCamera';
import { PhotoDropArea } from './PhotoDropArea';
import { pickPhotoFile } from '../camera/pickPhotoFile';
import { useIsWide } from '../hooks/useIsWide';

import type { CameraFailure } from '../camera/CameraFailure';
import type { CameraLabels, SourceLabels } from '../labels';

const GAP = 12;
const WIDE_MIN_HEIGHT = 420;

const styles = StyleSheet.create({
  column: { gap: GAP },
  row: { flexDirection: 'row', gap: GAP, minHeight: WIDE_MIN_HEIGHT },
  pane: { flex: 1, justifyContent: 'center', minWidth: 0 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  button: { flexGrow: 1, flexBasis: 0 },
  fallback: { gap: GAP },
});

export interface PhotoSourcePanelProps {
  readonly cameraLabels: CameraLabels;
  readonly labels: SourceLabels;
  readonly onFile: (file: File) => void;
  readonly testID: string;
}

export function PhotoSourcePanel({ cameraLabels, labels, onFile, testID }: PhotoSourcePanelProps): ReactElement {
  const { theme } = useUi();
  const isWide = useIsWide();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraFailure, setCameraFailure] = useState<CameraFailure | null>(null);

  const pick = useCallback(
    (capture: boolean) => {
      void pickPhotoFile({ capture }).then((file) => {
        if (file !== null) onFile(file);
      });
    },
    [onFile],
  );

  const onFailed = useCallback((failure: CameraFailure) => {
    setCameraOpen(false);
    setCameraFailure(failure);
  }, []);

  const choose = (
    <Button accessibilityHint={labels.choosePhotoHint} accessibilityLabel={labels.choosePhoto} label={labels.choosePhoto} testID={`${testID}-choose`} variant="outline" onPress={() => pick(false)} />
  );
  const take = (
    <Button accessibilityHint={labels.takePhotoHint} accessibilityLabel={labels.takePhoto} label={labels.takePhoto} testID={`${testID}-take`} onPress={() => setCameraOpen(true)} />
  );
  const fallback = cameraFailure === null ? null : (
    <View style={styles.fallback} testID={`${testID}-fallback`}>
      <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.textSecondary }}>{labels.cameraFailure(cameraFailure)}</Text>
      <View style={styles.buttons}>
        <View style={styles.button}>
          <Button fullWidth accessibilityHint={labels.deviceCameraHint} accessibilityLabel={labels.deviceCamera} label={labels.deviceCamera} testID={`${testID}-device-camera`} onPress={() => pick(true)} />
        </View>
        <View style={styles.button}>{choose}</View>
      </View>
    </View>
  );
  const camera = cameraOpen ? (
    <LiveCamera labels={cameraLabels} testID={`${testID}-camera`} onCapture={onFile} onClose={() => setCameraOpen(false)} onFailed={onFailed} onGallery={() => pick(false)} />
  ) : null;

  if (isWide) {
    return (
      <View style={styles.row} testID={testID}>
        <PhotoDropArea formats={labels.dropFormats} testID={`${testID}-drop`} title={labels.dropTitle} onFile={onFile}>
          {choose}
        </PhotoDropArea>
        <View style={styles.pane}>{camera ?? fallback ?? take}</View>
      </View>
    );
  }
  return (
    <View style={styles.column} testID={testID}>
      {camera ?? fallback ?? (
        <View style={styles.buttons}>
          <View style={styles.button}>{take}</View>
          <View style={styles.button}>{choose}</View>
        </View>
      )}
    </View>
  );
}
