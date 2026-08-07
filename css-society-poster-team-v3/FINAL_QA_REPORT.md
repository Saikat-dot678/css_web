# Final QA report

## Summary

- Routes tested: **25**
- Routes with horizontal overflow: **0**
- Runtime page errors: **0**
- Registration submission: **passed**
- Form-builder option-field test: **passed**
- Mobile-menu interaction: **passed**

## Validation performed

- JavaScript parsed successfully with Node syntax validation.
- Every public route was rendered at desktop width.
- Core public and admin routes were rendered at mobile width.
- `scrollWidth` was compared against viewport width for horizontal overflow.
- Browser page errors were captured for each route.
- A public registration was submitted and stored.
- An option-based form field was added in the admin form builder.
- The mobile navigation drawer was opened and verified.
- Desktop and mobile screenshots were captured for visual inspection.

## Route matrix

| Viewport | Route | Overflow | Runtime errors | Rendered height |
|---|---|---:|---:|---:|
| desktop | `#/home` | no | 0 | 8493 px |
| desktop | `#/events` | no | 0 | 2811 px |
| desktop | `#/events/resume-rewired` | no | 0 | 1902 px |
| desktop | `#/projects` | no | 0 | 2864 px |
| desktop | `#/team` | no | 0 | 5820 px |
| desktop | `#/team?year=2025%E2%80%9326` | no | 0 | 5468 px |
| desktop | `#/resources` | no | 0 | 2938 px |
| desktop | `#/achievements` | no | 0 | 2403 px |
| desktop | `#/admin` | no | 0 | 1061 px |
| desktop | `#/admin/events` | no | 0 | 900 px |
| desktop | `#/admin/form-builder` | no | 0 | 900 px |
| desktop | `#/admin/responses` | no | 0 | 900 px |
| desktop | `#/admin/projects` | no | 0 | 900 px |
| desktop | `#/admin/resources` | no | 0 | 1143 px |
| desktop | `#/admin/achievements` | no | 0 | 943 px |
| desktop | `#/admin/team` | no | 0 | 1269 px |
| desktop | `#/admin/content` | no | 0 | 900 px |
| mobile | `#/home` | no | 0 | 14700 px |
| mobile | `#/events` | no | 0 | 4219 px |
| mobile | `#/projects` | no | 0 | 4595 px |
| mobile | `#/team` | no | 0 | 8043 px |
| mobile | `#/resources` | no | 0 | 5347 px |
| mobile | `#/achievements` | no | 0 | 3881 px |
| mobile | `#/admin` | no | 0 | 1923 px |
| mobile | `#/admin/form-builder` | no | 0 | 2971 px |

## Visual review

- Home: editorial hierarchy, announcement ticker, event posters, projects, team/faculty, achievements, and gallery read as one coherent system.
- Events: filters, featured event, registration state, and archive remain visually distinct without a generic product-card layout.
- Projects: index and participation states are scan-friendly.
- Team: current team and historical cohorts support the real 30+ member scale.
- Resources and achievements: dedicated page structures avoid repeating the Events composition.
- Admin: information-dense but usable tables, forms, and builder controls.
- Mobile: navigation and content stack without horizontal overflow.

## Evidence

Machine-readable results: `qa/qa-report.json`

Screenshots:

- `qa/desktop-achievements.png`
- `qa/desktop-admin.png`
- `qa/desktop-events.png`
- `qa/desktop-form-builder.png`
- `qa/desktop-home.png`
- `qa/desktop-projects.png`
- `qa/desktop-resources.png`
- `qa/desktop-team.png`
- `qa/mobile-admin.png`
- `qa/mobile-events.png`
- `qa/mobile-home.png`
- `qa/mobile-team.png`

## Known prototype limitations

- Data is stored in browser `localStorage`; it is not multi-user or secure.
- File-upload fields demonstrate the interface but do not persist files to a server.
- Authentication and role-based permissions are not implemented in this static prototype.
- Placeholder society content must be replaced using `CONTENT_REPLACEMENT_CHECKLIST.md`.
- Final production QA must include real devices, real content, backend validation, permissions, and accessibility testing with assistive technology.


## Palette revision note

The final source was recoloured after the original visual screenshot pass. The old screenshots were removed from this package so they do not misrepresent the current palette. Structural route, syntax, interaction, and responsive checks remain applicable because the palette revision changed only styling tokens and category colours.
