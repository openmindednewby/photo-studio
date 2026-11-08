import { pickPhotoFile } from './pickPhotoFile';

function openedInput(): HTMLInputElement {
  return document.querySelector('input[data-photo-studio-picker]') as HTMLInputElement;
}

describe('pickPhotoFile', () => {
  beforeEach(() => {
    jest.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('with capture on, asks for the back camera', () => {
    const options = { capture: true };

    void pickPhotoFile(options);

    expect(openedInput().getAttribute('capture')).toBe('environment');
  });

  it('with no options, offers the gallery with no capture attribute', () => {
    const options = {};

    void pickPhotoFile(options);

    expect(openedInput().hasAttribute('capture')).toBe(false);
  });

  it('while the chooser is open, keeps the input attached to the document', () => {
    const options = {};

    void pickPhotoFile(options);

    expect(document.body.contains(openedInput())).toBe(true);
  });

  it('when a file is chosen, resolves it and removes the input', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    const pending = pickPhotoFile();
    const input = openedInput();
    Object.defineProperty(input, 'files', { value: [file] });

    input.dispatchEvent(new Event('change'));

    await expect(pending).resolves.toBe(file);
    expect(openedInput()).toBeNull();
  });

  it('when cancelled, resolves null', async () => {
    const pending = pickPhotoFile();

    openedInput().dispatchEvent(new Event('cancel'));

    await expect(pending).resolves.toBeNull();
  });
});
