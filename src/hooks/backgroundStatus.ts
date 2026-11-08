import type { EditorLabels } from '../labels';
import type { BackgroundRemovalProgress } from '../types';

const PERCENT = 100;

/** The line shown while the background tool runs: the download percentage, or working once nothing is left to fetch. */
export function backgroundStatusText(labels: Pick<EditorLabels, 'backgroundDownloading' | 'backgroundWorking'>, progress: BackgroundRemovalProgress | null): string {
  if (progress === null || progress.totalBytes === undefined || progress.loadedBytes >= progress.totalBytes) return labels.backgroundWorking;
  return labels.backgroundDownloading(Math.floor((progress.loadedBytes / progress.totalBytes) * PERCENT));
}
