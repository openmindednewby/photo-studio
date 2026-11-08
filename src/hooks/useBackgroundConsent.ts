import { useCallback, useState } from 'react';

export interface BackgroundConsent {
  readonly isAsking: boolean;
  readonly isWorking: boolean;
  readonly ask: () => Promise<void>;
  readonly cancel: () => void;
  readonly confirm: () => Promise<void>;
}

export function useBackgroundConsent(send: () => Promise<void>, onDone: () => void, isDownloaded: () => Promise<boolean>): BackgroundConsent {
  const [isAsking, setIsAsking] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  const confirm = useCallback(async () => {
    setIsWorking(true);
    await send();
    setIsWorking(false);
    setIsAsking(false);
    onDone();
  }, [send, onDone]);

  const ask = useCallback(async () => {
    if (isWorking) return;
    const downloaded = await isDownloaded().catch(() => false);
    if (downloaded) await confirm();
    else setIsAsking(true);
  }, [isWorking, isDownloaded, confirm]);

  const cancel = useCallback(() => {
    setIsAsking(false);
    onDone();
  }, [onDone]);

  return { isAsking, isWorking, ask, cancel, confirm };
}
