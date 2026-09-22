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
import { neighborsOf, jumpLanding } from './board.js';

function demoState(entries) {
  return { pieces: new Map(entries) };
}

const SLIDES = [
  {
    title: 'La leyenda',
    body: `Cuando se acerca el frío del invierno, el <strong>pangui</strong> (el puma) baja
      hambriento desde la cordillera hacia el valle, buscando comida. Los
      <strong>trewa</strong> (los perros) que custodian la ruka intentan cerrarle el
      paso antes de que llegue.<br><br>
      Así se cuenta el origen de este antiguo juego de estrategia mapuche: uno
      contra doce, cada bando con un objetivo distinto.`,
    demo: null,
  },
  {
    title: 'El tablero',
    body: `El tablero tiene dos zonas unidas por un único paso: la <strong>montaña</strong>
      (el triángulo, arriba) y el <strong>valle</strong> (el cuadrado, abajo, donde
      está la ruka). El pangui empieza en la montaña; los doce trewa empiezan
      en el extremo más lejano del valle.`,
    demo: () => demoState([['t1_2', 'puma']]),
  },
  {
    title: 'Cómo se mueven',
    body: `Cada turno, una ficha se mueve <strong>un solo paso</strong>, siguiendo
      cualquier línea dibujada del tablero — hacia adelante, atrás, o en
      diagonal. El pangui y los trewa se mueven igual; la diferencia está en
      lo que pueden hacer al llegar. Prueba: los puntos resaltados son todos
      los movimientos posibles desde aquí.`,
    demo: () => demoState([['t1_2', 'puma']]),
    highlightMovesFrom: 't1_2',
  },
  {
    title: 'La cacería',
    body: `Solo el <strong>pangui</strong> puede comer. Si un trewa está en una línea recta
      junto a él y el punto siguiente está vacío, el pangui salta por encima
      y se lo come — igual que en las damas. Los trewa nunca pueden comerse
      al pangui, solo bloquearlo.`,
    demo: () => demoState([['s_2_2', 'puma'], ['s_1_2', 'dog']]),
    highlightJumpFrom: 's_2_2',
  },
  {
    title: 'Saltos encadenados',
    body: `Si después de comer a un trewa hay otro salto disponible, el pangui
      puede seguir comiendo en el mismo turno — incluso <strong>cambiando de
      dirección</strong>. En este ejemplo, el pangui puede saltar hacia el norte y
      luego, sin perder el turno, seguir hacia el este.`,
    demo: () => demoState([['s_2_2', 'puma'], ['s_1_2', 'dog'], ['s_0_3', 'dog']]),
    highlightJumpFrom: 's_2_2',
  },
  {
    title: 'Cómo se gana',
    body: `El <strong>pangui gana</strong> si logra comerse suficientes trewa (9 de 12, en la
      variante clásica que usa este juego).<br><br>
      Los <strong>trewa ganan</strong> si logran acorralar al pangui hasta dejarlo sin
      ningún movimiento posible.<br><br>
      Es un juego desigual a propósito: cada bando tiene una cantidad de
      fichas distinta y una manera distinta de ganar.`,
    demo: null,
  },
];

export class Tutorial {
  constructor(overlayEl, { onStartPractice }) {
    this.overlay = overlayEl;
    this.onStartPractice = onStartPractice;
    this.index = 0;
    this.demoView = null;
    this.overlay.innerHTML = `
      <div class="tutorial-card">
        <button class="tutorial-close" aria-label="Cerrar tutorial">&times;</button>
        <div class="tutorial-dots"></div>
        <h2 class="tutorial-title"></h2>
        <div class="tutorial-body"></div>
        <svg class="tutorial-demo" role="img" aria-hidden="true"></svg>
        <div class="tutorial-nav">
          <button class="btn btn-ghost tutorial-prev">Anterior</button>
          <button class="btn btn-primary tutorial-next">Siguiente</button>
        </div>
        <div class="tutorial-practice" hidden>
          <p>Practica ahora mismo, contra una IA suave y con pistas activadas:</p>
          <div class="tutorial-practice-buttons">
            <button class="btn btn-primary" data-side="puma">Practicar como Pangui</button>
            <button class="btn btn-primary" data-side="dog">Practicar como Trewa</button>
          </div>
        </div>
      </div>`;

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
    card.querySelector('.tutorial-title').textContent = slide.title;
    card.querySelector('.tutorial-body').innerHTML = slide.body;

    const dots = card.querySelector('.tutorial-dots');
    dots.innerHTML = SLIDES.map((_, i) => `<span class="dot${i === this.index ? ' is-active' : ''}"></span>`).join('');

    card.querySelector('.tutorial-prev').disabled = this.index === 0;
    const isLast = this.index === SLIDES.length - 1;
    card.querySelector('.tutorial-next').hidden = isLast;
    card.querySelector('.tutorial-practice').hidden = !isLast;

    const svg = card.querySelector('.tutorial-demo');
    if (!slide.demo) {
      svg.hidden = true;
      return;
    }
    svg.hidden = false;
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
