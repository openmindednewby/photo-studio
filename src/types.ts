export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Raster extends Size {
  readonly data: Uint8ClampedArray;
}

export interface Quad {
  readonly topLeft: Point;
  readonly topRight: Point;
  readonly bottomRight: Point;
  readonly bottomLeft: Point;
}

export interface Adjustments {
  readonly brightness: number;
  readonly contrast: number;
  readonly sharpen: number;
  readonly auto: boolean;
  readonly blackAndWhite: boolean;
}

export interface PhotoEdits {
  readonly quarterTurns: number;
  readonly quad: Quad | null;
  readonly adjustments: Adjustments;
}

export interface BackgroundRemovalProgress {
  readonly loadedBytes: number;
  readonly totalBytes: number | undefined;
}

export interface BackgroundRemovalPort {
  remove(photo: Blob, options: { readonly signal: AbortSignal; readonly onProgress?: (progress: BackgroundRemovalProgress) => void }): Promise<Blob>;
  isDownloaded?(): Promise<boolean>;
}
