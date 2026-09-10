import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from '@/mocks/server';

// In the Node test environment there is no `location`; MSW needs one to resolve
// relative handler paths (e.g. '/api/auth/login') against a base origin.
const globalScope = globalThis as unknown as { location?: unknown };
if (typeof window === 'undefined' && typeof globalScope.location === 'undefined') {
  globalScope.location = new URL('http://localhost/');
}

// Start the MSW request-mocking server for the test suite.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  // DOM-specific teardown only applies in the jsdom environment.
  if (typeof window !== 'undefined') {
    cleanup();
    window.localStorage.clear();
  }
});

afterAll(() => server.close());
