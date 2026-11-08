import { useCallback, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@dloizides/ui-buttons';
import { useUi } from '@dloizides/ui-feedback';

import { AdjustPanel } from './AdjustPanel';
import { BackgroundNotice } from './BackgroundNotice';
import { CornerEditor } from './CornerEditor';
import { FilterPreviewRow } from './FilterPreviewRow';
import { PhotoCanvas } from './PhotoCanvas';
import { StudioTool } from './StudioTool';
import { ToolBar } from './ToolBar';
import { useBackgroundConsent } from '../hooks/useBackgroundConsent';
import { useIsWide } from '../hooks/useIsWide';
import { CornerMode } from '../processing/CornerMode';
import { insetQuad } from '../processing/quad';

import type { PhotoStudioController } from '../hooks/usePhotoStudio';
import type { EditorLabels } from '../labels';
import type { Raster } from '../types';

const GAP = 12;
const CAPTION_SIZE = 13;
const DISPLAY_INSET = 0.04;
const DEFAULT_QUAD = insetQuad(DISPLAY_INSET);

const styles = StyleSheet.create({
  root: { gap: GAP },
  panes: { flexDirection: 'row', gap: GAP, alignItems: 'flex-start' },
  pane: { flex: 1, minWidth: 0, gap: GAP / 2 },
  caption: { fontSize: CAPTION_SIZE },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
});

export interface PhotoEditorProps {
  readonly studio: PhotoStudioController;
  readonly labels: EditorLabels;
  readonly showBackground: boolean;
  readonly renderResult: (output: Raster) => ReactNode;
  readonly testID: string;
}

export function PhotoEditor({ studio, labels, showBackground, renderResult, testID }: PhotoEditorProps): ReactElement | null {
  const { theme } = useUi();
  const isWide = useIsWide();
  const [tool, setTool] = useState(StudioTool.Crop);
  const backToCrop = useCallback(() => setTool(StudioTool.Crop), []);
  const consent = useBackgroundConsent(studio.removeBackground, backToCrop);
  const { view, output, edits, findEdges, setQuad } = studio;

  const onSelect = useCallback(
    (next: StudioTool) => {
      setTool(next);
      if (next === StudioTool.Background) consent.ask();
      if (next === StudioTool.Straighten && edits.quad === null) void findEdges();
    },
    [consent, edits.quad, findEdges],
  );

  if (view === null || output === null) return null;
  const isCornerTool = tool === StudioTool.Crop || tool === StudioTool.Straighten;
  const toolBar = <ToolBar labels={labels} showBackground={showBackground} testID={`${testID}-tools`} tool={tool} onRotate={studio.rotate} onSelect={onSelect} />;
  const panes = (
    <View style={styles.panes}>
      <View style={styles.pane}>
        {isCornerTool ? (
          <CornerEditor labels={labels.corners} mode={tool === StudioTool.Crop ? CornerMode.Rectangle : CornerMode.Free} quad={edits.quad ?? DEFAULT_QUAD} raster={view} testID={`${testID}-corners`} onCommit={setQuad} />
        ) : (
          <PhotoCanvas label={labels.corners.photo} raster={output} testID={`${testID}-photo`} />
        )}
        <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>{labels.photoCaption}</Text>
      </View>
      <View style={styles.pane} testID={`${testID}-result`}>{renderResult(output)}</View>
    </View>
  );
  const previews = <FilterPreviewRow labels={labels} previews={studio.previews} selected={studio.preset} testID={`${testID}-presets`} onSelect={studio.applyPreset} />;
  const footer = (
    <View style={styles.footer}>
      {tool === StudioTool.Straighten ? <Button accessibilityHint={labels.findEdgesHint} accessibilityLabel={labels.findEdges} label={labels.findEdges} loading={studio.isFindingEdges} testID={`${testID}-find-edges`} variant="outline" onPress={findEdges} /> : null}
      <Button accessibilityHint={labels.changePhotoHint} accessibilityLabel={labels.changePhoto} label={labels.changePhoto} testID={`${testID}-change`} variant="outline" onPress={studio.clear} />
    </View>
  );
  const panel = (
    <>
      {tool === StudioTool.Filters ? <AdjustPanel adjustments={edits.adjustments} labels={labels} testID={`${testID}-adjust`} onChange={studio.setAdjustments} /> : null}
      {tool === StudioTool.Background && consent.isAsking ? <BackgroundNotice labels={labels} testID={`${testID}-background`} onCancel={consent.cancel} onSend={consent.confirm} /> : null}
    </>
  );

  return (
    <View style={styles.root} testID={testID}>
      {isWide ? toolBar : null}
      {panes}
      {previews}
      {isWide ? null : toolBar}
      {panel}
      {footer}
    </View>
  );
}
