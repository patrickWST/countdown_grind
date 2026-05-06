import { getYesterdayKey } from "./countdown.js";

function shouldFreezeStreak(tasks) {
  return tasks.length === 0;
}

function getCompletionStats(taskStatus) {
  const completed = taskStatus.filter(Boolean).length;
  const total = taskStatus.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

function applyPerfectDayIfEligible(state, todayKey) {
  const { tasks, taskStatus, streakSettings } = state;
  if (!streakSettings.enabled) {
    return false;
  }

  if (shouldFreezeStreak(tasks)) {
    return false;
  }

  const { completed, total } = getCompletionStats(taskStatus);
  if (total === 0 || completed !== total) {
    return false;
  }

  if (streakSettings.lastPerfectDay === todayKey) {
    return false;
  }

  const yesterday = getYesterdayKey(todayKey);
  if (streakSettings.lastPerfectDay === yesterday) {
    streakSettings.currentStreak += 1;
  } else {
    streakSettings.currentStreak = 1;
  }

  streakSettings.lastPerfectDay = todayKey;
  return true;
}

function resetStreakOnMissedDay(state, todayKey) {
  const { tasks, streakSettings } = state;

  if (!streakSettings.enabled || shouldFreezeStreak(tasks)) {
    return false;
  }

  if (!streakSettings.lastPerfectDay) {
    return false;
  }

  const yesterday = getYesterdayKey(todayKey);
  if (streakSettings.lastPerfectDay === todayKey || streakSettings.lastPerfectDay === yesterday) {
    return false;
  }

  streakSettings.currentStreak = 0;
  return true;
}

export {
  applyPerfectDayIfEligible,
  getCompletionStats,
  resetStreakOnMissedDay,
  shouldFreezeStreak
};
