/**
 * main.js — the app shell: menu, HUD, turn loop, and the glue between
 * gameState.js (rules), ai.js (opponent), ui.js (rendering) and
 * tutorial.js (onboarding). No game rules live here — this file only
 * decides *when* to call them and *how* to reflect the result on screen.
 */

import { createInitialState, getLegalActions, applyAction, dogsRemaining, pieceAt } from './gameState.js';
import { chooseAiAction } from './ai.js';
import { BoardView } from './ui.js';
import { Tutorial } from './tutorial.js';
import { t, setLang, getLang, detectLang, onLangChange } from './i18n.js';

const SETTINGS_KEY = 'komikan-settings-v1';
const defaultSettings = { hints: true, difficulty: 'medium', theme: 'light', lang: null };

function loadSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return { ...defaultSettings };
  }
}
function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* private mode etc. */ }
}

const settings = loadSettings();

const els = {
  menu: document.getElementById('screen-menu'),
  game: document.getElementById('screen-game'),
  aiOptions: document.getElementById('ai-options'),
  btnVsHuman: document.getElementById('btn-vs-human'),
  btnVsAi: document.getElementById('btn-vs-ai'),
  btnStartAi: document.getElementById('btn-start-ai'),
  btnTutorial: document.getElementById('btn-tutorial'),
  selectDifficulty: document.getElementById('select-difficulty'),
  langEs: document.getElementById('lang-es'),
  langEn: document.getElementById('lang-en'),
  btnTheme: document.getElementById('btn-theme'),
  toggleHints: document.getElementById('toggle-hints'),
  board: document.getElementById('board'),
  hudTurn: document.getElementById('hud-turn'),
  hudCaptured: document.getElementById('hud-captured'),
  hudRemaining: document.getElementById('hud-remaining'),
  btnEndTurn: document.getElementById('btn-end-turn'),
  btnRestart: document.getElementById('btn-restart'),
  btnMenu: document.getElementById('btn-menu'),
  banner: document.getElementById('banner-winner'),
  bannerText: document.getElementById('banner-text'),
  btnPlayAgain: document.getElementById('btn-play-again'),
  btnBackToMenu: document.getElementById('btn-back-to-menu'),
  tutorialOverlay: document.getElementById('tutorial-overlay'),
};

els.toggleHints.checked = settings.hints;
els.selectDifficulty.value = settings.difficulty;

let game = null; // the live controller for the current match, see startGame()

function showScreen(name) {
  document.body.classList.toggle('in-game', name === 'game');
  els.menu.hidden = name !== 'menu';
  els.game.hidden = name !== 'game';
}

// ---- Menu wiring ----

els.btnVsAi.addEventListener('click', () => {
  els.aiOptions.hidden = !els.aiOptions.hidden;
});
// ---- Language and theme (menu) ----
function applyTheme() {
  document.documentElement.dataset.theme = settings.theme;
  // The button offers the *other* mode.
  els.btnTheme.textContent = t(settings.theme === 'dark' ? 'menu.themeToLight' : 'menu.themeToDark');
}
function applyLangButtons() {
  els.langEs.classList.toggle('is-active', getLang() === 'es');
  els.langEn.classList.toggle('is-active', getLang() === 'en');
  els.langEs.setAttribute('aria-pressed', String(getLang() === 'es'));
  els.langEn.setAttribute('aria-pressed', String(getLang() === 'en'));
  applyTheme();
}
for (const [btn, code] of [[els.langEs, 'es'], [els.langEn, 'en']]) {
  btn.addEventListener('click', () => { settings.lang = code; saveSettings(settings); setLang(code); });
}
els.btnTheme.addEventListener('click', () => {
  settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
  saveSettings(settings);
  applyTheme();
});
onLangChange(() => { applyLangButtons(); game?.rerender(); });
setLang(detectLang(settings.lang));
applyLangButtons();

els.toggleHints.addEventListener('change', () => {
  settings.hints = els.toggleHints.checked;
  saveSettings(settings);
  if (game) game.setHints(settings.hints);
});
els.selectDifficulty.addEventListener('change', () => {
  settings.difficulty = els.selectDifficulty.value;
  saveSettings(settings);
});

els.btnVsHuman.addEventListener('click', () => startGame({ mode: 'human' }));
els.btnStartAi.addEventListener('click', () => {
  const humanSide = document.querySelector('input[name="humanSide"]:checked').value;
  startGame({ mode: 'ai', humanSide, difficulty: settings.difficulty });
});
els.btnMenu.addEventListener('click', () => showScreen('menu'));
els.btnBackToMenu.addEventListener('click', () => { els.banner.hidden = true; showScreen('menu'); });
els.btnRestart.addEventListener('click', () => game && startGame(game.config));
els.btnPlayAgain.addEventListener('click', () => { els.banner.hidden = true; game && startGame(game.config); });

const tutorial = new Tutorial(els.tutorialOverlay, {
  onStartPractice: (side) => {
    tutorial.close();
    startGame({ mode: 'ai', humanSide: side, difficulty: 'easy', forceHints: true });
  },
});
els.btnTutorial.addEventListener('click', () => tutorial.open());

// ---- Game controller ----

const WIN_MESSAGES = {
  eaten: (state) => t('win.eaten', { n: state.capturedDogs }),
  trapped: () => t('win.trapped'),
  dogs_stuck: () => t('win.dogsStuck'),
};

function startGame(config) {
  showScreen('game');
  els.banner.hidden = true;

  const state0 = createInitialState();
  const isHumanTurn = (turn) => config.mode === 'human' || turn === config.humanSide;
  let hintsOn = config.forceHints || settings.hints;

  let state = state0;
  let selected = null;
  let aiThinking = false;

  const view = new BoardView(els.board, onNodeClick);

  function currentActions() {
    return getLegalActions(state);
  }

  function autoSelectPuma() {
    if (state.turn !== 'puma') return;
    const pumaId = state.chain ? state.chain.pumaId : [...state.pieces.entries()].find(([, k]) => k === 'puma')?.[0];
    selected = pumaId ?? null;
  }

  function render() {
    const actions = currentActions();
    const targetsFrom = (id) => actions.filter((a) => a.from === id);
    const moveTargets = selected ? targetsFrom(selected).filter((a) => a.type === 'move').map((a) => a.to) : [];
    const jumpTargets = selected ? targetsFrom(selected).filter((a) => a.type === 'jump').map((a) => a.to) : [];

    view.render(state, {
      // The selected piece always lights up, even with hints off: hints only
      // control whether the legal destinations are shown, not whether you
      // can see which piece you picked up.
      selected,
      legalMoves: hintsOn ? moveTargets : [],
      legalJumps: hintsOn ? jumpTargets : [],
    });

    els.hudCaptured.textContent = String(state.capturedDogs);
    els.hudRemaining.textContent = String(dogsRemaining(state));
    els.btnEndTurn.hidden = !state.chain;

    if (state.winner) {
      els.hudTurn.textContent = t('hud.over');
    } else if (aiThinking) {
      els.hudTurn.textContent = t(state.turn === 'puma' ? 'hud.aiPuma' : 'hud.aiDog');
    } else {
      const who = t(state.turn === 'puma' ? 'hud.puma' : 'hud.dog');
      const control = t(isHumanTurn(state.turn) ? 'hud.you' : 'hud.ai');
      els.hudTurn.textContent = t('hud.turn', { who, control });
    }
  }

  function maybeShowWinner() {
    if (!state.winner) return false;
    els.banner.hidden = false;
    els.bannerText.textContent = WIN_MESSAGES[state.winReason]?.(state) ?? t('win.over');
    return true;
  }

  function afterStateChange() {
    autoSelectPuma();
    if (state.turn === 'dog') selected = null;
    render();
    if (maybeShowWinner()) return;
    if (!isHumanTurn(state.turn)) scheduleAiMove();
  }

  function scheduleAiMove() {
    aiThinking = true;
    render();
    setTimeout(() => {
      const action = chooseAiAction(state, config.difficulty ?? 'medium');
      aiThinking = false;
      if (action) state = applyAction(state, action);
      afterStateChange();
    }, 260 + Math.random() * 260); // a small delay reads as "thinking" rather than instant/robotic
  }

  function performAction(action) {
    state = applyAction(state, action);
    afterStateChange();
  }

  function onNodeClick(nodeId) {
    if (state.winner || aiThinking || !isHumanTurn(state.turn)) return;
    const actions = currentActions();

    if (state.turn === 'dog' && !selected) {
      if (pieceAt(state, nodeId) === 'dog') selected = nodeId;
      render();
      return;
    }
    if (!selected) return;

    const match = actions.find((a) => (a.type === 'move' || a.type === 'jump') && a.from === selected && a.to === nodeId);
    if (match) {
      if (match.type === 'jump') view.pulse(match.over, 'is-captured');
      performAction(match);
      return;
    }
    if (state.turn === 'dog' && pieceAt(state, nodeId) === 'dog') {
      selected = nodeId;
      render();
    }
  }

  els.btnEndTurn.onclick = () => {
    if (state.chain && isHumanTurn('puma')) performAction({ type: 'endTurn' });
  };

  game = {
    config,
    setHints(v) { hintsOn = v; render(); },
    rerender() {
      render();
      if (!els.banner.hidden) maybeShowWinner();
    },
  };

  autoSelectPuma();
  render();
  if (!isHumanTurn(state.turn)) scheduleAiMove();
}

showScreen('menu');
