import { computeCountdown } from "./countdown.js";
import {
  applyPerfectDayIfEligible,
  getCompletionStats,
  resetStreakOnMissedDay,
  shouldFreezeStreak
} from "./streak.js";
import {
  getTodayKey,
  loadState,
  saveCurrentDay,
  saveEventData,
  saveStreakSettings,
  saveTasks,
  saveTaskStatus
} from "./storage.js";
import { addTask, deleteTask, editTask, ensureStatusLength, moveTask, setTaskChecked } from "./tasks.js";
import {
  closeSettings,
  getElements,
  openSettings,
  parseDateInputValue,
  renderCountdown,
  renderEvent,
  renderProgress,
  renderStreak,
  renderTasks
} from "./ui.js";

const state = loadState();
const elems = getElements();
let countdownTimerId = null;

function persistState() {
  saveEventData(state.eventData);
  saveTasks(state.tasks);
  saveCurrentDay(state.currentDay);
  saveTaskStatus(state.taskStatus, state.tasks.length);
  saveStreakSettings(state.streakSettings);
}

function checkForDailyReset() {
  const today = getTodayKey();
  if (state.currentDay === today) {
    return false;
  }

  state.currentDay = today;
  state.taskStatus = ensureStatusLength(state.tasks, []).map(() => false);
  resetStreakOnMissedDay(state, today);
  persistState();
  return true;
}

function refreshCountdown() {
  const countdown = computeCountdown(state.eventData.targetDate);
  renderCountdown(elems, countdown);
}

function refreshTasksAndProgress() {
  const stats = getCompletionStats(state.taskStatus);
  renderProgress(elems, stats);

  renderTasks(
    elems,
    state.tasks,
    state.taskStatus,
    (index, checked) => {
      if (!setTaskChecked(state, index, checked)) {
        return;
      }

      if (!shouldFreezeStreak(state.tasks)) {
        applyPerfectDayIfEligible(state, state.currentDay);
      }

      persistState();
      refreshTasksAndProgress();
      renderStreak(elems, state.streakSettings, state.tasks.length);
    },
    (index, text) => {
      if (!editTask(state, index, text)) {
        refreshTasksAndProgress();
        return;
      }

      persistState();
      refreshTasksAndProgress();
    },
    (index) => {
      if (!deleteTask(state, index)) {
        return;
      }

      if (shouldFreezeStreak(state.tasks)) {
        // Empty task list freezes streak and clears carryover day marker.
        state.streakSettings.lastPerfectDay = null;
      }

      persistState();
      refreshTasksAndProgress();
      renderStreak(elems, state.streakSettings, state.tasks.length);
    },
    (index, direction) => {
      if (!moveTask(state, index, direction)) {
        return;
      }

      persistState();
      refreshTasksAndProgress();
    }
  );
}

function refreshAll() {
  renderEvent(elems, state.eventData);
  renderStreak(elems, state.streakSettings, state.tasks.length);
  refreshCountdown();
  refreshTasksAndProgress();
}

function bindEvents() {
  elems.openSettingsBtn.addEventListener("click", () => {
    openSettings(elems, state.streakSettings.enabled);
  });

  elems.closeSettingsBtn.addEventListener("click", () => {
    closeSettings(elems);
  });

  elems.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();

    state.eventData.eventName = elems.eventNameInput.value.trim();
    state.eventData.targetDate = parseDateInputValue(elems.targetDateInput.value);
    state.streakSettings.enabled = elems.streakEnabledInput.checked;

    persistState();
    closeSettings(elems);
    refreshAll();
  });

  elems.quickAddForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const value = elems.quickTaskInput.value;
    if (!addTask(state, value)) {
      return;
    }

    elems.quickTaskInput.value = "";
    persistState();
    refreshTasksAndProgress();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
      return;
    }

    const changed = checkForDailyReset();
    if (changed) {
      refreshTasksAndProgress();
      renderStreak(elems, state.streakSettings, state.tasks.length);
    }

    refreshCountdown();
  });

  window.addEventListener("focus", () => {
    const changed = checkForDailyReset();
    if (changed) {
      refreshTasksAndProgress();
      renderStreak(elems, state.streakSettings, state.tasks.length);
    }

    refreshCountdown();
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // Ignore registration errors in local dev contexts.
    });
  });
}

function startCountdownTicker() {
  if (countdownTimerId) {
    clearInterval(countdownTimerId);
  }

  countdownTimerId = window.setInterval(refreshCountdown, 60000);
}

function boot() {
  checkForDailyReset();
  bindEvents();
  refreshAll();
  startCountdownTicker();
  registerServiceWorker();
}

boot();
