# Komikán — rules and sources

*Leer en español: [RULES.es.md](./RULES.es.md)*

Komikán ("the one that eats everything") is a traditional two-player
strategy game of the Mapuche people, documented since at least 1776. It
belongs to the same family as other "hunt games" found worldwide — Bagh
Chal (Nepal), Fox and Geese (Europe), Adugo (Brazil) — where one side
controls a single powerful piece and the other controls many weaker ones,
each side with a different goal and a different way of winning.

This document records what the app implements and, just as importantly,
**where each rule comes from**, since the historical sources don't all
agree with each other.

## The story

> Cuando se acerca el frío invierno, el Pangui (puma) baja hambriento
> desde la cordillera al valle en busca de alimentos. Los Trewas (perros)
> que custodian la Ruka intentan que no lleguen hasta ella, y buscan
> cerrarle el camino.

When winter's cold approaches, the pangui (puma) comes down hungry from
the mountains to the valley looking for food. The trewa (dogs) that guard
the ruka (house) try to keep it from getting there, and try to block its
path. — [Fundación Casa Rafael](https://www.casarafael.org.ar/wp-content/uploads/2020/10/Komikan-Tablero.pdf)

## Primary sources used

1. **Molina, Juan Ignacio.** *Compendio de la historia civil del Reyno de
   Chile.* Madrid, 1788–1795 (describing what he saw in southern Chile in
   1776), p. 124 — the earliest known written description, which likened
   the game to chess.
2. **Manquilef, Manuel.** *Comentarios del pueblo araucano II: la
   jimnasia nacional (juegos, ejercicios y bailes).* Santiago, 1914, pp.
   104–105.
3. **Matus Z., Leotardo.** *Juegos i ejercicios de los antiguos araucanos
   (contribución al estudio de la etnolojía chilena).* Santiago, 1920, pp.
   9–10 — described the game as closer to draughts/checkers, and recorded
   a movement variant (see below).
4. **[Chile Para Niños — Biblioteca Nacional de Chile](https://www.chileparaninos.gob.cl/639/w3-article-639005.html)**,
   "El juego del Komikan" — a modern educational worksheet that reconstructs
   the board and rules directly from sources 1–3, with illustrated
   examples. This is the single most detailed and best-illustrated source
   available, and is what this app follows by default.
5. **[Fundación Casa Rafael](https://www.casarafael.org.ar/wp-content/uploads/2020/10/Komikan-Tablero.pdf)** —
   a shorter, simplified educational version, used here mainly to
   cross-check and as the source of the alternate ("quick game") capture
   threshold.

## The board

38 points in total, in two joined shapes (the count comes straight from the
sources):

- **The valley** (*el cuadrado*, the square): a 4×4-unit square with a 5×5
  lattice of points — 25 points. Each of its four 2×2 quadrants has an "X"
  drawn across it, so only the quadrant corners and centres have diagonal
  moves; the points halfway along a quadrant edge connect orthogonally only.
  This is where the ruka stands and where the trewa start.
- **The mountain** (*el triángulo*, the triangle): an inverted triangle
  sitting on top of the square, 4 units wide at the top and 2 units tall,
  with **13** points. Its tip is the square's top-centre point, the
  **mountain pass**, which is the one and only connection between the two
  shapes (and is counted as part of the square).

Inside the triangle, the middle vertical is split into three equal steps;
two horizontal bars cross it (at one third and two thirds of the height) and
two further verticals rise from the lower bar's ends to the top edge. A
point sits wherever two drawn lines meet, including where those side
verticals cross the upper bar. The triangle's inner points have **no
diagonals** — they only move along the drawn bars and verticals — while its
two slanted sides are walkable all the way down to the pass.

Straight lines continue through the pass: for example the triangle's right
slant carries on into the square's down-left diagonal, so a jump can cross
from one shape into the other along that line. See
[`ARCHITECTURE.md`](./ARCHITECTURE.md#board-topology) for how the board is
built in code.

## Setup

- **1 pangui/komikelu** (the puma), starting in the middle of the mountain
  (the centre point of the upper bar).
- **12 trewa** (the dogs), starting at the valley's edge farthest from the
  mountain — filling its two bottom rows plus the two outer corners of the
  second row, mirroring the piece layout given in the Chile Para Niños
  diagram.

## Turn order and movement

- The **pangui always moves first**; turns then alternate one piece-move
  at a time (one pangui move, then one trewa move, and so on).
- Any piece moves **one step** along a drawn line of the board, in **any
  direction** — forward, backward, or diagonally, wherever a line exists.

> *Variant, not used by default:* Leotardo Matus (1920) recorded a
> related game, *Leoncito*, in which the trewa may only advance, never
> retreat, while the pangui can still move both ways. This app doesn't
> currently offer that as a toggle, since the primary tutorial-oriented
> source (Chile Para Niños) explicitly uses free movement for both sides.

## Capturing

Only the pangui captures, and only the trewa can be captured:

- If a trewa sits on a point adjacent to the pangui, in a straight line,
  and the point immediately beyond it is empty, the pangui may jump over
  it and remove it from the board — as in checkers/draughts.
- If, after landing, another jump is available, the pangui **may**
  continue jumping in the same turn — **even changing direction** between
  jumps — without it costing an extra turn. Continuing is optional: a
  player may choose to stop after any jump.
- The trewa can never jump and never capture; their only tool is to block.

## Winning

- **The pangui wins** by eating enough trewa. The historical sources
  disagree on the exact number: Chile Para Niños (citing Molina/Manquilef/
  Matus) says **9 of the 12**; Casa Rafael's simplified sheet says 6. This
  app defaults to **9**, as the more rigorously sourced figure, but the
  win threshold is a single constant (`DEFAULT_WIN_THRESHOLD` in
  `js/gameState.js`) that's easy to change for a "quick game" variant.
- **The trewa win** by cornering the pangui until it has no legal move
  left at all — no simple step and no jump.
- *(House rule, not covered by any source: if the trewa side is somehow
  reduced to having no legal move of its own — extremely unlikely, since
  it would require most of the pack to already be eaten or boxed in — the
  pangui is awarded the win, since the trewa can no longer pursue their
  objective either. See `winReason: 'dogs_stuck'` in the code.)*

## What this app adds on top of the historical rules

Everything above is sourced. A few things were added purely for the
digital experience and are **not** claimed to be traditional:

- **Difficulty levels** for the AI opponent (Easy/Medium/Hard) — the
  original is a two-human game.
- **Hints** (highlighting legal moves) — an optional teaching aid. It was
  never part of the traditional game, but it's offered because this app's
  explicit goal is to make Komikán learnable by someone who has never
  seen it before.
- **The tutorial's demo positions** (movement/capture/multi-jump examples)
  are illustrative scenarios built for teaching, not moves from a
  recorded historical game.
