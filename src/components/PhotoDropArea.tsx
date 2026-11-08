import { useCallback, useState } from 'react';
import type { DragEvent, ReactElement, ReactNode } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { useUi } from '@dloizides/ui-feedback';

const GAP = 8;
const PADDING = 24;
const RADIUS = 8;
const BORDER = 2;
const TITLE_SIZE = 20;
const FORMAT_SIZE = 13;
const FILL = { flex: 1, display: 'flex' } as const;

const styles = StyleSheet.create({
  area: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: GAP, padding: PADDING, borderWidth: BORDER, borderStyle: 'dashed', borderRadius: RADIUS },
  title: { fontSize: TITLE_SIZE, fontWeight: '700', textAlign: 'center' },
  formats: { fontSize: FORMAT_SIZE, textAlign: 'center' },
});

export interface PhotoDropAreaProps {
  readonly title: string;
  readonly formats: string;
  readonly onFile: (file: File) => void;
  readonly children: ReactNode;
  readonly testID: string;
}

export function PhotoDropArea({ title, formats, onFile, children, testID }: PhotoDropAreaProps): ReactElement {
  const { theme } = useUi();
  const [isOver, setIsOver] = useState(false);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsOver(false);
      const file = event.dataTransfer.files[0];
      if (file !== undefined) onFile(file);
    },
    [onFile],
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsOver(true);
  }, []);

  return (
    <div data-testid={testID} style={FILL} onDragLeave={() => setIsOver(false)} onDragOver={onDragOver} onDrop={onDrop}>
      <View style={[styles.area, { borderColor: isOver ? theme.palette.primary['500'] : theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.formats, { color: theme.colors.textSecondary }]}>{formats}</Text>
        {children}
      </View>
    </div>
  );
}
