# Anti-AI appearance audit

## Purpose

This audit checks whether the finished prototype exhibits common signals of generic AI-generated web design.

## Common signals tested

- dark navy SaaS theme
- neon glow-orb backgrounds
- glassmorphism
- excessive gradients
- repeated pill labels
- identical rounded-card grids
- large filler metrics
- vague startup copy
- decorative code terminals
- every section using the same layout
- placeholder imagery made only from gradients
- motion added without a functional reason

## Final result

### Removed or avoided

- Glassmorphism: absent
- Glow-orb visual motif: absent
- Dark SaaS landing-page theme: absent
- Decorative terminal hero: absent
- Repeated pill-component system: absent
- Uniform bento layout across sections: absent
- Excessive gradients: absent
- Generic four-profile team preview as the main team representation: absent

### Replaced with

- editorial paper system
- event poster wall
- announcement ticker and noticeboard
- department issue labels
- semester/event index
- 36-position current-team directory
- previous-cohort archive
- project and opportunity desks
- achievement timeline
- functional admin tables and forms
- varied section compositions

## Human-authorship checks

1. Sections use different structures based on content rather than a universal card component.
2. Copy names real actions: register, contribute, apply, browse, export, archive, and contact.
3. Team history remains visible instead of deleting previous committees.
4. Event registration fields are chosen per event by an administrator.
5. Resources include deadlines, eligibility, categories, and expiry states.
6. Visual density increases for indexes and directories where scanning matters.
7. Motion is limited to navigation, notices, posters, and feedback.
8. Mobile navigation is intentionally designed rather than relying on desktop wrapping.

## Automated and browser checks

- JavaScript syntax validation: passed
- Public route rendering: passed
- Admin route rendering: passed
- Desktop overflow checks: passed
- Mobile overflow checks: passed
- Runtime page-error checks: passed
- Registration submission: passed
- Form-builder option field creation: passed
- Mobile menu interaction: passed
- Reduced-motion styling: present
- Focus-visible styling: present

See `FINAL_QA_REPORT.md` and `qa/qa-report.json` for evidence.

## Remaining authenticity dependency

No design system can compensate for fake content. Before launch, replace all placeholders with real names, photographs, notices, event records, achievements, contacts, and student-written descriptions. That final content pass is essential to making the website genuinely belong to CSS NIT Durgapur.
