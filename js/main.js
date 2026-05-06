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
  persistAll,
  sanitizeProject
} from "./storage.js";
import { addTask, deleteTask, editTask, ensureStatusLength, moveTask, setTaskChecked } from "./tasks.js";
import {
  closeSettings,
  getElements,
  openSettings,
  parseDateInputValue,
  renderCountdown,
  renderEvent,
  renderImportStatus,
  renderProjectSettings,
  renderProjects,
  renderProgress,
  renderStreak,
  renderTasks
} from "./ui.js";

const state = loadState();
const elems = getElements();
let countdownTimerId = null;

function getNonArchivedProjects() {
  return state.projects.filter((project) => !project.archived);
}

function ensureActiveProject() {
  if (state.projects.length === 0) {
    const project = createProject("My First Target");
    state.projects.push(project);
    state.activeProjectId = project.id;
    return;
  }

  const current = state.projects.find((project) => project.id === state.activeProjectId);
  if (current && !current.archived) {
    return;
  }

  const firstActive = state.projects.find((project) => !project.archived);
  if (firstActive) {
    state.activeProjectId = firstActive.id;
    return;
  }

  const project = createProject(`Project ${state.projects.length + 1}`);
  state.projects.push(project);
  state.activeProjectId = project.id;
}

function persistState() {
  ensureActiveProject();
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
  ensureActiveProject();
  const activeProject = getProjectState();
  renderProjects(elems, state.projects, state.activeProjectId);
  renderEvent(elems, activeProject);
  renderProjectSettings(elems, state.projects, state.activeProjectId);
  renderStreak(elems, activeProject.streakSettings, activeProject.tasks.length);
  refreshCountdown();
  refreshTasksAndProgress();
}

function downloadJsonFile(filename, payload) {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildExportPayload(projects, activeProjectId) {
  return {
    app: "target-grind",
    version: "1.2",
    exportedAt: new Date().toISOString(),
    activeProjectId,
    projects
  };
}

function makeUniqueProjectId(baseId, existingIds) {
  let candidate = baseId;
  while (existingIds.has(candidate)) {
    candidate = `project-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }
  return candidate;
}

function normalizeImportedProjects(rawProjects) {
  if (!Array.isArray(rawProjects)) {
    return [];
  }

  return rawProjects.map((project, index) => sanitizeProject(project, index));
}

function applyImportedData(payload, mode) {
  const importedProjects = normalizeImportedProjects(payload.projects);
  if (importedProjects.length === 0) {
    throw new Error("Imported file has no projects.");
  }

  if (mode === "overwrite") {
    state.projects = importedProjects;
    const requestedActive = typeof payload.activeProjectId === "string" ? payload.activeProjectId : null;
    const chosenActive = importedProjects.find((project) => project.id === requestedActive && !project.archived)
      || importedProjects.find((project) => !project.archived)
      || importedProjects[0];
    state.activeProjectId = chosenActive.id;
    ensureActiveProject();
    return importedProjects.length;
  }

  const existingIds = new Set(state.projects.map((project) => project.id));
  const merged = importedProjects.map((project) => {
    const next = { ...project };
    next.id = makeUniqueProjectId(project.id, existingIds);
    existingIds.add(next.id);
    return next;
  });

  state.projects.push(...merged);
  const firstRestoredActive = merged.find((project) => !project.archived) || merged[0];
  state.activeProjectId = firstRestoredActive.id;
  ensureActiveProject();
  return merged.length;
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

  elems.archiveProjectBtn.addEventListener("click", () => {
    const current = getProjectState();
    const activeProjects = state.projects.filter((project) => !project.archived);
    if (!current || activeProjects.length <= 1) {
      return;
    }

    current.archived = true;
    const fallback = state.projects.find((project) => !project.archived);
    if (fallback) {
      state.activeProjectId = fallback.id;
    }

    persistState();
    closeSettings(elems);
    refreshAll();
  });

  elems.restoreProjectBtn.addEventListener("click", () => {
    const restoreId = elems.archivedProjectSelect.value;
    if (!restoreId) {
      return;
    }

    const restoreProject = state.projects.find((project) => project.id === restoreId);
    if (!restoreProject) {
      return;
    }

    restoreProject.archived = false;
    state.activeProjectId = restoreProject.id;
    persistState();
    closeSettings(elems);
    refreshAll();
  });

  elems.exportCurrentBtn.addEventListener("click", () => {
    const activeProject = getProjectState();
    const payload = buildExportPayload([activeProject], activeProject.id);
    const safeName = activeProject.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "project";
    downloadJsonFile(`target-grind-${safeName}.json`, payload);
    renderImportStatus(elems, "Current project exported.", "success");
  });

  elems.exportAllBtn.addEventListener("click", () => {
    const payload = buildExportPayload(state.projects, state.activeProjectId);
    downloadJsonFile("target-grind-all-projects.json", payload);
    renderImportStatus(elems, "All projects exported.", "success");
  });

  elems.importJsonBtn.addEventListener("click", () => {
    elems.importJsonInput.click();
  });

  elems.importJsonInput.addEventListener("change", async () => {
    const file = elems.importJsonInput.files?.[0];
    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const payload = JSON.parse(raw);
      if (!payload || typeof payload !== "object" || !Array.isArray(payload.projects)) {
        throw new Error("Invalid JSON format. Expected a projects array.");
      }

      const mode = elems.importModeSelect.value === "overwrite" ? "overwrite" : "merge";
      const count = applyImportedData(payload, mode);
      persistState();
      refreshAll();
      renderImportStatus(elems, `Imported ${count} project(s) using ${mode} mode.`, "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed.";
      renderImportStatus(elems, message, "error");
    } finally {
      elems.importJsonInput.value = "";
    }
  });

  elems.openSettingsBtn.addEventListener("click", () => {
    openSettings(elems, getProjectState().streakSettings.enabled);
  });

  elems.closeSettingsBtn.addEventListener("click", () => {
    closeSettings(elems);
  });

  elems.deleteProjectBtn.addEventListener("click", () => {
    if (state.projects.length <= 1) {
      return;
    }

    const currentIndex = state.projects.findIndex((project) => project.id === state.activeProjectId);
    if (currentIndex === -1) {
      return;
    }

    state.projects.splice(currentIndex, 1);
    ensureActiveProject();
    persistState();
    closeSettings(elems);
    refreshAll();
  });

  elems.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const activeProject = getProjectState();

    activeProject.name = elems.projectNameInput.value.trim() || activeProject.name || "Untitled Project";
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
  renderImportStatus(elems, "Use Export to back up your project data.");
  startCountdownTicker();
  registerServiceWorker();
}

boot();
