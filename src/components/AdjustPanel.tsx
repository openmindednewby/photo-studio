import type { ReactElement } from 'react';

import { StyleSheet, View } from 'react-native';

import { Button } from '@dloizides/ui-buttons';

import { SliderRow } from './SliderRow';

import type { EditorLabels } from '../labels';
import type { Adjustments } from '../types';

const GAP = 8;

const styles = StyleSheet.create({
  panel: { gap: GAP },
  toggles: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
});

export interface AdjustPanelProps {
  readonly adjustments: Adjustments;
  readonly labels: EditorLabels;
  readonly onChange: (adjustments: Adjustments) => void;
  readonly testID: string;
}

export function AdjustPanel({ adjustments, labels, onChange, testID }: AdjustPanelProps): ReactElement {
  return (
    <View style={styles.panel} testID={testID}>
      <SliderRow label={labels.brightness} min={-1} testID={`${testID}-brightness`} value={adjustments.brightness} onChange={(brightness) => onChange({ ...adjustments, brightness })} />
      <SliderRow label={labels.contrast} min={-1} testID={`${testID}-contrast`} value={adjustments.contrast} onChange={(contrast) => onChange({ ...adjustments, contrast })} />
      <SliderRow label={labels.sharpen} min={0} testID={`${testID}-sharpen`} value={adjustments.sharpen} onChange={(sharpen) => onChange({ ...adjustments, sharpen })} />
      <View style={styles.toggles}>
        <Button accessibilityHint={labels.toggleHint} accessibilityLabel={labels.auto} label={labels.auto} testID={`${testID}-auto`} variant={adjustments.auto ? 'primary' : 'outline'} onPress={() => onChange({ ...adjustments, auto: !adjustments.auto })} />
        <Button accessibilityHint={labels.toggleHint} accessibilityLabel={labels.blackAndWhite} label={labels.blackAndWhite} testID={`${testID}-bw`} variant={adjustments.blackAndWhite ? 'primary' : 'outline'} onPress={() => onChange({ ...adjustments, blackAndWhite: !adjustments.blackAndWhite })} />
      </View>
    </View>
  );
}
