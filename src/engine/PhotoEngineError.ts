import { PhotoEngineFailure } from './PhotoEngineFailure';

export class PhotoEngineError extends Error {
  public readonly failure: string;

  public constructor(failure: string) {
    super(`photo engine failed: ${failure}`);
    this.name = 'PhotoEngineError';
    this.failure = failure;
  }
}

export function failureOf(error: unknown): string {
  return error instanceof PhotoEngineError ? error.failure : PhotoEngineFailure.RenderFailed;
}
