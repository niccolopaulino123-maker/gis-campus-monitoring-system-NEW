# ICCT Binangonan — Campus Environmental Monitoring System (GIS)

A GIS-based web app that maps and monitors environmental conditions across the
ICCT Binangonan Campus. Authorized users log environmental issues (waste,
drainage, maintenance, electrical, safety) directly on an interactive 2D campus
map; administrators view, filter, and track those issues to completion.

Built with **Next.js (App Router) + React + TypeScript + Leaflet + Tailwind
CSS**, backed by **Firebase** (Firestore + Authentication). The app includes a
**serverless REST API** (Next.js route handlers) documented with **Swagger /
OpenAPI**, and **role-based access control**. Deployable on **Vercel**.

## How the map works

The campus base layer is the 2D campus/evacuation layout image
(`public/campus-map.png`, 2048 × 1152). Leaflet is configured with
`L.CRS.Simple`, so the image is treated as a flat coordinate plane instead of a
real-world geographic map. Clicking the map drops a pin at `[y, x]` pixel-space
coordinates, which is stored with each report.

## Features

- Authorized login (Firebase Auth, with a built-in demo fallback)
- Interactive campus map with pan/zoom (Leaflet `CRS.Simple`)
- Click-to-report: drop a pin and log category, location, description, priority
- Color-coded pins per category; dimmed when resolved
- Filter by category and status; live stats (total / open / active / resolved)
- Realtime sync across devices via Firestore
- Status workflow: Open / In Progress / Resolved
- **Role-based access control**: admin, staff, maintenance, viewer
- **Serverless REST API** with **Swagger UI** at `/docs`

## Roles

Roles are stored as Firebase Auth **custom claims** (and mirrored to a `users`
Firestore collection). Admins assign roles in-app via **Manage Roles**, or
through the API.

| Role | Capabilities |
|------|--------------|
| `admin` | Manage users/roles; create, update, delete any report |
| `staff` | Create and update reports |
| `maintenance` | Update report status (in progress / resolved) |
| `viewer` | Read-only access to the map and reports |

## REST API & Swagger docs

The serverless backend lives under `src/app/api/`. Interactive docs are served
by Swagger UI at **`/docs`**, reading the OpenAPI spec at **`/api/openapi`**.

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/issues` | any | List all reports |
| POST | `/api/issues` | admin, staff, maintenance | Create a report |
| PATCH | `/api/issues/{id}` | admin, staff, maintenance | Update status |
| DELETE | `/api/issues/{id}` | admin | Delete a report |
| GET | `/api/roles` | admin | List users and roles |
| POST | `/api/roles` | admin | Assign a role by email |

All endpoints require `Authorization: Bearer <Firebase ID token>`. In Swagger
UI, click **Authorize** and paste a token (get one from a signed-in session).

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Without Firebase configured, the app runs in
**demo mode** (data stored in your browser, role = admin). Demo login:

- Email: `admin@icct.edu.ph`
- Password: `admin123`

> Note: the REST API + roles require the **Firebase Admin** service account
> (below). The map/reporting UI works in demo mode without it.

## Connecting Firebase

1. Create a project at <https://console.firebase.google.com>.
2. Add a **Web app** and copy the config values.
3. Enable **Authentication → Email/Password**; create at least one user.
4. Create a **Firestore Database** (production mode).
5. **Service accounts → Generate new private key** (downloads a JSON file).
6. Copy `.env.example` to `.env.local` and fill in:

   ```env
   # Client (safe to expose)
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...

   # Server-only (NEVER expose) — paste the service-account JSON on one line,
   # or base64-encode it.
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
   ```

7. Apply the Firestore security rules in `firestore.rules`.
8. Bootstrap the first admin: temporarily allow any signed-in user in
   `src/app/api/roles/route.ts`, assign yourself `admin`, then revert — or set
   the custom claim once via a Firebase Admin script.

Restart `npm run dev`.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it on <https://vercel.com> (framework preset: **Next.js**).
3. Add all `NEXT_PUBLIC_FIREBASE_*` vars **and** `FIREBASE_SERVICE_ACCOUNT`
   under **Settings → Environment Variables**.
4. In Firebase **Authentication → Settings → Authorized domains**, add your
   Vercel domain.
5. Deploy.

## Project structure

```
public/campus-map.png          2D campus base image
src/
  app/
    layout.tsx                 Root layout + AuthProvider
    page.tsx                   Auth gate -> Login or Dashboard
    globals.css                Tailwind + map/pin styles
    docs/page.tsx              Swagger UI
    api/
      openapi/route.ts         Serves the OpenAPI spec
      issues/route.ts          GET (list) / POST (create)
      issues/[id]/route.ts     PATCH (status) / DELETE
      roles/route.ts           GET (list) / POST (assign) — admin only
  lib/
    firebase.ts                Client Firebase init + "configured?" detection
    firebaseAdmin.ts           Server-only Admin SDK init
    apiAuth.ts                 Token verification + role guards
    openapi.ts                 OpenAPI 3.0 spec
  types.ts                     Models + role/category/status metadata
  data/locations.ts            Known campus areas (centroids on the map)
  contexts/AuthContext.tsx     Auth + role + ID-token access
  hooks/useIssues.ts           Firestore realtime CRUD (localStorage fallback)
  components/
    Dashboard.tsx              Authed app shell (dynamic-imports the map)
    CampusMap.tsx              Leaflet map, pins, popups, click-to-place
    ReportModal.tsx            New-report form
    RolesModal.tsx             Role management UI (calls /api/roles)
    Sidebar.tsx                Stats, filters, report list
    Header.tsx / Login.tsx     Shell + auth UI
```
