/**
 * board.js — the Komikán board as a graph.
 *
 * The real board has two zones drawn as one figure:
 *   - the "valle" (valley): a 5x5 lattice of points where every cell has
 *     both diagonals drawn, so every interior point has up to 8 neighbours
 *     (like king moves in chess). This is where the trewa (dogs) start.
 *   - the "mountain" (cordillera): a 13-point triangular lattice above the
 *     valley where the pangui/komikelu (puma) starts, joined to the valley
 *     by a single point (the mountain pass).
 *
 * 25 (valley) + 13 (mountain) = 38 points, matching the point count given
 * for the traditional board (see docs/RULES.md for sources).
 *
 * We model the board as a graph rather than a pixel grid because the two
 * zones use different spacing and the mountain isn't a regular lattice.
 * Two things are exported:
 *   - ADJACENCY: which points a piece may step to (one move).
 *   - JUMP_LINES: which straight three-point lines exist, so a puma can
 *     jump A -> over B -> to C. This is authored by hand for the mountain
 *     (an irregular, hand-drawn shape in the original board) and generated
 *     from grid geometry for the valley (a perfect lattice, so "the next
 *     point in the same direction" is well defined).
 */

// ---- Valley: 5x5 full lattice (rows/cols 0..4, row 0 touches the mountain) ----

const VALLEY_SIZE = 5;
const valleyId = (r, c) => `s_${r}_${c}`;

const DIRECTIONS_8 = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

function inValley(r, c) {
  return r >= 0 && r < VALLEY_SIZE && c >= 0 && c < VALLEY_SIZE;
}

// ---- Mountain: hand-authored 13-point triangular lattice ----
// t0 = top edge (5 pts), t1 = second row (5 pts), t2 = taper row (2 pts),
// apex = the single point at the bottom of the mountain, bridging to the
// valley's top-centre point (s_0_2), representing the mountain pass.

const MOUNTAIN_NODES = [
  't0_0', 't0_1', 't0_2', 't0_3', 't0_4',
  't1_0', 't1_1', 't1_2', 't1_3', 't1_4',
  't2_l', 't2_r',
  'apex',
];

const MOUNTAIN_EDGES = [
  // top row
  ['t0_0', 't0_1'], ['t0_1', 't0_2'], ['t0_2', 't0_3'], ['t0_3', 't0_4'],
  // second row
  ['t1_0', 't1_1'], ['t1_1', 't1_2'], ['t1_2', 't1_3'], ['t1_3', 't1_4'],
  // verticals joining the two rows
  ['t0_0', 't1_0'], ['t0_1', 't1_1'], ['t0_2', 't1_2'], ['t0_3', 't1_3'], ['t0_4', 't1_4'],
  // taper down to the two pre-apex points
  ['t1_0', 't2_l'], ['t1_1', 't2_l'], ['t1_1', 't2_r'],
  ['t1_2', 't2_l'], ['t1_2', 't2_r'],
  ['t1_3', 't2_l'], ['t1_3', 't2_r'], ['t1_4', 't2_r'],
  // base of the taper and the mountain pass
  ['t2_l', 't2_r'], ['t2_l', 'apex'], ['t2_r', 'apex'],
  // the pass itself, joining the mountain to the valley
  ['apex', valleyId(0, 2)],
];

// Straight three-point lines in the mountain, used for jump/capture.
// These follow the two visible ridgelines and the horizontal rows; the
// short "crossing" diagonals in the taper are walkable but not jump lines
// (see docs/RULES.md for why this interpretation was chosen).
const MOUNTAIN_JUMP_LINES = [
  ['t0_0', 't0_1', 't0_2'], ['t0_1', 't0_2', 't0_3'], ['t0_2', 't0_3', 't0_4'],
  ['t1_0', 't1_1', 't1_2'], ['t1_1', 't1_2', 't1_3'], ['t1_2', 't1_3', 't1_4'],
  ['t1_0', 't2_l', 'apex'], // left ridge
  ['t1_4', 't2_r', 'apex'], // right ridge
  ['apex', valleyId(0, 2), valleyId(1, 2)], // the mountain pass, into the valley
];

// ---- Build the graph ----

function buildBoard() {
  const nodes = new Map(); // id -> { x, y, zone }
  const adjacency = new Map(); // id -> Set<id>

  const addNode = (id, x, y, zone) => {
    nodes.set(id, { id, x, y, zone });
    adjacency.set(id, new Set());
  };
  const addEdge = (a, b) => {
    adjacency.get(a).add(b);
    adjacency.get(b).add(a);
  };

  // Valley coordinates: 90 units per step, origin at the pass.
  const STEP = 90;
  for (let r = 0; r < VALLEY_SIZE; r++) {
    for (let c = 0; c < VALLEY_SIZE; c++) {
      addNode(valleyId(r, c), c * STEP, 300 + r * STEP, 'valley');
    }
  }
  for (let r = 0; r < VALLEY_SIZE; r++) {
    for (let c = 0; c < VALLEY_SIZE; c++) {
      for (const [dr, dc] of DIRECTIONS_8) {
        const nr = r + dr, nc = c + dc;
        if (inValley(nr, nc)) addEdge(valleyId(r, c), valleyId(nr, nc));
      }
    }
  }

  // Mountain coordinates, chosen so the two ridgelines render dead straight.
  const MOUNTAIN_COORDS = {
    t0_0: [0, 0], t0_1: [90, 0], t0_2: [180, 0], t0_3: [270, 0], t0_4: [360, 0],
    t1_0: [0, 110], t1_1: [90, 110], t1_2: [180, 110], t1_3: [270, 110], t1_4: [360, 110],
    t2_l: [90, 190], t2_r: [270, 190],
    apex: [180, 270],
  };
  for (const id of MOUNTAIN_NODES) {
    const [x, y] = MOUNTAIN_COORDS[id];
    addNode(id, x, y, 'mountain');
  }
  for (const [a, b] of MOUNTAIN_EDGES) addEdge(a, b);

  // Jump lines: valley ones generated from geometry, mountain ones hand-authored.
  const jumpLines = [...MOUNTAIN_JUMP_LINES];
  for (let r = 0; r < VALLEY_SIZE; r++) {
    for (let c = 0; c < VALLEY_SIZE; c++) {
      for (const [dr, dc] of DIRECTIONS_8) {
        const mr = r + 2 * dr, mc = c + 2 * dc;
        const jr = r + dr, jc = c + dc;
        if (inValley(mr, mc) && inValley(jr, jc)) {
          jumpLines.push([valleyId(r, c), valleyId(jr, jc), valleyId(mr, mc)]);
        }
      }
    }
  }

  // Build a lookup: "A|B" -> C, meaning a piece at A may jump over B to land at C.
  // Deduplicated since the valley loop above produces each line from both ends.
  const jumpMap = new Map();
  const seen = new Set();
  for (const [a, b, c] of jumpLines) {
    for (const [x, y, z] of [[a, b, c], [c, b, a]]) {
      const key = `${x}|${y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      jumpMap.set(key, z);
    }
  }

  return { nodes, adjacency, jumpMap };
}

export const BOARD = buildBoard();

export function neighborsOf(nodeId) {
  return [...BOARD.adjacency.get(nodeId)];
}

/** Where a piece at `from` would land jumping over `over`, or null if no such line exists. */
export function jumpLanding(from, over) {
  return BOARD.jumpMap.get(`${from}|${over}`) ?? null;
}

export function allNodeIds() {
  return [...BOARD.nodes.keys()];
}

export { valleyId };
