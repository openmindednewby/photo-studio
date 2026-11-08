import { bandColors } from './bandColors';

const COLORS = { background: 'bg', surface: 's', surfaceElevated: 'se', text: 'tx', textSecondary: 'ts', border: 'b' };

describe('bandColors', () => {
  it('with a neutral scale, uses its darkest and lightest steps', () => {
    const palette = { primary: { '500': 'p' }, neutral: { '500': 'n', '900': 'dark', '50': 'light' } };

    const colors = bandColors({ colors: COLORS, palette, semantic: { error: { '500': 'e' } } });

    expect(colors).toEqual({ band: 'dark', ink: 'light' });
  });

  it('with no neutral scale, pairs text and background so contrast holds in both modes', () => {
    const palette = { primary: { '500': 'p' } };

    const colors = bandColors({ colors: COLORS, palette, semantic: { error: { '500': 'e' } } });

    expect(colors).toEqual({ band: 'tx', ink: 'bg' });
  });
});
