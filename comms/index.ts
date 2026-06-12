// Polyfill WebSocket global for Node.js runtimes that don't provide the Web API
// Must run before importing modules that expect a global `WebSocket`.
try {
  if (typeof (globalThis as any).WebSocket === 'undefined') {
    // Use the 'ws' package as a lightweight WebSocket implementation
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const WebSocketImpl = require('ws');
    (globalThis as any).WebSocket = WebSocketImpl;
  }
} catch (polyfillErr) {
  // If polyfill fails, we continue — the startup will show a clear error later.
  // Log a warning to help debugging in CI/container logs.
  // eslint-disable-next-line no-console
  console.warn('WebSocket polyfill failed:', polyfillErr?.message || polyfillErr);
}

import { run } from './email_sender';

run().catch(err => {
  console.error('Fatal error in comms:', err?.message || err);
  process.exit(1);
});

export default run;
