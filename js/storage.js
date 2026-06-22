const STORAGE_KEY = "allyson-math-quest";

const DEFAULT_PROGRESS = {
  stars: 0,
  bestStreak: 0,
  unlockedTables: [2, 5, 10],
  masteredTables: [],
};

const UNLOCK_ORDER = [2, 5, 10, 3, 4, 6, 7, 8, 9, 11, 12];

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { ...DEFAULT_PROGRESS };
    return { ...DEFAULT_PROGRESS, ...JSON.parse(saved) };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function addStars(progress, amount) {
  progress.stars += amount;
  saveProgress(progress);
  return progress;
}

function updateBestStreak(progress, streak) {
  if (streak > progress.bestStreak) {
    progress.bestStreak = streak;
    saveProgress(progress);
  }
}

function maybeUnlockNextTable(progress, table, correct, total) {
  const ratio = correct / total;
  if (ratio >= 0.8 && !progress.masteredTables.includes(table)) {
    progress.masteredTables.push(table);
    const idx = UNLOCK_ORDER.indexOf(table);
    if (idx >= 0 && idx < UNLOCK_ORDER.length - 1) {
      const next = UNLOCK_ORDER[idx + 1];
      if (!progress.unlockedTables.includes(next)) {
        progress.unlockedTables.push(next);
      }
    }
    saveProgress(progress);
    return true;
  }
  return false;
}
