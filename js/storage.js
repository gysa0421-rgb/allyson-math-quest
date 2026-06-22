const STORAGE_KEY = "allyson-math-quest";

const DEFAULT_PROGRESS = {
  stars: 0,
  bestStreak: 0,
  unlockedTables: [1, 2, 5, 10],
  masteredTables: [],
  tableStats: {},
  roundsPlayed: 0,
  soundEnabled: true,
  voiceMode: "normal",
};

const UNLOCK_ORDER = [1, 2, 5, 10, 3, 4, 6, 7, 8, 9, 11, 12];

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(DEFAULT_PROGRESS);
    const data = { ...structuredClone(DEFAULT_PROGRESS), ...JSON.parse(saved) };
    if (!data.unlockedTables.includes(1)) {
      data.unlockedTables = [1, ...data.unlockedTables];
    }
    data.tableStats = data.tableStats || {};
    return data;
  } catch {
    return structuredClone(DEFAULT_PROGRESS);
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

function recordAnswer(progress, table, wasCorrect) {
  const key = String(table);
  if (!progress.tableStats[key]) {
    progress.tableStats[key] = { correct: 0, total: 0, rounds: 0 };
  }
  progress.tableStats[key].total += 1;
  if (wasCorrect) progress.tableStats[key].correct += 1;
  saveProgress(progress);
}

function recordRound(progress, table) {
  const key = String(table);
  if (!progress.tableStats[key]) {
    progress.tableStats[key] = { correct: 0, total: 0, rounds: 0 };
  }
  progress.tableStats[key].rounds += 1;
  progress.roundsPlayed += 1;
  saveProgress(progress);
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
