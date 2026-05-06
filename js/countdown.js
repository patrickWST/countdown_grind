function computeCountdown(targetTimestamp) {
  if (!Number.isFinite(targetTimestamp)) {
    return {
      status: "unset",
      days: "--",
      message: "No target date set yet."
    };
  }

  const diffMs = targetTimestamp - Date.now();
  if (diffMs <= 0) {
    return {
      status: "done",
      days: "00",
      message: "Target reached. Keep the grind alive."
    };
  }

  const days = Math.ceil(diffMs / 86400000);

  return {
    status: "running",
    days: String(days),
    message: "Keep showing up today."
  };
}

function getYesterdayKey(dayKey) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export { computeCountdown, getYesterdayKey };
