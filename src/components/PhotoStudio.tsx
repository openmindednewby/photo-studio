import type { ReactElement, ReactNode } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { useUi } from '@dloizides/ui-feedback';

import { PhotoEditor } from './PhotoEditor';
import { PhotoSourcePanel } from './PhotoSourcePanel';
import { StudioStatus } from '../hooks/StudioStatus';
import { usePhotoStudio } from '../hooks/usePhotoStudio';

import type { PhotoEngine } from '../engine/createPhotoEngine';
import type { PhotoStudioLabels } from '../labels';
import type { BackgroundRemovalPort, Raster } from '../types';

const GAP = 12;
const NOTE_SIZE = 14;

const styles = StyleSheet.create({
  root: { gap: GAP },
  note: { fontSize: NOTE_SIZE },
});

export interface PhotoStudioProps {
  readonly engine: PhotoEngine;
  readonly labels: PhotoStudioLabels;
  readonly renderResult: (output: Raster) => ReactNode;
  readonly backgroundRemoval?: BackgroundRemovalPort;
  readonly onOutput?: (output: Raster) => void;
  readonly testID: string;
}

export function PhotoStudio({ engine, labels, renderResult, backgroundRemoval, onOutput, testID }: PhotoStudioProps): ReactElement {
  const { theme } = useUi();
  const studio = usePhotoStudio({ engine, backgroundRemoval, onOutput });
  const showEditor = studio.status === StudioStatus.Ready && (studio.view !== null || studio.failure === null);

  return (
    <View style={styles.root} testID={testID}>
      <Text style={[styles.note, { color: theme.colors.textSecondary }]} testID={`${testID}-privacy`}>
        {labels.onDevice}
      </Text>
      {showEditor ? (
        <PhotoEditor labels={labels.editor} renderResult={renderResult} showBackground={backgroundRemoval !== undefined} studio={studio} testID={`${testID}-editor`} />
      ) : (
        <PhotoSourcePanel cameraLabels={labels.camera} labels={labels.source} testID={`${testID}-source`} onFile={(file) => void studio.loadFile(file)} />
      )}
      {studio.status === StudioStatus.Loading ? <Text style={{ color: theme.colors.textSecondary }} testID={`${testID}-working`}>{labels.working}</Text> : null}
      {studio.failure === null ? null : (
        <Text accessibilityLiveRegion="polite" style={{ color: theme.semantic.error['500'] }} testID={`${testID}-failure`}>
          {labels.describeFailure(studio.failure)}
        </Text>
      )}
    </View>
  );
}
