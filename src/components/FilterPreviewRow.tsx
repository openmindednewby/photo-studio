import type { ReactElement } from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useUi } from '@dloizides/ui-feedback';

import { PhotoCanvas } from './PhotoCanvas';
import { FilterPreset } from '../processing/FilterPreset';
import { FILTER_PRESETS } from '../processing/filterPresets';

import type { FilterPreviews } from '../hooks/useFilterPreviews';
import type { EditorLabels } from '../labels';

const GAP = 8;
const RADIUS = 8;
const PADDING = 4;
const MIN_TARGET = 44;
const THIN = 1;
const THICK = 2;
const FONT_SIZE = 13;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: GAP },
  tile: { flex: 1, minWidth: 0, minHeight: MIN_TARGET, padding: PADDING, borderRadius: RADIUS, alignItems: 'center', gap: PADDING },
  label: { fontSize: FONT_SIZE, textAlign: 'center' },
});

function presetName(preset: FilterPreset, labels: EditorLabels): string {
  switch (preset) {
    case FilterPreset.Scan:
      return labels.scan;
    case FilterPreset.Bright:
      return labels.bright;
    case FilterPreset.BlackAndWhite:
      return labels.blackAndWhite;
    default:
      return labels.original;
  }
}

export interface FilterPreviewRowProps {
  readonly previews: FilterPreviews;
  readonly selected: FilterPreset | null;
  readonly labels: EditorLabels;
  readonly onSelect: (preset: FilterPreset) => void;
  readonly testID: string;
}

export function FilterPreviewRow({ previews, selected, labels, onSelect, testID }: FilterPreviewRowProps): ReactElement {
  const { theme } = useUi();
  return (
    <View accessibilityLabel={labels.filtersTitle} accessibilityRole="radiogroup" style={styles.row} testID={testID}>
      {FILTER_PRESETS.map((preset) => {
        const isSelected = preset === selected;
        const name = presetName(preset, labels);
        const raster = previews[preset];
        return (
          <Pressable
            key={preset}
            accessibilityHint={labels.presetHint}
            accessibilityLabel={name}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            style={[styles.tile, { borderWidth: isSelected ? THICK : THIN, borderColor: isSelected ? theme.colors.text : theme.colors.border }]}
            testID={`${testID}-${preset}`}
            onPress={() => onSelect(preset)}
          >
            {raster === undefined ? null : <PhotoCanvas label={name} raster={raster} testID={`${testID}-${preset}-preview`} />}
            <Text style={[styles.label, { color: theme.colors.text, fontWeight: isSelected ? '700' : '400' }]}>{name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
