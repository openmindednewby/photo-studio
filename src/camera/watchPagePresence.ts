export interface PagePresence {
  readonly hasStream: () => boolean;
  readonly onAway: () => void;
  readonly onBack: () => void;
}

/** Reports the page leaving and returning; a blur counts only once a stream is live. */
export function watchPagePresence({ hasStream, onAway, onBack }: PagePresence): () => void {
  if (typeof document === 'undefined') return () => undefined;
  const onBlur = (): void => {
    if (hasStream()) onAway();
  };
  const onVisibility = (): void => {
    if (document.visibilityState === 'hidden') onAway();
    else onBack();
  };
  window.addEventListener('blur', onBlur);
  window.addEventListener('pagehide', onAway);
  window.addEventListener('focus', onBack);
  window.addEventListener('pageshow', onBack);
  document.addEventListener('visibilitychange', onVisibility);
  return () => {
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('pagehide', onAway);
    window.removeEventListener('focus', onBack);
    window.removeEventListener('pageshow', onBack);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
