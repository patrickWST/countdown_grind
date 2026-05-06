# Target & Grind

Target & Grind is a local-first, mobile-friendly PWA that combines a day-based countdown with a reusable daily task list and optional streak tracking.

## Highlights
- Day-only countdown to a target date
- Persistent daily tasks (same tasks every day)
- Daily checkbox reset behavior
- Optional streak counter with frozen behavior when no tasks exist
- Offline-capable PWA (manifest + service worker)
- Data stored locally in browser localStorage

## Tech Stack
- HTML5
- CSS3
- Vanilla JavaScript (ES modules)
- localStorage
- Service Worker + Web App Manifest

## Local Development
No build step is required.

1. From project root, run a static server:

```bash
python3 -m http.server 8124
```

2. Open:

```text
http://127.0.0.1:8124
```

## Data Model (localStorage)
- `tg_eventData`: `{ eventName: string, targetDate: number | null }`
- `tg_tasks`: `string[]`
- `tg_currentDay`: `YYYY-MM-DD`
- `tg_taskStatus`: `boolean[]`
- `tg_streakSettings`: `{ enabled: boolean, currentStreak: number, lastPerfectDay: string | null }`

## Behavior Notes
- Tasks stay the same every day until edited or deleted by the user.
- Only completion state resets each new day.
- If no tasks exist, streak is frozen.
- Missed-day streak reset is immediate when day rollover is detected.

## GitHub Pages Deployment
1. Create a GitHub repo and push your code:

```bash
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

2. In GitHub repo settings:
- Go to `Settings` -> `Pages`
- `Source`: `Deploy from a branch`
- `Branch`: `main`
- `Folder`: `/ (root)`

3. Wait for Pages to publish and open your site URL.

## PWA Notes
- Install prompts and behavior vary by browser/platform.
- For offline use, load the app once online so assets can be cached.

## Roadmap
See [plan.md](plan.md) for completed milestones and planned features, including:
- Multiple targets/projects
- JSON import/export for user-owned backups
- Backup/recovery UX improvements
