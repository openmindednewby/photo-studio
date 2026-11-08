import { useCallback, useState } from 'react';

export interface BackgroundConsent {
  readonly isAsking: boolean;
  readonly ask: () => void;
  readonly cancel: () => void;
  readonly confirm: () => Promise<void>;
}

export function useBackgroundConsent(send: () => Promise<void>, onDone: () => void): BackgroundConsent {
  const [isAsking, setIsAsking] = useState(false);

  const ask = useCallback(() => setIsAsking(true), []);

  const cancel = useCallback(() => {
    setIsAsking(false);
    onDone();
  }, [onDone]);

  const confirm = useCallback(async () => {
    await send();
    setIsAsking(false);
    onDone();
  }, [send, onDone]);

  return { isAsking, ask, cancel, confirm };
}
