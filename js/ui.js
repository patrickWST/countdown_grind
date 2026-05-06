function getElements() {
  return {
    heroCard: document.querySelector(".hero-card"),
    projectSelect: document.getElementById("projectSelect"),
    addProjectBtn: document.getElementById("addProjectBtn"),
    backupReminder: document.getElementById("backupReminder"),
    backupReminderText: document.getElementById("backupReminderText"),
    backupNowBtn: document.getElementById("backupNowBtn"),
    backupDismissBtn: document.getElementById("backupDismissBtn"),
    streakBadge: document.getElementById("streakBadge"),
    streakMeta: document.getElementById("streakMeta"),
    openSettingsBtn: document.getElementById("openSettingsBtn"),
    closeSettingsBtn: document.getElementById("closeSettingsBtn"),
    settingsModal: document.getElementById("settingsModal"),
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
    importPreviewText: document.getElementById("importPreviewText"),
    applyImportBtn: document.getElementById("applyImportBtn"),
    importStatusText: document.getElementById("importStatusText"),
    eventNameInput: document.getElementById("eventNameInput"),
    targetDateInput: document.getElementById("targetDateInput"),
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

function renderTasks(elems, tasks, taskStatus, onToggle, onEdit, onDelete, onMove) {
  elems.taskList.innerHTML = "";
  elems.emptyTasksHint.hidden = tasks.length > 0;

  tasks.forEach((task, index) => {
    const fragment = elems.taskItemTemplate.content.cloneNode(true);
    const item = fragment.querySelector(".task-item");
    const check = fragment.querySelector(".task-check");
    const textInput = fragment.querySelector(".task-text");
    const moveUpBtn = fragment.querySelector(".task-move-up");
    const moveDownBtn = fragment.querySelector(".task-move-down");
    const deleteBtn = fragment.querySelector(".task-delete");

    check.checked = Boolean(taskStatus[index]);
    textInput.value = task;
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

    moveUpBtn.disabled = index === 0;
    moveDownBtn.disabled = index === tasks.length - 1;

    moveUpBtn.addEventListener("click", () => onMove(index, -1));
    moveDownBtn.addEventListener("click", () => onMove(index, 1));

    deleteBtn.addEventListener("click", () => onDelete(index));

    item.dataset.index = String(index);
    elems.taskList.appendChild(fragment);
  });
}

function openSettings(elems, streakEnabled) {
  elems.streakEnabledInput.checked = streakEnabled;
  elems.settingsModal.showModal();
}

function closeSettings(elems) {
  elems.settingsModal.close();
}

export {
  closeSettings,
  getElements,
  openSettings,
  parseDateInputValue,
  renderCountdown,
  renderEvent,
  renderBackupReminder,
  renderImportPreview,
  renderImportStatus,
  renderProjectSettings,
  renderProjects,
  renderProgress,
  renderStreak,
  renderTasks
};
