# Production bug and security audit — 5 October 2026

Scope: current main, reconciled with commit `7a0393f112c5c0e7f31494cdb896776c037e25b3`, and read-only checks of the Vercel deployment. Production records were not edited or deleted.

## Production incident

The supplied screenshot shows a projects request returning HTTP 500, React error 441, and digest 98410213. Production sign-in and the Projects page succeeded during inspection after a concurrent admin fix was merged. The exact original server exception cannot be established without the matching Vercel Function logs. Browser-extension `contentscript.js` warnings do not prove an application memory leak.

## Fixes

| Finding | Change |
| --- | --- |
| Invalid entity submissions throw into the generic error page | Event, project, member, faculty, resource and achievement forms display returned validation errors and prevent repeat submission while pending. Framework redirects remain intact. |
| Legacy project arrays can be missing or strings | Normalize technologies/contributors on repository reads. |
| Draft events appear on public listings and detail routes | Exclude drafts from public lists, detail metadata, related events, sitemap and generated posters. Draft and closed events reject registrations. |
| Latest Mongo adapter silently switches to bundled JSON after connection/query failure | Remove the fallback. Require Mongo on Vercel and retain recoverable error boundaries. Connection failure no longer reads or writes a separate database. |
| Mongo insertion mutates the response object with a BSON `_id` | Insert a clone so results remain plain application objects. |
| Public content can be built from stale database snapshots | Database-backed public routes render at request time; builds no longer depend on a live Mongo connection. |
| Admin form APIs disclose raw exceptions | Return validation/domain messages and generic failures without exposing driver errors. |
| Admin API cookie authentication has no explicit origin check | Reject cross-origin mutation requests. |
| Session parsing accepts malformed hex signatures and has inconsistent email normalization | Require exact signatures, bounded payloads and numeric expiry; normalize emails, harden signing, support independent session secret and credential rotation. |
| Unlimited login attempts | Add atomic shared Mongo counters with TTL expiry, allowing 10 attempts per IP per ten-minute bucket. Local development uses a bounded in-memory counter. |
| Root-relative URL validation accepts backslashes/control characters; optional blank URLs can become `#` | Reject unsafe paths and normalize blank/null optional URLs to undefined while preserving the newly merged bare-host URL support. |
| Image optimizer accepts arbitrary HTTPS hosts | Require an explicit IMAGE_REMOTE_HOSTS allowlist. |
| Missing basic browser security headers | Set nosniff, frame denial and a referrer policy. |
| Environment files beyond .env.local can enter Git | Ignore .env.* while retaining .env.example. |
| CI only validates an old design branch | Validate main, audit branches and pull requests; add security and production route checks. |
| Runtime dependencies have reported advisories | Update Next.js/eslint-config-next to 16.3.8 and refresh Sharp to a patched release. Production dependency audit passes. The Next.js advisory concerns attacker-controlled Node ImageResponse SVGs; no such handler was found here. |

## Verification

Run typecheck, lint, database tests, form tests, validation tests, security regression tests, production build and production route smoke tests. Security tests cover sessions, credential rotation, legacy projects, origins, draft visibility, Mongo mutation/counters and the Vercel persistence guard. Production smoke tests cover public/admin routes and unauthenticated access gates with a local fixture database. Mongo behavior is mocked for unit tests; no production database write test was performed.

## Vercel rollout requirements

- Preserve MONGO_URL, MONGO_DB_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in the relevant Vercel environments. The Mongo user needs read/write privileges and permission to create a TTL index on adminLoginAttempts.
- Set ADMIN_SESSION_SECRET to an independent random secret of at least 32 bytes. Password/session-secret rotation invalidates current sessions. Change any credential shared outside a secure sign-in flow.
- Set IMAGE_REMOTE_HOSTS to the exact external HTTPS image hostnames your content uses; otherwise only local images are allowed by the optimizer. This replaces the previous wildcard configuration.
- Direct image uploads and form-file uploads remain disabled in production until a durable storage adapter is implemented/configured. Continue using durable image URLs.
- Review the Vercel Preview and then merge/deploy. Match digest 98410213 against Vercel Function logs if the original error recurs. This branch does not change production environment variables or production records.

## Remaining limits

This is not a guarantee that every possible defect or historical secret has been found. No repository-history secret scan or full browser interaction suite was completed. The full dependency audit still reports a development-only braces/micromatch/fast-glob ESLint chain; npm's proposed automatic fix downgrades eslint-config-next to 14.2.35, so that incompatible downgrade was not applied. CI reports those development advisories separately. The production-only audit remains a required passing check.

Form response limits currently use count-then-insert logic and may be exceeded by simultaneous submissions; strict atomic quotas and public submission abuse controls need further work. Multi-record event/form relinking is not transactional. These require a separate coordinated database change and concurrency testing.
