import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';

import { Platform, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

import { useUi } from '@dloizides/ui-feedback';

import { bandColors } from './bandColors';
import { CornerHandle } from './CornerHandle';
import { PhotoCanvas } from './PhotoCanvas';
import { CornerName } from '../processing/CornerName';
import { moveCorner } from '../processing/quad';

import type { CornerLabels } from '../labels';
import type { CornerMode } from '../processing/CornerMode';
import type { Point, Quad, Raster, Size } from '../types';

const CORNERS = [CornerName.TopLeft, CornerName.TopRight, CornerName.BottomRight, CornerName.BottomLeft] as const;
const OVERLAY = { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' } as const;
const LINE_WIDTH = 2;

export interface CornerEditorProps {
  readonly raster: Raster;
  readonly quad: Quad;
  readonly mode: CornerMode;
  readonly onCommit: (quad: Quad) => void;
  readonly labels: CornerLabels;
  readonly testID: string;
}

export function CornerEditor({ raster, quad, mode, onCommit, labels, testID }: CornerEditorProps): ReactElement {
  const { theme } = useUi();
  const { band, ink } = bandColors(theme);
  const [draft, setDraft] = useState(quad);
  const [box, setBox] = useState<Size>({ width: 0, height: 0 });
  const draftRef = useRef(draft);

  useEffect(() => {
    draftRef.current = quad;
    setDraft(quad);
  }, [quad]);

  const onMove = useCallback(
    (corner: CornerName, target: Point) => {
      const next = moveCorner(draftRef.current, corner, target, mode);
      draftRef.current = next;
      setDraft(next);
    },
    [mode],
  );

  const onRelease = useCallback(() => {
    if (draftRef.current !== quad) onCommit(draftRef.current);
  }, [onCommit, quad]);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox({ width, height });
  }, []);
  const points = CORNERS.map((corner) => `${draft[corner].x},${draft[corner].y}`).join(' ');

  return (
    <View testID={testID} onLayout={onLayout}>
      <PhotoCanvas label={labels.photo} raster={raster} testID={`${testID}-photo`} />
      {Platform.OS === 'web' ? (
        <svg preserveAspectRatio="none" style={OVERLAY} viewBox="0 0 1 1">
          <polygon fill="none" points={points} stroke={ink} strokeWidth={LINE_WIDTH} vectorEffect="non-scaling-stroke" />
        </svg>
      ) : null}
      {CORNERS.map((corner) => (
        <CornerHandle
          key={corner}
          box={box}
          corner={corner}
          fill={ink}
          hint={labels.hint}
          label={labels[corner]}
          point={draft[corner]}
          stroke={band}
          testID={`${testID}-corner-${corner}`}
          onMove={onMove}
          onRelease={onRelease}
        />
      ))}
    </View>
  );
}
