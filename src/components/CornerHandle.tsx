import { useMemo, useRef } from 'react';
import type { ReactElement } from 'react';

import { PanResponder, StyleSheet, View } from 'react-native';
import type { ViewProps, ViewStyle } from 'react-native';

import type { CornerName } from '../processing/CornerName';
import type { Point, Size } from '../types';

const HIT_BOX = 44;
const MARK_SIZE = 20;
const MARK_BORDER = 2;
const NUDGE = 0.01;
const TOUCH_NONE = { touchAction: 'none' } as unknown as ViewStyle;
const ARROWS: Readonly<Record<string, Point | undefined>> = {
  ArrowLeft: { x: -NUDGE, y: 0 },
  ArrowRight: { x: NUDGE, y: 0 },
  ArrowUp: { x: 0, y: -NUDGE },
  ArrowDown: { x: 0, y: NUDGE },
};

const styles = StyleSheet.create({
  box: { position: 'absolute', width: HIT_BOX, height: HIT_BOX, alignItems: 'center', justifyContent: 'center' },
  mark: { width: MARK_SIZE, height: MARK_SIZE, borderWidth: MARK_BORDER },
});

export interface CornerHandleProps {
  readonly corner: CornerName;
  readonly point: Point;
  readonly box: Size;
  readonly fill: string;
  readonly stroke: string;
  readonly label: string;
  readonly hint: string;
  readonly testID: string;
  readonly onMove: (corner: CornerName, target: Point) => void;
  readonly onRelease: () => void;
}

export function CornerHandle({ corner, point, box, fill, stroke, label, hint, testID, onMove, onRelease }: CornerHandleProps): ReactElement {
  const pointRef = useRef(point);
  pointRef.current = point;
  const startRef = useRef(point);
  const boxRef = useRef(box);
  boxRef.current = box;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startRef.current = pointRef.current;
        },
        onPanResponderMove: (_event, gesture) => {
          onMove(corner, { x: startRef.current.x + gesture.dx / boxRef.current.width, y: startRef.current.y + gesture.dy / boxRef.current.height });
        },
        onPanResponderRelease: onRelease,
        onPanResponderTerminate: onRelease,
      }),
    [corner, onMove, onRelease],
  );

  const keyProps = {
    onKeyDown: (event: { key: string; preventDefault: () => void }): void => {
      const arrow = ARROWS[event.key];
      if (arrow === undefined) return;
      event.preventDefault();
      onMove(corner, { x: pointRef.current.x + arrow.x, y: pointRef.current.y + arrow.y });
      onRelease();
    },
  } as ViewProps;

  return (
    <View
      {...responder.panHandlers}
      {...keyProps}
      focusable
      accessibilityHint={hint}
      accessibilityLabel={label}
      accessibilityRole="adjustable"
      style={[styles.box, TOUCH_NONE, { left: point.x * box.width - HIT_BOX / 2, top: point.y * box.height - HIT_BOX / 2 }]}
      testID={testID}
    >
      <View style={[styles.mark, { backgroundColor: fill, borderColor: stroke }]} />
    </View>
  );
}
