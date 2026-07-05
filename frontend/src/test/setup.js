import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom lacks ResizeObserver (used by the chart size hook) — provide a no-op polyfill.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver || ResizeObserverStub;

// Unmount React trees between tests to avoid cross-test leakage.
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
