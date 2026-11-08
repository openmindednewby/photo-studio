# Changelog

## 0.1.3

- The live camera reports the page as back only when it is visible: a `focus` or `pageshow` on a hidden page no longer reopens it.

## 0.1.2

- Background removal is on-device: `leftDevice` is gone from the controller and the labels.
- The notice is a one-time download notice: `backgroundSend` and `backgroundSendHint` are now `backgroundDownload` and `backgroundDownloadHint`, and new `backgroundDownloading` and `backgroundWorking` labels report progress.
- `BackgroundRemovalPort` gains `onProgress` and an optional `isDownloaded`; when it answers true the tool runs with no notice.
- The 60 s background limit now restarts on every progress report, so a slow first download is not cut off.

## 0.1.1

- The live camera stops when the page loses focus, is hidden or is left, and reopens on return.
- Forgetting a photo drops renders already running or queued.
- A disposed engine stays disposed; a restarted worker gets its photo back; worker requests run in order.
- Find edges shows the loading state; `isFindingEdges` on the controller.
- Exports `createLatestRunner`.

## 0.1.0

- First release: camera, gallery and drop capture, crop, rotate, edge detection with perspective straighten, filters, side-by-side result slot and a consent-gated background removal port, all on-device in a Web Worker.
