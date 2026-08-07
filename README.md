# CSS — CSE Students’ Society, NIT Durgapur

Production Next.js rebuild of the CSS V3 editorial prototype. The existing prototype is preserved in [`css-society-poster-team-v3`](./css-society-poster-team-v3) and remains the visual source of truth.

## Setup

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
copy .env.example .env.local
npm run seed
npm run dev
```

Open `http://localhost:3000`. With no admin credentials configured, `/admin` is intentionally open for local/demo use. Set both `ADMIN_EMAIL` and `ADMIN_PASSWORD` before deploying.

## Environment variables

```dotenv
MONGO_URL=
ADMIN_EMAIL=
ADMIN_PASSWORD=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- `MONGO_URL`: when non-empty, all repositories use MongoDB. When blank or absent, they use `data/db.json`.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: enable the signed, HTTP-only admin session. Both must be set.
- `NEXT_PUBLIC_SITE_URL`: canonical public origin used by the sitemap.

Do not commit `.env.local` or production secrets.

## Data backends

Pages and actions call repository functions in `lib/repositories`; they never choose a backend themselves. `lib/db/index.ts` selects one adapter once:

- `lib/db/json-db.ts` provides safe asynchronous local persistence with a serialized in-process write queue and atomic temporary-file rename.
- `lib/db/mongodb.ts` uses the MongoDB Node driver and mirrors the same collection shape.

The JSON backend is suitable for local development and single-process demonstrations. It is not suitable for distributed, serverless, or multi-instance production deployment because its queue is process-local and its filesystem may be ephemeral. Use MongoDB for those deployments.

### MongoDB setup

Create a database and set a connection URI, optionally including the database name:

```dotenv
MONGO_URL=mongodb+srv://user:password@cluster.example.net/css_society
```

If the URI has no database path, the adapter uses `css_society`. Restart the Next.js process after changing the variable. The Mongo adapter creates collections on first write; seed/import Mongo data separately from the supplied JSON demo database.

## Commands

```bash
npm run dev        # development server
npm run build      # optimized production build
npm run start      # run the production build
npm run lint       # ESLint, zero warnings allowed
npm run typecheck  # TypeScript without emitting files
npm run seed       # restore the V3-based demo data in data/db.json
npm run test:db    # isolated JSON CRUD and restart-persistence test
```

`npm run seed` replaces `data/db.json`; do not run it over local data you want to keep.

## Main structure

```text
app/                 App Router pages, Server Actions, and Route Handlers
components/public/   Public shell and editorial components
components/events/   Poster cards, filters, and dynamic registration form
components/team/     Faculty and rectangular member cards
components/admin/    V3-aligned admin editors, tables, and form builder
lib/db/              JSON and MongoDB adapters
lib/repositories/    Backend-independent data access
lib/validation/      Zod schemas used on server writes
types/               Shared domain types
data/db.json         Seeded local fallback database
public/uploads/      Development image and registration-file storage
scripts/             Seeder and persistence verification
```

## Admin and forms

The admin routes manage events, team records, projects, resources, achievements, announcements, and homepage copy. Event creation also creates a registration form. The form builder supports all V3 field types, ordering, duplication, required state, and option editing. Public submissions are validated on the server, stored through the active adapter, searchable in `/admin/responses`, and exportable as CSV.

Images may be public URLs or local paths under `public/uploads`. Upload actions currently write to local disk; move these helpers to object storage before a serverless deployment.

## Deployment notes

1. Set `MONGO_URL`, admin credentials, and the public URL in the host’s secret manager.
2. Use persistent object storage for uploads; local deployment filesystems may be read-only or ephemeral.
3. Run `npm run lint`, `npm run typecheck`, and `npm run build` in CI.
4. Deploy the generated Next.js application using a Node-compatible host. No Mongo credential is ever included in client bundles.

The `css-society-poster-team-v3` directory is reference material and must remain available when comparing visual changes.
