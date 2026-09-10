# School Management App

A production-quality, responsive, role-based **School Management** frontend prototype built with React, TypeScript, and Vite. It supports three role experiences — **Administrator**, **Parent/Student**, and **Staff/Faculty** — backed entirely by mocked APIs (MSW) with local persistence, so the mock services can later be swapped for a real backend without rewriting UI or business logic.

> This is a **frontend prototype**. There is no real backend and **all payments are simulated**.

## Table of Contents

- [Features by Role](#features-by-role)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Commands](#commands)
- [Running Locally](#running-locally)
- [Demo Credentials](#demo-credentials)
- [Resetting Mock Data](#resetting-mock-data)
- [Project Documentation](#project-documentation)
- [Known Prototype Limitations](#known-prototype-limitations)

## Features by Role

### Administrator

- School-wide dashboard: fee collection metrics, attendance %, staff/leave summary, charts (monthly trend, by class, by category, paid vs pending), upcoming due dates, recent payments.
- **Fee management**: create / view / archive fee structures, auto-assign to students, record payments, generate receipt screens, CSV export, filtering & search.
- **Attendance monitoring**: by class/section/date, present/absent/late/leave counts, weekly trend.
- **Faculty leave management**: approve / reject (with reason), filter by status/type.
- Announcements (create), student directory, staff directory, academic calendar, settings.

### Parent / Student

- Dashboard: profile summary, attendance %, pending homework, upcoming activities, fees, announcements, today's schedule, quick actions.
- Announcements (read + mark read), homework (mark complete), daily activities agenda, notes & classwork (mark reviewed), attendance history, **fees with simulated pay-now flow & receipts**, timetable, profile.
- **Multi-child support**: parents linked to more than one student get a child selector in the header.

### Staff / Faculty

- Dashboard: today's classes, assigned classes/subjects, leave balance & status, announcements, quick actions.
- **Attendance marking**: mobile-optimized, large touch targets, mark-all-present, draft & submit with confirmation.
- Notes & classwork (draft/publish/delete), homework creation, leave management (apply/cancel with overlap validation), timetable, assigned-students directory, profile.

## Technology Stack

| Concern            | Library                                  |
| ------------------ | ---------------------------------------- |
| Framework          | React 18 + TypeScript                    |
| Build tool         | Vite 5                                    |
| Routing            | React Router 6                           |
| State management   | Redux Toolkit                            |
| Server-state/cache | RTK Query                                |
| Styling            | Tailwind CSS 3                           |
| Forms              | React Hook Form                          |
| Validation         | Zod                                      |
| Charts             | Recharts                                 |
| Icons              | lucide-react                             |
| Mock API           | Mock Service Worker (MSW)                |
| Persistence        | localStorage (behind a storage abstraction) |
| Testing            | Vitest + React Testing Library           |
| Quality            | ESLint + Prettier                        |

## Prerequisites

- **Node.js 18+** (Node 20 LTS recommended)
- npm 9+

## Installation

```bash
npm install
```

The MSW service worker (`public/mockServiceWorker.js`) is already included. If you ever need to regenerate it:

```bash
npm run prepare:msw
```

## Commands

| Command                | Description                                   |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Start the dev server (opens the browser)      |
| `npm run build`        | Type-check and build for production           |
| `npm run preview`      | Preview the production build locally          |
| `npm run test`         | Run the test suite once                       |
| `npm run test:watch`   | Run tests in watch mode                       |
| `npm run lint`         | Lint the codebase                             |
| `npm run format`       | Format the codebase with Prettier             |
| `npm run format:check` | Check formatting without writing              |

## Running Locally

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

3. Open the app (Vite prints the URL, typically `http://localhost:5173`) and log in with any demo account below.

## Demo Credentials

All accounts use the password **`password123`**. Credentials are also displayed on the login page (click a card to auto-fill).

| Role          | Email               |
| ------------- | ------------------- |
| Administrator | `admin@school.edu`  |
| Staff/Faculty | `staff@school.edu`  |
| Parent        | `parent@school.edu` (linked to 2 children) |
| Student       | `student@school.edu` |

## Resetting Mock Data

Any user can reset all mock data (fees, attendance, leaves, notes, payments, etc.) back to the seeded demo state from **Settings → Reset demo data**. This clears the persisted database in `localStorage` and reloads the app.

## Project Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — architecture, folder structure, state, routing, auth, persistence, accessibility.
- [docs/CODE_FLOWS.md](docs/CODE_FLOWS.md) — step-by-step walkthroughs of major flows.
- [docs/BACKEND_INTEGRATION.md](docs/BACKEND_INTEGRATION.md) — how to replace MSW with a real backend.

## Known Prototype Limitations

- **No real backend**: all data lives in `localStorage`; clearing browser storage resets everything.
- **Payments are simulated** — no payment gateway integration.
- **Attachments are mocked** — file "downloads" show a toast; no real upload/storage.
- Notifications are seeded and generated on the client, not pushed in real time.
- The dashboard monthly trend is a deterministic approximation derived from current totals (there is no historical time-series in the mock data).
- No password reset / account creation flow (demo accounts only).
- Not optimized into route-level code-split chunks (single JS bundle) — noted as a future improvement.
