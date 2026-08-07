# Codex production prompt — CSS NIT Durgapur website

Use this folder as the visual, interaction, content-model, and route reference. Convert the prototype into a production-quality Next.js App Router application using TypeScript.

## Source of truth

Study before coding:

- `index.html`
- `styles.css`
- `app.js`
- `DESIGN_RESEARCH.md`
- `AI_LOOK_AUDIT.md`
- `FINAL_QA_REPORT.md`
- screenshots inside `qa/`

Do not make an unrelated redesign while implementing.

## Visual direction: Department Dispatch

The website is a living CSE department publication and noticeboard.

Preserve:

- warm paper canvas
- black editorial typography and rules
- burgundy, vermilion, dusty peach, ochre, and aubergine spot colours
- event poster system
- issue labels and annotations
- hard offset shadows
- varied section structures
- dense but readable directories and indexes
- restrained motion

Do not introduce:

- dark SaaS backgrounds
- glassmorphism
- glowing orbs
- purple/cyan gradient branding
- pill labels everywhere
- generic bento grids
- identical rounded cards for all content
- filler statistics
- generic AI-written marketing copy

## Public routes

- `/`
- `/events`
- `/events/[slug]`
- `/projects`
- `/team`
- `/team?year=[academic-year]`
- `/resources`
- `/achievements`

## Admin routes

- `/admin`
- `/admin/events`
- `/admin/events/new`
- `/admin/events/[id]/edit`
- `/admin/events/[id]/form`
- `/admin/responses`
- `/admin/projects`
- `/admin/resources`
- `/admin/achievements`
- `/admin/team`
- `/admin/content`

## Required data models

Create models for:

- User and role
- Event
- Registration form
- Form field
- Registration response
- Project
- Project contributor
- Resource or opportunity
- Achievement
- Faculty member
- Team member
- Academic-year cohort
- Announcement
- Site content/settings
- Gallery album and media

## Required functionality

### Events

- CRUD
- draft, published, postponed, closed, and archived states
- featured state
- registration opening and closing dates
- capacity and waitlist-ready structure
- unique slug validation

### Form builder

Support:

- short text
- long answer
- email
- phone
- number
- dropdown
- multiple choice
- checkboxes
- date
- file upload
- consent
- section heading

Each field needs:

- label
- helper text
- required state
- order
- options when applicable
- duplication
- deletion

### Responses

- server-side validation
- response table
- event filters
- detail view
- deletion with confirmation
- CSV export
- secure file-download links

### Team and history

- current members grouped by domain
- faculty guidance
- academic-year selector
- previous committees
- role and domain history
- ordering controls
- archive rather than destructive replacement

### Other modules

- project CRUD and contributor status
- resource/opportunity CRUD with expiry date
- achievement CRUD and timeline ordering
- announcement pinning
- recruitment state
- editable homepage copy
- gallery management

## Production requirements

- responsive and keyboard accessible
- reduced-motion support
- semantic HTML
- WCAG-aware colour contrast
- image optimization
- metadata and social sharing
- sitemap and robots configuration
- validation with Zod
- authentication and role-based authorization
- database migrations and seed data
- audit-friendly admin actions
- tests for forms, routing, and permissions

## Suggested stack

- Next.js App Router
- TypeScript
- PostgreSQL
- Prisma
- Auth.js or institution-approved SSO
- Zod
- React Hook Form
- S3-compatible object storage
- CSS Modules or Tailwind configured from explicit tokens
- Framer Motion only where the prototype specifies motion

## Build order

1. Extract tokens from `styles.css`.
2. Build the public shell and navigation.
3. Implement content models and seed data.
4. Implement Events and registration.
5. Implement Team and history.
6. Implement Projects, Resources, and Achievements.
7. Build the admin shell and CRUD modules.
8. Add authentication and authorization.
9. Add responsive, accessibility, and reduced-motion tests.
10. Compare final routes against the screenshots and QA report.
