import { watchPagePresence } from './watchPagePresence';

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
}

describe('watchPagePresence', () => {
  const onAway = jest.fn();
  const onBack = jest.fn();
  let stop: () => void = () => undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    setVisibility('visible');
    stop = watchPagePresence({ hasStream: () => true, onAway, onBack });
  });

  afterEach(() => {
    stop();
    setVisibility('visible');
  });

  it.each(['focus', 'pageshow'])('with %s while the page is hidden, does not report back', (eventName) => {
    setVisibility('hidden');

    window.dispatchEvent(new Event(eventName));

    expect(onBack).not.toHaveBeenCalled();
  });

  it.each(['focus', 'pageshow'])('with %s while the page is visible, reports back', (eventName) => {
    setVisibility('visible');

    window.dispatchEvent(new Event(eventName));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('with the page turning visible again, reports back', () => {
    setVisibility('visible');

    document.dispatchEvent(new Event('visibilitychange'));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onAway).not.toHaveBeenCalled();
  });
});
