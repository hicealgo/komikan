/**
 * ai.js — opponent AI for either side, at three difficulties.
 *
 * Approach: minimax with alpha-beta pruning, run as iterative deepening
 * inside a time budget (so "Hard" doesn't have to commit to a fixed depth
 * that might be too slow on a phone — it just searches as deep as it can
 * in the time given and returns the best move found so far).
 *
 * The evaluation function scores a state from the puma's point of view
 * (positive = good for the puma); the dog side simply minimizes the same
 * number, since the game is zero-sum enough for this to work well.
 */

import { neighborsOf } from './board.js';
import { getLegalActions, applyAction, getPumaPosition, dogsRemaining } from './gameState.js';

export const DIFFICULTIES = {
  easy: { label: 'Fácil', maxDepth: 2, timeBudgetMs: 150, randomness: 0.55 },
  medium: { label: 'Media', maxDepth: 4, timeBudgetMs: 500, randomness: 0.12 },
  hard: { label: 'Difícil', maxDepth: 7, timeBudgetMs: 1200, randomness: 0 },
};

function evaluate(state) {
  if (state.winner === 'puma') return 100000;
  if (state.winner === 'dog') return -100000;

  const pumaId = getPumaPosition(state);
  const jumps = getLegalActions({ ...state, turn: 'puma', chain: null }).filter((a) => a.type === 'jump');
  // Recompute simple mobility for the puma directly (cheap, avoids relying on whose turn it is).
  const openness = neighborsOf(pumaId).filter((n) => !state.pieces.has(n)).length;

  let score = 0;
  score += state.capturedDogs * 40;
  score -= dogsRemaining(state) * 2;
  score += jumps.length * 12;
  score += openness * 3;
  score += neighborsOf(pumaId).length; // prefer well-connected points generally
  return score;
}

function minimax(state, depth, alpha, beta, deadline) {
  if (state.winner || depth === 0 || Date.now() > deadline) {
    return { score: evaluate(state), action: null };
  }
  const actions = getLegalActions(state);
  if (actions.length === 0) return { score: evaluate(state), action: null };

  // Move ordering: try captures first, which tends to tighten the window sooner.
  actions.sort((a, b) => (b.type === 'jump') - (a.type === 'jump'));

  const maximizing = state.turn === 'puma';
  let best = maximizing ? -Infinity : Infinity;
  let bestAction = actions[0];

  for (const action of actions) {
    const child = applyAction(state, action);
    const { score } = minimax(child, depth - 1, alpha, beta, deadline);

    if (maximizing) {
      if (score > best) { best = score; bestAction = action; }
      alpha = Math.max(alpha, best);
    } else {
      if (score < best) { best = score; bestAction = action; }
      beta = Math.min(beta, best);
    }
    if (beta <= alpha || Date.now() > deadline) break;
  }
  return { score: best, action: bestAction };
}

/**
 * Pick an action for whichever side is to move in `state`.
 * `difficultyKey` is one of 'easy' | 'medium' | 'hard'.
 */
export function chooseAiAction(state, difficultyKey) {
  const preset = DIFFICULTIES[difficultyKey] ?? DIFFICULTIES.medium;
  const actions = getLegalActions(state);
  if (actions.length === 0) return null;
  if (actions.length === 1) return actions[0];

  if (preset.randomness > 0 && Math.random() < preset.randomness) {
    return actions[Math.floor(Math.random() * actions.length)];
  }

  const deadline = Date.now() + preset.timeBudgetMs;
  let bestAction = actions[0];
  for (let depth = 1; depth <= preset.maxDepth; depth++) {
    const result = minimax(state, depth, -Infinity, Infinity, deadline);
    if (result.action) bestAction = result.action;
    if (Date.now() > deadline) break;
  }
  return bestAction;
}
