/**
 * ui.js — draws the board as SVG and turns clicks/taps into node ids.
 *
 * The board never changes shape, so we build the static parts (the lines,
 * and one empty "socket" circle per point) exactly once in `build()`, then
 * `render()` only touches the pieces and the highlight classes on sockets.
 * That keeps re-renders cheap and animation-friendly.
 *
 * Pieces are drawn as small hand-authored pixel-art glyphs (a 7x7 bitmap
 * turned into <rect> pixels) rather than image files, so the whole app is
 * zero external image assets and easy to re-theme with CSS variables.
 */

import { BOARD, neighborsOf } from './board.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PIECE_RADIUS = 18.7; // pieces are diamonds (rombos) of this "radius"
const SOCKET_RADIUS = 23;
const PADDING = 34;

// 7x7 bitmaps, 1 = filled pixel. Deliberately minimal: a solid block for the
// pangui and a small plus for the trewa (the sides are told apart mainly by
// colour, so these only need to stay legible at any board size).
const GLYPHS = {
  puma: [
    '0000000',
    '0000000',
    '0011100',
    '0011100',
    '0011100',
    '0000000',
    '0000000',
  ],
  dog: [
    '0000000',
    '0000000',
    '0001000',
    '0011100',
    '0001000',
    '0000000',
    '0000000',
  ],
};

function el(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function buildGlyph(kind) {
  const g = el('g', { class: `piece-glyph piece-glyph--${kind}` });
  const bitmap = GLYPHS[kind];
  const cell = (PIECE_RADIUS * 2 * 0.9) / bitmap.length;
  const offset = -(cell * bitmap.length) / 2;
  bitmap.forEach((row, ry) => {
    [...row].forEach((bit, rx) => {
      if (bit !== '1') return;
      g.appendChild(el('rect', {
        x: offset + rx * cell,
        y: offset + ry * cell,
        width: cell,
        height: cell,
        class: 'piece-pixel',
      }));
    });
  });
  return g;
}

export class BoardView {
  /**
   * @param {SVGSVGElement} svg
   * @param {(nodeId: string) => void} onNodeClick
   */
  constructor(svg, onNodeClick) {
    this.svg = svg;
    this.onNodeClick = onNodeClick;
    this.sockets = new Map(); // nodeId -> <circle> (the empty-point marker)
    this.pieceLayer = null;
    this.build();
  }

  build() {
    const nodes = [...BOARD.nodes.values()];
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const minX = Math.min(...xs) - PADDING;
    const minY = Math.min(...ys) - PADDING;
    const w = Math.max(...xs) - Math.min(...xs) + PADDING * 2;
    const h = Math.max(...ys) - Math.min(...ys) + PADDING * 2;
    this.svg.setAttribute('viewBox', `${minX} ${minY} ${w} ${h}`);
    this.svg.style.aspectRatio = `${w} / ${h}`; // lets CSS size the board by height alone

    const edgeLayer = el('g', { class: 'layer-edges' });
    const seen = new Set();
    for (const [id, neighbors] of BOARD.adjacency) {
      const a = BOARD.nodes.get(id);
      for (const nId of neighbors) {
        const key = [id, nId].sort().join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        const b = BOARD.nodes.get(nId);
        edgeLayer.appendChild(el('line', {
          x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'board-edge',
        }));
      }
    }

    const socketLayer = el('g', { class: 'layer-sockets' });
    for (const n of nodes) {
      const socket = el('circle', {
        cx: n.x, cy: n.y, r: SOCKET_RADIUS,
        class: `board-socket board-socket--${n.zone}`,
        'data-node': n.id,
      });
      socket.addEventListener('click', () => this.onNodeClick(n.id));
      socketLayer.appendChild(socket);
      this.sockets.set(n.id, socket);
    }

    this.pieceLayer = el('g', { class: 'layer-pieces' });

    this.svg.innerHTML = '';
    this.svg.append(edgeLayer, socketLayer, this.pieceLayer);
  }

  /**
   * @param {import('./gameState.js').GameState} state
   * @param {{ selected?: string, legalMoves?: string[], legalJumps?: string[] }} view
   */
  render(state, { selected = null, legalMoves = [], legalJumps = [] } = {}) {
    for (const [nodeId, socket] of this.sockets) {
      socket.classList.toggle('is-selected', nodeId === selected);
      socket.classList.toggle('is-legal-move', legalMoves.includes(nodeId));
      socket.classList.toggle('is-legal-jump', legalJumps.includes(nodeId));
    }

    this.pieceLayer.innerHTML = '';
    for (const [nodeId, kind] of state.pieces) {
      const { x, y } = BOARD.nodes.get(nodeId);
      const g = el('g', {
        class: `piece piece--${kind}${nodeId === selected ? ' is-selected' : ''}`,
        transform: `translate(${x}, ${y})`,
        'data-node': nodeId,
      });
      if (nodeId === selected) g.appendChild(el('circle', { r: PIECE_RADIUS * 1.35, class: 'piece-ring' }));
      const d = PIECE_RADIUS * 1.15;
      g.appendChild(el('polygon', { points: `0,${-d} ${d},0 0,${d} ${-d},0`, class: `piece-base piece-base--${kind}` }));
      g.appendChild(buildGlyph(kind));
      g.addEventListener('click', (e) => { e.stopPropagation(); this.onNodeClick(nodeId); });
      this.pieceLayer.appendChild(g);
    }
  }

  /** Brief highlight pulse on a node, used for capture/jump feedback. */
  pulse(nodeId, cssClass) {
    const socket = this.sockets.get(nodeId);
    if (!socket) return;
    socket.classList.add(cssClass);
    setTimeout(() => socket.classList.remove(cssClass), 450);
  }
}

export function degreeOf(nodeId) {
  return neighborsOf(nodeId).length;
}
