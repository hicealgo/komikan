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
const PIECE_RADIUS = 17;
const PADDING = 34;

// 7x7 bitmaps, 1 = filled pixel. Deliberately simple/iconic, not literal.
const GLYPHS = {
  puma: [
    '0100010',
    '0111110',
    '1111111',
    '1101011',
    '1111111',
    '0111110',
    '0101010',
  ],
  dog: [
    '0100010',
    '1111111',
    '1111111',
    '1101011',
    '1111111',
    '0111110',
    '0010100',
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
        cx: n.x, cy: n.y, r: PIECE_RADIUS + 6,
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
      g.appendChild(el('circle', { r: PIECE_RADIUS, class: `piece-base piece-base--${kind}` }));
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
