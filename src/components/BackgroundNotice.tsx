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
  readonly onSend: () => Promise<void>;
  readonly onCancel: () => void;
  readonly testID: string;
}

export function BackgroundNotice({ labels, onSend, onCancel, testID }: BackgroundNoticeProps): ReactElement {
  const { theme } = useUi();
  return (
    <View style={styles.notice} testID={testID}>
      <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.text }}>{labels.backgroundNotice}</Text>
      <View style={styles.actions}>
        <Button accessibilityHint={labels.backgroundCancelHint} accessibilityLabel={labels.backgroundCancel} label={labels.backgroundCancel} testID={`${testID}-cancel`} variant="outline" onPress={onCancel} />
        <Button accessibilityHint={labels.backgroundSendHint} accessibilityLabel={labels.backgroundSend} label={labels.backgroundSend} testID={`${testID}-send`} onPress={onSend} />
      </View>
    </View>
  );
}
