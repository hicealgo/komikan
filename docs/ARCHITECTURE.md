# Architecture

This is a static site: plain HTML, CSS and JavaScript ES modules, no
build step, no dependencies, no backend. Open `index.html` through any
web server (or GitHub Pages) and it runs. That was a deliberate choice —
it keeps the project easy to fork, easy to read end-to-end, and trivial
to deploy.

```
index.html          the page shell: menu, HUD, board <svg>, overlays
css/styles.css       all styling: layout, retro CRT effect, theme
js/
  board.js           the board as a graph (nodes, edges, jump lines)
  gameState.js        the rules engine (pure functions over a state object)
  ai.js               minimax opponent, both sides, three difficulties
  ui.js               renders the board to <svg>, turns clicks into node ids
  tutorial.js          the onboarding slides (reuses ui.js for live demos)
  main.js             the app shell: wires menu, HUD, AI turn loop together
tests/run.mjs         dependency-free sanity checks (`npm test`)
docs/
  RULES.md            game rules + historical sources
  ARCHITECTURE.md      this file
```

## Why a graph, not a grid

The Komikán board isn't a plain grid — it's a 5×5 lattice (the valley)
fused to an irregular 13-point triangular lattice (the mountain), joined
at a single point. Modelling it as a graph (`js/board.js`) rather than a
2D array means the same movement/capture code works for both zones
without any special-casing, and the renderer just draws whatever's in the
graph — it doesn't know or care that the board has an unusual shape.

### Board topology

`board.js` builds two things at module load:

- **`adjacency`**: `Map<nodeId, Set<nodeId>>` — which points a single
  step can reach. Generated programmatically for the valley (a perfect
  grid, so "the 8 neighbours of (r, c)" is just arithmetic), and listed by
  hand for the mountain (`MOUNTAIN_EDGES`), since its shape isn't regular.
- **`jumpMap`**: `Map<"A|B", C>` — if a piece sits at `A` and there's a
  dog at `B`, it may jump to `C`. This is *not* derived from the
  adjacency graph automatically, because "the next point in the same
  straight line" isn't well-defined on an irregular lattice — it has to
  be told which triples of points are actually collinear. For the valley
  this is generated from the grid geometry (reflect two steps in one of
  the 8 directions); for the mountain it's a short hand-authored list of
  the visible straight lines (`MOUNTAIN_JUMP_LINES`), covering the two
  outer ridgelines, the two horizontal rows, and the pass into the
  valley. See [`RULES.md`](./RULES.md#the-board) for why that's the
  right interpretation of the source diagram, and what was necessarily a
  judgment call.

Coordinates (`x, y`, used only for rendering) were chosen so the two
mountain ridgelines render as visually straight lines, which is a nice
side effect of them being geometrically consistent, not a requirement of
the game logic — the logic only ever consults `jumpMap`, never geometry.

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
attribute.

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
