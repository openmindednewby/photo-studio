export interface CameraLabels {
  readonly close: string;
  readonly closeHint: string;
  readonly sessionNote: string;
  readonly shutter: string;
  readonly shutterHint: string;
  readonly gallery: string;
  readonly galleryHint: string;
  readonly flip: string;
  readonly flipHint: string;
  readonly flashOn: string;
  readonly flashOff: string;
  readonly flashHint: string;
  readonly viewfinder: string;
  readonly starting: string;
}

export interface SourceLabels {
  readonly takePhoto: string;
  readonly takePhotoHint: string;
  readonly choosePhoto: string;
  readonly choosePhotoHint: string;
  readonly dropTitle: string;
  readonly dropFormats: string;
  readonly deviceCamera: string;
  readonly deviceCameraHint: string;
  readonly cameraFailure: (failure: string) => string;
}

export interface CornerLabels {
  readonly topLeft: string;
  readonly topRight: string;
  readonly bottomRight: string;
  readonly bottomLeft: string;
  readonly hint: string;
  readonly photo: string;
}

export interface EditorLabels {
  readonly crop: string;
  readonly cropHint: string;
  readonly rotate: string;
  readonly rotateHint: string;
  readonly straighten: string;
  readonly straightenHint: string;
  readonly filters: string;
  readonly filtersHint: string;
  readonly background: string;
  readonly backgroundHint: string;
  readonly filtersTitle: string;
  readonly presetHint: string;
  readonly scan: string;
  readonly original: string;
  readonly bright: string;
  readonly blackAndWhite: string;
  readonly brightness: string;
  readonly contrast: string;
  readonly sharpen: string;
  readonly auto: string;
  readonly toggleHint: string;
  readonly findEdges: string;
  readonly findEdgesHint: string;
  readonly photoCaption: string;
  readonly changePhoto: string;
  readonly changePhotoHint: string;
  readonly backgroundNotice: string;
  readonly backgroundDownload: string;
  readonly backgroundDownloadHint: string;
  readonly backgroundDownloading: (percent: number) => string;
  readonly backgroundWorking: string;
  readonly backgroundCancel: string;
  readonly backgroundCancelHint: string;
  readonly corners: CornerLabels;
}

export interface PhotoStudioLabels {
  readonly onDevice: string;
  readonly working: string;
  readonly describeFailure: (failure: string) => string;
  readonly camera: CameraLabels;
  readonly source: SourceLabels;
  readonly editor: EditorLabels;
}
