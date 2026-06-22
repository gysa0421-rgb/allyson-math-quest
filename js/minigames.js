const MINIGAME_ROUNDS = 8;
const BUBBLE_LIVES = 3;

let bubbleState = null;
let rocketState = null;
let onMinigameComplete = null;

function initMinigames(completeCallback) {
  onMinigameComplete = completeCallback;

  document.getElementById("start-bubble-btn").addEventListener("click", () => {
    Sound.playClick();
    startBubbleGame();
  });

  document.getElementById("start-rocket-btn").addEventListener("click", () => {
    Sound.playClick();
    startRocketGame();
  });
}

function startBubbleGame(unlockedTables) {
  const tables = unlockedTables || loadProgress().unlockedTables;
  bubbleState = {
    round: 0,
    correct: 0,
    lives: BUBBLE_LIVES,
    questions: buildQuizQuestions(tables, MINIGAME_ROUNDS),
    locked: false,
  };
  window.showScreen("bubble");
  showBubbleRound();
}

function showBubbleRound() {
  if (bubbleState.round >= MINIGAME_ROUNDS) {
    endBubbleGame();
    return;
  }
  if (bubbleState.lives <= 0) {
    endBubbleGame();
    return;
  }

  bubbleState.locked = false;
  const q = bubbleState.questions[bubbleState.round];
  document.getElementById("bubble-question").textContent = `${q.a} × ${q.b} = ?`;
  document.getElementById("bubble-feedback").textContent = "";
  document.getElementById("bubble-score").textContent =
    `Score: ${bubbleState.correct} / ${MINIGAME_ROUNDS}`;
  updateBubbleLives();

  const arena = document.getElementById("bubble-arena");
  arena.innerHTML = "";

  const values = shuffle([...q.choices]);
  while (values.length < 5) {
    const extra = q.answer + randomInt(-4, 4);
    if (extra > 0 && !values.includes(extra)) values.push(extra);
  }

  shuffle(values.slice(0, 5)).forEach((value, i) => {
    const bubble = document.createElement("button");
    bubble.className = "bubble";
    bubble.textContent = value;
    bubble.style.left = `${10 + (i % 3) * 30}%`;
    bubble.style.top = `${15 + Math.floor(i / 3) * 35}%`;
    bubble.style.animationDelay = `${i * 0.15}s`;
    bubble.addEventListener("click", () => popBubble(bubble, value, q));
    arena.appendChild(bubble);
  });
}

function popBubble(bubble, value, q) {
  if (bubbleState.locked) return;
  bubbleState.locked = true;

  const feedback = document.getElementById("bubble-feedback");
  const statsTable = q.a;

  if (value === q.answer) {
    bubbleState.correct += 1;
    bubble.classList.add("pop");
    feedback.textContent = pickRandom(ENCOURAGEMENTS);
    feedback.className = "feedback bounce happy";
    Sound.playBubblePop();
    Voice.cheerBubblePop();
    launchStarBurst();
    recordAnswer(loadProgress(), statsTable, true);
    setTimeout(() => {
      bubbleState.round += 1;
      showBubbleRound();
    }, 700);
  } else {
    bubbleState.lives -= 1;
    bubble.classList.add("burst-wrong");
    feedback.textContent = `Oops! It was ${q.answer}.`;
    feedback.className = "feedback gentle";
    Sound.playWrong();
    Voice.cheerWrong();
    recordAnswer(loadProgress(), statsTable, false);
    arena.querySelectorAll(".bubble").forEach((b) => {
      b.disabled = true;
      if (Number(b.textContent) === q.answer) b.classList.add("highlight");
    });
    setTimeout(() => {
      bubbleState.round += 1;
      showBubbleRound();
    }, 1200);
  }
}

function updateBubbleLives() {
  const hearts = "❤️ ".repeat(bubbleState.lives).trim() || "💔";
  document.getElementById("bubble-lives").textContent = hearts;
}

function endBubbleGame() {
  const progress = loadProgress();
  progress.roundsPlayed += 1;
  saveProgress(progress);
  onMinigameComplete("bubble", bubbleState.correct, MINIGAME_ROUNDS);
}

function startRocketGame(unlockedTables) {
  const tables = unlockedTables || loadProgress().unlockedTables;
  rocketState = {
    round: 0,
    correct: 0,
    questions: buildQuizQuestions(tables, MINIGAME_ROUNDS),
    answered: false,
  };
  window.showScreen("rocket");
  updateRocketVisual();
  showRocketRound();
}

function updateRocketVisual() {
  const pct = (rocketState.correct / MINIGAME_ROUNDS) * 100;
  document.getElementById("rocket-ship").style.bottom = `${8 + pct * 0.75}%`;
  document.getElementById("rocket-fuel-fill").style.width = `${pct}%`;
}

function showRocketRound() {
  if (rocketState.round >= MINIGAME_ROUNDS) {
    endRocketGame();
    return;
  }

  rocketState.answered = false;
  const q = rocketState.questions[rocketState.round];
  document.getElementById("rocket-question").textContent = `${q.a} × ${q.b} = ?`;
  document.getElementById("rocket-progress").textContent =
    `Stop ${rocketState.round + 1} of ${MINIGAME_ROUNDS}`;
  document.getElementById("rocket-feedback").textContent = "";
  document.getElementById("rocket-feedback").className = "feedback";

  const choicesEl = document.getElementById("rocket-choices");
  choicesEl.innerHTML = "";
  q.choices.forEach((value) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = value;
    btn.addEventListener("click", () => handleRocketAnswer(btn, value, q));
    choicesEl.appendChild(btn);
  });
}

function handleRocketAnswer(btn, chosen, q) {
  if (rocketState.answered) return;
  rocketState.answered = true;

  const buttons = document.querySelectorAll("#rocket-choices .choice-btn");
  buttons.forEach((b) => (b.disabled = true));

  const feedback = document.getElementById("rocket-feedback");

  if (chosen === q.answer) {
    rocketState.correct += 1;
    btn.classList.add("correct");
    feedback.textContent = "Fuel up! 🚀";
    feedback.className = "feedback bounce happy";
    Sound.playCorrect();
    Voice.cheerRocketBoost();
    launchConfetti();
    recordAnswer(loadProgress(), q.a, true);
    updateRocketVisual();
    document.getElementById("rocket-ship").classList.add("boost");
    setTimeout(() => document.getElementById("rocket-ship").classList.remove("boost"), 400);
  } else {
    btn.classList.add("wrong");
    buttons.forEach((b) => {
      if (Number(b.textContent) === q.answer) b.classList.add("correct");
    });
    feedback.textContent = `Not enough fuel! Answer: ${q.answer}`;
    feedback.className = "feedback gentle";
    Sound.playWrong();
    Voice.cheerWrong();
    recordAnswer(loadProgress(), q.a, false);
  }

  setTimeout(() => {
    rocketState.round += 1;
    showRocketRound();
  }, 900);
}

function endRocketGame() {
  const progress = loadProgress();
  progress.roundsPlayed += 1;
  saveProgress(progress);
  if (rocketState.correct >= MINIGAME_ROUNDS) Sound.playUnlock();
  onMinigameComplete("rocket", rocketState.correct, MINIGAME_ROUNDS);
}
