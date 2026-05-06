# Target & Grind v1.1 Implementation Plan

## Milestone Status
- [x] Milestone 1: Project Scaffold and App Shell
- [x] Milestone 2: State and Storage Foundation
- [x] Milestone 3: Countdown Engine (updated to day-only display)
- [x] Milestone 4: Daily Reset Engine
- [x] Milestone 5: Tasks, Inline Editing, and Progress
- [x] Milestone 6: Optional Streak Counter
- [x] Milestone 7: Settings Modal and Visual Design
- [x] Milestone 8: PWA Offline Readiness
- [x] Milestone 9: QA and Release Checklist
- [-] Milestone 10: Multiple Targets / Projects (initial slice started)
- [-] Milestone 11: Import / Export (JSON, User-Owned Data) (initial slice started)

## Confirmed Decisions
- Start with an empty task list on first launch.
- If there are zero tasks, streak is frozen (no increment, no reset, no auto-complete behavior).
- Streak resets immediately when a missed day is detected.
- Task editing is inline.
- Use system fonts per platform (no custom webfont dependency).
- Data import/export is out of scope for v1.1.
- JavaScript modules are allowed and preferred for structure.

## Open Product Decision
- Countdown completion state when target date is reached is not finalized yet.
- Implemented for now: "Target reached. Keep the grind alive." celebratory state.

## Milestone 1: Project Scaffold and App Shell
- Create core files:
  - index.html
  - styles.css
  - js/main.js
  - js/storage.js
  - js/countdown.js
  - js/tasks.js
  - js/streak.js
  - js/ui.js
  - manifest.json
  - service-worker.js
  - icons/icon-192.png
  - icons/icon-512.png
- Build single-page layout sections:
  - Header: title, optional streak badge, settings button
  - Hero: event name + countdown container
  - Daily Grind: progress bar + task list
  - Settings modal: event/date controls, streak toggle, task management
- Wire module loading and service-worker registration.

Acceptance criteria:
- App shell loads with no console errors.
- Layout is mobile-first and readable on desktop.

## Milestone 2: State and Storage Foundation
- Implement localStorage schema and defaults:
  - tg_eventData
  - tg_tasks
  - tg_currentDay
  - tg_taskStatus
  - tg_streakSettings
- Add schema guards and fallback recovery for malformed data.
- Add state helpers:
  - loadState
  - saveEventData
  - saveTasks
  - saveTaskStatus
  - saveStreakSettings
  - getTodayKey

Acceptance criteria:
- Reload persists all supported state.
- Corrupted/missing keys do not break app startup.

## Milestone 3: Countdown Engine
- Implement countdown interval against tg_eventData.targetDate.
- Render days only (mobile-optimized display).
- Handle edge cases:
  - no target date set
  - target date already in the past
- Keep display updates lightweight (text node updates only).

Acceptance criteria:
- Countdown updates reliably with focus/visibility refresh and periodic interval updates.
- Past/no-date states display graceful messaging.

## Milestone 4: Daily Reset Engine
- On init and on focus/visibility return:
  - compare tg_currentDay to today
  - if changed, reset tg_taskStatus for new day
  - update tg_currentDay
- Apply immediate streak reset when a missed day is detected.
- Preserve tasks and event metadata across day rollover.

Acceptance criteria:
- Daily reset occurs exactly once per day boundary per device date.
- Missed-day streak reset is immediate.

## Milestone 5: Tasks, Inline Editing, and Progress
- Render task list from tg_tasks with per-item checkbox and inline edit UX.
- Support add, edit, delete task actions.
- Keep tg_taskStatus aligned with task array mutations.
- Render progress bar and completion ratio.

Rules:
- Empty task entries are rejected.
- Deleting a task also removes corresponding status entry.

Acceptance criteria:
- Task operations are stable and persisted.
- Progress UI always matches stored completion state.

## Milestone 6: Optional Streak Counter
- Implement streak settings object with defaults:
  - enabled: true
  - currentStreak: 0
  - lastPerfectDay: null
- Update streak only when all tasks are complete and there is at least one task.
- If lastPerfectDay is yesterday, increment; otherwise set to 1.
- Set lastPerfectDay to today on perfect day.
- Freeze behavior when task list is empty.
- Respect settings toggle: hide/show streak badge without deleting streak data.

Acceptance criteria:
- Streak increments once per perfect day.
- Empty task list does not alter streak.
- Streak can be disabled from UI and remains persisted.

## Milestone 7: Settings Modal and Visual Design
- Implement settings controls:
  - event name input
  - target date picker
  - streak enable toggle
  - task management (consistent with inline editing behavior)
- Apply pastel visual system with CSS variables:
  - soft off-white background
  - white cards
  - pastel green progress/completed states
  - pastel peach accent for streak
  - dark gray text for readability
- Use system font stack across devices.

Acceptance criteria:
- Settings edits apply immediately and persist.
- UI matches the intended pastel style and spacing.

## Milestone 8: PWA Offline Readiness
- Complete manifest:
  - display: standalone
  - theme_color + background_color aligned to palette
  - icons 192 and 512
- Implement cache-first service worker for core assets:
  - HTML/CSS/JS/icons/manifest
- Add activate cleanup for old cache versions.

Acceptance criteria:
- App is installable.
- App loads offline after first successful visit.

## Milestone 9: QA and Release Checklist
- Functional verification:
  - first launch with empty task list
  - create/edit/delete/check tasks
  - daily reset behavior
  - immediate missed-day streak reset
  - frozen streak with zero tasks
  - streak toggle visibility
  - offline load behavior
- Device checks:
  - mobile viewport usability
  - desktop responsiveness
  - touch target sizing

Release criteria:
- No blocking UI or state bugs in core loop (countdown + daily grind).
- Stable behavior across reloads and day transitions.

## Suggested Build Order
1. Milestone 1 to 2 (scaffold + storage)
2. Milestone 3 to 4 (countdown + reset logic)
3. Milestone 5 to 6 (tasks/progress + streak)
4. Milestone 7 (settings + polish)
5. Milestone 8 to 9 (PWA + QA)

## v1.2+ Feature Roadmap

### Milestone 10: Multiple Targets / Projects
- Initial slice implemented:
  - project-scoped storage migration from legacy single-project keys
  - `tg_projects` + `tg_activeProjectId` storage model
  - basic header project switcher
  - basic project creation flow
  - current project rename in settings
  - safe current project deletion when more than one project exists
  - archive current project flow
  - restore archived projects from settings
  - active project selector now hides archived projects
- Support multiple independent projects, each with its own:
  - eventName + targetDate
  - task list
  - daily task status
  - streak settings/history
- Add project switcher in header (dropdown or segmented control on mobile).
- Add create/rename/archive/delete project actions.
- Persist a `tg_activeProjectId` key and move data to project-scoped storage shape.

Proposed schema migration:
- `tg_projects` (Array):
  - `{ id, name, eventData, tasks, currentDay, taskStatus, streakSettings, createdAt, updatedAt }`
- `tg_activeProjectId` (String)

Acceptance criteria:
- Users can create and switch between projects without data collision.
- Each project resets daily independently.

### Milestone 11: Import / Export (JSON, User-Owned Data)
- Initial slice implemented:
  - export current project to JSON
  - export all projects to JSON
  - import JSON with merge and overwrite modes
  - import status feedback in settings
- Add settings actions:
  - Export current project to JSON
  - Export all projects to JSON
  - Import JSON (merge or overwrite mode)
- Add JSON schema versioning for forward compatibility.
- Validate imported payloads with user-friendly error messages.

Proposed export metadata:
- `app`: "target-grind"
- `version`: "1.2"
- `exportedAt`: ISO timestamp
- `projects`: array of project objects

Acceptance criteria:
- Exported files can be re-imported on another device/browser.
- Invalid imports never corrupt existing local data.

### Milestone 12: Backup and Recovery UX
- One-tap "Create backup" shortcut in settings.
- Optional reminder banner for periodic backup.
- "Restore preview" screen before applying imports.

### Milestone 13: Quality-of-Life Enhancements
- Optional notes field per task.
- Optional weekend mode (different task sets for weekday/weekend).
- Lightweight completion history chart (last 7/30 days).
- Optional daily notification prompt (when supported by platform/browser).

### Milestone 14: Theme Personalization
- Add selectable pastel themes (peach, mint, sky, lilac).
- Let users choose card density and corner radius presets.
- Persist selected theme per project.

Acceptance criteria:
- Theme changes apply instantly without reload.
- Theme choice survives reloads and project switches.

### Milestone 15: Streak Insights and Recovery
- Add weekly streak recap cards.
- Show reasons for streak breaks when inferable (missed day, empty project, imported state).
- Add optional "streak save" grace setting for one missed day per month.

Acceptance criteria:
- Users can understand streak changes without inspecting raw data.
- Recovery rules remain explicit and optional.

### Milestone 16: Home Screen and Widget-Friendly Shortcuts
- Add alternate compact layout for narrow home-screen launches.
- Add query/hash-based deep links to open a specific project or settings state.
- Prepare app state model for future widget/shortcut integrations.

Acceptance criteria:
- PWA launch feels optimized from the home screen on phones.
- Deep links open the expected project/state consistently.
