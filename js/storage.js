const STORAGE_KEYS = {
  projects: "tg_projects",
  activeProjectId: "tg_activeProjectId",
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

function createProject(name = "My First Target") {
  return {
    id: `project-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name,
    eventData: { ...DEFAULTS.eventData },
    tasks: [],
    currentDay: getTodayKey(),
    taskStatus: [],
    streakSettings: { ...DEFAULTS.streakSettings },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

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

function sanitizeProject(value, index = 0) {
  const fallback = createProject(index === 0 ? "My First Target" : `Project ${index + 1}`);
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const tasks = sanitizeTasks(value.tasks);
  return {
    id: typeof value.id === "string" && value.id ? value.id : fallback.id,
    name: typeof value.name === "string" && value.name.trim() ? value.name.trim() : fallback.name,
    eventData: sanitizeEventData(value.eventData),
    tasks,
    currentDay: typeof value.currentDay === "string" && value.currentDay ? value.currentDay : getTodayKey(),
    taskStatus: sanitizeTaskStatus(value.taskStatus, tasks.length),
    streakSettings: sanitizeStreakSettings(value.streakSettings),
    createdAt: Number.isFinite(value.createdAt) ? value.createdAt : fallback.createdAt,
    updatedAt: Number.isFinite(value.updatedAt) ? value.updatedAt : Date.now()
  };
}

function migrateLegacyState() {
  const project = createProject("My First Target");
  project.eventData = sanitizeEventData(readJSON(STORAGE_KEYS.eventData, DEFAULTS.eventData));
  project.tasks = sanitizeTasks(readJSON(STORAGE_KEYS.tasks, DEFAULTS.tasks));
  project.taskStatus = sanitizeTaskStatus(readJSON(STORAGE_KEYS.taskStatus, DEFAULTS.taskStatus), project.tasks.length);
  project.streakSettings = sanitizeStreakSettings(readJSON(STORAGE_KEYS.streakSettings, DEFAULTS.streakSettings));
  const currentDay = localStorage.getItem(STORAGE_KEYS.currentDay);
  project.currentDay = typeof currentDay === "string" && currentDay ? currentDay : getTodayKey();
  project.updatedAt = Date.now();

  return {
    projects: [project],
    activeProjectId: project.id
  };
}

function loadState() {
  const rawProjects = readJSON(STORAGE_KEYS.projects, null);
  const normalizedState = Array.isArray(rawProjects) && rawProjects.length > 0
    ? {
        projects: rawProjects.map((project, index) => sanitizeProject(project, index)),
        activeProjectId: localStorage.getItem(STORAGE_KEYS.activeProjectId)
      }
    : migrateLegacyState();

  if (!normalizedState.projects.some((project) => project.id === normalizedState.activeProjectId)) {
    normalizedState.activeProjectId = normalizedState.projects[0].id;
  }

  persistAll(normalizedState);
  return normalizedState;
}

function persistAll(state) {
  const projects = state.projects.map((project, index) => sanitizeProject(project, index));
  writeJSON(STORAGE_KEYS.projects, projects);
  localStorage.setItem(STORAGE_KEYS.activeProjectId, state.activeProjectId);
}

function getActiveProject(state) {
  return state.projects.find((project) => project.id === state.activeProjectId) || state.projects[0];
}

export {
  createProject,
  getActiveProject,
  getTodayKey,
  loadState,
  persistAll
};
