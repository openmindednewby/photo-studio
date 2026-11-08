import { backgroundStatusText } from './backgroundStatus';

const LABELS = { backgroundWorking: 'working', backgroundDownloading: (percent: number): string => `${percent}%` };

describe('backgroundStatusText', () => {
  it('with no progress reported, says working', () => {
    const text = backgroundStatusText(LABELS, null);

    expect(text).toBe('working');
  });

  it('part way through a sized download, shows the whole percentage', () => {
    const text = backgroundStatusText(LABELS, { loadedBytes: 339, totalBytes: 1000 });

    expect(text).toBe('33%');
  });

  it('with the download finished, says working', () => {
    const text = backgroundStatusText(LABELS, { loadedBytes: 1000, totalBytes: 1000 });

    expect(text).toBe('working');
  });

  it('with an unknown total, says working', () => {
    const text = backgroundStatusText(LABELS, { loadedBytes: 10, totalBytes: undefined });

    expect(text).toBe('working');
  });
});
