import type { ChangeEvent, ReactElement } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { useUi } from '@dloizides/ui-feedback';

const SCALE = 100;
const MIN_TARGET = 44;
const LABEL_WIDTH = 96;
const GAP = 8;
const INPUT_STYLE = { flex: 1, minWidth: 0, height: MIN_TARGET } as const;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: GAP, minHeight: MIN_TARGET },
  label: { width: LABEL_WIDTH, flexShrink: 1 },
});

export interface SliderRowProps {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly onChange: (value: number) => void;
  readonly testID: string;
}

export function SliderRow({ label, value, min, onChange, testID }: SliderRowProps): ReactElement {
  const { theme } = useUi();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <input
        aria-label={label}
        data-testid={testID}
        max={SCALE}
        min={min * SCALE}
        style={{ ...INPUT_STYLE, accentColor: theme.palette.primary['500'] }}
        type="range"
        value={Math.round(value * SCALE)}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value) / SCALE)}
      />
    </View>
  );
}
