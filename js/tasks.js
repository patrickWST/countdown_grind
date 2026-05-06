function ensureStatusLength(tasks, taskStatus) {
  const next = taskStatus.slice(0, tasks.length).map(Boolean);
  while (next.length < tasks.length) {
    next.push(false);
  }
  return next;
}

function ensureNotesLength(tasks, taskNotes) {
  const next = Array.isArray(taskNotes)
    ? taskNotes.slice(0, tasks.length).map((note) => (typeof note === "string" ? note.trim() : ""))
    : [];

  while (next.length < tasks.length) {
    next.push("");
  }

  return next;
}

function addTask(state, taskText) {
  const value = taskText.trim();
  if (!value) {
    return false;
  }

  state.tasks.push(value);
  state.taskStatus = ensureStatusLength(state.tasks, state.taskStatus);
  state.taskNotes = ensureNotesLength(state.tasks, state.taskNotes);
  return true;
}

function deleteTask(state, index) {
  if (index < 0 || index >= state.tasks.length) {
    return false;
  }

  state.tasks.splice(index, 1);
  state.taskStatus.splice(index, 1);
  state.taskNotes.splice(index, 1);
  state.taskStatus = ensureStatusLength(state.tasks, state.taskStatus);
  state.taskNotes = ensureNotesLength(state.tasks, state.taskNotes);
  return true;
}

function editTask(state, index, newText) {
  if (index < 0 || index >= state.tasks.length) {
    return false;
  }

  const value = newText.trim();
  if (!value) {
    return false;
  }

  state.tasks[index] = value;
  return true;
}

function editTaskNote(state, index, noteText) {
  if (index < 0 || index >= state.tasks.length) {
    return false;
  }

  state.taskNotes = ensureNotesLength(state.tasks, state.taskNotes);
  state.taskNotes[index] = typeof noteText === "string" ? noteText.trim() : "";
  return true;
}

function setTaskChecked(state, index, checked) {
  if (index < 0 || index >= state.taskStatus.length) {
    return false;
  }

  state.taskStatus[index] = Boolean(checked);
  return true;
}

function moveTask(state, index, direction) {
  const targetIndex = index + direction;
  if (
    index < 0
    || index >= state.tasks.length
    || targetIndex < 0
    || targetIndex >= state.tasks.length
  ) {
    return false;
  }

  [state.tasks[index], state.tasks[targetIndex]] = [state.tasks[targetIndex], state.tasks[index]];
  [state.taskStatus[index], state.taskStatus[targetIndex]] = [state.taskStatus[targetIndex], state.taskStatus[index]];
  [state.taskNotes[index], state.taskNotes[targetIndex]] = [state.taskNotes[targetIndex], state.taskNotes[index]];
  return true;
}

export {
  addTask,
  deleteTask,
  editTask,
  editTaskNote,
  ensureNotesLength,
  ensureStatusLength,
  moveTask,
  setTaskChecked
};
