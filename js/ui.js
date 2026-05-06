function getElements() {
  return {
    heroCard: document.querySelector(".hero-card"),
    streakBadge: document.getElementById("streakBadge"),
    streakMeta: document.getElementById("streakMeta"),
    openSettingsBtn: document.getElementById("openSettingsBtn"),
    closeSettingsBtn: document.getElementById("closeSettingsBtn"),
    settingsModal: document.getElementById("settingsModal"),
    settingsForm: document.getElementById("settingsForm"),
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

function renderEvent(elems, eventData) {
  elems.eventNameDisplay.textContent = eventData.eventName || "Set your target in Settings";
  elems.eventNameInput.value = eventData.eventName || "";
  elems.targetDateInput.value = formatDateInputValue(eventData.targetDate);
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
  renderProgress,
  renderStreak,
  renderTasks
};
