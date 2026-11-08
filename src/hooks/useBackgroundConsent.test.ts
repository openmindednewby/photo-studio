import { act, renderHook } from '@testing-library/react';

import { useBackgroundConsent } from './useBackgroundConsent';

function setup(): { send: jest.Mock; onDone: jest.Mock; hook: ReturnType<typeof renderHook<ReturnType<typeof useBackgroundConsent>, unknown>> } {
  const send = jest.fn().mockResolvedValue(undefined);
  const onDone = jest.fn();
  return { send, onDone, hook: renderHook(() => useBackgroundConsent(send, onDone)) };
}

describe('useBackgroundConsent', () => {
  it('when asking, sends nothing and shows the notice', () => {
    const { send, hook } = setup();

    act(() => hook.result.current.ask());

    expect(send).not.toHaveBeenCalled();
    expect(hook.result.current.isAsking).toBe(true);
  });

  it('when cancelled, closes the notice without ever sending', () => {
    const { send, hook } = setup();
    act(() => hook.result.current.ask());

    act(() => hook.result.current.cancel());

    expect(send).not.toHaveBeenCalled();
    expect(hook.result.current.isAsking).toBe(false);
  });

  it('when confirmed, sends once and closes', async () => {
    const { send, onDone, hook } = setup();
    act(() => hook.result.current.ask());

    await act(() => hook.result.current.confirm());

    expect(send).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(hook.result.current.isAsking).toBe(false);
  });
});
