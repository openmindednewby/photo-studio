import type { useUi } from '@dloizides/ui-feedback';

type Theme = ReturnType<typeof useUi>['theme'];

export interface BandColors {
  readonly band: string;
  readonly ink: string;
}

export function bandColors(theme: Theme): BandColors {
  const neutral = theme.palette['neutral'];
  return { band: neutral?.['900'] ?? theme.colors.text, ink: neutral?.['50'] ?? theme.colors.background };
}
