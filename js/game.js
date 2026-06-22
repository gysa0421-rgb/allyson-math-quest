const ENCOURAGEMENTS = [
  "Amazing, Allyson!",
  "You're a math star!",
  "So smart, Allyson!",
  "Keep going, superstar!",
  "Fantastic work!",
  "Allyson rocks!",
  "Brilliant!",
  "You got it!",
];

const GENTLE_WRONG = [
  "Nice try! The answer is",
  "Almost! It's",
  "Good effort! It was",
];

const QUESTIONS_PER_ROUND = 10;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildQuestion(a, b) {
  const answer = a * b;
  const wrong = new Set();
  while (wrong.size < 3) {
    const offset = randomInt(-3, 3);
    const candidate = answer + offset;
    if (candidate > 0 && candidate !== answer) wrong.add(candidate);
  }
  const choices = [answer, ...wrong];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return { a, b, answer, choices };
}

function buildTableQuestions(table) {
  const questions = [];
  for (let b = 1; b <= 12; b++) {
    questions.push(buildQuestion(table, b));
  }
  return shuffle(questions).slice(0, QUESTIONS_PER_ROUND);
}

function buildQuizQuestions(unlockedTables) {
  const questions = [];
  while (questions.length < QUESTIONS_PER_ROUND) {
    const table = pickRandom(unlockedTables);
    const b = randomInt(1, 12);
    questions.push(buildQuestion(table, b));
  }
  return questions;
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function renderDots(a, b) {
  const grid = document.getElementById("dot-grid");
  grid.innerHTML = "";
  if (a > 6 || b > 6 || a * b > 36) {
    grid.style.display = "none";
    return;
  }
  grid.style.display = "inline-grid";
  grid.style.gridTemplateColumns = `repeat(${b}, 14px)`;
  for (let i = 0; i < a * b; i++) {
    const dot = document.createElement("span");
    dot.className = "dot";
    grid.appendChild(dot);
  }
}

function launchConfetti() {
  const container = document.getElementById("confetti");
  const colors = ["#ff6b9d", "#8b5cf6", "#fbbf24", "#38bdf8", "#34d399"];
  for (let i = 0; i < 24; i++) {
    const piece = document.createElement("span");
    piece.style.left = `${randomInt(0, 100)}%`;
    piece.style.background = pickRandom(colors);
    piece.style.animationDelay = `${randomInt(0, 400)}ms`;
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 1800);
  }
}
