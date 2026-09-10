import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Used by Vitest tests to intercept fetch calls in a Node environment.
export const server = setupServer(...handlers);
