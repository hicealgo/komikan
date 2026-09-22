# Komikán

An open-source, browser-playable version of **Komikán**, a traditional
Mapuche strategy game: one player controls the *pangui* (a puma, a single
piece that hunts by jumping), the other controls twelve *trewa* (dogs,
who win only by cornering it). Play locally against another person, play
against an AI at three difficulties, or learn the game from scratch with
a short interactive tutorial.

No installation, no account, no build step. It's a static site — open
`index.html`, or visit it hosted on GitHub Pages.

**[▶ Play it](https://heelgueta.github.io/komikan/)**

![status](https://img.shields.io/badge/status-playable-brightgreen)
![license](https://img.shields.io/badge/license-MIT-blue)

## Why this exists

Komikán has been documented since at least 1776 but, like a lot of oral
and regional games, it's easy for something like this to fade simply
because there's no accessible way left to encounter it. Putting it in a
browser doesn't replace playing it on a hand-drawn board with pebbles —
it just means anyone with a phone can try it, learn it, and (since this
is open source) look at exactly how it's modelled and correct it if
something's off.

See [`docs/RULES.md`](docs/RULES.md) for the full rules and the
historical sources they were reconstructed from, and
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how the code works.

## Playing

- **Dos jugadores** — pass-and-play on one device.
- **Jugar contra la IA** — pick Fácil / Media / Difícil, and which side
  you want (the pangui, with 1 piece and the harder objective; or the
  trewa, with 12 pieces and safety in numbers).
- **Tutorial** — six short slides (with live, interactive board demos,
  not static images) covering the board, movement, capturing, chained
  jumps, and how each side wins, ending in a practice match against the
  easiest AI with hints turned on.

Two settings persist between visits (via `localStorage`, never sent
anywhere): the CRT visual effect, and whether legal moves are highlighted.

## Running it locally

No dependencies, no bundler. Any static file server works, e.g.:

```bash
cd komikan
python3 -m http.server 8080
# then open http://localhost:8080
```

Opening `index.html` directly by double-clicking it (a `file://` URL)
also works in most browsers, since everything is loaded as relative
paths with no server-only features in use.

## Running the tests

```bash
npm test        # or: node tests/run.mjs
```

Dependency-free — `npm test` doesn't need `npm install` first. It checks
the board graph is well-formed, movement/capture/chain rules behave as
specified, both win conditions trigger correctly, and the AI never
returns an illegal move at any difficulty.

## Deploying to GitHub Pages

Already live for this repo at <https://heelgueta.github.io/komikan/>. To
do the same for a fork:

1. Push the folder to a GitHub repository.
2. In the repo's Settings → Pages, set the source to the `main` branch,
   root folder.
3. Your game will be live at `https://<username>.github.io/<repo>/`.

That's the whole process — there's no build artifact to generate first.

## Project structure

```
index.html         page shell
css/styles.css      styling + the retro CRT effect
js/                 board graph, rules engine, AI, rendering, tutorial, app shell
tests/run.mjs        sanity-check test suite
docs/               rules + sources, architecture notes
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for what each file is
responsible for.

## Contributing

Issues and pull requests are welcome — especially from anyone who can
speak to the traditional rules with more authority than a set of
digitized worksheets. The board's exact geometry in particular
([documented here](docs/ARCHITECTURE.md#board-topology)) required some
interpretation of a hand-drawn diagram and would benefit from a second
opinion.

## License

MIT — see [`LICENSE`](LICENSE). The game itself is a piece of Mapuche
cultural heritage and belongs to no one; the license covers this
particular implementation of it.
