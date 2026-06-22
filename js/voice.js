const Voice = {
  enabled: true,
  mode: "normal",
  player: null,
  availableCustom: [],

  fileNames: {
    correct: [
      "good-job.m4a",
      "amazing.m4a",
      "thats-right.m4a",
      "math-star.m4a",
      "fantastic.m4a",
      "great-work.m4a",
      "brilliant.m4a",
      "you-got-it.m4a",
    ],
    wrong: ["nice-try.m4a", "keep-going.m4a", "almost.m4a"],
    win: ["incredible.m4a", "wow-champion.m4a", "super-job.m4a"],
    bubble: ["pop-good.m4a", "nice-pop.m4a", "bubble-great.m4a"],
    rocket: ["fuel-up.m4a", "go-go.m4a", "rocket-power.m4a"],
    unlock: "unlocked.m4a",
    moon: "moon.m4a",
  },

  async loadCustomManifest() {
    this.availableCustom = Array.isArray(window.CUSTOM_VOICE_FILES)
      ? window.CUSTOM_VOICE_FILES
      : [];
  },

  setEnabled(on) {
    this.enabled = on;
    if (!on && this.player) this.player.pause();
  },

  setMode(mode) {
    this.mode = mode === "custom" ? "custom" : "normal";
  },

  hasCustom() {
    return this.availableCustom.length > 0;
  },

  path(name) {
    return `audio/${name}`;
  },

  customPath(name) {
    return `audio/custom/${name}`;
  },

  clipsForCategory(category, useCustom) {
    const files = this.fileNames[category];
    const list = Array.isArray(files) ? files : [files];

    if (useCustom) {
      const available = list.filter((f) => this.availableCustom.includes(f));
      if (available.length) return available.map((f) => this.customPath(f));
      if (this.availableCustom.length) {
        return [this.customPath(this.availableCustom[0])];
      }
      return [];
    }

    if (typeof files === "string") return this.path(files);
    return list.map((f) => this.path(f));
  },

  get clips() {
    const useCustom = this.mode === "custom" && this.hasCustom();
    return {
      correct: this.clipsForCategory("correct", useCustom),
      wrong: this.clipsForCategory("wrong", useCustom),
      win: this.clipsForCategory("win", useCustom),
      bubble: this.clipsForCategory("bubble", useCustom),
      rocket: this.clipsForCategory("rocket", useCustom),
      unlock: this.clipsForCategory("unlock", useCustom)[0] || this.path(this.fileNames.unlock),
      moon: this.clipsForCategory("moon", useCustom)[0] || this.path(this.fileNames.moon),
    };
  },

  playFile(path) {
    if (!this.enabled || !path) return;

    if (this.player) {
      this.player.pause();
      this.player.currentTime = 0;
    }

    this.player = new Audio(path);
    this.player.volume = 0.95;
    this.player.play().catch(() => {});
  },

  playRandom(list) {
    if (!list?.length) return;
    this.playFile(pickRandom(list));
  },

  cheerCorrect() {
    this.playRandom(this.clips.correct);
  },

  cheerWrong() {
    this.playRandom(this.clips.wrong);
  },

  cheerWin() {
    this.playRandom(this.clips.win);
  },

  cheerUnlock() {
    this.playFile(this.clips.unlock);
  },

  cheerBubblePop() {
    this.playRandom(this.clips.bubble);
  },

  cheerRocketBoost() {
    this.playRandom(this.clips.rocket);
  },

  cheerMoon() {
    this.playFile(this.clips.moon);
  },
};
