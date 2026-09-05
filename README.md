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

Open `http://localhost:3000`. With no admin credentials configured, `/admin` is intentionally open only in local development/demo mode. In production the admin panel fails closed when either credential is missing. Set both `ADMIN_EMAIL` and `ADMIN_PASSWORD` before deploying.

## Environment variables

```dotenv
MONGO_URL=
MONGO_DB_NAME=css_society
ADMIN_EMAIL=
ADMIN_PASSWORD=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
FORM_STORAGE=local
```

- `MONGO_URL`: when non-empty, all repositories use MongoDB. When blank or absent, they use `data/db.json`.
- `MONGO_DB_NAME`: MongoDB database name when `MONGO_URL` does not select one explicitly; defaults to `css_society`.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: enable the signed, HTTP-only admin session. Both must be set in production; missing credentials do not grant production admin access.
- `NEXT_PUBLIC_SITE_URL`: canonical public origin used by the sitemap.
- `FORM_STORAGE`: defaults to `local`. Local form-file storage is development-only and is intentionally rejected in production. A durable production storage adapter must be configured/implemented before enabling file fields for real deployments.

Do not commit `.env.local` or production secrets.

## Data backends

Pages and actions call repository functions in `lib/repositories`; they never choose a backend themselves. `lib/db/index.ts` selects one adapter once:

- `lib/db/json-db.ts` provides asynchronous local persistence with a serialized in-process write queue, duplicate-ID protection, and atomic temporary-file rename.
- `lib/db/mongodb.ts` uses the MongoDB Node driver and mirrors the same collection shape through the same adapter interface.

The JSON backend is suitable for local development and single-process demonstrations. It is not suitable for distributed, serverless, or multi-instance production deployment because its queue is process-local and its filesystem may be ephemeral. Use MongoDB for those deployments.

### MongoDB setup

Create a database and set a connection URI, optionally including the database name:

```dotenv
MONGO_URL=mongodb+srv://user:password@cluster.example.net/css_society
MONGO_DB_NAME=css_society
```

Restart the Next.js process after changing either value. The Mongo adapter creates collections on first write; seed/import Mongo data separately from the supplied JSON demo database. MongoDB integration must be tested against the actual deployment credentials before production rollout; the JSON test suite does not substitute for a live MongoDB check.

## Commands

```bash
npm run dev             # development server
npm run build           # optimized production build
npm run start           # run the production build
npm run lint            # ESLint, zero warnings allowed
npm run typecheck       # TypeScript without emitting files
npm run seed            # restore the V3-based demo data in data/db.json
npm run test:db         # isolated JSON CRUD and restart-persistence test
npm run test:forms      # generic form CRUD, validation, response and CSV tests
npm run test:validation # URL/security validation boundary tests
npm run test:runtime    # browser/runtime QA; normally launched by branch CI
npm audit --audit-level=high
```

`npm run seed` replaces `data/db.json`; do not run it over local data you want to keep. `scripts/prepare-runtime-fixture.ts` is CI-only test setup and should not be used to seed real content.

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
public/uploads/      Local development image and registration-file storage
scripts/             Seeder, persistence tests, and browser QA
```

## Admin and forms

The admin routes manage events, team records, projects, resources, achievements, announcements, and homepage copy. Event creation also creates a registration form. The form builder supports the current field set, ordering, duplication, required state, option editing, publish/close/re-open flows, and standalone or event-linked forms. Public submissions are validated on the server, stored through the active database adapter, searchable in `/admin/responses`, and exportable as CSV with human-readable field labels.

Event posters and member images may be public URLs or local paths under `public/uploads`. Those admin image-upload actions currently write to local disk. This is acceptable for local development or a single persistent Node host, but it is not durable on typical serverless filesystems. Move those helpers to persistent object storage before such a deployment.

Form-file uploads use the storage abstraction in `lib/storage`. The bundled local adapter validates MIME type and size and generates safe filenames, but it is disabled in production. Text-only forms continue to work when production file storage is unavailable; submitting an actual file returns a clear service-unavailable response rather than silently losing the file.

## Deployment notes

1. Set MongoDB configuration, both admin credentials, and the public URL in the host’s secret manager.
2. Configure durable object storage before enabling production file-upload fields or relying on uploaded admin images on an ephemeral host.
3. Run `npm ci`, `npm audit --audit-level=high`, `npm run typecheck`, `npm run lint`, `npm run test:db`, `npm run test:forms`, `npm run test:validation`, and `npm run build` in CI.
4. Verify the production runtime against the real database/storage providers and deployment origin; local JSON/browser CI cannot certify unavailable external credentials.
5. Deploy the generated Next.js application using a Node-compatible host. Mongo credentials and admin secrets must never be exposed to client bundles.

The `css-society-poster-team-v3` directory is reference material and must remain available when comparing visual changes.
