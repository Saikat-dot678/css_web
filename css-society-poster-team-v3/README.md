# CSS NIT Durgapur — Department Dispatch v3

Interactive front-end prototype for the CSE Students' Society, NIT Durgapur.

## What changed in v3
The Team and Events experiences were rebuilt around real society content rather than directory rows:

- poster-first event catalogue
- posters retained for past events
- event detail and event recap states
- poster image URL/upload support in Admin
- rectangular member cards
- final-year students treated as Office Bearers
- separate Third Year, Second Year, M.Tech, and PhD sections
- LinkedIn, Instagram, and Facebook on every member card
- previous committees keep the same structured card layout

See `UPDATE_V3.md` for the full change list.

## Run
Windows:
- `OPEN_PROTOTYPE.bat`, or
- `SERVE_PROTOTYPE.bat` and visit `http://localhost:8080`

macOS/Linux:
```bash
./serve.sh
```

You can also open `index.html` directly.

## Main routes
- `#/home`
- `#/events`
- `#/events/resume-rewired`
- `#/events/open-source-kickoff` — past-event example
- `#/team`
- `#/team?year=2025–26`
- `#/projects`
- `#/resources`
- `#/achievements`
- `#/admin`
- `#/admin/events`
- `#/admin/events/edit/resume-rewired`
- `#/admin/form-builder`
- `#/admin/responses`
- `#/admin/team`

## Poster behaviour
Each event always renders a 4:5 poster. When an admin has not supplied real artwork, a fallback poster is generated from the event's title, date, category, venue, and status. A real poster can be supplied through the event editor using an image URL or file upload.

## Prototype storage
Admin changes are stored in browser `localStorage`. This remains a front-end prototype; production requires authentication, server validation, database storage, and persistent media storage.
