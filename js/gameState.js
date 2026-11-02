/**
 * gameState.js — the rules engine. Pure functions over a plain state object;
 * nothing here touches the DOM, so it can be unit-tested, run inside the AI's
 * search tree, and driven by the UI, all from the same source of truth.
 *
 * State shape:
 *   {
 *     pieces:        Map<nodeId, 'puma' | 'dog'>
 *     turn:          'puma' | 'dog'
 *     capturedDogs:  number
 *     winThreshold:  number   (dogs captured needed for the puma to win)
 *     winner:        null | 'puma' | 'dog'
 *     winReason:     null | 'eaten' | 'trapped' | 'dogs_stuck'
 *     chain:         null | { pumaId: nodeId }  (mid multi-jump; see below)
 *     lastMove:      the move object that produced this state (for animating/undo)
 *   }
 *
 * Multi-jump chaining: after the puma captures a dog, the rules let it
 * (optionally) keep jumping, even changing direction, without ending its
 * turn. We model that as: turn stays 'puma' and `chain.pumaId` records
 * where it now sits; the legal-move list for that state is then either
 * "jump again from here" or an explicit "end turn" action. This lets the
 * exact same move-generation code serve the UI and the AI search.
 */

import { neighborsOf, jumpLanding, idAt, START } from './board.js';

export const DEFAULT_WIN_THRESHOLD = 9; // puma wins on capturing 9 of 12 dogs

export function createInitialState(winThreshold = DEFAULT_WIN_THRESHOLD) {
  const pieces = new Map();

  // Start positions live in board.js, next to the geometry they refer to.
  pieces.set(idAt(...START.puma), 'puma');
  const dogStarts = START.dogs.map((p) => idAt(...p));
  for (const id of dogStarts) pieces.set(id, 'dog');

  return {
    pieces,
    turn: 'puma', // the puma always moves first
    capturedDogs: 0,
    winThreshold,
    winner: null,
    winReason: null,
    chain: null,
    lastMove: null,
  };
}

export function getPumaPosition(state) {
  for (const [id, kind] of state.pieces) if (kind === 'puma') return id;
  return null;
}

export function pieceAt(state, nodeId) {
  return state.pieces.get(nodeId) ?? null;
}

/** Empty adjacent points a piece at `from` could step to. */
export function legalSimpleMoves(state, from) {
  return neighborsOf(from).filter((n) => !state.pieces.has(n));
}

/** Jumps available to the puma sitting at `from`: [{ over, to }]. */
export function legalPumaJumps(state, from) {
  const jumps = [];
  for (const over of neighborsOf(from)) {
    if (state.pieces.get(over) !== 'dog') continue;
    const to = jumpLanding(from, over);
    if (to && !state.pieces.has(to)) jumps.push({ over, to });
  }
  return jumps;
}

/**
 * All legal actions for whichever side's turn it is, as move objects:
 *   { type: 'move', from, to }
 *   { type: 'jump', from, over, to }
 *   { type: 'endTurn' }   (only offered mid multi-jump chain)
 */
export function getLegalActions(state) {
  if (state.winner) return [];

  if (state.turn === 'puma') {
    const pumaId = state.chain ? state.chain.pumaId : getPumaPosition(state);
    const jumps = legalPumaJumps(state, pumaId).map((j) => ({ type: 'jump', from: pumaId, over: j.over, to: j.to }));

    if (state.chain) {
      // Mid-chain: must either keep jumping or explicitly stop.
      return [...jumps, { type: 'endTurn' }];
    }
    const simples = legalSimpleMoves(state, pumaId).map((to) => ({ type: 'move', from: pumaId, to }));
    return [...jumps, ...simples];
  }

  // Dogs: any dog may take any one simple step. No jumps, ever.
  const actions = [];
  for (const [id, kind] of state.pieces) {
    if (kind !== 'dog') continue;
    for (const to of legalSimpleMoves(state, id)) actions.push({ type: 'move', from: id, to });
  }
  return actions;
}

/** True if it's the puma's turn (not mid-chain) and it has no move at all. */
function pumaIsTrapped(state) {
  const pumaId = getPumaPosition(state);
  return legalSimpleMoves(state, pumaId).length === 0 && legalPumaJumps(state, pumaId).length === 0;
}

function cloneState(state) {
  return {
    ...state,
    pieces: new Map(state.pieces),
    chain: state.chain ? { ...state.chain } : null,
  };
}

/** Apply one action, returning a new state. Does not mutate `state`. */
export function applyAction(state, action) {
  const next = cloneState(state);
  next.lastMove = action;

  if (action.type === 'move') {
    const kind = next.pieces.get(action.from);
    next.pieces.delete(action.from);
    next.pieces.set(action.to, kind);
    next.chain = null;
    next.turn = state.turn === 'puma' ? 'dog' : 'puma';
  } else if (action.type === 'jump') {
    next.pieces.delete(action.over); // eat the dog
    next.pieces.delete(action.from);
    next.pieces.set(action.to, 'puma');
    next.capturedDogs += 1;

    if (next.capturedDogs >= next.winThreshold) {
      next.winner = 'puma';
      next.winReason = 'eaten';
      next.chain = null;
      return next;
    }
    const moreJumps = legalPumaJumps(next, action.to);
    next.chain = moreJumps.length > 0 ? { pumaId: action.to } : null;
    next.turn = next.chain ? 'puma' : 'dog';
  } else if (action.type === 'endTurn') {
    next.chain = null;
    next.turn = 'dog';
  }

  // After any move, check whether the side who now must move has lost.
  if (!next.winner) {
    if (next.turn === 'puma' && pumaIsTrapped(next)) {
      next.winner = 'dog';
      next.winReason = 'trapped';
    } else if (next.turn === 'dog' && getLegalActions(next).length === 0) {
      // Not covered by the historical sources (dogs are rarely reduced this
      // far), but a side with literally no legal move can't continue.
      next.winner = 'puma';
      next.winReason = 'dogs_stuck';
    }
  }

  return next;
}

export function dogsRemaining(state) {
  let n = 0;
  for (const kind of state.pieces.values()) if (kind === 'dog') n += 1;
  return n;
}
