import { act, renderHook } from '@testing-library/react';

import { useBackgroundConsent } from './useBackgroundConsent';

function setup(isDownloaded: () => Promise<boolean> = () => Promise.resolve(false), send: jest.Mock = jest.fn().mockResolvedValue(undefined)): { send: jest.Mock; onDone: jest.Mock; hook: ReturnType<typeof renderHook<ReturnType<typeof useBackgroundConsent>, unknown>> } {
  const onDone = jest.fn();
  return { send, onDone, hook: renderHook(() => useBackgroundConsent(send, onDone, isDownloaded)) };
}

describe('useBackgroundConsent', () => {
  it('with the assets missing, shows the notice and starts nothing', async () => {
    const { send, hook } = setup();

    await act(() => hook.result.current.ask());

    expect(send).not.toHaveBeenCalled();
    expect(hook.result.current.isAsking).toBe(true);
  });

  it('with the assets already downloaded, runs once and never shows the notice', async () => {
    const { send, onDone, hook } = setup(() => Promise.resolve(true));

    await act(() => hook.result.current.ask());

    expect(send).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(hook.result.current.isAsking).toBe(false);
  });

  it('when the download check fails, shows the notice', async () => {
    const { send, hook } = setup(() => Promise.reject(new Error('blocked')));

    await act(() => hook.result.current.ask());

    expect(send).not.toHaveBeenCalled();
    expect(hook.result.current.isAsking).toBe(true);
  });

  it('while a removal runs, a second ask starts nothing', async () => {
    const send = jest.fn(() => new Promise<void>(() => undefined));
    const { hook } = setup(() => Promise.resolve(true), send);
    await act(async () => {
      void hook.result.current.ask();
    });

    await act(() => hook.result.current.ask());

    expect(send).toHaveBeenCalledTimes(1);
    expect(hook.result.current.isWorking).toBe(true);
  });

  it('when cancelled, closes the notice without ever starting', async () => {
    const { send, hook } = setup();
    await act(() => hook.result.current.ask());

    act(() => hook.result.current.cancel());

    expect(send).not.toHaveBeenCalled();
    expect(hook.result.current.isAsking).toBe(false);
  });

  it('when confirmed, runs once and closes', async () => {
    const { send, onDone, hook } = setup();
    await act(() => hook.result.current.ask());

    await act(() => hook.result.current.confirm());

    expect(send).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(hook.result.current.isAsking).toBe(false);
    expect(hook.result.current.isWorking).toBe(false);
  });
});
