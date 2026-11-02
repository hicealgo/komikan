/**
 * board.js — the Komikán board as a graph, built straight from the drawn
 * lines of the physical board.
 *
 * Geometry: a square (4 x 4 units, 5x5 points, with an X drawn in each of its
 * four 2x2 quadrants) with a triangle (top edge 4 units wide, 2 units tall)
 * sitting on top of it. The triangle's bottom tip is the square's top-centre
 * point, which is the one and only junction between the two ("the pass").
 *
 * To keep every coordinate an integer, we work in THIRDS of a unit
 * (so 1 unit = 3). The origin (0, 0) is the pass; the square extends to
 * y = +12 and the triangle up to y = -6; x runs from -6 to +6:
 *
 *   triangle:  top edge   y=-6 : x = -6, -2, 0, 2, 6
 *              upper bar  y=-4 : x = -4, -2, 0, 2, 4
 *              lower bar  y=-2 : x = -2, 0, 2
 *              the pass   (0, 0)
 *   square:    y = 0,3,6,9,12 ; x = -6,-3,0,3,6   (25 points, (0,0) shared)
 *
 * 13 triangle points + 25 square points = 38 points.
 *
 * Every drawn line is listed below as an ordered run of points; movement
 * edges are just consecutive points on a run. Notes on the shape:
 *   - The triangle's inner points have NO diagonals to the perimeter; they
 *     only connect along the drawn bars and verticals.
 *   - The side verticals (x = ±2) cross the upper bar at (±2, -4); that
 *     crossing is a real, playable point.
 *   - Square diagonals exist only inside each 2x2 quadrant, so only the
 *     quadrant centres (±3, 3) and (±3, 9) have 8 neighbours.
 *
 * Jumps: a puma at A may jump over a neighbour B and land on C if A-B and
 * B-C are consecutive steps along the SAME straight line. We derive that
 * from the geometry (collinear, same direction) instead of listing it by
 * hand. This also makes the pass work naturally, e.g. the right slant of the
 * triangle continues straight into the square's down-left diagonal.
 */

/** Every drawn line, as an ordered list of [x, y] points along it. */
const LINES = [
  // ---- Square: rows ----
  ...[0, 3, 6, 9, 12].map((y) => [-6, -3, 0, 3, 6].map((x) => [x, y])),
  // ---- Square: columns (the centre one continues up into the triangle) ----
  ...[-6, -3, 3, 6].map((x) => [0, 3, 6, 9, 12].map((y) => [x, y])),
  [[0, -6], [0, -4], [0, -2], [0, 0], [0, 3], [0, 6], [0, 9], [0, 12]],
  // ---- Square: the X in each 2x2 quadrant ----
  [[-6, 0], [-3, 3], [0, 6]], [[-6, 6], [-3, 3], [0, 0]],
  [[0, 0], [3, 3], [6, 6]], [[0, 6], [3, 3], [6, 0]],
  [[-6, 6], [-3, 9], [0, 12]], [[-6, 12], [-3, 9], [0, 6]],
  [[0, 6], [3, 9], [6, 12]], [[0, 12], [3, 9], [6, 6]],
  // ---- Triangle: perimeter ----
  [[-6, -6], [-2, -6], [0, -6], [2, -6], [6, -6]], // top edge
  [[-6, -6], [-4, -4], [-2, -2], [0, 0]], // left slant, down to the pass
  [[6, -6], [4, -4], [2, -2], [0, 0]], // right slant, down to the pass
  // ---- Triangle: inside ----
  [[-2, -2], [0, -2], [2, -2]], // lower bar
  [[-4, -4], [-2, -4], [0, -4], [2, -4], [4, -4]], // upper bar
  [[-2, -2], [-2, -4], [-2, -6]], // left vertical (crosses the upper bar at a point)
  [[2, -2], [2, -4], [2, -6]], // right vertical
];

/** Where the pieces start, in the same thirds-of-a-unit coordinates. */
export const START = {
  puma: [0, -4],
  dogs: [
    [-6, 3], [6, 3],
    [-6, 9], [-3, 9], [0, 9], [3, 9], [6, 9],
    [-6, 12], [-3, 12], [0, 12], [3, 12], [6, 12],
  ],
};

const PX_PER_THIRD = 30; // 1 board unit = 90px
const nodeId = (x, y) => `p${x}_${y}`;

function buildBoard() {
  const nodes = new Map(); // id -> { id, x, y, gx, gy, zone }   (x,y in px; gx,gy in thirds)
  const adjacency = new Map(); // id -> Set<id>

  const ensure = (gx, gy) => {
    const id = nodeId(gx, gy);
    if (!nodes.has(id)) {
      nodes.set(id, { id, gx, gy, x: gx * PX_PER_THIRD, y: gy * PX_PER_THIRD, zone: gy < 0 ? 'mountain' : 'valley' });
      adjacency.set(id, new Set());
    }
    return id;
  };

  for (const line of LINES) {
    for (let i = 0; i < line.length; i++) {
      const id = ensure(...line[i]);
      if (i === 0) continue;
      const prev = nodeId(...line[i - 1]);
      adjacency.get(id).add(prev);
      adjacency.get(prev).add(id);
    }
  }

  // Jumps: A over B to C when A->B and B->C point the same way along a line.
  const jumpMap = new Map(); // "A|B" -> C
  for (const [a, aNeighbors] of adjacency) {
    const A = nodes.get(a);
    for (const b of aNeighbors) {
      const B = nodes.get(b);
      const dx = B.gx - A.gx, dy = B.gy - A.gy;
      for (const c of adjacency.get(b)) {
        const C = nodes.get(c);
        const ex = C.gx - B.gx, ey = C.gy - B.gy;
        if (dx * ey - dy * ex === 0 && dx * ex + dy * ey > 0) jumpMap.set(`${a}|${b}`, c);
      }
    }
  }

  return { nodes, adjacency, jumpMap };
}

export const BOARD = buildBoard();

export function neighborsOf(id) {
  return [...BOARD.adjacency.get(id)];
}

/** Where a piece at `from` would land jumping over `over`, or null if no such line exists. */
export function jumpLanding(from, over) {
  return BOARD.jumpMap.get(`${from}|${over}`) ?? null;
}

export function allNodeIds() {
  return [...BOARD.nodes.keys()];
}

/** Board coordinates (thirds of a unit, origin at the pass) -> node id. */
export function idAt(gx, gy) {
  return nodeId(gx, gy);
}
