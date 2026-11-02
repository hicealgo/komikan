/**
 * tutorial.js — a short, slide-based intro for people who've never seen
 * Komikán before. Rather than build a whole separate scripted rules-engine,
 * most slides reuse BoardView on small hand-picked scenarios (a handful of
 * pieces placed to demonstrate one idea), so what people see here is the
 * real board and the real move rules, not a mock-up.
 *
 * The last slide hands off to a real game against the Easy AI with hints
 * forced on ("Practice mode"), via the `onStartPractice(side)` callback.
 */

import { BoardView } from './ui.js';
import { neighborsOf, jumpLanding, idAt } from './board.js';
import { t, onLangChange } from './i18n.js';

const PUMA_HOME = idAt(0, -4);

function demoState(entries) {
  return { pieces: new Map(entries) };
}

// Text lives in i18n.js (keys tut.<n>.title / tut.<n>.body); this only
// describes which demo board each slide shows.
const SLIDES = [
  { demo: null },
  { demo: () => demoState([[PUMA_HOME, 'puma']]) },
  { demo: () => demoState([[PUMA_HOME, 'puma']]), highlightMovesFrom: PUMA_HOME },
  {
    demo: () => demoState([[idAt(0, 6), 'puma'], [idAt(0, 3), 'dog']]),
    highlightJumpFrom: idAt(0, 6),
  },
  {
    demo: () => demoState([[idAt(0, 6), 'puma'], [idAt(0, 3), 'dog'], [idAt(3, 0), 'dog']]),
    highlightJumpFrom: idAt(0, 6),
  },
  { demo: null },
];

export class Tutorial {
  constructor(overlayEl, { onStartPractice }) {
    this.overlay = overlayEl;
    this.onStartPractice = onStartPractice;
    this.index = 0;
    this.demoView = null;
    this.overlay.innerHTML = `
      <div class="tutorial-card">
        <button class="tutorial-close" aria-label="">&times;</button>
        <div class="tutorial-dots"></div>
        <h2 class="tutorial-title"></h2>
        <div class="tutorial-body"></div>
        <svg class="tutorial-demo" role="img" aria-hidden="true"></svg>
        <div class="tutorial-practice" hidden>
          <p class="tutorial-practice-text"></p>
          <div class="tutorial-practice-buttons">
            <button class="btn btn-primary" data-side="puma"></button>
            <button class="btn btn-primary" data-side="dog"></button>
          </div>
        </div>
        <div class="tutorial-nav">
          <button class="btn btn-ghost tutorial-prev"></button>
          <button class="btn btn-primary tutorial-next"></button>
        </div>
      </div>`;

    onLangChange(() => { if (!this.overlay.hidden) this.renderSlide(); });
    this.overlay.querySelector('.tutorial-close').addEventListener('click', () => this.close());
    this.overlay.querySelector('.tutorial-prev').addEventListener('click', () => this.go(-1));
    this.overlay.querySelector('.tutorial-next').addEventListener('click', () => this.go(1));
    this.overlay.querySelector('.tutorial-practice').addEventListener('click', (e) => {
      const side = e.target?.dataset?.side;
      if (side) this.onStartPractice(side);
    });
  }

  open() {
    this.index = 0;
    this.overlay.hidden = false;
    this.renderSlide();
  }

  close() {
    this.overlay.hidden = true;
  }

  go(delta) {
    this.index = Math.min(Math.max(this.index + delta, 0), SLIDES.length - 1);
    this.renderSlide();
  }

  renderSlide() {
    const slide = SLIDES[this.index];
    const card = this.overlay.querySelector('.tutorial-card');
    const n = this.index + 1;
    card.querySelector('.tutorial-title').textContent = t(`tut.${n}.title`);
    card.querySelector('.tutorial-body').innerHTML = t(`tut.${n}.body`);
    card.querySelector('.tutorial-close').setAttribute('aria-label', t('tut.close'));
    card.querySelector('.tutorial-prev').textContent = t('tut.prev');
    card.querySelector('.tutorial-next').textContent = t('tut.next');
    card.querySelector('.tutorial-practice-text').textContent = t('tut.practice');
    card.querySelector('[data-side="puma"]').textContent = t('tut.asPuma');
    card.querySelector('[data-side="dog"]').textContent = t('tut.asDog');

    const dots = card.querySelector('.tutorial-dots');
    dots.innerHTML = SLIDES.map((_, i) => `<span class="dot${i === this.index ? ' is-active' : ''}"></span>`).join('');

    card.querySelector('.tutorial-prev').disabled = this.index === 0;
    const isLast = this.index === SLIDES.length - 1;
    card.querySelector('.tutorial-next').hidden = isLast;
    card.querySelector('.tutorial-practice').hidden = !isLast;

    const svg = card.querySelector('.tutorial-demo');
    if (!slide.demo) {
      // SVG elements have no `.hidden` property, so toggle the attribute itself.
      svg.setAttribute('hidden', '');
      return;
    }
    svg.removeAttribute('hidden');
    if (!this.demoView) this.demoView = new BoardView(svg, () => {});
    const state = slide.demo();

    let legalMoves = [];
    let legalJumps = [];
    if (slide.highlightMovesFrom) {
      legalMoves = neighborsOf(slide.highlightMovesFrom).filter((n) => !state.pieces.has(n));
    }
    if (slide.highlightJumpFrom) {
      for (const over of neighborsOf(slide.highlightJumpFrom)) {
        if (state.pieces.get(over) !== 'dog') continue;
        const to = jumpLanding(slide.highlightJumpFrom, over);
        if (to && !state.pieces.has(to)) legalJumps.push(to);
      }
    }
    this.demoView.render(state, { selected: slide.highlightMovesFrom || slide.highlightJumpFrom, legalMoves, legalJumps });
  }
}
