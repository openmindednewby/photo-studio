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
  const onReturn = (): void => {
    if (document.visibilityState === 'visible') onBack();
  };
  window.addEventListener('focus', onReturn);
  window.addEventListener('pageshow', onReturn);
  document.addEventListener('visibilitychange', onVisibility);
  return () => {
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('pagehide', onAway);
    window.removeEventListener('focus', onReturn);
    window.removeEventListener('pageshow', onReturn);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
