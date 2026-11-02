# Architecture

*Leer en español: [ARCHITECTURE.es.md](./ARCHITECTURE.es.md)*

This is a static site: plain HTML, CSS and JavaScript ES modules, no
build step, no dependencies, no backend. Open `index.html` through any
web server (or GitHub Pages) and it runs. That was a deliberate choice —
it keeps the project easy to fork, easy to read end-to-end, and trivial
to deploy.

```
index.html          the page shell: menu, HUD, board <svg>, overlays
css/styles.css       all styling: layout, light/dark themes, retro CRT effect
js/
  board.js           the board as a graph (nodes, edges, jump lines)
  gameState.js        the rules engine (pure functions over a state object)
  ai.js               minimax opponent, both sides, three difficulties
  ui.js               renders the board to <svg>, turns clicks into node ids
  tutorial.js          the onboarding slides (reuses ui.js for live demos)
  i18n.js             Spanish/English strings + language switching
  main.js             the app shell: wires menu, HUD, AI turn loop together
tests/run.mjs         dependency-free sanity checks (`npm test`)
test/                 OFF-by-default visual lab (see test/README.md)
docs/
  RULES.md / RULES.es.md                game rules + historical sources
  ARCHITECTURE.md / ARCHITECTURE.es.md  this file
```

## Why a graph, not a grid

The Komikán board isn't a plain grid — it's a 5×5 square joined at a single
point to an inverted triangle whose inner points have no diagonals.
Modelling it as a graph (`js/board.js`) rather than a 2D array means the
same movement/capture code works everywhere, and the renderer just draws
whatever's in the graph — it doesn't know or care about the board's shape.

### Board topology

`board.js` is built straight from the **drawn lines** of the physical board.
Coordinates are integers in thirds of a unit (so the triangle's 1/3 and 2/3
divisions are whole numbers); the origin `(0, 0)` is the mountain pass, the
square extends to `y = 12` and the triangle up to `y = -6`.

- **`LINES`**: every drawn line, as an ordered run of points. Movement edges
  are simply the consecutive points on each run, so adding or removing a
  point (or a whole line) is a one-line change. The board is currently
  38 points: 25 in the square + 13 in the triangle.
- **`adjacency`**: `Map<nodeId, Set<nodeId>>`, derived from `LINES`.
- **`jumpMap`**: `Map<"A|B", C>` — a piece at `A` may jump over a dog at `B`
  to land on `C`. It is *derived from geometry*: `A→B` and `B→C` must be
  consecutive steps along the same straight line (collinear, same direction).
  That is why the triangle's right slant continues through the pass into the
  square's diagonal without any special-casing.
- **`START`**: the starting squares for the puma and the 12 dogs.

`tests/run.mjs` pins the important facts: the 38-point count, the diagonals
that exist (and don't), the pass being the only link, and the jumps through it.

## The rules engine (`gameState.js`)

A `GameState` is a plain object: a `Map` of piece positions, whose turn
it is, the capture count, the winner (if any), and one extra field,
`chain`, that exists only to support the puma's optional multi-jump:

- After a capture, if another jump is immediately available, `chain` is
  set and the turn is *not* passed to the dogs — the puma may keep
  jumping or call `endTurn` to stop early (the rules say continuing is
  allowed, not mandatory).
- `getLegalActions(state)` is turn-aware: mid-chain, it returns only
  further jumps from the puma's current spot plus `endTurn`; otherwise it
  returns every simple move and jump available to whoever's turn it is.

Every function here is pure — `applyAction(state, action)` returns a
*new* state rather than mutating the one it's given. That's what lets the
exact same code run inside the AI's search tree (which needs to try
thousands of hypothetical moves without corrupting the real game) and
back the on-screen game.

## The AI (`ai.js`)

Minimax with alpha-beta pruning, run as **iterative deepening inside a
time budget** rather than to a fixed depth. That matters because the two
sides have wildly different branching factors — the puma usually has a
handful of options, but a dogs-turn can have 30–60 (any of up to 12 dogs,
each with several possible steps). A fixed search depth that's snappy for
one side would either crawl or barely think for the other; a time budget
adapts automatically and always returns *something* legal, even if the
board position forced an early cutoff.

The evaluation function scores a position from the puma's side (positive
= good for the puma); the dogs simply minimize the same number. It
rewards: dogs already captured, the puma's own mobility (both simple
moves and available jumps — a cornered puma has few of either), and how
well-connected the puma's current point is (open ground is safer than a
board edge).

Difficulty is just three presets (`DIFFICULTIES` in `ai.js`) trading off
search depth, time budget, and — for Easy — a chance of ignoring the
search result and picking a random legal move instead, so it's genuinely
beatable rather than "the same AI but told not to try."

## Rendering (`ui.js`)

The board's shape never changes, only what's on it — so `BoardView.build()`
draws the static lines and one "socket" circle per point exactly once,
and `render()` on every subsequent state change only touches piece
tokens and a handful of CSS classes (`is-selected`, `is-legal-move`,
`is-legal-jump`). Pieces are small hand-authored 7×7 pixel bitmaps turned
into `<rect>` elements at draw time (see `GLYPHS` in `ui.js`) rather than
image files, so the whole app has zero binary assets to fetch, cache, or
attribute. A selected piece always gets a ring (`is-selected`), whether or
not move hints are on.

## Language, theme and look (`i18n.js`, `styles.css`)

All user-facing text lives in `js/i18n.js` (Spanish and English). Static text
carries `data-i18n` attributes; dynamic text calls `t('key')`. Light and dark
themes are two sets of CSS variables on `:root` / `:root[data-theme='dark']`.
`test/` holds a throw-away visual lab used to choose the current look; it is
disabled by default.

## The app shell (`main.js`)

Holds no game rules at all — its only job is deciding *when* to call
`gameState.js`/`ai.js` and how to reflect the result. The interesting bit
is `afterStateChange()`: every action, human or AI, funnels through it,
which is what keeps human turns, AI turns, and multi-jump chains all
driving the same render path instead of three separate code paths.

## Tutorial (`tutorial.js`)

Rather than build a second, scripted rules-engine just for onboarding,
most slides construct a tiny hand-picked `{ pieces: Map }` scenario (e.g.
"one puma, one dog, positioned to demonstrate a jump") and hand it to a
second `BoardView` instance. What a newcomer sees during the tutorial is
therefore the *real* board and the *real* move/jump computation — not a
mock-up that could quietly drift out of sync with the actual game.

## Contributing

Issues and pull requests are welcome — especially from anyone who can speak to
the traditional rules with more authority than a set of digitized worksheets. The
board's exact geometry (see [Board topology](#board-topology)) was reconstructed
from a hand-drawn diagram and would benefit from a second opinion. `test/` holds
a visual lab (palettes, pieces, CRT, fonts) that is off by default: to use it
locally, set `ENABLED = true` in `test/lab.js`.
