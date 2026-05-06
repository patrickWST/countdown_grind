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
  closeImportReview,
  closeSettings,
  getElements,
  openImportReview,
  openSettings,
  parseDateInputValue,
  renderBackupReminder,
  renderCountdown,
  renderEvent,
  renderImportReview,
  renderImportPreview,
  renderImportStatus,
  renderProjectSettings,
  renderProjects,
  renderProgress,
  setConfirmImportEnabled,
  renderStreak,
  renderTasks
} from "./ui.js";

const state = loadState();
const elems = getElements();
let countdownTimerId = null;
let pendingImport = null;
const BACKUP_META_KEY = "tg_backupMeta";
const BACKUP_REMINDER_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

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
  updateBackupReminder();
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

function getBackupMeta() {
  try {
    const raw = localStorage.getItem(BACKUP_META_KEY);
    if (!raw) {
      return { lastBackupAt: null, dismissedDayKey: null };
    }

    const parsed = JSON.parse(raw);
    return {
      lastBackupAt: Number.isFinite(parsed.lastBackupAt) ? parsed.lastBackupAt : null,
      dismissedDayKey: typeof parsed.dismissedDayKey === "string" ? parsed.dismissedDayKey : null
    };
  } catch {
    return { lastBackupAt: null, dismissedDayKey: null };
  }
}

function saveBackupMeta(meta) {
  localStorage.setItem(BACKUP_META_KEY, JSON.stringify(meta));
}

function markBackupCreated() {
  saveBackupMeta({ lastBackupAt: Date.now(), dismissedDayKey: null });
}

function dismissBackupReminderToday() {
  const meta = getBackupMeta();
  meta.dismissedDayKey = getTodayKey();
  saveBackupMeta(meta);
}

function exportAllProjectsAsBackup() {
  const payload = buildExportPayload(state.projects, state.activeProjectId);
  const datePart = new Date().toISOString().slice(0, 10);
  downloadJsonFile(`target-grind-backup-${datePart}.json`, payload);
  markBackupCreated();
}

function updateBackupReminder() {
  const meta = getBackupMeta();
  const today = getTodayKey();
  if (meta.dismissedDayKey === today) {
    renderBackupReminder(elems, false);
    return;
  }

  if (!meta.lastBackupAt) {
    renderBackupReminder(elems, true, "No backup found yet. Create one to keep your data safe.");
    return;
  }

  const age = Date.now() - meta.lastBackupAt;
  if (age >= BACKUP_REMINDER_INTERVAL_MS) {
    const days = Math.floor(age / (24 * 60 * 60 * 1000));
    renderBackupReminder(elems, true, `Your last backup is ${days} day(s) old. Create a fresh backup.`);
    return;
  }

  renderBackupReminder(elems, false);
}

function makeUniqueProjectId(baseId, existingIds) {
  let candidate = baseId;
  while (existingIds.has(candidate)) {
    candidate = `project-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }
  return candidate;
}

function makeUniqueProjectName(baseName, existingNames) {
  const trimmed = (baseName || "Imported Project").trim() || "Imported Project";
  if (!existingNames.has(trimmed)) {
    existingNames.add(trimmed);
    return trimmed;
  }

  let index = 2;
  let candidate = `${trimmed} (Imported)`;
  while (existingNames.has(candidate)) {
    candidate = `${trimmed} (Imported ${index})`;
    index += 1;
  }

  existingNames.add(candidate);
  return candidate;
}

function normalizeImportedProjects(rawProjects) {
  if (!Array.isArray(rawProjects)) {
    return [];
  }

  return rawProjects.map((project, index) => sanitizeProject(project, index));
}

function validateImportPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid JSON format.");
  }

  if (payload.app && payload.app !== "target-grind") {
    throw new Error("Unsupported app identifier in import file.");
  }

  if (payload.version && typeof payload.version !== "string") {
    throw new Error("Invalid version metadata in import file.");
  }

  if (!Array.isArray(payload.projects)) {
    throw new Error("Invalid JSON format. Expected a projects array.");
  }

  if (payload.projects.length === 0) {
    throw new Error("Imported file has no projects.");
  }

  if (payload.projects.length > 200) {
    throw new Error("Import file is too large (max 200 projects).");
  }

  const everyProjectObject = payload.projects.every((project) => project && typeof project === "object");
  if (!everyProjectObject) {
    throw new Error("Invalid project entries in import file.");
  }
}

function buildImportPreview(payload, mode) {
  const normalized = normalizeImportedProjects(payload.projects);
  const activeCount = normalized.filter((project) => !project.archived).length;
  const archivedCount = normalized.length - activeCount;

  const idSeen = new Set();
  let duplicateIdCount = 0;
  normalized.forEach((project) => {
    if (idSeen.has(project.id)) {
      duplicateIdCount += 1;
    }
    idSeen.add(project.id);
  });

  const nameSeen = new Set();
  let duplicateNameCount = 0;
  normalized.forEach((project) => {
    const key = project.name.toLowerCase();
    if (nameSeen.has(key)) {
      duplicateNameCount += 1;
    }
    nameSeen.add(key);
  });

  const existingNameSet = new Set(state.projects.map((project) => project.name.toLowerCase()));
  const existingNameConflictCount = normalized.filter((project) => existingNameSet.has(project.name.toLowerCase())).length;

  const warnings = [];
  if (duplicateIdCount > 0) {
    warnings.push(`${duplicateIdCount} duplicate id(s)`);
  }
  if (duplicateNameCount > 0) {
    warnings.push(`${duplicateNameCount} duplicate name(s) in file`);
  }
  if (mode === "merge" && existingNameConflictCount > 0) {
    warnings.push(`${existingNameConflictCount} name conflict(s) with existing projects`);
  }

  const baseSummary = `Ready to ${mode}: ${normalized.length} project(s), ${activeCount} active, ${archivedCount} archived.`;
  const warningSummary = warnings.length > 0 ? ` Warnings: ${warnings.join(", ")}.` : "";
  const details = [
    `Mode: ${mode === "overwrite" ? "Overwrite existing projects" : "Merge with existing projects"}`,
    `Projects in file: ${normalized.length}`,
    `Active projects in file: ${activeCount}`,
    `Archived projects in file: ${archivedCount}`
  ];

  if (mode === "overwrite") {
    details.push(`Current projects that will be replaced: ${state.projects.length}`);
  } else {
    details.push(`Current projects that will be kept: ${state.projects.length}`);
  }

  if (warnings.length > 0) {
    details.push(`Warnings: ${warnings.join(", ")}`);
  }

  return {
    mode,
    payload,
    normalizedProjects: normalized,
    warnings,
    details,
    summary: `${baseSummary}${warningSummary}`
  };
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
  const existingNames = new Set(state.projects.map((project) => project.name));
  const merged = importedProjects.map((project) => {
    const next = { ...project };
    next.id = makeUniqueProjectId(project.id, existingIds);
    next.name = makeUniqueProjectName(project.name, existingNames);
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

  elems.backupNowBtn.addEventListener("click", () => {
    exportAllProjectsAsBackup();
    renderImportStatus(elems, "Backup file downloaded.", "success");
    updateBackupReminder();
  });

  elems.backupDismissBtn.addEventListener("click", () => {
    dismissBackupReminderToday();
    updateBackupReminder();
  });

  elems.createBackupBtn.addEventListener("click", () => {
    exportAllProjectsAsBackup();
    renderImportStatus(elems, "Backup file downloaded.", "success");
    updateBackupReminder();
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
    markBackupCreated();
    renderImportStatus(elems, "All projects exported.", "success");
    updateBackupReminder();
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
      const mode = elems.importModeSelect.value === "overwrite" ? "overwrite" : "merge";
      validateImportPayload(payload);

      pendingImport = buildImportPreview(payload, mode);
      const previewStatus = pendingImport.warnings.length > 0 ? "warning" : "info";
      renderImportPreview(elems, pendingImport.summary, true, previewStatus);
      renderImportStatus(elems, "Import file parsed. Click Apply Import to continue.", "info");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed.";
      pendingImport = null;
      renderImportPreview(elems, "", false, "error");
      renderImportStatus(elems, message, "error");
    } finally {
      elems.importJsonInput.value = "";
    }
  });

  elems.importModeSelect.addEventListener("change", () => {
    if (!pendingImport) {
      return;
    }

    const mode = elems.importModeSelect.value === "overwrite" ? "overwrite" : "merge";
    pendingImport = buildImportPreview(pendingImport.payload, mode);
    const previewStatus = pendingImport.warnings.length > 0 ? "warning" : "info";
    renderImportPreview(elems, pendingImport.summary, true, previewStatus);
  });

  elems.applyImportBtn.addEventListener("click", () => {
    if (!pendingImport) {
      return;
    }

    renderImportReview(elems, pendingImport.summary, pendingImport.details, pendingImport.mode);
    openImportReview(elems);
  });

  elems.overwriteConfirmInput.addEventListener("change", () => {
    if (!pendingImport) {
      setConfirmImportEnabled(elems, false);
      return;
    }

    if (pendingImport.mode === "overwrite") {
      setConfirmImportEnabled(elems, elems.overwriteConfirmInput.checked);
      return;
    }

    setConfirmImportEnabled(elems, true);
  });

  elems.closeImportReviewBtn.addEventListener("click", () => {
    closeImportReview(elems);
  });

  elems.confirmImportBtn.addEventListener("click", () => {
    if (!pendingImport) {
      return;
    }

    try {
      const count = applyImportedData(pendingImport.payload, pendingImport.mode);
      persistState();
      refreshAll();
      renderImportStatus(elems, `Imported ${count} project(s) using ${pendingImport.mode} mode.`, "success");
      pendingImport = null;
      renderImportPreview(elems, "", false, "info");
      closeImportReview(elems);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed.";
      renderImportStatus(elems, message, "error");
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
  renderImportPreview(elems, "", false, "info");
  renderImportStatus(elems, "Use Export to back up your project data.");
  startCountdownTicker();
  registerServiceWorker();
}

boot();
