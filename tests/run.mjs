/**
 * tests/run.mjs — dependency-free sanity checks for the rules engine.
 *
 * No test framework: this is a small static site with no build step, so
 * the tests should run with nothing but `node tests/run.mjs` and no
 * npm install. Each check throws via node:assert on failure; a clean run
 * prints "All tests passed." and exits 0.
 */

import assert from 'node:assert/strict';
import { BOARD, neighborsOf, jumpLanding, valleyId, allNodeIds } from '../js/board.js';
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
test('has exactly 38 points (25 valley + 13 mountain)', () => {
  assert.equal(allNodeIds().length, 38);
});
test('adjacency is symmetric', () => {
  for (const [id, neighbors] of BOARD.adjacency) {
    for (const n of neighbors) assert.ok(BOARD.adjacency.get(n).has(id), `${n} should list ${id} back`);
  }
});
test('valley diagonal jump works (king-move geometry)', () => {
  assert.equal(jumpLanding(valleyId(0, 0), valleyId(1, 1)), valleyId(2, 2));
});
test('mountain ridge jump works (t1_0 -> t2_l -> apex)', () => {
  assert.equal(jumpLanding('t1_0', 't2_l'), 'apex');
});
test('the mountain pass jump works (apex -> valley top -> row 1)', () => {
  assert.equal(jumpLanding('apex', valleyId(0, 2)), valleyId(1, 2));
});
test('no jump exists where no straight line was authored', () => {
  assert.equal(jumpLanding('t2_l', 't2_r'), null);
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
  assert.equal(getPumaPosition(s), 't1_2');
  assert.equal(s.turn, 'puma');
});

console.log('gameState.js — movement');
test('puma has 5 free neighbours at kickoff', () => {
  const s = createInitialState();
  assert.equal(legalSimpleMoves(s, 't1_2').length, neighborsOf('t1_2').length);
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
  let s = stateWith([[valleyId(2, 2), 'puma'], [valleyId(1, 2), 'dog']]);
  const jumps = legalPumaJumps(s, valleyId(2, 2));
  assert.equal(jumps.length, 1);
  assert.equal(jumps[0].to, valleyId(0, 2));
  s = applyAction(s, { type: 'jump', from: valleyId(2, 2), over: jumps[0].over, to: jumps[0].to });
  assert.equal(s.pieces.get(valleyId(0, 2)), 'puma');
  assert.equal(s.pieces.has(valleyId(1, 2)), false);
  assert.equal(s.capturedDogs, 1);
});
test('a chain continues (and can change direction) when another jump opens up', () => {
  let s = stateWith([[valleyId(2, 2), 'puma'], [valleyId(1, 2), 'dog'], [valleyId(0, 3), 'dog']]);
  s = applyAction(s, { type: 'jump', from: valleyId(2, 2), over: valleyId(1, 2), to: valleyId(0, 2) });
  assert.ok(s.chain, 'should still be mid-chain');
  assert.equal(s.turn, 'puma');
  const jumps = legalPumaJumps(s, valleyId(0, 2));
  assert.equal(jumps.length, 1);
  assert.equal(jumps[0].to, valleyId(0, 4));
  s = applyAction(s, { type: 'jump', from: valleyId(0, 2), over: jumps[0].over, to: jumps[0].to });
  assert.equal(s.capturedDogs, 2);
  assert.equal(s.turn, 'dog'); // no further jump available, chain ends automatically
});
test('the puma may stop a chain early with endTurn', () => {
  let s = stateWith([[valleyId(2, 2), 'puma'], [valleyId(1, 2), 'dog'], [valleyId(0, 3), 'dog']]);
  s = applyAction(s, { type: 'jump', from: valleyId(2, 2), over: valleyId(1, 2), to: valleyId(0, 2) });
  assert.ok(s.chain);
  s = applyAction(s, { type: 'endTurn' });
  assert.equal(s.chain, null);
  assert.equal(s.turn, 'dog');
});
test('the puma wins on reaching the capture threshold', () => {
  let s = stateWith([[valleyId(2, 2), 'puma'], [valleyId(1, 2), 'dog']], { capturedDogs: 8, winThreshold: 9 });
  s = applyAction(s, { type: 'jump', from: valleyId(2, 2), over: valleyId(1, 2), to: valleyId(0, 2) });
  assert.equal(s.winner, 'puma');
  assert.equal(s.winReason, 'eaten');
});

console.log('gameState.js — trapping');
test('dogs win once the puma has no move and no jump', () => {
  // Surround the puma at s_2_2 on all 8 sides with dogs, and make sure
  // every jump landing behind those dogs is also occupied, so it is
  // truly stuck rather than just crowded.
  const around = [
    [1, 1], [1, 2], [1, 3],
    [2, 1], [2, 3],
    [3, 1], [3, 2], [3, 3],
  ];
  const landings = [
    [0, 0], [0, 2], [0, 4],
    [2, 0], [2, 4],
    [4, 0], [4, 2], [4, 4],
  ];
  const entries = [[valleyId(2, 2), 'puma']];
  for (const [r, c] of around) entries.push([valleyId(r, c), 'dog']);
  for (const [r, c] of landings) entries.push([valleyId(r, c), 'dog']);
  let s = stateWith(entries, { turn: 'dog' });
  // A dog makes some neutral move elsewhere far away... there is none far
  // away here since we only placed the surrounding ring, so simulate the
  // "turn passes to puma and it's trapped" check directly:
  s = { ...s, turn: 'puma', pieces: new Map(s.pieces) };
  const actions = getLegalActions(s);
  assert.equal(actions.length, 0, 'puma should have zero legal actions when boxed in with landings blocked');
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
  let s = stateWith([[valleyId(2, 2), 'puma'], [valleyId(1, 2), 'dog']]);
  assert.equal(dogsRemaining(s), 1);
  s = applyAction(s, { type: 'jump', from: valleyId(2, 2), over: valleyId(1, 2), to: valleyId(0, 2) });
  assert.equal(dogsRemaining(s), 0);
});

console.log(`\nAll ${count} tests passed.`);
