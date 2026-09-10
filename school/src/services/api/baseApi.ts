import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '@/constants';
import type { RootState } from '@/app/store';

// Node/undici (used by tests) requires absolute URLs, while browsers resolve
// relative paths against the document origin. Prefixing the origin works in both.
const resolvedBaseUrl =
  typeof window !== 'undefined'
    ? `${window.location.origin}${API_BASE_URL}`
    : `http://localhost${API_BASE_URL}`;

/**
 * Central RTK Query API definition. Every feature injects its endpoints into
 * this single API so caching and invalidation are coordinated. Replacing the
 * mock backend later only requires changing `API_BASE_URL` / baseQuery.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: resolvedBaseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'Auth',
    'Student',
    'Staff',
    'Parent',
    'Class',
    'Attendance',
    'FeeStructure',
    'StudentFee',
    'Payment',
    'Announcement',
    'Homework',
    'Note',
    'Activity',
    'Timetable',
    'Leave',
    'Notification',
    'Dashboard',
  ],
  endpoints: () => ({}),
});
