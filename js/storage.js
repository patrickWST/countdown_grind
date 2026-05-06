const STORAGE_KEYS = {
  eventData: "tg_eventData",
  tasks: "tg_tasks",
  currentDay: "tg_currentDay",
  taskStatus: "tg_taskStatus",
  streakSettings: "tg_streakSettings"
};

const DEFAULTS = {
  eventData: {
    eventName: "",
    targetDate: null
  },
  tasks: [],
  currentDay: null,
  taskStatus: [],
  streakSettings: {
    enabled: true,
    currentStreak: 0,
    lastPerfectDay: null
  }
};

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function sanitizeEventData(value) {
  if (!value || typeof value !== "object") {
    return { ...DEFAULTS.eventData };
  }

  const eventName = typeof value.eventName === "string" ? value.eventName.trim() : "";
  const targetDate = typeof value.targetDate === "number" && Number.isFinite(value.targetDate)
    ? value.targetDate
    : null;

  return { eventName, targetDate };
}

function sanitizeTasks(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((task) => (typeof task === "string" ? task.trim() : ""))
    .filter((task) => task.length > 0);
}

function sanitizeTaskStatus(value, taskCount) {
  const normalized = Array.isArray(value)
    ? value.map((status) => Boolean(status)).slice(0, taskCount)
    : [];

  while (normalized.length < taskCount) {
    normalized.push(false);
  }

  return normalized;
}

function sanitizeStreakSettings(value) {
  if (!value || typeof value !== "object") {
    return { ...DEFAULTS.streakSettings };
  }

  return {
    enabled: typeof value.enabled === "boolean" ? value.enabled : true,
    currentStreak: Number.isInteger(value.currentStreak) && value.currentStreak >= 0 ? value.currentStreak : 0,
    lastPerfectDay: typeof value.lastPerfectDay === "string" ? value.lastPerfectDay : null
  };
}

function loadState() {
  const eventData = sanitizeEventData(readJSON(STORAGE_KEYS.eventData, DEFAULTS.eventData));
  const tasks = sanitizeTasks(readJSON(STORAGE_KEYS.tasks, DEFAULTS.tasks));
  const taskStatus = sanitizeTaskStatus(readJSON(STORAGE_KEYS.taskStatus, DEFAULTS.taskStatus), tasks.length);
  const streakSettings = sanitizeStreakSettings(readJSON(STORAGE_KEYS.streakSettings, DEFAULTS.streakSettings));

  let currentDay = localStorage.getItem(STORAGE_KEYS.currentDay);
  if (typeof currentDay !== "string" || !currentDay) {
    currentDay = getTodayKey();
  }

  const normalizedState = {
    eventData,
    tasks,
    currentDay,
    taskStatus,
    streakSettings
  };

  persistAll(normalizedState);
  return normalizedState;
}

function persistAll(state) {
  writeJSON(STORAGE_KEYS.eventData, state.eventData);
  writeJSON(STORAGE_KEYS.tasks, state.tasks);
  localStorage.setItem(STORAGE_KEYS.currentDay, state.currentDay);
  writeJSON(STORAGE_KEYS.taskStatus, state.taskStatus);
  writeJSON(STORAGE_KEYS.streakSettings, state.streakSettings);
}

function saveEventData(eventData) {
  writeJSON(STORAGE_KEYS.eventData, sanitizeEventData(eventData));
}

function saveTasks(tasks) {
  writeJSON(STORAGE_KEYS.tasks, sanitizeTasks(tasks));
}

function saveCurrentDay(dayKey) {
  localStorage.setItem(STORAGE_KEYS.currentDay, dayKey);
}

function saveTaskStatus(taskStatus, taskCount) {
  writeJSON(STORAGE_KEYS.taskStatus, sanitizeTaskStatus(taskStatus, taskCount));
}

function saveStreakSettings(streakSettings) {
  writeJSON(STORAGE_KEYS.streakSettings, sanitizeStreakSettings(streakSettings));
}

export {
  getTodayKey,
  loadState,
  persistAll,
  saveCurrentDay,
  saveEventData,
  saveStreakSettings,
  saveTasks,
  saveTaskStatus
};
