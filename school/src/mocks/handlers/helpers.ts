import { HttpResponse, delay } from 'msw';
import { database } from '../db/database';
import type { User } from '@/types';

/** Simulated network latency range (ms). */
export async function networkDelay(): Promise<void> {
  await delay(200 + Math.random() * 400);
}

export function ok<T>(data: T, init?: ResponseInit) {
  return HttpResponse.json(data as Parameters<typeof HttpResponse.json>[0], { status: 200, ...init });
}

export function created<T>(data: T) {
  return HttpResponse.json(data as Parameters<typeof HttpResponse.json>[0], { status: 201 });
}

export function noContent() {
  return new HttpResponse(null, { status: 204 });
}

export function error(status: number, message: string, fieldErrors?: Record<string, string>) {
  return HttpResponse.json({ status, message, fieldErrors }, { status });
}

export const badRequest = (message: string, fieldErrors?: Record<string, string>) =>
  error(400, message, fieldErrors);
export const unauthorized = (message = 'Authentication required.') => error(401, message);
export const forbidden = (message = 'You do not have access to this resource.') =>
  error(403, message);
export const notFound = (message = 'Resource not found.') => error(404, message);
export const serverError = (message = 'Something went wrong. Please try again.') =>
  error(500, message);

/**
 * Resolve the authenticated user from the Authorization header. The mock token
 * format is `mock-token.<userId>`.
 */
export function getAuthUser(request: Request): User | null {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length);
  const userId = token.split('.')[1];
  return database.data.users.find((u) => u.id === userId) ?? null;
}
