/**
 * Laboratorio visual (temporal) — NOT part of the shipped game.
 *
 * Loads the real game (../index.html) in an iframe and restyles it live by
 * injecting CSS + a few DOM tweaks into that iframe. The game's own code is
 * untouched, so what you see is exactly what the game would look like.
 * Delete this whole /test folder once the final look is chosen and baked into
 * css/styles.css.
 */

// ---------------------------------------------------------------------------
// OFF BY DEFAULT. This lab is kept in the repo for contributors who want to
// try new looks, but it is not offered to visitors. To use it locally:
//   1. set ENABLED = true below,
//   2. serve the repo (e.g. `python3 -m http.server 8000`),
//   3. open http://localhost:8000/test/
// ---------------------------------------------------------------------------
const ENABLED = false;

if (!ENABLED) {
  document.body.innerHTML = '<p style="font:16px system-ui;padding:24px;color:#ddd">Laboratorio visual desactivado / Visual lab disabled. '
    + 'Para activarlo, pon <code>ENABLED = true</code> en <code>test/lab.js</code>. / To enable it, set <code>ENABLED = true</code> in <code>test/lab.js</code>.</p>';
  throw new Error('visual lab disabled');
}

const STORE = 'komikan-lab-v1';

// ---------------------------------------------------------------- palettes
// Colour roles: puma = pangui piece, dog = trewa piece.
// Inspired by Mapuche textile and silverwork tones: undyed wool, natural black
// and brown wool, madder/cochineal reds, indigo, maqui violet, chilco yellow,
// silver. Generic and decorative on purpose: no sacred symbols, no flag.
const P = (o) => o;
const PALETTES = {
  tierra:   P({ label: 'Tierra (actual)', bgDeep: '#171009', bgPanel: '#241a10', bgRaised: '#2e2114', ink: '#f2e6cd', inkDim: '#c9b998', puma: '#e0a23d', dog: '#3f9c93', red: '#c0432f', line: '#8a6b3f', valley: '#d8c69c', mountain: '#9fb4ac', pumaEdge: '#3a2705', dogEdge: '#082623', pixelInk: '#1a1204', select: '#fff3c4' }),
  lana:     P({ label: 'Lana cruda (claro)', bgDeep: '#efe6d2', bgPanel: '#e3d6bb', bgRaised: '#d8c9a8', ink: '#2b2118', inkDim: '#5b4a37', puma: '#b3412c', dog: '#24456f', red: '#8c2f1f', line: '#5b4a37', valley: '#b89f6a', mountain: '#7f9a8a', pumaEdge: '#2b0f08', dogEdge: '#0a1a30', pixelInk: '#1a1204', select: '#1a1204' }),
  anil:     P({ label: 'Añil (noche índigo)', bgDeep: '#0b1226', bgPanel: '#111b36', bgRaised: '#17254a', ink: '#ebe5d3', inkDim: '#a3a9c2', puma: '#e9b949', dog: '#e6dfcc', red: '#d1553f', line: '#5b6ca8', valley: '#8c9fd6', mountain: '#b7c3e6', pumaEdge: '#3a2a05', dogEdge: '#1a2347', pixelInk: '#0b1226', select: '#ffffff' }),
  maqui:    P({ label: 'Maqui (violeta)', bgDeep: '#150c1c', bgPanel: '#20132b', bgRaised: '#2b1a3a', ink: '#f2e8ee', inkDim: '#bda6c4', puma: '#f4cb6a', dog: '#b88ae6', red: '#e0566f', line: '#7d5a9c', valley: '#c9a9e6', mountain: '#a3b8d9', pumaEdge: '#3a2905', dogEdge: '#24123a', pixelInk: '#150c1c', select: '#ffffff' }),
  cochinilla: P({ label: 'Cochinilla (carmesí)', bgDeep: '#1a0a0a', bgPanel: '#2a1010', bgRaised: '#381616', ink: '#f4e4d1', inkDim: '#d0aa9b', puma: '#f2c14e', dog: '#e8e0d0', red: '#ff6a4d', line: '#9a423a', valley: '#d9a79a', mountain: '#cdbfb0', pumaEdge: '#3a2205', dogEdge: '#3a1010', pixelInk: '#1a0a0a', select: '#ffffff' }),
  nogal:    P({ label: 'Nogal y bosque', bgDeep: '#14100c', bgPanel: '#1f1812', bgRaised: '#2a2118', ink: '#efe3cf', inkDim: '#bba98a', puma: '#d89b4a', dog: '#7aa37a', red: '#b5452c', line: '#6e5334', valley: '#cbb68a', mountain: '#94a58c', pumaEdge: '#3a2205', dogEdge: '#14240f', pixelInk: '#14100c', select: '#fff0c0' }),
  plata:    P({ label: 'Platería (plata y cobre)', bgDeep: '#101214', bgPanel: '#1a1d20', bgRaised: '#23272b', ink: '#e8ebee', inkDim: '#a4abb1', puma: '#dfe4e8', dog: '#c0662f', red: '#e0634a', line: '#7c858d', valley: '#b9c0c6', mountain: '#8fa0ad', pumaEdge: '#2a2f33', dogEdge: '#3a1a08', pixelInk: '#101214', select: '#ffffff' }),
  papel:    P({ label: 'Papel (claro, limpio)', bgDeep: '#f4efe3', bgPanel: '#fffaf0', bgRaised: '#efe8d6', ink: '#22190f', inkDim: '#6b5b45', puma: '#c0432f', dog: '#2f6f68', red: '#a12d1d', line: '#8a6b3f', valley: '#cdb78a', mountain: '#9fb4ac', pumaEdge: '#2b0f08', dogEdge: '#0a2321', pixelInk: '#1a1204', select: '#111111' }),
  ambar:    P({ label: 'Terminal ámbar', bgDeep: '#0a0704', bgPanel: '#140f08', bgRaised: '#1c150a', ink: '#ffb000', inkDim: '#b37800', puma: '#ffb000', dog: '#c97a00', red: '#ff3300', line: '#7a4f00', valley: '#ffb000', mountain: '#ffb000', pumaEdge: '#1a0f00', dogEdge: '#1a0f00', pixelInk: '#1a0f00', select: '#fff3c4' }),
  fosforo:  P({ label: 'Terminal verde fósforo', bgDeep: '#030a04', bgPanel: '#07140a', bgRaised: '#0b1d0f', ink: '#33ff66', inkDim: '#1fa840', puma: '#33ff66', dog: '#b6ffc8', red: '#ff5533', line: '#14803a', valley: '#33ff66', mountain: '#33ff66', pumaEdge: '#021a08', dogEdge: '#021a08', pixelInk: '#021a08', select: '#eaffee' }),
  neon:     P({ label: 'Neón synth', bgDeep: '#0b0618', bgPanel: '#130a2a', bgRaised: '#1b1040', ink: '#f4eaff', inkDim: '#b49cd9', puma: '#ffdd33', dog: '#20e3d6', red: '#ff2e93', line: '#6a3fd1', valley: '#9b6bff', mountain: '#20e3d6', pumaEdge: '#2a2000', dogEdge: '#04302d', pixelInk: '#0b0618', select: '#ffffff' }),
};

// ------------------------------------------------------------ piece glyphs
const GLYPH_SETS = {
  clasico: {
    label: 'Clásico (actual)',
    puma: ['0100010', '0111110', '1111111', '1101011', '1111111', '0111110', '0101010'],
    dog: ['0100010', '1111111', '1111111', '1101011', '1111111', '0111110', '0010100'],
  },
  geometrico: {
    label: 'Geométrico (montaña / rombo)',
    puma: ['0001000', '0001000', '0011100', '0011100', '0111110', '0111110', '1111111'],
    dog: ['0001000', '0011100', '0111110', '1111111', '0111110', '0011100', '0001000'],
  },
  huellas: {
    label: 'Huellas (puma / perro)',
    puma: ['0100010', '1100011', '1100011', '0001000', '0111110', '1111111', '0111110'],
    dog: ['1010101', '1010101', '0000000', '0011100', '0111110', '0111110', '0011100'],
  },
  letras: {
    label: 'Letras P / T',
    puma: ['1111100', '1000010', '1000010', '1111100', '1000000', '1000000', '1000000'],
    dog: ['1111111', '0001000', '0001000', '0001000', '0001000', '0001000', '0001000'],
  },
  ojos: {
    label: 'Ojos (mirada)',
    puma: ['0000000', '0110110', '1111111', '1101011', '1111111', '0110110', '0000000'],
    dog: ['0000000', '0000000', '0110110', '1011101', '0110110', '0000000', '0000000'],
  },
  puntos: {
    label: 'Puntos (minimal)',
    puma: ['0000000', '0000000', '0011100', '0011100', '0011100', '0000000', '0000000'],
    dog: ['0000000', '0000000', '0001000', '0011100', '0001000', '0000000', '0000000'],
  },
};

const FONTS = {
  head: {
    'Press Start 2P': 'Press Start 2P', 'Silkscreen': 'Silkscreen', 'Pixelify Sans': 'Pixelify Sans',
    'VT323': 'VT323', 'DotGothic16': 'DotGothic16', 'Space Mono': 'Space Mono', 'Share Tech Mono': 'Share Tech Mono',
  },
  body: {
    'VT323': 'VT323', 'Share Tech Mono': 'Share Tech Mono', 'Courier Prime': 'Courier Prime',
    'Space Mono': 'Space Mono', 'IBM Plex Mono': 'IBM Plex Mono', 'Pixelify Sans': 'Pixelify Sans',
    'DotGothic16': 'DotGothic16', 'system-ui': 'system-ui',
  },
};

// ---------------------------------------------------------------- controls
const opt = (obj) => Object.entries(obj).map(([v, o]) => [v, typeof o === 'string' ? o : o.label]);
const GROUPS = [
  { id: 'paleta', title: '🎨 Paleta', controls: [
    { key: 'palette', type: 'select', label: 'Paleta', options: opt(PALETTES), swatches: true },
    { key: 'texture', type: 'select', label: 'Textura de fondo', options: [['liso', 'Lisa'], ['tejido', 'Tejido (trama fina)'], ['rombos', 'Rombos tenues'], ['estrellas', 'Estrellas (cielo del sur)']] },
    { key: 'textureAmt', type: 'range', label: 'Intensidad de textura', min: 0, max: 1, step: 0.05 },
  ] },
  { id: 'fichas', title: '🐆 Fichas', controls: [
    { key: 'glyph', type: 'select', label: 'Dibujo', options: opt(GLYPH_SETS) },
    { key: 'shape', type: 'select', label: 'Forma de la ficha', options: [['circulo', 'Círculo (actual)'], ['cuadrado', 'Cuadrado'], ['rombo', 'Rombo'], ['hexagono', 'Hexágono'], ['escudo', 'Escudo']] },
    { key: 'pieceScale', type: 'range', label: 'Tamaño', min: 0.7, max: 1.3, step: 0.05 },
    { key: 'pieceStroke', type: 'range', label: 'Grosor del borde', min: 1, max: 5, step: 0.5, unit: 'px' },
    { key: 'idle', type: 'select', label: 'Animación en reposo', options: [['ninguna', 'Ninguna'], ['respirar', 'Respirar'], ['latido', 'Latido suave'], ['flotar', 'Flotar']] },
    { key: 'select', type: 'select', label: 'Ficha seleccionada', options: [['pulso', 'Anillo pulsante (actual)'], ['giro', 'Anillo punteado giratorio'], ['resplandor', 'Resplandor'], ['inversion', 'Colores invertidos']] },
  ] },
  { id: 'tablero', title: '🗺️ Tablero', controls: [
    { key: 'edgeW', type: 'range', label: 'Grosor de líneas', min: 1, max: 7, step: 0.5, unit: 'px' },
    { key: 'edgeStyle', type: 'select', label: 'Estilo de línea', options: [['continua', 'Continua'], ['punteada', 'Punteada'], ['tejida', 'Tejida (guion-punto)']] },
    { key: 'socketR', type: 'range', label: 'Tamaño de los puntos', min: 14, max: 30, step: 1, unit: 'px' },
    { key: 'socketFill', type: 'select', label: 'Relleno de los puntos', options: [['suave', 'Suave (actual)'], ['hueco', 'Hueco'], ['solido', 'Sólido']] },
    { key: 'zones', type: 'select', label: 'Fondo de zonas', options: [['ninguno', 'Ninguno (actual)'], ['campos', 'Montaña y valle tintados'], ['montana', 'Solo la montaña']] },
    { key: 'zoneAmt', type: 'range', label: 'Intensidad del fondo de zonas', min: 0.05, max: 0.5, step: 0.05 },
    { key: 'hints', type: 'select', label: 'Marcas de jugadas legales', options: [['relleno', 'Relleno (actual)'], ['punteado', 'Anillo punteado'], ['brillo', 'Brillo']] },
  ] },
  { id: 'crt', title: '📺 Efecto CRT', controls: [
    { key: 'crt', type: 'check', label: 'Activar efecto CRT' },
    { key: 'scan', type: 'range', label: 'Líneas de barrido (oscuridad)', min: 0, max: 0.6, step: 0.02 },
    { key: 'scanPitch', type: 'range', label: 'Separación de líneas', min: 2, max: 8, step: 1, unit: 'px' },
    { key: 'vignette', type: 'range', label: 'Viñeta (bordes oscuros)', min: 0, max: 0.9, step: 0.05 },
    { key: 'rgb', type: 'range', label: 'Máscara RGB (subpíxeles)', min: 0, max: 0.2, step: 0.01 },
    { key: 'grain', type: 'range', label: 'Grano / ruido', min: 0, max: 0.4, step: 0.02 },
    { key: 'flicker', type: 'check', label: 'Parpadeo leve' },
    { key: 'glow', type: 'range', label: 'Resplandor de fósforo', min: 0, max: 10, step: 1, unit: 'px' },
    { key: 'aberration', type: 'range', label: 'Aberración cromática del título', min: 0, max: 4, step: 0.5, unit: 'px' },
  ] },
  { id: 'tipo', title: '🔤 Tipografía y tamaños', controls: [
    { key: 'fontHead', type: 'select', label: 'Fuente de títulos y botones', options: opt(FONTS.head) },
    { key: 'fontBody', type: 'select', label: 'Fuente de texto', options: opt(FONTS.body) },
    { key: 'bodySize', type: 'range', label: 'Tamaño del texto', min: 14, max: 28, step: 1, unit: 'px' },
    { key: 'headScale', type: 'range', label: 'Escala de títulos y botones', min: 0.7, max: 1.5, step: 0.05, unit: '×' },
    { key: 'tracking', type: 'range', label: 'Espaciado entre letras', min: 0, max: 3, step: 0.25, unit: 'px' },
  ] },
  { id: 'marcos', title: '🧵 Marcos y adornos', controls: [
    { key: 'radius', type: 'range', label: 'Esquinas de los paneles', min: 0, max: 22, step: 1, unit: 'px' },
    { key: 'border', type: 'range', label: 'Grosor de los marcos', min: 1, max: 6, step: 1, unit: 'px' },
    { key: 'shadow', type: 'select', label: 'Sombra de los paneles', options: [['dura', 'Dura / pixel (actual)'], ['suave', 'Suave'], ['ninguna', 'Ninguna']] },
    { key: 'guarda', type: 'select', label: 'Franja decorativa (guarda)', options: [['chevron', 'Chevrón (actual)'], ['dientes', 'Dientes (zigzag)'], ['rombos', 'Rombos'], ['lisa', 'Franja lisa'], ['oculta', 'Oculta']] },
    { key: 'guardaH', type: 'range', label: 'Alto de la franja', min: 6, max: 28, step: 2, unit: 'px' },
  ] },
];

// Defaults = the look currently baked into css/styles.css (light theme).
const DEFAULTS = {
  palette: 'lana', texture: 'tejido', textureAmt: 0.5,
  glyph: 'puntos', shape: 'rombo', pieceScale: 1.1, pieceStroke: 3, idle: 'respirar', select: 'giro',
  edgeW: 3, edgeStyle: 'continua', socketR: 23, socketFill: 'suave', zones: 'ninguno', zoneAmt: 0.2, hints: 'relleno',
  crt: true, scan: 0.1, scanPitch: 2, vignette: 0.1, rgb: 0.2, grain: 0.4, flicker: true, glow: 0, aberration: 2.5,
  fontHead: 'Press Start 2P', fontBody: 'Pixelify Sans', bodySize: 20, headScale: 1, tracking: 0,
  radius: 10, border: 3, shadow: 'ninguna', guarda: 'oculta', guardaH: 12,
};

let state = (() => {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE) || '{}') }; } catch { return { ...DEFAULTS }; }
})();
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* ignore */ } };

// ------------------------------------------------------------- build panel
const $ = (s, r = document) => r.querySelector(s);
const controlsEl = $('#controls');
const inputs = new Map();
const fmt = (c, v) => (c.type === 'range' ? `${Number(v).toFixed(c.step < 1 ? (c.step < 0.1 ? 2 : 2) : 0).replace(/\.?0+$/, '')}${c.unit ?? ''}` : '');

for (const g of GROUPS) {
  const det = document.createElement('details');
  det.className = 'group';
  det.open = ['paleta', 'fichas'].includes(g.id);
  det.innerHTML = `<summary>${g.title}</summary><div class="group-body"></div>`;
  const body = $('.group-body', det);
  for (const c of g.controls) {
    const row = document.createElement('div');
    row.className = `row${c.type === 'check' ? ' check' : ''}`;
    let input;
    if (c.type === 'select') {
      row.innerHTML = `<label>${c.label}</label><select>${c.options.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>${c.swatches ? '<div class="swatches"></div>' : ''}`;
      input = $('select', row);
      input.addEventListener('change', () => set(c.key, input.value));
    } else if (c.type === 'range') {
      row.innerHTML = `<label>${c.label}<b></b></label><input type="range" min="${c.min}" max="${c.max}" step="${c.step}">`;
      input = $('input', row);
      input.addEventListener('input', () => set(c.key, Number(input.value)));
    } else {
      row.innerHTML = `<label><input type="checkbox"> ${c.label}</label>`;
      input = $('input', row);
      input.addEventListener('change', () => set(c.key, input.checked));
    }
    inputs.set(c.key, { c, input, row });
    body.appendChild(row);
  }
  controlsEl.appendChild(det);
}

function syncInputs() {
  for (const { c, input, row } of inputs.values()) {
    const v = state[c.key];
    if (c.type === 'check') input.checked = !!v; else input.value = v;
    if (c.type === 'range') $('label b', row).textContent = ` ${fmt(c, v)}`;
    if (c.swatches) {
      const p = PALETTES[state.palette];
      $('.swatches', row).innerHTML = [p.bgPanel, p.ink, p.puma, p.dog, p.red, p.line, p.valley, p.mountain].map((x) => `<i style="background:${x}"></i>`).join('');
    }
  }
}

function set(key, value) { state[key] = value; save(); syncInputs(); apply(); }

// ----------------------------------------------------------- CSS generation
const frame = $('#game');
let fontsLoaded = new Set();

function ensureFonts(doc) {
  for (const f of [state.fontHead, state.fontBody]) {
    if (f === 'system-ui' || fontsLoaded.has(f) && doc.querySelector(`link[data-lab-font="${f}"]`)) continue;
    fontsLoaded.add(f);
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.dataset.labFont = f;
    link.href = `https://fonts.googleapis.com/css2?family=${f.replace(/ /g, '+')}&display=swap`;
    doc.head.appendChild(link);
  }
}

const pct = (n) => Math.round(n * 100) / 100;

function buildCss() {
  const p = PALETTES[state.palette];
  const s = state;
  const grainUri = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='${s.grain}'/></svg>")`;
  const tex = {
    liso: 'none',
    tejido: `repeating-linear-gradient(0deg, rgba(255,255,255,${0.04 * s.textureAmt * 2}) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(0,0,0,${0.12 * s.textureAmt * 2}) 0 1px, transparent 1px 4px)`,
    rombos: `linear-gradient(135deg, rgba(255,255,255,${0.05 * s.textureAmt * 2}) 25%, transparent 25%) -16px 0 / 32px 32px, linear-gradient(225deg, rgba(255,255,255,${0.05 * s.textureAmt * 2}) 25%, transparent 25%) -16px 0 / 32px 32px, linear-gradient(315deg, rgba(0,0,0,${0.12 * s.textureAmt * 2}) 25%, transparent 25%) 0 0 / 32px 32px, linear-gradient(45deg, rgba(0,0,0,${0.12 * s.textureAmt * 2}) 25%, transparent 25%) 0 0 / 32px 32px`,
    estrellas: `radial-gradient(circle at 20% 30%, rgba(255,255,255,${0.5 * s.textureAmt}) 0 1px, transparent 1.5px) 0 0 / 90px 90px, radial-gradient(circle at 70% 70%, rgba(255,255,255,${0.35 * s.textureAmt}) 0 1px, transparent 1.5px) 0 0 / 130px 130px, radial-gradient(circle at 45% 85%, rgba(255,255,255,${0.25 * s.textureAmt}) 0 1.5px, transparent 2px) 0 0 / 170px 170px`,
  }[s.texture];

  const guarda = {
    chevron: '',
    dientes: `.guarda{background:linear-gradient(135deg,var(--accent-gold) 25%,transparent 25%) -${s.guardaH}px 0/${s.guardaH * 2}px ${s.guardaH}px,linear-gradient(225deg,var(--accent-gold) 25%,transparent 25%) -${s.guardaH}px 0/${s.guardaH * 2}px ${s.guardaH}px,linear-gradient(315deg,var(--accent-teal) 25%,transparent 25%) 0 0/${s.guardaH * 2}px ${s.guardaH}px,linear-gradient(45deg,var(--accent-teal) 25%,transparent 25%) 0 0/${s.guardaH * 2}px ${s.guardaH}px !important;}`,
    rombos: `.guarda{background:conic-gradient(from 45deg at 50% 50%,var(--accent-gold) 0 25%,transparent 0 50%,var(--accent-teal) 0 75%,transparent 0) 0 0/${s.guardaH * 2}px ${s.guardaH * 2}px !important;}`,
    lisa: '.guarda{background:linear-gradient(var(--accent-gold) 0 40%,var(--accent-red) 0 60%,var(--accent-teal) 0) !important;}',
    oculta: '.guarda{display:none !important;}',
  }[s.guarda];

  const shapeShadow = { dura: 'var(--shadow-hard)', suave: '0 8px 24px rgba(0,0,0,.35)', ninguna: 'none' }[s.shadow];
  const edgeDash = { continua: 'none', punteada: '2 7', tejida: '12 5 3 5' }[s.edgeStyle];
  const idleAnim = { ninguna: 'none', respirar: 'lab-breathe 2.6s ease-in-out infinite', latido: 'lab-beat 1.6s ease-in-out infinite', flotar: 'lab-float 2.2s ease-in-out infinite' }[s.idle];

  const selectCss = {
    pulso: '',
    giro: '.piece-ring{stroke-dasharray:5 5;animation:lab-spin 3s linear infinite !important;}',
    resplandor: '.piece-ring{display:none;} .piece.is-selected .piece-base{filter:drop-shadow(0 0 3px var(--select-color)) drop-shadow(0 0 9px var(--select-color));}',
    inversion: '.piece-ring{display:none;} .piece.is-selected .piece-base{fill:var(--select-color) !important;filter:drop-shadow(0 0 6px var(--select-color));} .piece.is-selected .piece-pixel{fill:var(--pixel-ink) !important;}',
  }[s.select];

  const hintCss = {
    relleno: '',
    punteado: '.board-socket.is-legal-move{fill:transparent !important;stroke-dasharray:4 4;stroke-width:3;} .board-socket.is-legal-jump{fill:transparent !important;stroke-dasharray:4 4;stroke-width:3;}',
    brillo: '.board-socket.is-legal-move{filter:drop-shadow(0 0 6px var(--accent-teal));} .board-socket.is-legal-jump{filter:drop-shadow(0 0 6px var(--accent-red));}',
  }[s.hints];

  const socketFill = {
    suave: '',
    hueco: '.board-socket--valley,.board-socket--mountain{fill:transparent !important;}',
    solido: '.board-socket--valley{fill:color-mix(in srgb,var(--socket-valley) 55%,var(--bg-panel)) !important;} .board-socket--mountain{fill:color-mix(in srgb,var(--socket-mountain) 55%,var(--bg-panel)) !important;}',
  }[s.socketFill];

  const crtOn = s.crt;
  const bodyFont = s.fontBody === 'system-ui' ? 'system-ui, sans-serif' : `'${s.fontBody}', 'VT323', monospace`;
  const headFont = `'${s.fontHead}', 'VT323', monospace`;
  const glowText = s.glow ? `body{text-shadow:0 0 ${s.glow}px color-mix(in srgb,currentColor 70%,transparent);} .board-svg{filter:drop-shadow(0 0 ${Math.max(1, s.glow / 2)}px var(--line-color));}` : '';

  return `
:root{
  --bg-deep:${p.bgDeep};--bg-panel:${p.bgPanel};--bg-panel-raised:${p.bgRaised};
  --ink:${p.ink};--ink-dim:${p.inkDim};--accent-gold:${p.puma};--accent-teal:${p.dog};--accent-red:${p.red};
  --line-color:${p.line};--socket-valley:${p.valley};--socket-mountain:${p.mountain};
  --puma-edge:${p.pumaEdge};--dog-edge:${p.dogEdge};--pixel-ink:${p.pixelInk};--select-color:${p.select};
  --radius:${s.radius}px;--shadow-hard:${shapeShadow};--lab-border:${s.border}px;
  --ps:${s.pieceScale};--hs:${s.headScale};
}
html,body{background-color:var(--bg-deep) !important;background-image:${tex} !important;}
body{font-family:${bodyFont} !important;font-size:${s.bodySize}px !important;letter-spacing:${s.tracking}px;}
h1,h2,.btn,.hud-turn,.tutorial-title{font-family:${headFont} !important;letter-spacing:${s.tracking}px;}
.app-title{font-size:calc(clamp(22px,6vw,34px) * var(--hs)) !important;text-shadow:${s.aberration}px 0 0 var(--accent-red),-${s.aberration}px 0 0 var(--accent-teal) !important;}
.btn{font-size:calc(14px * var(--hs)) !important;}
.hud-actions .btn{font-size:calc(12px * var(--hs)) !important;}
.hud-turn{font-size:calc(13px * var(--hs)) !important;}
.tutorial-title{font-size:calc(15px * var(--hs)) !important;}
.menu-card,.hud,.board-wrap,.tutorial-card,.banner-card{border-width:var(--lab-border) !important;}
.app-header,.app-footer{border-width:0 0 var(--lab-border) 0;}
.app-footer{border-width:var(--lab-border) 0 0 0;}
.guarda{height:${s.guardaH}px !important;}
${guarda}
.btn{border-radius:calc(var(--radius) * .6) !important;}
.btn-primary{background:var(--accent-gold) !important;} .btn-accent{background:var(--accent-teal) !important;}
.board-edge{stroke-width:${s.edgeW}px !important;stroke-dasharray:${edgeDash};stroke-linecap:round;}
.board-socket{r:${s.socketR}px;}
${socketFill}
.piece-base{r:calc(17px * var(--ps));}
.piece-ring{r:calc(23px * var(--ps));}
.piece-base--puma,.piece-base--dog{stroke-width:${s.pieceStroke}px !important;}
.piece-glyph{animation:${idleAnim};}
${selectCss}
${hintCss}
.lab-zones{pointer-events:none;} .lab-zone-m{fill:var(--socket-mountain);} .lab-zone-v{fill:var(--socket-valley);}
.lab-zones{opacity:${s.zones === 'ninguno' ? 0 : s.zoneAmt};} ${s.zones === 'montana' ? '.lab-zone-v{display:none;}' : ''}
@keyframes lab-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes lab-beat{0%,60%,100%{transform:scale(1)}20%{transform:scale(1.14)}40%{transform:scale(1.02)}}
@keyframes lab-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}
@keyframes lab-spin{to{transform:rotate(360deg)}}
${glowText}
/* ---- CRT: fully replaced so every knob is live ---- */
body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:50;mix-blend-mode:multiply;
  opacity:${crtOn ? 1 : 0} !important;
  background:repeating-linear-gradient(to bottom,rgba(0,0,0,${s.scan}) 0,rgba(0,0,0,${s.scan}) 1px,transparent 1px,transparent ${s.scanPitch}px),radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,${s.vignette}) 100%) !important;
  animation:${crtOn && s.flicker ? 'crt-flicker 6s infinite' : 'none'} !important;}
body::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:51;mix-blend-mode:overlay;display:${crtOn ? 'block' : 'none'};
  background:repeating-linear-gradient(to right,rgba(255,0,0,${s.rgb}) 0 1px,rgba(0,255,0,${s.rgb}) 1px 2px,rgba(0,0,255,${s.rgb}) 2px 3px),${grainUri};}
`;
}

// ---------------------------------------------- DOM tweaks inside the iframe
const SVG_NS = 'http://www.w3.org/2000/svg';
const mk = (doc, tag, attrs = {}) => {
  const n = doc.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

function shapeFor(doc, kind, R, cls) {
  const common = { class: cls };
  if (kind === 'cuadrado') return mk(doc, 'rect', { ...common, x: -R * 0.9, y: -R * 0.9, width: R * 1.8, height: R * 1.8, rx: R * 0.15 });
  if (kind === 'rombo') return mk(doc, 'polygon', { ...common, points: `0,${-R * 1.15} ${R * 1.15},0 0,${R * 1.15} ${-R * 1.15},0`, 'stroke-linejoin': 'round' });
  if (kind === 'hexagono') {
    const pts = [0, 1, 2, 3, 4, 5].map((i) => { const a = Math.PI / 6 + i * Math.PI / 3; return `${(R * 1.08 * Math.cos(a)).toFixed(2)},${(R * 1.08 * Math.sin(a)).toFixed(2)}`; }).join(' ');
    return mk(doc, 'polygon', { ...common, points: pts, 'stroke-linejoin': 'round' });
  }
  if (kind === 'escudo') return mk(doc, 'path', { ...common, d: `M${-R * 0.9},${-R} H${R * 0.9} V${R * 0.1} Q${R * 0.9},${R * 0.75} 0,${R * 1.1} Q${-R * 0.9},${R * 0.75} ${-R * 0.9},${R * 0.1} Z`, 'stroke-linejoin': 'round' });
  return mk(doc, 'circle', { ...common, r: R });
}

function restylePiece(doc, g) {
  const kind = g.classList.contains('piece--puma') ? 'puma' : 'dog';
  const s = state, R = 17 * s.pieceScale;

  const oldBase = g.querySelector('.piece-base');
  if (oldBase) {
    const nb = shapeFor(doc, s.shape, R, oldBase.getAttribute('class'));
    oldBase.replaceWith(nb);
  }
  const glyph = g.querySelector('.piece-glyph');
  if (glyph) {
    glyph.replaceChildren();
    const bitmap = GLYPH_SETS[s.glyph][kind];
    const cell = (R * 2 * 0.9) / bitmap.length;
    const off = -(cell * bitmap.length) / 2;
    bitmap.forEach((row, ry) => [...row].forEach((bit, rx) => {
      if (bit === '1') glyph.appendChild(mk(doc, 'rect', { x: off + rx * cell, y: off + ry * cell, width: cell + 0.3, height: cell + 0.3, class: 'piece-pixel' }));
    }));
  }
  g.dataset.lab = `${s.glyph}|${s.shape}|${s.pieceScale}`;
}

function injectZones(doc) {
  for (const svg of doc.querySelectorAll('svg.board-svg, svg.tutorial-demo')) {
    if (svg.querySelector(':scope > .lab-zones') || !svg.firstChild) continue;
    const g = mk(doc, 'g', { class: 'lab-zones' });
    g.appendChild(mk(doc, 'polygon', { class: 'lab-zone-m', points: '-186,-186 186,-186 0,0' }));
    g.appendChild(mk(doc, 'rect', { class: 'lab-zone-v', x: -186, y: 0, width: 372, height: 372, rx: 8 }));
    svg.insertBefore(g, svg.firstChild);
  }
}

function sweep(doc) {
  const key = `${state.glyph}|${state.shape}|${state.pieceScale}`;
  for (const g of doc.querySelectorAll('.piece')) if (g.dataset.lab !== key) restylePiece(doc, g);
  injectZones(doc);
}

let observer = null;
function apply() {
  const doc = frame.contentDocument;
  if (!doc || !doc.head) return;
  ensureFonts(doc);
  let style = doc.getElementById('lab-style');
  if (!style) { style = doc.createElement('style'); style.id = 'lab-style'; doc.head.appendChild(style); }
  style.textContent = buildCss();
  // The lab's CRT switch wins over the in-game checkbox.
  doc.body.classList.toggle('crt-on', state.crt);
  sweep(doc);
  if (!observer || observer.doc !== doc) {
    observer?.disconnect();
    observer = new frame.contentWindow.MutationObserver(() => sweep(doc));
    observer.doc = doc;
    observer.observe(doc.body, { childList: true, subtree: true });
  }
}
frame.addEventListener('load', apply);

// ----------------------------------------------------------------- actions
const toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 1800); };

$('#btn-reset').addEventListener('click', () => { state = { ...DEFAULTS }; save(); syncInputs(); apply(); toast('Valores originales restablecidos'); });
$('#btn-random').addEventListener('click', () => {
  for (const { c } of inputs.values()) {
    if (c.type === 'select') state[c.key] = c.options[Math.floor(Math.random() * c.options.length)][0];
    else if (c.type === 'range') { const n = Math.round((c.max - c.min) / c.step); state[c.key] = +(c.min + Math.floor(Math.random() * (n + 1)) * c.step).toFixed(3); }
    else state[c.key] = Math.random() < 0.7;
  }
  // Keep text legible when the dice are rolled.
  state.bodySize = Math.max(state.bodySize, 17);
  save(); syncInputs(); apply();
});
$('#btn-copy').addEventListener('click', async () => {
  const lines = ['Elección del laboratorio visual de Komikán:'];
  for (const g of GROUPS) {
    for (const c of g.controls) {
      let v = state[c.key];
      if (c.type === 'select') v = `${c.options.find(([o]) => o === v)?.[1] ?? v} [${v}]`;
      else if (c.type === 'check') v = v ? 'sí' : 'no';
      else v = `${v}${c.unit ?? ''}`;
      const changed = state[c.key] !== DEFAULTS[c.key] ? '  ← cambiado' : '';
      lines.push(`- ${g.title.replace(/^\S+\s/, '')} / ${c.label}: ${v}${changed}`);
    }
  }
  lines.push('', JSON.stringify(state));
  const text = lines.join('\n');
  try { await navigator.clipboard.writeText(text); toast('Copiado al portapapeles'); }
  catch { prompt('Copia este texto:', text); }
});
$('#btn-collapse').addEventListener('click', () => { $('#panel').classList.add('is-collapsed'); $('#btn-expand').hidden = false; });
$('#btn-expand').addEventListener('click', () => { $('#panel').classList.remove('is-collapsed'); $('#btn-expand').hidden = true; });

syncInputs();
if (frame.contentDocument?.readyState === 'complete') apply();
