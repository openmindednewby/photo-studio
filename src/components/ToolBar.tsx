import type { ReactElement } from 'react';

import { StyleSheet, View } from 'react-native';

import { Button } from '@dloizides/ui-buttons';

import { StudioTool } from './StudioTool';

import type { EditorLabels } from '../labels';

const GAP = 8;

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  item: { flexGrow: 1 },
});

export interface ToolBarProps {
  readonly tool: StudioTool;
  readonly labels: EditorLabels;
  readonly showBackground: boolean;
  readonly onSelect: (tool: StudioTool) => void;
  readonly onRotate: () => void;
  readonly testID: string;
}

export function ToolBar({ tool, labels, showBackground, onSelect, onRotate, testID }: ToolBarProps): ReactElement {
  const selectable = [
    { key: StudioTool.Straighten, label: labels.straighten, hint: labels.straightenHint },
    { key: StudioTool.Filters, label: labels.filters, hint: labels.filtersHint },
    ...(showBackground ? [{ key: StudioTool.Background, label: labels.background, hint: labels.backgroundHint }] : []),
  ];
  return (
    <View style={styles.bar} testID={testID}>
      <View style={styles.item}>
        <Button fullWidth accessibilityHint={labels.cropHint} accessibilityLabel={labels.crop} label={labels.crop} testID={`${testID}-${StudioTool.Crop}`} variant={tool === StudioTool.Crop ? 'primary' : 'outline'} onPress={() => onSelect(StudioTool.Crop)} />
      </View>
      <View style={styles.item}>
        <Button fullWidth accessibilityHint={labels.rotateHint} accessibilityLabel={labels.rotate} label={labels.rotate} testID={`${testID}-rotate`} variant="outline" onPress={onRotate} />
      </View>
      {selectable.map((entry) => (
        <View key={entry.key} style={styles.item}>
          <Button fullWidth accessibilityHint={entry.hint} accessibilityLabel={entry.label} label={entry.label} testID={`${testID}-${entry.key}`} variant={tool === entry.key ? 'primary' : 'outline'} onPress={() => onSelect(entry.key)} />
        </View>
      ))}
    </View>
  );
}
