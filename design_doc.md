That is a great call. A streak counter adds that little hit of dopamine to keep the momentum going, and making it optional is good UX design. Moving away from the dark mode to a balanced, happy pastel palette will give the app a fresh, uplifting vibe without looking like a candy store.

Here is your updated Design Document. You can copy and paste this directly into Gemini in VSCode when you get home, and it will know exactly what to build.

---

# 📄 PWA Design Document: "Target & Grind" (v1.1)

## 1. Project Overview
**Target & Grind** is a local-only Progressive Web App (PWA) designed to track a countdown to a specific target date while providing a daily checklist of static habits to complete along the way. The app is mobile-first, offline-capable, and stores all user data locally on the device.

## 2. UI / UX Design & Vibe
* **Color Palette (Happy, Subtle Pastels):** * **Background:** Soft off-white or light cream (e.g., `#FAFAFA` or `#FDFBF7`) so it's not harsh on the eyes.
    * **Cards/Containers:** Pure white (`#FFFFFF`) with very soft, diffused shadows.
    * **Accents:** Subtle pastels for functional elements. E.g., a muted pastel green (`#A8E6CF`) for completed tasks/progress bars, soft pastel peach/orange (`#FFD3B6`) for the streak counter, and dark gray (`#333333`) for highly readable text instead of harsh pure black.
* **Layout:** A single-page, scrolling view with smooth, rounded corners (e.g., `border-radius: 16px`) and airy padding.

## 3. Tech Stack
* **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+). No heavy frameworks (React/Vue) needed.
* **Storage:** Browser `localStorage`.
* **PWA Features:** `manifest.json` and a standard offline-caching Service Worker.

## 4. Data Architecture (Local Storage Schema)
The app will rely on a simple key-value structure in `localStorage`:
* `tg_eventData` (Object): `{ eventName: string, targetDate: timestamp }`
* `tg_tasks` (Array of Strings): The user's custom daily tasks.
* `tg_currentDay` (String): Date string (e.g., "2026-05-06") to track daily resets.
* `tg_taskStatus` (Array of Booleans): Checkmark states for the current day.
* **[NEW]** `tg_streakSettings` (Object): `{ enabled: boolean (default true), currentStreak: number, lastPerfectDay: string }`

## 5. Core App Mechanics
* **The Countdown Interval:** A JavaScript `setInterval` running every 1000ms. It calculates the difference between `Date.now()` and the saved `targetDate`, updating the DOM with Days, Hours, Minutes, and Seconds.
* **The Daily Reset Engine:** On initialization and every time the app regains focus, it checks `tg_currentDay` against today's date string. If they do not match, it clears `tg_taskStatus` and updates `tg_currentDay`.
* **Task Editor:** Users can add, edit, or delete existing tasks.
* **[NEW] Optional Streak Counter:** * When 100% of the day's tasks are checked off, the app checks if `lastPerfectDay` was yesterday. If yes, `currentStreak++`. If not, `currentStreak = 1`. Updates `lastPerfectDay` to today.
    * The streak is displayed visually (e.g., "🔥 5 Day Streak!") but can be hidden via the settings menu.

## 6. View Hierarchy
1.  **Header:** App title, Streak Counter (if enabled), and a Settings gear icon.
2.  **Hero Section (The Countdown):**
    * Name of the event.
    * Large, highly legible countdown timer in a distinct pastel accent container.
3.  **Action Section (The Daily Grind):**
    * A daily progress bar that fills up with a satisfying pastel green as tasks are checked.
    * A clean list of checkboxes with the task names.
4.  **Settings Modal (Hidden by default):**
    * Date picker for the target date.
    * Text input to name the event.
    * Toggle switch: "Enable Daily Streak Counter" (Default: ON).
    * List of current tasks with "X" buttons to remove them, and an input + button to add new ones.

## 7. PWA Requirements
* **`manifest.json`:** Needs `display: "standalone"`, a `theme_color` (matching the pastel background), a `background_color`, and a set of basic app icons (192x192 and 512x512).
* **`service-worker.js`:** A basic "cache-first" strategy for the HTML, CSS, JS, and icons to ensure the app loads instantly offline.