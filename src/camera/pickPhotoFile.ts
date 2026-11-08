const IMAGE_ACCEPT = 'image/*';
const PICKER_ATTRIBUTE = 'data-photo-studio-picker';
const BACK_CAMERA = 'environment';

export interface PickPhotoOptions {
  readonly capture?: boolean;
}

function removeStalePickers(): void {
  document.querySelectorAll(`input[${PICKER_ATTRIBUTE}]`).forEach((input) => input.remove());
}

export function pickPhotoFile(options: PickPhotoOptions = {}): Promise<File | null> {
  if (typeof document === 'undefined') return Promise.resolve(null);
  removeStalePickers();
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = IMAGE_ACCEPT;
    input.hidden = true;
    input.setAttribute(PICKER_ATTRIBUTE, '');
    if (options.capture === true) input.setAttribute('capture', BACK_CAMERA);
    const finish = (file: File | null): void => {
      input.remove();
      resolve(file);
    };
    input.addEventListener('change', () => finish(input.files?.[0] ?? null), { once: true });
    input.addEventListener('cancel', () => finish(null), { once: true });
    document.body.appendChild(input);
    input.click();
  });
}
