# Architecture

This document describes the high-level architecture of the School Management App prototype.

## High-level overview

The app is a single-page React application. It is intentionally structured so the **mock API layer (MSW) can be replaced by a real backend** without touching UI components or business logic. The key idea: components never call `fetch` or `localStorage` directly — they go through **RTK Query hooks** (server state) and Redux slices / a storage abstraction (client state).

```
UI components ──► RTK Query hooks ──► fetchBaseQuery ──► (MSW handlers) ──► mock DB ──► localStorage
       │
       └────────► Redux slices (auth, ui) ──► storage abstraction ──► localStorage
```

Replacing MSW with a real API only requires changing the base query / base URL — the RTK Query endpoint definitions and every component stay the same.

## Folder structure

```
src/
  app/                # store, typed hooks, router
    store.ts          # configureStore + makeStore() factory (tests)
    hooks.ts          # useAppDispatch / useAppSelector
    router.tsx        # route tree with guards & layouts
  components/
    common/           # design system primitives (Button, Modal, DataTable, ...)
    charts/           # ChartCard wrapper
    forms/            # RHF-friendly field components
    feedback/         # Loading, States, Toaster, ErrorBoundary
    layout/           # AppShell (sidebar + topbar + mobile nav)
    navigation/       # nav config, NotificationBell, ChildSelector
    routing/          # RequireAuth, RequireRole, GuestOnlyRoute
  constants/          # labels, enums, demo creds, storage keys
  features/
    auth/authSlice.ts # session state (persisted)
    ui/uiSlice.ts     # theme, selected child, toasts (partially persisted)
    activities/       # ActivityAgenda (shared)
    announcements/    # AnnouncementsFeed (shared)
    timetable/        # TimetableView (shared)
  hooks/              # useAuth, useToast, useSelectedStudent
  layouts/            # AdminLayout / PortalLayout / StaffLayout
  mocks/
    browser.ts        # setupWorker (dev)
    server.ts         # setupServer (tests)
    handlers/         # MSW request handlers by domain
    data/seed.ts      # seed data generator
    db/database.ts    # in-memory DB persisted to localStorage
  pages/
    admin/ portal/ staff/ auth/ shared/
  schemas/            # Zod schemas + inferred form types
  services/
    api/              # baseApi + injected endpoints
    storage/          # persistence abstraction over localStorage
  styles/             # Tailwind entry + component classes
  tests/              # setup + test utilities + specs
  types/              # shared domain & API contracts
  utils/              # formatting, dates, csv, pagination, etc.
```

## Component hierarchy

```
App (Provider + RouterProvider + Toaster)
 └─ Route guards (RequireAuth → RequireRole)
     └─ Role layout (AdminLayout | PortalLayout | StaffLayout)
         └─ AppShell (sidebar, topbar, mobile bottom nav, ErrorBoundary)
             └─ <Outlet /> → page component
                 └─ design-system components (PageHeader, StatCard, DataTable, charts…)
```

## Routing approach

- Declarative route tree via `createBrowserRouter` in [src/app/router.tsx](../src/app/router.tsx).
- **Nested routes with role-specific layouts**: `/admin/*`, `/portal/*`, `/staff/*`.
- Guards compose as parent routes:
  - `RequireAuth` — redirects unauthenticated users to `/login` (preserving the intended destination).
  - `RequireRole` — redirects users without the required role to `/unauthorized`.
  - `GuestOnlyRoute` — keeps authenticated users out of `/login`, sending them to their role home.
- `/` redirects to `/login`; unknown routes render the 404 page.

Authorization is enforced at the **route level**, not merely by hiding nav links, so directly typing a forbidden URL still blocks access.

## Authentication flow

1. User submits the login form (validated by Zod).
2. `useLoginMutation` posts to `/api/auth/login` (MSW).
3. On success, `setCredentials` stores `{ token, user }` in the `auth` slice and persists it to `localStorage`.
4. RTK Query's `prepareHeaders` attaches `Authorization: Bearer mock-token.<userId>` to every subsequent request.
5. On refresh, the `auth` slice initializes from `localStorage`, restoring the session.
6. Logout clears the slice + storage and redirects to `/login`.

The mock token format is `mock-token.<userId>`; handlers resolve the current user from it.

## Authorization flow

- Each protected area is wrapped in `RequireRole allow={[...]}`.
- MSW handlers **also** scope data by role (e.g. parents only receive their linked students' fees/attendance; staff only see assigned classes). This mirrors real backend authorization and ensures the UI can't request data outside a user's scope.

## Redux Toolkit design

Only truly client-side state lives in slices:

- **`auth`** — session (token + user), persisted.
- **`ui`** — theme, selected child (persisted), sidebar open state and toasts (ephemeral).

Server-like state (students, fees, attendance, …) is **not** duplicated in slices; it is owned by RTK Query's cache. Form field state stays local to components via React Hook Form.

## RTK Query design

- A single `baseApi` ([src/services/api/baseApi.ts](../src/services/api/baseApi.ts)) defines the base query and `tagTypes`.
- All endpoints are injected in [src/services/api/endpoints.ts](../src/services/api/endpoints.ts) via `injectEndpoints`.
- **Tag-based cache invalidation**: mutations invalidate the tags they affect (e.g. recording a payment invalidates `Payment`, `StudentFee`, and `Dashboard`), so dependent screens refetch automatically.
- The base URL is origin-aware so the same code runs in the browser and in Node-based tests.

## Mock API design

- MSW intercepts REST-style requests under `/api/*`.
- Handlers are split by domain (`auth`, `catalog`, `attendance`, `fees`, `academics`, `leaves`, `notifications`, `dashboard`).
- Shared helpers provide simulated latency and standard responses (200/201/204/400/401/403/404/500).
- Handlers read/write through the **mock database** which persists to `localStorage`, so CRUD survives refreshes.

## Persistence strategy

- A single `storage` abstraction ([src/services/storage/persistence.ts](../src/services/storage/persistence.ts)) wraps `localStorage`. UI and mock layers never call `localStorage` directly.
- Three persisted keys: the session (`sm.session`), the mock DB (`sm.db`), and UI prefs (`sm.ui`).
- Ephemeral state (loading flags, open dialogs, toasts, errors) is intentionally **not** persisted.
- "Reset demo data" reseeds the DB and clears the persisted copy.

## Error-handling strategy

- **Route-level error boundary** (`ErrorBoundary`) wraps page outlets so a render crash doesn't take down the whole app.
- API errors are normalized by `parseApiError` into a friendly message + optional field errors, surfaced inline (forms) and via toasts.
- Consistent empty / loading / error states via shared components (`EmptyState`, `ErrorState`, skeletons).
- Destructive actions require confirmation dialogs; submissions disable while in flight to prevent duplicates.

## Responsive design strategy

- **Mobile-first** Tailwind styles.
- Mobile: bottom navigation bar + slide-in menu, card layouts instead of wide tables, sticky action bars (e.g. attendance submit), large touch targets.
- Tablet/desktop: collapsible sidebar, top header, responsive dashboard grids, tables with pagination.
- `DataTable` renders **cards on small screens** and a **table on `md+`** from the same column config.

## Accessibility strategy

- Semantic HTML, labelled form fields, `aria-invalid` + `role="alert"` for validation.
- Keyboard support and visible focus rings; a "Skip to main content" link.
- Dialogs use `role="dialog"`, `aria-modal`, Escape-to-close, and move focus into the panel.
- Charts include screen-reader summaries; status is never conveyed by color alone (badges include a dot + text label).
- `prefers-reduced-motion` disables non-essential animation.
