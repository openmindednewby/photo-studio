import { Platform, useWindowDimensions } from 'react-native';

import { isWideWebViewport } from '@dloizides/ui-layout';

export function useIsWide(): boolean {
  const { width } = useWindowDimensions();
  return isWideWebViewport(width, Platform.OS);
}
