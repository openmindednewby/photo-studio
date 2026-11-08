import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';

import { Platform, View } from 'react-native';

import type { Raster } from '../types';

const FILL = { width: '100%', height: '100%', display: 'block' } as const;

export interface PhotoCanvasProps {
  readonly raster: Raster;
  readonly label: string;
  readonly testID: string;
}

export function PhotoCanvas({ raster, label, testID }: PhotoCanvasProps): ReactElement | null {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (context === null || context === undefined) return;
    context.putImageData(new ImageData(new Uint8ClampedArray(raster.data), raster.width, raster.height), 0, 0);
  }, [raster]);

  if (Platform.OS !== 'web') return null;
  return (
    <View style={{ aspectRatio: raster.width / raster.height, width: '100%' }} testID={testID}>
      <canvas ref={canvasRef} aria-label={label} height={raster.height} role="img" style={FILL} width={raster.width} />
    </View>
  );
}
