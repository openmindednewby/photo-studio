import { browserImageOps } from './browserImageOps';
import { transferablesOf } from './protocol';
import { createStudioSession } from './studioSession';

import type { StudioRequest, StudioResponse } from './protocol';

interface WorkerScope {
  onmessage: ((event: MessageEvent<StudioRequest>) => void) | null;
  postMessage(message: StudioResponse, transfer: Transferable[]): void;
}

const scope = self as unknown as WorkerScope;
const session = createStudioSession(browserImageOps);

scope.onmessage = (event) => {
  void session.handle(event.data).then((response) => scope.postMessage(response, transferablesOf(response)));
};
