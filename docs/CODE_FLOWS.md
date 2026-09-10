# Code Flows

Step-by-step walkthroughs of the major flows in the application. File references point to the relevant implementation.

## 1. Application startup

1. `index.html` loads `src/main.tsx`.
2. `enableMocking()` starts the MSW worker when `VITE_ENABLE_MOCKS === 'true'`.
3. React renders `<App />` ([src/App.tsx](../src/App.tsx)), which mounts the Redux `Provider`, the `RouterProvider`, and the global `Toaster`.
4. The `auth` slice initializes its state from `localStorage` (session restoration).
5. The mock database (`src/mocks/db/database.ts`) loads the persisted DB or seeds a fresh one.

## 2. Login

1. User visits `/login` (guarded by `GuestOnlyRoute`).
2. `LoginPage` validates input with the Zod `loginSchema` via React Hook Form.
3. `useLoginMutation` → `POST /api/auth/login`.
4. The `auth` handler verifies credentials against the mock DB and returns `{ token, user }`.
5. `setCredentials` stores the session in Redux + `localStorage`.
6. The user is redirected to `ROLE_HOME[role]` (or the originally requested URL).

## 3. Session restoration

1. On refresh, `authSlice`'s initial state calls `storage.get(STORAGE_KEYS.session)`.
2. If a session exists, the user stays authenticated and RTK Query re-attaches the token via `prepareHeaders`.
3. Guards see `isAuthenticated === true` and render the protected tree without a re-login.

## 4. Role-based routing

1. `RequireAuth` checks the session; unauthenticated users are redirected to `/login` with `state.from`.
2. `RequireRole allow={[...]}` checks `user.role`; mismatches redirect to `/unauthorized`.
3. The matching role layout (`AdminLayout` / `PortalLayout` / `StaffLayout`) renders `AppShell` and the page `<Outlet />`.

## 5. Administrator dashboard data loading

1. `AdminDashboard` calls `useGetAdminDashboardQuery()`.
2. RTK Query issues `GET /api/dashboard/admin`; the loading state renders skeletons.
3. The `dashboard` handler aggregates fees, attendance, and leave data from the mock DB into `DashboardMetrics`.
4. Charts (Recharts) and stat cards render; each chart includes an accessible summary.

## 6. Fee creation

1. Admin opens `/admin/fees/create` (`FeeCreate`).
2. `feeStructureSchema` validates the form (positive amount, non-past due date, required fields).
3. `useCreateFeeStructureMutation` → `POST /api/fee-structures`.
4. The handler rejects duplicates, creates the structure, and **auto-assigns** matching students an unpaid `StudentFee`.
5. Tags `FeeStructure`, `StudentFee`, `Dashboard` are invalidated; the admin is routed to the fee detail page.

## 7. Payment recording

1. From `FeeDetail` (admin) or `PortalFees` (parent/student), the user opens the pay modal.
2. `paymentSchema` validates the amount and method.
3. `useRecordPaymentMutation` → `POST /api/payments`.
4. The handler applies the payment (capped at the remaining balance), recomputes the `StudentFee` status, and creates a `Payment` with a receipt reference.
5. A receipt modal is shown; `Payment`, `StudentFee`, and `Dashboard` caches refresh.

## 8. Staff attendance submission

1. Staff selects a class/section on `/staff/attendance`, opening `/staff/attendance/:classId?section=`.
2. `StaffAttendanceClass` loads the roster and any existing attendance for the chosen date, seeding local marks.
3. Staff marks each student (or "Mark all present"); a sticky action bar shows progress.
4. **Save draft** or **Submit** (submit requires a confirmation dialog and all students marked).
5. `useSubmitAttendanceMutation` → `POST /api/attendance`; the handler replaces existing records for that class/section/date.
6. `Attendance` and `Dashboard` caches invalidate.

## 9. Notes publishing

1. Staff opens the "New Note" modal on `/staff/notes`.
2. `noteSchema` validates title/subject/description, etc.
3. **Save Draft** creates a `draft`; **Publish** creates/updates to `published`.
4. `useCreateNoteMutation` / `useUpdateNoteMutation` → `POST/PUT /api/notes`.
5. Published notes appear for students/parents in their class via `PortalNotes` (draft notes stay staff-only).

## 10. Leave application

1. Staff opens the "Apply for Leave" modal on `/staff/leaves`.
2. `leaveSchema` validates the date range and reason length.
3. `useApplyLeaveMutation` → `POST /api/leaves`.
4. The handler additionally rejects **overlapping** pending/approved requests and sets status to `pending`.
5. `Leave` and `Dashboard` caches invalidate; the request appears in history and in the admin's queue.

## 11. Leave approval / rejection

1. Admin reviews requests on `/admin/staff-leaves`.
2. **Approve** → `PATCH /api/leaves/:id` with `status: 'approved'` (decrements the staff member's leave balance).
3. **Reject** opens a modal that **requires a reason**; the handler enforces this and stores `reviewComment` + `reviewedBy`.
4. `Leave`, `Staff`, and `Dashboard` caches invalidate; the staff member sees the outcome and any comment.

## 12. Parent child selection

1. `useSelectedStudentId` resolves the active student from linked children (`user.studentIds`).
2. A parent with 2+ children sees the `ChildSelector` in the header.
3. Changing the selection dispatches `setSelectedChild` (persisted in `ui` prefs).
4. Portal pages re-query with the new `studentId`, so dashboard/fees/attendance follow the selected child.

## 13. Logout

1. User clicks "Sign out" (sidebar, mobile menu, or Settings).
2. `useLogoutMutation` → `POST /api/auth/logout` (best-effort).
3. `logout` clears the `auth` slice and `localStorage` session.
4. The user is redirected to `/login`; guards prevent access to protected routes.

## 14. Demo-data reset

1. From **Settings**, the user confirms "Reset demo data".
2. `useResetDemoDataMutation` → `POST /api/system/reset` reseeds the in-memory DB.
3. The persisted DB key is removed from `localStorage`.
4. The app reloads, rebuilding a fresh seeded dataset, and all RTK Query caches are invalidated.
