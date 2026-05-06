import { computeCountdown } from "./countdown.js";
import {
  applyPerfectDayIfEligible,
  getCompletionStats,
  resetStreakOnMissedDay,
  shouldFreezeStreak
} from "./streak.js";
import {
  createProject,
  getActiveProject,
  getTodayKey,
  loadState,
  persistAll
} from "./storage.js";
import { addTask, deleteTask, editTask, ensureStatusLength, moveTask, setTaskChecked } from "./tasks.js";
import {
  closeSettings,
  getElements,
  openSettings,
  parseDateInputValue,
  renderCountdown,
  renderEvent,
  renderProjects,
  renderProgress,
  renderStreak,
  renderTasks
} from "./ui.js";

const state = loadState();
const elems = getElements();
let countdownTimerId = null;

function persistState() {
  const activeProject = getActiveProject(state);
  activeProject.updatedAt = Date.now();
  persistAll(state);
}

function getProjectState() {
  return getActiveProject(state);
}

function checkForDailyReset() {
  const activeProject = getProjectState();
  const today = getTodayKey();
  if (activeProject.currentDay === today) {
    return false;
  }

  activeProject.currentDay = today;
  activeProject.taskStatus = ensureStatusLength(activeProject.tasks, []).map(() => false);
  resetStreakOnMissedDay(activeProject, today);
  persistState();
  return true;
}

function refreshCountdown() {
  const activeProject = getProjectState();
  const countdown = computeCountdown(activeProject.eventData.targetDate);
  renderCountdown(elems, countdown);
}

function refreshTasksAndProgress() {
  const activeProject = getProjectState();
  const stats = getCompletionStats(activeProject.taskStatus);
  renderProgress(elems, stats);

  renderTasks(
    elems,
    activeProject.tasks,
    activeProject.taskStatus,
    (index, checked) => {
      if (!setTaskChecked(activeProject, index, checked)) {
        return;
      }

      if (!shouldFreezeStreak(activeProject.tasks)) {
        applyPerfectDayIfEligible(activeProject, activeProject.currentDay);
      }

      persistState();
      refreshTasksAndProgress();
      renderStreak(elems, activeProject.streakSettings, activeProject.tasks.length);
    },
    (index, text) => {
      if (!editTask(activeProject, index, text)) {
        refreshTasksAndProgress();
        return;
      }

      persistState();
      refreshTasksAndProgress();
    },
    (index) => {
      if (!deleteTask(activeProject, index)) {
        return;
      }

      if (shouldFreezeStreak(activeProject.tasks)) {
        // Empty task list freezes streak and clears carryover day marker.
        activeProject.streakSettings.lastPerfectDay = null;
      }

      persistState();
      refreshTasksAndProgress();
      renderStreak(elems, activeProject.streakSettings, activeProject.tasks.length);
    },
    (index, direction) => {
      if (!moveTask(activeProject, index, direction)) {
        return;
      }

      persistState();
      refreshTasksAndProgress();
    }
  );
}

function refreshAll() {
  const activeProject = getProjectState();
  renderProjects(elems, state.projects, state.activeProjectId);
  renderEvent(elems, activeProject.eventData);
  renderStreak(elems, activeProject.streakSettings, activeProject.tasks.length);
  refreshCountdown();
  refreshTasksAndProgress();
}

function bindEvents() {
  elems.projectSelect.addEventListener("change", () => {
    state.activeProjectId = elems.projectSelect.value;
    persistState();
    refreshAll();
  });

  elems.addProjectBtn.addEventListener("click", () => {
    const defaultName = `Project ${state.projects.length + 1}`;
    const project = createProject(defaultName);
    state.projects.push(project);
    state.activeProjectId = project.id;
    persistState();
    refreshAll();
  });

  elems.openSettingsBtn.addEventListener("click", () => {
    openSettings(elems, getProjectState().streakSettings.enabled);
  });

  elems.closeSettingsBtn.addEventListener("click", () => {
    closeSettings(elems);
  });

  elems.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const activeProject = getProjectState();

    activeProject.eventData.eventName = elems.eventNameInput.value.trim();
    activeProject.eventData.targetDate = parseDateInputValue(elems.targetDateInput.value);
    activeProject.streakSettings.enabled = elems.streakEnabledInput.checked;

    persistState();
    closeSettings(elems);
    refreshAll();
  });

  elems.quickAddForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const activeProject = getProjectState();

    const value = elems.quickTaskInput.value;
    if (!addTask(activeProject, value)) {
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
      const activeProject = getProjectState();
      refreshTasksAndProgress();
      renderStreak(elems, activeProject.streakSettings, activeProject.tasks.length);
    }

    refreshCountdown();
  });

  window.addEventListener("focus", () => {
    const changed = checkForDailyReset();
    if (changed) {
      const activeProject = getProjectState();
      refreshTasksAndProgress();
      renderStreak(elems, activeProject.streakSettings, activeProject.tasks.length);
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
