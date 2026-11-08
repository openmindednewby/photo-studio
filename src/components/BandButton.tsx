import type { ReactElement } from 'react';

import { Pressable, StyleSheet, Text } from 'react-native';

const MIN_TARGET = 44;
const RADIUS = 8;
const PADDING = 12;
const FONT_SIZE = 15;

const styles = StyleSheet.create({
  button: { minWidth: MIN_TARGET, minHeight: MIN_TARGET, borderWidth: 1, borderRadius: RADIUS, paddingHorizontal: PADDING, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: FONT_SIZE, fontWeight: '600' },
});

export interface BandButtonProps {
  readonly label: string;
  readonly hint: string;
  readonly ink: string;
  readonly testID: string;
  readonly onPress: () => void;
}

export function BandButton({ label, hint, ink, testID, onPress }: BandButtonProps): ReactElement {
  return (
    <Pressable accessibilityHint={hint} accessibilityLabel={label} accessibilityRole="button" style={[styles.button, { borderColor: ink }]} testID={testID} onPress={onPress}>
      <Text style={[styles.label, { color: ink }]}>{label}</Text>
    </Pressable>
  );
}
