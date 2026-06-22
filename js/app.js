let progress = loadProgress();
let playState = null;

const screens = {
  home: document.getElementById("screen-home"),
  tables: document.getElementById("screen-tables"),
  play: document.getElementById("screen-play"),
  results: document.getElementById("screen-results"),
  chart: document.getElementById("screen-chart"),
  parents: document.getElementById("screen-parents"),
  bubble: document.getElementById("screen-bubble"),
  rocket: document.getElementById("screen-rocket"),
};

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[name].classList.add("active");
}

window.showScreen = showScreen;

function syncSoundToggle() {
  const btn = document.getElementById("sound-toggle");
  const voiceBtn = document.getElementById("voice-mode-toggle");
  Sound.setEnabled(progress.soundEnabled);
  Voice.setEnabled(progress.soundEnabled);
  Voice.setMode(progress.voiceMode || "normal");
  btn.textContent = progress.soundEnabled ? "🔊 Sound & Voice On" : "🔇 Sound & Voice Off";
  voiceBtn.textContent =
    progress.voiceMode === "custom" ? "👨‍👩‍👧 Family Voice ON" : "🙂 Default Voice";
  voiceBtn.classList.toggle("active-funny", progress.voiceMode === "custom");
}

function refreshHome() {
  progress = loadProgress();
  document.getElementById("total-stars").textContent = progress.stars;
  document.getElementById("best-streak").textContent = progress.bestStreak;
  syncSoundToggle();
}

function renderTableGrid() {
  const grid = document.getElementById("table-grid");
  grid.innerHTML = "";
  for (let n = 1; n <= 12; n++) {
    const btn = document.createElement("button");
    btn.className = "table-btn";
    btn.textContent = `${n}×`;
    const unlocked = progress.unlockedTables.includes(n);
    const mastered = progress.masteredTables.includes(n);
    if (unlocked) btn.classList.add("unlocked");
    else btn.classList.add("locked");
    if (mastered) btn.classList.add("mastered");
    btn.disabled = !unlocked;
    btn.addEventListener("click", () => {
      Sound.playClick();
      startPractice(n);
    });
    grid.appendChild(btn);
  }
}

function startPractice(table) {
  playState = {
    mode: "practice",
    table,
    questions: buildTableQuestions(table),
    index: 0,
    correct: 0,
    streak: 0,
    answered: false,
  };
  document.getElementById("play-title").textContent = `${table}s Table`;
  document.getElementById("play-back-btn").dataset.go = "tables";
  showScreen("play");
  showQuestion();
}

function startQuiz() {
  playState = {
    mode: "quiz",
    table: null,
    questions: buildQuizQuestions(progress.unlockedTables),
    index: 0,
    correct: 0,
    streak: 0,
    answered: false,
  };
  document.getElementById("play-title").textContent = "Quiz Quest";
  document.getElementById("play-back-btn").dataset.go = "home";
  showScreen("play");
  showQuestion();
}

function showQuestion() {
  const q = playState.questions[playState.index];
  playState.answered = false;

  document.getElementById("question-text").textContent = `${q.a} × ${q.b} = ?`;
  document.getElementById("progress-text").textContent =
    `Question ${playState.index + 1} of ${playState.questions.length}`;
  document.getElementById("progress-fill").style.width =
    `${(playState.index / playState.questions.length) * 100}%`;

  const streakEl = document.getElementById("streak-badge");
  streakEl.textContent = `🔥 Streak: ${playState.streak}`;
  streakEl.classList.toggle("on-fire", playState.streak >= 3);

  document.getElementById("feedback").textContent = "";
  document.getElementById("feedback").className = "feedback";
  document.getElementById("next-btn").classList.add("hidden");

  renderDots(q.a, q.b);

  const choicesEl = document.getElementById("choices");
  choicesEl.innerHTML = "";
  q.choices.forEach((value) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = value;
    btn.addEventListener("click", () => handleAnswer(btn, value, q.answer, q.a));
    choicesEl.appendChild(btn);
  });
}

function handleAnswer(btn, chosen, answer, tableForStats) {
  if (playState.answered) return;
  playState.answered = true;

  const buttons = document.querySelectorAll(".choice-btn");
  buttons.forEach((b) => (b.disabled = true));

  const feedback = document.getElementById("feedback");
  const statsTable = playState.mode === "practice" ? playState.table : tableForStats;

  if (chosen === answer) {
    playState.correct += 1;
    playState.streak += 1;
    btn.classList.add("correct");
    feedback.textContent = pickRandom(ENCOURAGEMENTS);
    feedback.classList.add("bounce", "happy");
    popQuestionCard();
    launchStarBurst();
    launchConfetti(playState.streak >= 5);
    Sound.playCorrect();
    Voice.cheerCorrect();
    recordAnswer(progress, statsTable, true);
  } else {
    playState.streak = 0;
    btn.classList.add("wrong");
    buttons.forEach((b) => {
      if (Number(b.textContent) === answer) b.classList.add("correct");
    });
    feedback.textContent = `${pickRandom(GENTLE_WRONG)} ${answer}.`;
    feedback.classList.add("gentle");
    Sound.playWrong();
    Voice.cheerWrong();
    recordAnswer(progress, statsTable, false);
  }

  updateBestStreak(progress, playState.streak);
  const streakEl = document.getElementById("streak-badge");
  streakEl.textContent = `🔥 Streak: ${playState.streak}`;
  streakEl.classList.toggle("on-fire", playState.streak >= 3);
  document.getElementById("next-btn").classList.remove("hidden");
}

function finishRound() {
  const total = playState.questions.length;
  const correct = playState.correct;
  const starsEarned = correct;
  addStars(progress, starsEarned);

  let mastered = false;
  if (playState.mode === "practice" && playState.table) {
    recordRound(progress, playState.table);
    mastered = maybeUnlockNextTable(progress, playState.table, correct, total);
    if (mastered) Sound.playUnlock();
    if (mastered) Voice.cheerUnlock();
  } else {
    progress.roundsPlayed += 1;
    saveProgress(progress);
  }

  document.getElementById("progress-fill").style.width = "100%";

  const ratio = correct / total;
  let emoji = "🌟";
  let title = "Good job, Allyson!";
  let message = `You got ${correct} out of ${total} correct.`;

  if (ratio >= 0.9) {
    emoji = "🏆";
    title = "Incredible, Allyson!";
    message = "You're a multiplication champion!";
    launchConfetti(true);
    Voice.cheerWin();
  } else if (ratio >= 0.7) {
    emoji = "🎉";
    title = "Great work, Allyson!";
  }

  if (mastered) {
    message += ` You mastered the ${playState.table}s table! New table unlocked!`;
    emoji = "⭐";
    launchConfetti(true);
  }

  document.getElementById("results-emoji").textContent = emoji;
  document.getElementById("results-title").textContent = title;
  document.getElementById("results-message").textContent = message;
  document.getElementById("results-correct").textContent = correct;
  document.getElementById("results-stars").textContent = `+${starsEarned}`;

  refreshHome();
  showScreen("results");
}

function finishMinigame(gameId, correct, total) {
  const starsEarned = correct;
  addStars(progress, starsEarned);

  playState = { mode: gameId, correct, total };

  const ratio = correct / total;
  let emoji = "🌟";
  let title = "Good job, Allyson!";
  let message = `You got ${correct} out of ${total} correct.`;

  if (gameId === "bubble") {
    title = correct >= 6 ? "Bubble Master!" : "Nice popping, Allyson!";
    emoji = correct >= 6 ? "🫧" : "💫";
    if (correct >= 6) Voice.cheerWin();
  } else if (gameId === "rocket") {
    if (correct >= total) {
      emoji = "🌙";
      title = "You reached the Moon!";
      message = "Allyson the astronaut! All fuel stops complete!";
      launchConfetti(true);
      Sound.playUnlock();
      Voice.cheerMoon();
    } else {
      emoji = "🚀";
      title = "Great flight, Allyson!";
      message = `You reached ${correct} of ${total} fuel stops. Try again!`;
    }
  }

  if (ratio >= 0.9 && gameId !== "rocket") {
    launchConfetti(true);
  }

  document.getElementById("results-emoji").textContent = emoji;
  document.getElementById("results-title").textContent = title;
  document.getElementById("results-message").textContent = message;
  document.getElementById("results-correct").textContent = correct;
  document.getElementById("results-stars").textContent = `+${starsEarned}`;

  refreshHome();
  showScreen("results");
}

function renderChart() {
  const wrap = document.getElementById("chart-wrap");
  const table = document.createElement("table");
  table.className = "chart-table";

  const headerRow = document.createElement("tr");
  headerRow.innerHTML = "<th>×</th>";
  for (let c = 1; c <= 12; c++) {
    const th = document.createElement("th");
    th.textContent = c;
    headerRow.appendChild(th);
  }
  table.appendChild(headerRow);

  for (let r = 1; r <= 12; r++) {
    const row = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = r;
    row.appendChild(th);
    for (let c = 1; c <= 12; c++) {
      const td = document.createElement("td");
      td.textContent = "?";
      td.addEventListener("click", () => {
        Sound.playClick();
        document.querySelectorAll(".chart-table td").forEach((cell) => cell.classList.remove("active"));
        td.classList.add("active");
        td.textContent = r * c;
        document.getElementById("chart-detail").textContent = `${r} × ${c} = ${r * c} ✨`;
      });
      row.appendChild(td);
    }
    table.appendChild(row);
  }

  wrap.innerHTML = "";
  wrap.appendChild(table);
  document.getElementById("chart-detail").textContent = "Tap a square to begin ✨";
}

function renderParents() {
  progress = loadProgress();
  document.getElementById("parent-stars").textContent = progress.stars;
  document.getElementById("parent-rounds").textContent = progress.roundsPlayed;
  document.getElementById("parent-mastered").textContent = progress.masteredTables.length;

  const list = document.getElementById("parent-table-list");
  list.innerHTML = "";

  for (let n = 1; n <= 12; n++) {
    const stats = progress.tableStats[String(n)] || { correct: 0, total: 0, rounds: 0 };
    const accuracy = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
    const mastered = progress.masteredTables.includes(n);
    const unlocked = progress.unlockedTables.includes(n);

    const row = document.createElement("div");
    row.className = "parent-row";
    row.innerHTML = `
      <div class="parent-row-head">
        <strong>${n}× table</strong>
        <span class="parent-badge ${mastered ? "mastered" : unlocked ? "learning" : "locked"}">
          ${mastered ? "⭐ Mastered" : unlocked ? "Learning" : "🔒 Locked"}
        </span>
      </div>
      <div class="parent-row-bar">
        <div class="parent-row-fill" style="width: ${accuracy}%"></div>
      </div>
      <p class="parent-row-meta">${accuracy}% accuracy · ${stats.rounds} rounds · ${stats.correct}/${stats.total} correct</p>
    `;
    list.appendChild(row);
  }
}

function navigate(target) {
  if (target === "home") {
    refreshHome();
    showScreen("home");
  } else if (target === "tables") {
    progress = loadProgress();
    renderTableGrid();
    showScreen("tables");
  } else if (target === "quiz") {
    Sound.playClick();
    startQuiz();
  } else if (target === "chart") {
    Sound.playClick();
    renderChart();
    showScreen("chart");
  } else if (target === "parents") {
    renderParents();
    showScreen("parents");
  }
}

document.querySelectorAll("[data-go]").forEach((el) => {
  el.addEventListener("click", () => {
    Sound.playClick();
    navigate(el.dataset.go);
  });
});

document.getElementById("sound-toggle").addEventListener("click", () => {
  progress.soundEnabled = !progress.soundEnabled;
  saveProgress(progress);
  syncSoundToggle();
  if (progress.soundEnabled) Sound.playClick();
});

document.getElementById("voice-mode-toggle").addEventListener("click", () => {
  progress.voiceMode = progress.voiceMode === "custom" ? "normal" : "custom";
  saveProgress(progress);
  syncSoundToggle();
  if (progress.soundEnabled && progress.voiceMode === "custom") {
    Voice.cheerCorrect();
  } else if (progress.soundEnabled) {
    Sound.playClick();
  }
});

document.getElementById("next-btn").addEventListener("click", () => {
  Sound.playClick();
  if (playState.index < playState.questions.length - 1) {
    playState.index += 1;
    showQuestion();
  } else {
    finishRound();
  }
});

document.getElementById("play-again-btn").addEventListener("click", () => {
  Sound.playClick();
  if (!playState) return;
  if (playState.mode === "quiz") startQuiz();
  else if (playState.mode === "practice" && playState.table) startPractice(playState.table);
  else if (playState.mode === "bubble") startBubbleGame(progress.unlockedTables);
  else if (playState.mode === "rocket") startRocketGame(progress.unlockedTables);
});

initMinigames(finishMinigame);

async function bootVoice() {
  await Voice.loadCustomManifest();
  if (Voice.hasCustom()) {
    progress.voiceMode = "custom";
    saveProgress(progress);
  }
  refreshHome();
}

document.body.addEventListener(
  "click",
  () => Sound.init(),
  { once: true }
);

bootVoice();
