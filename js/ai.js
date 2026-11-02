/**
 * ai.js — opponent AI for either side, at three difficulties.
 *
 * Minimax with alpha-beta pruning and a transposition table, run as iterative
 * deepening inside a time budget (so "Hard" just searches as deep as it can in the
 * time it is given, and never freezes a phone).
 *
 * v2 changes (backed by exact endgame analysis and self-play tournaments kept outside this repo):
 *   - Exact retrograde analysis shows the game is *drawish*: with best play from a
 *     normal opening neither side can force a win, so a purely "safe" AI just
 *     shuffles forever. The AI is therefore built to AVOID draws:
 *       · positions that already occurred in this game are penalised (anti-repetition);
 *       · the dogs are rewarded for advancing in formation, not hiding at the back;
 *       · the puma is rewarded for creating real jump threats.
 *   - Evaluation is positive when good for the puma; the dogs minimise it.
 *   - Easy still plays a random legal move some of the time, so it is beatable.
 */

import { neighborsOf, jumpLanding, BOARD } from './board.js';
import { getLegalActions, applyAction, getPumaPosition, dogsRemaining } from './gameState.js';

export const DIFFICULTIES = {
  easy: { label: 'Fácil', maxDepth: 2, timeBudgetMs: 150, randomness: 0.55, repetitionPenalty: 0 },
  medium: { label: 'Media', maxDepth: 4, timeBudgetMs: 500, randomness: 0.12, repetitionPenalty: 25 },
  hard: { label: 'Difícil', maxDepth: 8, timeBudgetMs: 1200, randomness: 0, repetitionPenalty: 60 },
};

/** Tunable evaluation weights (all from the puma's point of view). */
export const WEIGHTS = {
  captured: 60, // per dog eaten
  jumpNow: 14, // jumps the puma has right now
  threat2: 5, // dogs the puma could attack after one step
  free: 4, // empty squares next to the puma
  reach2: 1.5, // squares the puma can reach in two steps (room to breathe)
  advance: 0.9, // dogs pushing up the board (bad for the puma)
  region: 2.2, // size of the puma's free territory (flood fill through empty squares)
  cramped: 30, // extra penalty per square below 4 of free territory: a nearly trapped puma
};

/** The puma is allowed to repeat safely more than the dogs are: its repetition is often its only defence. */
const PUMA_REPETITION_FACTOR = 0.3;

const NODE_IDS = [...BOARD.nodes.keys()];
const INDEX = new Map(NODE_IDS.map((id, i) => [id, i]));
const GY = NODE_IDS.map((id) => BOARD.nodes.get(id).gy);

/** A compact string identifying a position (pieces + side to move + chain). */
export function positionKey(state) {
  const dogs = [];
  let puma = -1;
  for (const [id, kind] of state.pieces) { if (kind === 'puma') puma = INDEX.get(id); else dogs.push(INDEX.get(id)); }
  dogs.sort((a, b) => a - b);
  return `${state.turn[0]}${state.chain ? 'c' : ''}${puma}:${dogs.join(',')}`;
}

/** Jumps available to a puma standing on `from` (`vacated` = the square it just left, now empty). */
function pumaJumpsFrom(state, from, vacated = null) {
  let n = 0;
  for (const over of neighborsOf(from)) {
    if (state.pieces.get(over) !== 'dog') continue;
    const to = jumpLanding(from, over);
    if (to && (!state.pieces.has(to) || to === vacated)) n++;
  }
  return n;
}

export function evaluate(state, w = WEIGHTS) {
  if (state.winner === 'puma') return 100000;
  if (state.winner === 'dog') return -100000;

  const pumaId = getPumaPosition(state);
  const nb = neighborsOf(pumaId);
  const free = nb.filter((n) => !state.pieces.has(n));
  let score = state.capturedDogs * w.captured;
  score += pumaJumpsFrom(state, pumaId) * w.jumpNow;
  score += free.length * w.free;

  // squares reachable in two steps, and dogs that would be attackable after one step
  const reach = new Set(free);
  let threat = 0;
  for (const s of free) {
    threat += pumaJumpsFrom(state, s, pumaId) > 0 ? 1 : 0;
    for (const n2 of neighborsOf(s)) if (n2 !== pumaId && !state.pieces.has(n2)) reach.add(n2);
  }
  score += threat * w.threat2 + reach.size * w.reach2;

  // territory: how much empty room the puma can still walk through. The dogs win by shrinking this
  // to nothing (the exact tables show trapping manoeuvres of 50-80 plies), so we watch it closely.
  const seenSq = new Set([pumaId]); const queue = [pumaId]; let room = 0;
  while (queue.length) {
    const cur = queue.pop();
    for (const n of neighborsOf(cur)) if (!seenSq.has(n) && !state.pieces.has(n)) { seenSq.add(n); queue.push(n); room++; }
  }
  score += Math.min(room, 14) * w.region - Math.max(0, 4 - room) * w.cramped;

  // dogs rewarded (i.e. puma penalised) for advancing up the board in formation
  let advance = 0;
  for (const [id, kind] of state.pieces) if (kind === 'dog') advance += (12 - GY[INDEX.get(id)]) / 3;
  score -= advance * w.advance;
  return score;
}

/**
 * Core search. `opts`: { maxDepth, timeBudgetMs, history (array of position keys seen so far),
 * repetitionPenalty, weights }. Returns { action, score, depth }.
 */
export function searchBest(state, opts = {}) {
  const { maxDepth = 4, timeBudgetMs = Infinity, history = [], repetitionPenalty = 0, weights = WEIGHTS } = opts;
  const deadline = Date.now() + timeBudgetMs;
  const seen = new Map();
  for (const k of history) seen.set(k, (seen.get(k) || 0) + 1);
  const tt = new Map();
  let timedOut = false;

  function minimax(s, depth, alpha, beta) {
    if (s.winner || depth === 0) return evaluate(s, weights);
    if (Date.now() > deadline) { timedOut = true; return evaluate(s, weights); }
    const key = positionKey(s);
    const hit = tt.get(key);
    if (hit && hit.depth >= depth) {
      if (hit.flag === 0) return hit.score;
      if (hit.flag === 1 && hit.score >= beta) return hit.score;
      if (hit.flag === 2 && hit.score <= alpha) return hit.score;
    }
    const actions = getLegalActions(s);
    if (actions.length === 0) return evaluate(s, weights);
    actions.sort((a, b) => (b.type === 'jump') - (a.type === 'jump'));

    const maximizing = s.turn === 'puma';
    const alpha0 = alpha, beta0 = beta;
    let best = maximizing ? -Infinity : Infinity;
    for (const a of actions) {
      const score = minimax(applyAction(s, a), depth - 1, alpha, beta);
      if (maximizing) { if (score > best) best = score; alpha = Math.max(alpha, best); }
      else { if (score < best) best = score; beta = Math.min(beta, best); }
      if (beta <= alpha) break;
    }
    if (!timedOut) tt.set(key, { depth, score: best, flag: best <= alpha0 ? 2 : best >= beta0 ? 1 : 0 });
    return best;
  }

  const root = getLegalActions(state);
  if (root.length === 0) return { action: null, score: 0, depth: 0 };
  const maximizing = state.turn === 'puma';
  let bestAction = root[0], bestScore = 0, reached = 0;

  for (let depth = 1; depth <= maxDepth; depth++) {
    timedOut = false;
    let alpha = -Infinity, beta = Infinity, iterBest = null, iterScore = maximizing ? -Infinity : Infinity;
    const ordered = [...root].sort((a, b) => (b === bestAction) - (a === bestAction) || (b.type === 'jump') - (a.type === 'jump'));
    for (const a of ordered) {
      const child = applyAction(state, a);
      let score = minimax(child, depth - 1, alpha, beta);
      // anti-draw: repeating a position that already happened is worse than anything equal
      const rep = seen.get(positionKey(child)) || 0;
      if (rep) score += (maximizing ? -1 : 1) * repetitionPenalty * rep * (maximizing ? PUMA_REPETITION_FACTOR : 1);
      if (maximizing ? score > iterScore : score < iterScore) { iterScore = score; iterBest = a; }
      if (maximizing) alpha = Math.max(alpha, iterScore); else beta = Math.min(beta, iterScore);
      if (Date.now() > deadline) break;
    }
    if (timedOut || Date.now() > deadline) { if (depth === 1 && iterBest) bestAction = iterBest; break; }
    bestAction = iterBest; bestScore = iterScore; reached = depth;
    if (Math.abs(iterScore) > 90000) break; // a forced win/loss was found
  }
  return { action: bestAction, score: bestScore, depth: reached };
}

/**
 * Pick an action for whichever side is to move in `state`.
 * `difficultyKey` is 'easy' | 'medium' | 'hard'; `history` = position keys seen so far this game.
 */
export function chooseAiAction(state, difficultyKey, history = []) {
  const preset = DIFFICULTIES[difficultyKey] ?? DIFFICULTIES.medium;
  const actions = getLegalActions(state);
  if (actions.length === 0) return null;
  if (actions.length === 1) return actions[0];
  if (preset.randomness > 0 && Math.random() < preset.randomness) return actions[Math.floor(Math.random() * actions.length)];
  return searchBest(state, { maxDepth: preset.maxDepth, timeBudgetMs: preset.timeBudgetMs, history, repetitionPenalty: preset.repetitionPenalty }).action ?? actions[0];
}
