import { createLatestRunner } from './createLatestRunner';

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('createLatestRunner', () => {
  it('with requests arriving while one runs, runs the first and only the latest after it', async () => {
    const seen: number[] = [];
    const gates: Array<() => void> = [];
    const runner = createLatestRunner<number>((value) => {
      seen.push(value);
      return new Promise((resolve) => gates.push(resolve));
    });

    runner.request(1);
    runner.request(2);
    runner.request(3);
    gates[0]();
    await flush();
    gates[1]();
    await flush();

    expect(seen).toEqual([1, 3]);
  });

  it('when a run rejects, still runs the waiting request', async () => {
    const seen: number[] = [];
    const runner = createLatestRunner<number>((value) => {
      seen.push(value);
      return value === 1 ? Promise.reject(new Error('no')) : Promise.resolve();
    });

    runner.request(1);
    runner.request(2);
    await flush();

    expect(seen).toEqual([1, 2]);
  });
});
