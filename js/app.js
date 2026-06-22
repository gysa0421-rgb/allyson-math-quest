let progress = loadProgress();
let playState = null;

const screens = {
  home: document.getElementById("screen-home"),
  tables: document.getElementById("screen-tables"),
  play: document.getElementById("screen-play"),
  results: document.getElementById("screen-results"),
  chart: document.getElementById("screen-chart"),
};

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[name].classList.add("active");
}

function refreshHome() {
  progress = loadProgress();
  document.getElementById("total-stars").textContent = progress.stars;
  document.getElementById("best-streak").textContent = progress.bestStreak;
}

function renderTableGrid() {
  const grid = document.getElementById("table-grid");
  grid.innerHTML = "";
  for (let n = 2; n <= 12; n++) {
    const btn = document.createElement("button");
    btn.className = "table-btn";
    btn.textContent = `${n}×`;
    const unlocked = progress.unlockedTables.includes(n);
    const mastered = progress.masteredTables.includes(n);
    if (unlocked) btn.classList.add("unlocked");
    else btn.classList.add("locked");
    if (mastered) btn.classList.add("mastered");
    btn.disabled = !unlocked;
    btn.addEventListener("click", () => startPractice(n));
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
    `${((playState.index) / playState.questions.length) * 100}%`;
  document.getElementById("streak-badge").textContent = `🔥 Streak: ${playState.streak}`;
  document.getElementById("feedback").textContent = "";
  document.getElementById("next-btn").classList.add("hidden");

  renderDots(q.a, q.b);

  const choicesEl = document.getElementById("choices");
  choicesEl.innerHTML = "";
  q.choices.forEach((value) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = value;
    btn.addEventListener("click", () => handleAnswer(btn, value, q.answer));
    choicesEl.appendChild(btn);
  });
}

function handleAnswer(btn, chosen, answer) {
  if (playState.answered) return;
  playState.answered = true;

  const buttons = document.querySelectorAll(".choice-btn");
  buttons.forEach((b) => (b.disabled = true));

  const feedback = document.getElementById("feedback");

  if (chosen === answer) {
    playState.correct += 1;
    playState.streak += 1;
    btn.classList.add("correct");
    feedback.textContent = pickRandom(ENCOURAGEMENTS);
    feedback.style.color = "#059669";
    launchConfetti();
  } else {
    playState.streak = 0;
    btn.classList.add("wrong");
    buttons.forEach((b) => {
      if (Number(b.textContent) === answer) b.classList.add("correct");
    });
    feedback.textContent = `${pickRandom(GENTLE_WRONG)} ${answer}.`;
    feedback.style.color = "#7c3aed";
  }

  updateBestStreak(progress, playState.streak);
  document.getElementById("streak-badge").textContent = `🔥 Streak: ${playState.streak}`;
  document.getElementById("next-btn").classList.remove("hidden");
}

function finishRound() {
  const total = playState.questions.length;
  const correct = playState.correct;
  const starsEarned = correct;
  addStars(progress, starsEarned);

  let mastered = false;
  if (playState.mode === "practice" && playState.table) {
    mastered = maybeUnlockNextTable(progress, playState.table, correct, total);
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
  } else if (ratio >= 0.7) {
    emoji = "🎉";
    title = "Great work, Allyson!";
  }

  if (mastered) {
    message += ` You mastered the ${playState.table}s table! New table unlocked!`;
    emoji = "⭐";
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
      td.dataset.a = r;
      td.dataset.b = c;
      td.addEventListener("click", () => {
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

function navigate(target) {
  if (target === "home") {
    refreshHome();
    showScreen("home");
  } else if (target === "tables") {
    progress = loadProgress();
    renderTableGrid();
    showScreen("tables");
  } else if (target === "quiz") {
    startQuiz();
  } else if (target === "chart") {
    renderChart();
    showScreen("chart");
  }
}

document.querySelectorAll("[data-go]").forEach((el) => {
  el.addEventListener("click", () => navigate(el.dataset.go));
});

document.getElementById("next-btn").addEventListener("click", () => {
  if (playState.index < playState.questions.length - 1) {
    playState.index += 1;
    showQuestion();
  } else {
    finishRound();
  }
});

document.getElementById("play-again-btn").addEventListener("click", () => {
  if (playState.mode === "quiz") startQuiz();
  else if (playState.table) startPractice(playState.table);
});

refreshHome();
