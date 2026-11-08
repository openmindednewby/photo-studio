# Changelog

## 0.1.1

- The live camera stops when the page loses focus, is hidden or is left, and reopens on return.
- Forgetting a photo drops renders already running or queued.
- A disposed engine stays disposed; a restarted worker gets its photo back; worker requests run in order.
- Find edges shows the loading state; `isFindingEdges` on the controller.
- Exports `createLatestRunner`.

## 0.1.0

- First release: camera, gallery and drop capture, crop, rotate, edge detection with perspective straighten, filters, side-by-side result slot and a consent-gated background removal port, all on-device in a Web Worker.
