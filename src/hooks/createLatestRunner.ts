export interface LatestRunner<T> {
  request(input: T): void;
}

export function createLatestRunner<T>(run: (input: T) => Promise<void>): LatestRunner<T> {
  let busy = false;
  let hasNext = false;
  let next: T | undefined;

  const drain = async (first: T): Promise<void> => {
    busy = true;
    let current = first;
    for (;;) {
      await run(current).catch(() => undefined);
      if (!hasNext) break;
      hasNext = false;
      current = next as T;
    }
    busy = false;
  };

  return {
    request: (input) => {
      if (busy) {
        hasNext = true;
        next = input;
        return;
      }
      void drain(input);
    },
  };
}
