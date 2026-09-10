# Backend Integration Guide

This prototype is designed so the mocked API (MSW) can be replaced by a real backend with **minimal, localized changes**. UI components and RTK Query endpoint definitions do not change — only the transport layer and environment configuration do.

## 1. API base URL configuration

The base URL comes from `VITE_API_BASE_URL` (see [src/constants/index.ts](../src/constants/index.ts)) and is resolved to an absolute URL in [src/services/api/baseApi.ts](../src/services/api/baseApi.ts).

To point at a real backend, set it in `.env`:

```bash
VITE_API_BASE_URL=https://api.yourschool.com/v1
VITE_ENABLE_MOCKS=false
```

Setting `VITE_ENABLE_MOCKS=false` prevents `main.tsx` from starting the MSW worker, so requests hit the network instead.

## 2. Disable the mocks

- Development: set `VITE_ENABLE_MOCKS=false`.
- Production builds: never enable mocks. `enableMocking()` already no-ops unless the flag is exactly `'true'`.
- Optionally delete `public/mockServiceWorker.js` and `src/mocks/**` once the backend is live.

## 3. Authentication token handling

The mock uses a token of the form `mock-token.<userId>`. Real backends typically return a JWT.

- The token is stored in the `auth` slice and persisted to `localStorage` (`src/features/auth/authSlice.ts`).
- It is attached to every request by `prepareHeaders` in `baseApi.ts`:

  ```ts
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.session?.token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }
  ```

For refresh tokens / 401 handling, wrap the base query (see next section).

## 4. RTK Query base query replacement

All endpoints share one base query. To add token refresh, error normalization, or retries, replace `fetchBaseQuery` with a wrapper in `baseApi.ts`:

```ts
import { fetchBaseQuery, type BaseQueryFn } from '@reduxjs/toolkit/query/react';

const rawBaseQuery = fetchBaseQuery({ baseUrl: API_BASE_URL, prepareHeaders });

const baseQueryWithReauth: BaseQueryFn = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    // attempt refresh, then retry once
    const refresh = await rawBaseQuery({ url: '/auth/refresh', method: 'POST' }, api, extraOptions);
    if (refresh.data) {
      api.dispatch(setCredentials(refresh.data));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }
  return result;
};
```

Then pass `baseQuery: baseQueryWithReauth` to `createApi`. **No endpoint or component changes are required.**

## 5. Endpoint migration

The endpoint contracts are defined once in [src/services/api/endpoints.ts](../src/services/api/endpoints.ts). Align your backend routes with the paths already used, or update the `query` functions to match your API. Current routes:

| Domain        | Method(s) & path                                                        |
| ------------- | ----------------------------------------------------------------------- |
| Auth          | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`                  |
| System        | `POST /system/reset` (drop for real backend)                            |
| Classes       | `GET /classes`                                                          |
| Students      | `GET /students`, `GET /students/:id`                                    |
| Staff         | `GET /staff`, `GET /staff/:id`                                          |
| Timetable     | `GET /timetable`                                                        |
| Attendance    | `GET /attendance`, `POST /attendance`, `DELETE /attendance/:id`         |
| Fee structures| `GET/POST /fee-structures`, `GET/PUT/DELETE /fee-structures/:id`        |
| Student fees  | `GET /student-fees`                                                     |
| Payments      | `GET /payments`, `POST /payments`                                       |
| Announcements | `GET/POST /announcements`, `POST /announcements/:id/read`               |
| Homework      | `GET/POST /homework`, `POST /homework/:id/complete`                     |
| Notes         | `GET/POST /notes`, `PUT/DELETE /notes/:id`, `POST /notes/:id/review`    |
| Activities    | `GET /activities`                                                       |
| Leaves        | `GET/POST /leaves`, `PATCH /leaves/:id`                                 |
| Notifications | `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all` |
| Dashboard     | `GET /dashboard/admin`                                                  |

If your backend uses different paths, change only the `query` functions — the generated hooks and all callers stay the same.

## 6. Request and response contracts

Request/response shapes are the TypeScript interfaces in [src/types/index.ts](../src/types/index.ts) (e.g. `LoginResponse`, `Student`, `StudentFee`, `LeaveRequest`, `DashboardMetrics`). Keep your backend responses aligned with these interfaces, or adapt them via a `transformResponse` on individual endpoints:

```ts
getStudents: builder.query<Student[], void>({
  query: () => '/students',
  transformResponse: (raw: BackendStudent[]) => raw.map(mapBackendStudent),
}),
```

## 7. Error mapping

The mock returns `{ status, message, fieldErrors? }`. `parseApiError` ([src/utils/apiError.ts](../src/utils/apiError.ts)) turns RTK Query errors into a friendly message and per-field errors used by forms. If your backend uses a different error envelope, update `parseApiError` in one place.

Recommended server contract:

```json
{ "status": 400, "message": "Validation failed", "fieldErrors": { "amount": "Must be positive" } }
```

## 8. File-upload integration

Attachments are currently mocked (`MockAttachment`) and "downloads" show a toast (`AttachmentList`). For real uploads:

1. Add a multipart `upload` mutation (e.g. `POST /files`) returning a stored file descriptor.
2. Replace the mock attachment placeholders in forms (notes, homework, leave, announcements) with a real file input that uploads and stores the returned descriptor.
3. Point `AttachmentList` at real file URLs for download instead of the toast.

## 9. Environment variables

Defined in `.env` (see `.env.example`):

| Variable              | Purpose                                     |
| --------------------- | ------------------------------------------- |
| `VITE_API_BASE_URL`   | Base URL for API requests                   |
| `VITE_ENABLE_MOCKS`   | `true` to run MSW; `false` for a real API   |
| `VITE_APP_NAME`       | Display name used across the UI             |

Never commit real secrets. Only expose values that are safe for the browser (all `VITE_`-prefixed vars are bundled client-side).

## 10. Security considerations

- **Do not store long-lived secrets in `localStorage`.** For production, prefer short-lived access tokens with refresh, and consider `httpOnly` cookies for the refresh token.
- Enforce **authorization on the server** — the client-side role guards and MSW scoping are convenience/UX layers, not a security boundary.
- Validate all input server-side (mirror the Zod rules). Client validation is for UX only.
- Enable CORS appropriately and use HTTPS in production.
- Sanitize/escape any user-generated content (announcements, notes) on render and on the server.
- Apply rate limiting and audit logging on sensitive mutations (payments, leave approvals).
