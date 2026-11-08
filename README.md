# @dloizides/photo-studio

Take or choose a photo and clean it up on the device, in a Web Worker: live camera with a framing guide, flash where the phone allows it, a fallback when the camera is refused, gallery, drag and drop, crop, rotate, edge detection with four draggable corners and perspective straighten, brightness, contrast, sharpen, auto and black and white.

Web only today: on native the canvas, camera and overlay parts render nothing.

## Use

Serve the worker from your origin. Copy `node_modules/@dloizides/photo-studio/dist/photo-studio-worker.js` into `public/` at build time.

```tsx
const engine = useMemo(() => createPhotoEngine(() => new Worker('/photo-studio-worker.js')), []);

<PhotoStudio
  engine={engine}
  labels={labels}
  renderResult={(output) => <YourPreview raster={output} />}
  onOutput={generate}
  backgroundRemoval={port}
  testID="photo"
/>;
```

- Every string comes through `labels`, so the package holds no copy.
- `renderResult` receives the edited RGBA raster and fills the pane beside the photo.
- `backgroundRemoval` is optional. Without it the tool is hidden. The photo stays on the device. When the port has `isDownloaded` and it answers false, the tool first shows the one-time `labels.editor.backgroundNotice` and downloads only after the user confirms; `onProgress` drives `labels.editor.backgroundDownloading`. `@dloizides/background-removal` fits the port: `{ remove: (photo, options) => removeBackground(photo, { ...options, assetBaseUrl }), isDownloaded: () => isBackgroundRemovalDownloaded({ assetBaseUrl }) }`.
- `describeFailure` and `cameraFailure` receive a code: `ImageDecodeFailure` values from `@dloizides/image-decode`, `PhotoEngineFailure` values, or `CameraFailure` values.

Theme comes from `FeedbackUiProvider` in `@dloizides/ui-feedback`.

The parts (`PhotoSourcePanel`, `LiveCamera`, `PhotoEditor`, `CornerEditor`, `usePhotoStudio`) and the pure image functions are exported for hosts that compose their own screen.
