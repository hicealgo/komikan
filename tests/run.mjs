/**
 * tests/run.mjs — dependency-free sanity checks for the rules engine.
 *
 * No test framework: this is a small static site with no build step, so
 * the tests should run with nothing but `node tests/run.mjs` and no
 * npm install. Each check throws via node:assert on failure; a clean run
 * prints "All tests passed." and exits 0.
 */

import assert from 'node:assert/strict';
import { BOARD, neighborsOf, jumpLanding, idAt, allNodeIds } from '../js/board.js';
import {
  createInitialState, getLegalActions, applyAction, legalPumaJumps,
  legalSimpleMoves, dogsRemaining, getPumaPosition,
} from '../js/gameState.js';
import { chooseAiAction } from '../js/ai.js';

let count = 0;
function test(name, fn) {
  fn();
  count += 1;
  console.log(`  ok - ${name}`);
}

console.log('board.js');
const P = (x, y) => idAt(x, y);
const edge = (a, b) => BOARD.adjacency.get(P(...a))?.has(P(...b)) ?? false;
const deg = (x, y) => neighborsOf(P(x, y)).length;
test('has exactly 38 points (13 triangle + 25 square, sharing the pass)', () => {
  assert.equal(allNodeIds().length, 38);
  assert.equal([...BOARD.nodes.values()].filter((n) => n.zone === 'mountain').length, 13);
});
test('adjacency is symmetric', () => {
  for (const [id, neighbors] of BOARD.adjacency) {
    for (const n of neighbors) assert.ok(BOARD.adjacency.get(n).has(id), `${n} should list ${id} back`);
  }
});
test('square: quadrant centres have 8 neighbours, edge-midpoints have none diagonal', () => {
  assert.equal(deg(-3, 3), 8);
  assert.equal(deg(3, 9), 8);
  assert.equal(deg(-3, 6), 4); // midpoint between two quadrants: orthogonal only
  assert.equal(deg(0, 6), 8); // quadrant corner shared by four X's
  assert.equal(deg(-6, 12), 3); // outer corner: 2 orthogonal + 1 diagonal
});
test('square: no diagonal across a quadrant boundary', () => {
  assert.equal(edge([-6, 3], [-3, 6]), false);
  assert.equal(edge([-6, 3], [-3, 0]), false);
});
test('triangle: inner points have no diagonals, only the drawn bars and verticals', () => {
  assert.deepEqual(neighborsOf(P(0, -2)).sort(), [P(-2, -2), P(2, -2), P(0, 0), P(0, -4)].sort());
  assert.deepEqual(neighborsOf(P(0, -4)).sort(), [P(-2, -4), P(2, -4), P(0, -2), P(0, -6)].sort());
});
test('triangle: perimeter slants run corner -> (±4,-4) -> (±2,-2) -> pass', () => {
  assert.ok(edge([-6, -6], [-4, -4]) && edge([-4, -4], [-2, -2]) && edge([-2, -2], [0, 0]));
  assert.ok(edge([6, -6], [4, -4]) && edge([4, -4], [2, -2]) && edge([2, -2], [0, 0]));
});
test('triangle: side verticals cross the upper bar at a real point', () => {
  assert.ok(BOARD.nodes.has(P(-2, -4)) && BOARD.nodes.has(P(2, -4)));
  assert.deepEqual(neighborsOf(P(-2, -4)).sort(), [P(-4, -4), P(0, -4), P(-2, -2), P(-2, -6)].sort());
  assert.deepEqual(neighborsOf(P(2, -4)).sort(), [P(4, -4), P(0, -4), P(2, -2), P(2, -6)].sort());
});
test('triangle: top edge has 5 points joined in a row', () => {
  const row = [-6, -2, 0, 2, 6];
  for (let i = 0; i < row.length - 1; i++) assert.ok(edge([row[i], -6], [row[i + 1], -6]));
});
test('the pass (0,0) joins the triangle to the square: 8 neighbours total', () => {
  assert.deepEqual(neighborsOf(P(0, 0)).sort(),
    [P(0, -2), P(-2, -2), P(2, -2), P(-3, 0), P(3, 0), P(0, 3), P(-3, 3), P(3, 3)].sort());
});
test('the pass is the only link between triangle and square', () => {
  for (const [id, ns] of BOARD.adjacency) {
    for (const n of ns) {
      const a = BOARD.nodes.get(id), b = BOARD.nodes.get(n);
      if (a.gy < 0 && b.gy > 0 || a.gy > 0 && b.gy < 0) assert.fail(`${id} - ${n} bypasses the pass`);
    }
  }
});
test('square jumps: straight, and diagonal inside a quadrant', () => {
  assert.equal(jumpLanding(P(0, 12), P(0, 9)), P(0, 6));
  assert.equal(jumpLanding(P(-6, 0), P(-3, 3)), P(0, 6));
});
test('no diagonal jump over a quadrant midpoint', () => {
  assert.equal(jumpLanding(P(-6, 6), P(-3, 6)), P(0, 6)); // straight is fine
  assert.equal(jumpLanding(P(-3, 6), P(-6, 3)), null); // -6,3 is not even a neighbour of -3,6
});
test('triangle jumps: along the slant, bars and centre column', () => {
  assert.equal(jumpLanding(P(-6, -6), P(-4, -4)), P(-2, -2));
  assert.equal(jumpLanding(P(-4, -4), P(-2, -4)), P(0, -4));
  assert.equal(jumpLanding(P(-2, -2), P(-2, -4)), P(-2, -6));
  assert.equal(jumpLanding(P(0, -6), P(0, -4)), P(0, -2));
});
test('jumps through the pass: centre column and the slant-into-diagonal line', () => {
  assert.equal(jumpLanding(P(0, -2), P(0, 0)), P(0, 3));
  assert.equal(jumpLanding(P(2, -2), P(0, 0)), P(-3, 3));
  assert.equal(jumpLanding(P(-2, -2), P(0, 0)), P(3, 3));
});
test('no jump where the lines turn a corner', () => {
  assert.equal(jumpLanding(P(-6, -6), P(-2, -6)), P(0, -6)); // straight along the top is fine
  assert.equal(jumpLanding(P(-2, -6), P(-2, -4)), P(-2, -2)); // vertical, now through the crossing
  assert.equal(jumpLanding(P(-2, -2), P(0, -2)), P(2, -2));
  assert.equal(jumpLanding(P(-4, -4), P(-2, -2)), P(0, 0)); // slant continues to the pass
});

console.log('gameState.js — setup');
test('initial state has 1 puma and 12 dogs', () => {
  const s = createInitialState();
  const kinds = [...s.pieces.values()];
  assert.equal(kinds.filter((k) => k === 'puma').length, 1);
  assert.equal(kinds.filter((k) => k === 'dog').length, 12);
});
test('puma starts in the mountain, turn order starts with the puma', () => {
  const s = createInitialState();
  assert.equal(getPumaPosition(s), idAt(0, -4));
  assert.equal(BOARD.nodes.get(getPumaPosition(s)).zone, 'mountain');
  assert.equal(s.turn, 'puma');
});

console.log('gameState.js — movement');
test('puma has 4 free neighbours at kickoff', () => {
  const s = createInitialState();
  assert.equal(legalSimpleMoves(s, idAt(0, -4)).length, 4);
});
test('dogs cannot jump, only step', () => {
  const s = createInitialState();
  const actions = getLegalActions({ ...s, turn: 'dog' });
  assert.ok(actions.every((a) => a.type === 'move'));
});

console.log('gameState.js — capture');
function stateWith(entries, overrides = {}) {
  return { ...createInitialState(), pieces: new Map(entries), ...overrides };
}
test('a single jump removes the dog and lands the puma beyond it', () => {
  let s = stateWith([[idAt(0, 6), 'puma'], [idAt(0, 3), 'dog']]);
  const jumps = legalPumaJumps(s, idAt(0, 6));
  assert.equal(jumps.length, 1);
  assert.equal(jumps[0].to, idAt(0, 0));
  s = applyAction(s, { type: 'jump', from: idAt(0, 6), over: jumps[0].over, to: jumps[0].to });
  assert.equal(s.pieces.get(idAt(0, 0)), 'puma');
  assert.equal(s.pieces.has(idAt(0, 3)), false);
  assert.equal(s.capturedDogs, 1);
});
test('a chain continues (and can change direction) when another jump opens up', () => {
  let s = stateWith([[idAt(0, 6), 'puma'], [idAt(0, 3), 'dog'], [idAt(3, 0), 'dog']]);
  s = applyAction(s, { type: 'jump', from: idAt(0, 6), over: idAt(0, 3), to: idAt(0, 0) });
  assert.ok(s.chain, 'should still be mid-chain');
  assert.equal(s.turn, 'puma');
  const jumps = legalPumaJumps(s, idAt(0, 0));
  assert.equal(jumps.length, 1);
  assert.equal(jumps[0].to, idAt(6, 0));
  s = applyAction(s, { type: 'jump', from: idAt(0, 0), over: jumps[0].over, to: jumps[0].to });
  assert.equal(s.capturedDogs, 2);
  assert.equal(s.turn, 'dog'); // no further jump available, chain ends automatically
});
test('the puma may stop a chain early with endTurn', () => {
  let s = stateWith([[idAt(0, 6), 'puma'], [idAt(0, 3), 'dog'], [idAt(3, 0), 'dog']]);
  s = applyAction(s, { type: 'jump', from: idAt(0, 6), over: idAt(0, 3), to: idAt(0, 0) });
  assert.ok(s.chain);
  s = applyAction(s, { type: 'endTurn' });
  assert.equal(s.chain, null);
  assert.equal(s.turn, 'dog');
});
test('the puma wins on reaching the capture threshold', () => {
  let s = stateWith([[idAt(0, 6), 'puma'], [idAt(0, 3), 'dog']], { capturedDogs: 8, winThreshold: 9 });
  s = applyAction(s, { type: 'jump', from: idAt(0, 6), over: idAt(0, 3), to: idAt(0, 0) });
  assert.equal(s.winner, 'puma');
  assert.equal(s.winReason, 'eaten');
});

console.log('gameState.js — trapping');
test('dogs win once the puma has no move and no jump', () => {
  // Puma on a quadrant centre (3,9): ring its 8 neighbours with dogs and
  // block every landing square behind them, so it is truly stuck.
  const around = [[0, 6], [3, 6], [6, 6], [0, 9], [6, 9], [0, 12], [3, 12], [6, 12]];
  const landings = [[-3, 3], [3, 3], [-3, 9]]; // the only jumps that land on the board
  const entries = [[idAt(3, 9), 'puma']];
  for (const p of [...around, ...landings]) entries.push([idAt(...p), 'dog']);
  const s = stateWith(entries, { turn: 'puma' });
  assert.equal(getLegalActions(s).length, 0, 'puma should have zero legal actions when boxed in');
  assert.equal(legalPumaJumps(s, idAt(3, 9)).length, 0);
});
test('...but one open landing square means it can still jump out', () => {
  const around = [[0, 6], [3, 6], [6, 6], [0, 9], [6, 9], [0, 12], [3, 12], [6, 12]];
  const entries = [[idAt(3, 9), 'puma']];
  for (const p of [...around, [3, 3], [-3, 9]]) entries.push([idAt(...p), 'dog']); // (-3,3) left open
  const s = stateWith(entries, { turn: 'puma' });
  assert.deepEqual(legalPumaJumps(s, idAt(3, 9)).map((j) => j.to), [idAt(-3, 3)]);
});

console.log('ai.js');
test('the AI always returns a legal action, at every difficulty', () => {
  const s = createInitialState();
  for (const diff of ['easy', 'medium', 'hard']) {
    const action = chooseAiAction(s, diff);
    const legal = getLegalActions(s);
    assert.ok(legal.some((a) => JSON.stringify(a) === JSON.stringify(action)), `${diff} AI returned an illegal action`);
  }
});
test('dogs remaining decreases as captures happen', () => {
  let s = stateWith([[idAt(0, 6), 'puma'], [idAt(0, 3), 'dog']]);
  assert.equal(dogsRemaining(s), 1);
  s = applyAction(s, { type: 'jump', from: idAt(0, 6), over: idAt(0, 3), to: idAt(0, 0) });
  assert.equal(dogsRemaining(s), 0);
});

console.log(`\nAll ${count} tests passed.`);
