import type { ReactElement } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@dloizides/ui-buttons';
import { useUi } from '@dloizides/ui-feedback';

import type { EditorLabels } from '../labels';

const GAP = 8;

const styles = StyleSheet.create({
  notice: { gap: GAP },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
});

export interface BackgroundNoticeProps {
  readonly labels: EditorLabels;
  readonly isWorking: boolean;
  readonly showActions: boolean;
  readonly statusText: string;
  readonly onDownload: () => Promise<void>;
  readonly onCancel: () => void;
  readonly testID: string;
}

export function BackgroundNotice({ labels, isWorking, showActions, statusText, onDownload, onCancel, testID }: BackgroundNoticeProps): ReactElement {
  const { theme } = useUi();
  return (
    <View style={styles.notice} testID={testID}>
      <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.text }}>{isWorking ? statusText : labels.backgroundNotice}</Text>
      {showActions ? (
        <View style={styles.actions}>
          <Button accessibilityHint={labels.backgroundCancelHint} accessibilityLabel={labels.backgroundCancel} disabled={isWorking} label={labels.backgroundCancel} testID={`${testID}-cancel`} variant="outline" onPress={onCancel} />
          <Button accessibilityHint={labels.backgroundDownloadHint} accessibilityLabel={labels.backgroundDownload} label={labels.backgroundDownload} loading={isWorking} testID={`${testID}-download`} onPress={onDownload} />
        </View>
      ) : null}
    </View>
  );
}
