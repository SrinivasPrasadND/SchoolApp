import type { ApiError } from '@/types';

/** Narrow an RTK Query error into a friendly message + optional field errors. */
export function parseApiError(error: unknown): { message: string; fieldErrors?: Record<string, string> } {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: Partial<ApiError> }).data;
    if (data?.message) {
      return { message: data.message, fieldErrors: data.fieldErrors };
    }
  }
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: number | string }).status;
    if (status === 'FETCH_ERROR') {
      return { message: 'Network error. Please check your connection and try again.' };
    }
  }
  return { message: 'Something went wrong. Please try again.' };
}
