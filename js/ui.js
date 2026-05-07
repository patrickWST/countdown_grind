function getElements() {
  return {
    heroCard: document.querySelector(".hero-card"),
    projectSelect: document.getElementById("projectSelect"),
    addProjectBtn: document.getElementById("addProjectBtn"),
    backupReminder: document.getElementById("backupReminder"),
    backupReminderText: document.getElementById("backupReminderText"),
    backupNowBtn: document.getElementById("backupNowBtn"),
    restoreBackupBtn: document.getElementById("restoreBackupBtn"),
    backupDismissBtn: document.getElementById("backupDismissBtn"),
    streakBadge: document.getElementById("streakBadge"),
    streakMeta: document.getElementById("streakMeta"),
    openSettingsBtn: document.getElementById("openSettingsBtn"),
    closeSettingsBtn: document.getElementById("closeSettingsBtn"),
    settingsModal: document.getElementById("settingsModal"),
    settingsGeneralTabBtn: document.getElementById("settingsGeneralTabBtn"),
    settingsProjectTabBtn: document.getElementById("settingsProjectTabBtn"),
    settingsGeneralScreen: document.getElementById("settingsGeneralScreen"),
    settingsProjectScreen: document.getElementById("settingsProjectScreen"),
    importReviewModal: document.getElementById("importReviewModal"),
    importReviewSummary: document.getElementById("importReviewSummary"),
    importReviewRisk: document.getElementById("importReviewRisk"),
    importReviewList: document.getElementById("importReviewList"),
    closeImportReviewBtn: document.getElementById("closeImportReviewBtn"),
    confirmImportBtn: document.getElementById("confirmImportBtn"),
    overwriteConfirmRow: document.getElementById("overwriteConfirmRow"),
    overwriteConfirmInput: document.getElementById("overwriteConfirmInput"),
    settingsForm: document.getElementById("settingsForm"),
    projectNameInput: document.getElementById("projectNameInput"),
    archiveProjectBtn: document.getElementById("archiveProjectBtn"),
    deleteProjectBtn: document.getElementById("deleteProjectBtn"),
    archivedProjectSelect: document.getElementById("archivedProjectSelect"),
    restoreProjectBtn: document.getElementById("restoreProjectBtn"),
    exportCurrentBtn: document.getElementById("exportCurrentBtn"),
    exportAllBtn: document.getElementById("exportAllBtn"),
    createBackupBtn: document.getElementById("createBackupBtn"),
    importModeSelect: document.getElementById("importModeSelect"),
    importJsonBtn: document.getElementById("importJsonBtn"),
    importJsonInput: document.getElementById("importJsonInput"),
    backupMetaText: document.getElementById("backupMetaText"),
    notificationEnabledInput: document.getElementById("notificationEnabledInput"),
    notificationPermissionBtn: document.getElementById("notificationPermissionBtn"),
    notificationStatusText: document.getElementById("notificationStatusText"),
    historyRangeSelect: document.getElementById("historyRangeSelect"),
    historyChart: document.getElementById("historyChart"),
    importPreviewText: document.getElementById("importPreviewText"),
    applyImportBtn: document.getElementById("applyImportBtn"),
    importStatusText: document.getElementById("importStatusText"),
    eventNameInput: document.getElementById("eventNameInput"),
    targetDateInput: document.getElementById("targetDateInput"),
    themeSelect: document.getElementById("themeSelect"),
    densitySelect: document.getElementById("densitySelect"),
    radiusSelect: document.getElementById("radiusSelect"),
    streakEnabledInput: document.getElementById("streakEnabledInput"),
    eventNameDisplay: document.getElementById("eventNameDisplay"),
    countdownMessage: document.getElementById("countdownMessage"),
    daysValue: document.getElementById("daysValue"),
    progressText: document.getElementById("progressText"),
    progressFill: document.getElementById("progressFill"),
    taskList: document.getElementById("taskList"),
    emptyTasksHint: document.getElementById("emptyTasksHint"),
    quickAddForm: document.getElementById("quickAddForm"),
    quickTaskInput: document.getElementById("quickTaskInput"),
    taskItemTemplate: document.getElementById("taskItemTemplate")
  };
}

function formatDateInputValue(timestamp) {
  if (!Number.isFinite(timestamp)) {
    return "";
  }

  const date = new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateInputValue(dateValue) {
  if (!dateValue) {
    return null;
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  const parsed = new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function renderEvent(elems, project) {
  elems.projectNameInput.value = project.name || "";
  elems.archiveProjectBtn.disabled = false;
  elems.deleteProjectBtn.disabled = false;

  const eventData = project.eventData;
  elems.eventNameDisplay.textContent = eventData.eventName || "Set your target in Settings";
  elems.eventNameInput.value = eventData.eventName || "";
  elems.targetDateInput.value = formatDateInputValue(eventData.targetDate);
  elems.themeSelect.value = project.theme || "peach";
  elems.densitySelect.value = project.density || "comfortable";
  elems.radiusSelect.value = project.radius || "soft";
}

function renderProjectSettings(elems, projects, activeProjectId) {
  const archivedProjects = projects.filter((project) => project.archived);

  elems.archivedProjectSelect.innerHTML = "";
  if (archivedProjects.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No archived projects";
    elems.archivedProjectSelect.appendChild(option);
    elems.archivedProjectSelect.disabled = true;
    elems.restoreProjectBtn.disabled = true;
  } else {
    archivedProjects.forEach((project) => {
      const option = document.createElement("option");
      option.value = project.id;
      option.textContent = project.name;
      elems.archivedProjectSelect.appendChild(option);
    });
    elems.archivedProjectSelect.disabled = false;
    elems.restoreProjectBtn.disabled = false;
  }

  const activeProject = projects.find((project) => project.id === activeProjectId);
  const activeProjects = projects.filter((project) => !project.archived);

  elems.archiveProjectBtn.disabled = activeProjects.length <= 1;
  if (activeProjects.length <= 1) {
    elems.archiveProjectBtn.title = "Keep at least one active project";
  } else {
    elems.archiveProjectBtn.title = "";
  }

  elems.deleteProjectBtn.disabled = projects.length <= 1;
  if (projects.length <= 1) {
    elems.deleteProjectBtn.title = "Create another project before deleting this one";
  } else {
    elems.deleteProjectBtn.title = "";
  }

  if (activeProject?.archived) {
    elems.archiveProjectBtn.disabled = true;
  }
}

function renderProjects(elems, projects, activeProjectId) {
  elems.projectSelect.innerHTML = "";

  const visibleProjects = projects.filter((project) => !project.archived);

  visibleProjects.forEach((project) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.name;
    option.selected = project.id === activeProjectId;
    elems.projectSelect.appendChild(option);
  });
}

function renderImportStatus(elems, message, status = "info") {
  elems.importStatusText.textContent = message;
  elems.importStatusText.dataset.status = status;
}

function renderImportPreview(elems, message, hasPendingImport = false, status = "info") {
  elems.importPreviewText.textContent = message;
  elems.importPreviewText.dataset.status = status;
  elems.applyImportBtn.disabled = !hasPendingImport;
}

function renderBackupReminder(elems, visible, message = "") {
  elems.backupReminder.hidden = !visible;
  elems.backupReminderText.textContent = message;
}

function renderBackupMeta(elems, message, status = "info") {
  elems.backupMetaText.textContent = message;
  elems.backupMetaText.dataset.status = status;
}

function renderNotificationStatus(elems, message, status = "info") {
  elems.notificationStatusText.textContent = message;
  elems.notificationStatusText.dataset.status = status;
}

function renderHistoryChart(elems, historyEntries, rangeDays) {
  elems.historyChart.innerHTML = "";

  const range = Number.isInteger(rangeDays) ? rangeDays : 7;
  const sorted = Array.isArray(historyEntries)
    ? [...historyEntries].sort((a, b) => a.dayKey.localeCompare(b.dayKey))
    : [];
  const rows = sorted.slice(-range);

  if (rows.length === 0) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = "No history yet. Complete tasks to start your chart.";
    elems.historyChart.appendChild(empty);
    return;
  }

  rows.forEach((entry) => {
    const percent = entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0;

    const row = document.createElement("div");
    row.className = "history-row";

    const day = document.createElement("span");
    day.className = "history-day";
    day.textContent = entry.dayKey.slice(5);

    const bar = document.createElement("span");
    bar.className = "history-bar";

    const fill = document.createElement("span");
    fill.className = "history-fill";
    fill.style.width = `${percent}%`;
    fill.title = `${entry.dayKey}: ${entry.completed}/${entry.total}`;
    bar.appendChild(fill);

    const label = document.createElement("span");
    label.className = "history-value";
    label.textContent = `${entry.completed}/${entry.total}`;

    row.append(day, bar, label);
    elems.historyChart.appendChild(row);
  });
}

function renderCountdown(elems, countdown) {
  elems.daysValue.textContent = countdown.days;
  elems.countdownMessage.textContent = countdown.message;

  elems.heroCard.classList.toggle("is-complete", countdown.status === "done");
}

function renderStreak(elems, streakSettings, tasksCount) {
  if (!streakSettings.enabled) {
    elems.streakBadge.hidden = true;
    elems.streakMeta.hidden = true;
    return;
  }

  elems.streakBadge.hidden = false;
  const dayWord = streakSettings.currentStreak === 1 ? "Day" : "Days";
  elems.streakBadge.textContent = `🔥 ${streakSettings.currentStreak} ${dayWord} Streak`;

  if (tasksCount === 0) {
    elems.streakMeta.hidden = false;
    elems.streakMeta.textContent = "Streak frozen until you add tasks";
    return;
  }

  if (streakSettings.lastPerfectDay) {
    elems.streakMeta.hidden = false;
    elems.streakMeta.textContent = `Last perfect day: ${streakSettings.lastPerfectDay}`;
  } else {
    elems.streakMeta.hidden = false;
    elems.streakMeta.textContent = "No perfect day logged yet";
  }
}

function renderProgress(elems, stats) {
  elems.progressText.textContent = `${stats.completed} / ${stats.total} complete`;
  elems.progressFill.style.width = `${stats.percent}%`;

  const progressBar = elems.progressFill.parentElement;
  progressBar.setAttribute("aria-valuenow", String(stats.percent));
}

function renderTasks(elems, tasks, taskNotes, taskStatus, onToggle, onEdit, onEditNote, onDelete, onMove) {
  elems.taskList.innerHTML = "";
  elems.emptyTasksHint.hidden = tasks.length > 0;

  tasks.forEach((task, index) => {
    const fragment = elems.taskItemTemplate.content.cloneNode(true);
    const item = fragment.querySelector(".task-item");
    const check = fragment.querySelector(".task-check");
    const textInput = fragment.querySelector(".task-text");
    const noteInput = fragment.querySelector(".task-note");
    const moveUpBtn = fragment.querySelector(".task-move-up");
    const moveDownBtn = fragment.querySelector(".task-move-down");
    const deleteBtn = fragment.querySelector(".task-delete");

    check.checked = Boolean(taskStatus[index]);
    textInput.value = task;
    noteInput.value = taskNotes[index] || "";
    item.classList.toggle("task-complete", check.checked);

    check.addEventListener("change", () => onToggle(index, check.checked));

    textInput.addEventListener("blur", () => {
      onEdit(index, textInput.value);
    });

    textInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        textInput.blur();
      }
    });

    noteInput.addEventListener("blur", () => {
      onEditNote(index, noteInput.value);
    });

    noteInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        noteInput.blur();
      }
    });

    moveUpBtn.disabled = index === 0;
    moveDownBtn.disabled = index === tasks.length - 1;

    moveUpBtn.addEventListener("click", () => onMove(index, -1));
    moveDownBtn.addEventListener("click", () => onMove(index, 1));

    deleteBtn.addEventListener("click", () => onDelete(index));

    item.dataset.index = String(index);
    elems.taskList.appendChild(fragment);
  });
}

function setSettingsScreen(elems, screen) {
  const activeScreen = screen === "project" ? "project" : "general";
  const isProject = activeScreen === "project";

  elems.settingsGeneralScreen.hidden = isProject;
  elems.settingsProjectScreen.hidden = !isProject;

  elems.settingsGeneralTabBtn.classList.toggle("is-active", !isProject);
  elems.settingsProjectTabBtn.classList.toggle("is-active", isProject);

  elems.settingsGeneralTabBtn.setAttribute("aria-selected", String(!isProject));
  elems.settingsProjectTabBtn.setAttribute("aria-selected", String(isProject));
}

function openSettings(elems, streakEnabled, screen = "general") {
  elems.streakEnabledInput.checked = streakEnabled;
  setSettingsScreen(elems, screen);
  elems.settingsModal.showModal();
}

function closeSettings(elems) {
  elems.settingsModal.close();
}

function openImportReview(elems) {
  elems.importReviewModal.showModal();
}

function closeImportReview(elems) {
  elems.importReviewModal.close();
}

function renderImportReview(elems, summary, details, mode, riskLevel = "low") {
  elems.importReviewSummary.textContent = summary;
  elems.importReviewRisk.textContent = `Risk level: ${riskLevel.toUpperCase()}`;
  elems.importReviewRisk.dataset.status = riskLevel === "high" ? "error" : riskLevel === "medium" ? "warning" : "success";
  elems.importReviewList.innerHTML = "";

  details.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    elems.importReviewList.appendChild(li);
  });

  const isOverwrite = mode === "overwrite";
  elems.overwriteConfirmRow.hidden = !isOverwrite;
  elems.overwriteConfirmInput.checked = false;
  elems.confirmImportBtn.disabled = isOverwrite;
}

function setConfirmImportEnabled(elems, enabled) {
  elems.confirmImportBtn.disabled = !enabled;
}

export {
  closeImportReview,
  closeSettings,
  getElements,
  openImportReview,
  openSettings,
  parseDateInputValue,
  renderImportReview,
  setConfirmImportEnabled,
  renderCountdown,
  renderEvent,
  renderHistoryChart,
  renderBackupMeta,
  renderBackupReminder,
  renderImportPreview,
  renderImportStatus,
  renderNotificationStatus,
  renderProjectSettings,
  renderProjects,
  renderProgress,
  renderStreak,
  renderTasks,
  setSettingsScreen
};
