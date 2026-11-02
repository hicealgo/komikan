/**
 * admin.js — private dashboard + replay for the anonymous game log.
 * Sign in with the admin Google account (see docs/FIREBASE.md). The page itself is public,
 * but the data is not: Firestore rules only let ADMIN_EMAIL read it.
 */
import { FIREBASE_CONFIG, ADMIN_EMAIL, FIREBASE_SDK } from '../js/firebase-config.js';
import { BoardView } from '../js/ui.js';
import { createInitialState, applyAction, dogsRemaining } from '../js/gameState.js';

const $ = (s) => document.querySelector(s);
const msg = (t) => { $('#msg').textContent = t || ''; };

if (!FIREBASE_CONFIG) {
  msg('Firebase no está configurado: completa js/firebase-config.js (ver docs/FIREBASE.md).');
  $('#btn-signin').hidden = true;
} else {
  start();
}

async function start() {
  const [{ initializeApp }, auth, fs] = await Promise.all([
    import(`${FIREBASE_SDK}/firebase-app.js`),
    import(`${FIREBASE_SDK}/firebase-auth.js`),
    import(`${FIREBASE_SDK}/firebase-firestore.js`),
  ]);
  const app = initializeApp(FIREBASE_CONFIG);
  const a = auth.getAuth(app);
  const db = fs.getFirestore(app);

  $('#btn-signin').onclick = () => auth.signInWithPopup(a, new auth.GoogleAuthProvider()).catch((e) => msg(e.message));
  $('#btn-signout').onclick = () => auth.signOut(a);

  auth.onAuthStateChanged(a, async (user) => {
    $('#btn-signin').hidden = !!user; $('#btn-signout').hidden = !user;
    $('#who').textContent = user?.email ?? '';
    $('#dash').hidden = true;
    if (!user) return;
    if (user.email !== ADMIN_EMAIL) { msg(`${user.email} no es la cuenta administradora.`); return; }
    msg('Cargando…');
    try {
      const q = fs.query(fs.collection(db, 'games'), fs.orderBy('createdAt', 'desc'), fs.limit(500));
      const snap = await fs.getDocs(q);
      games = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      msg('');
      $('#dash').hidden = false;
      renderCards(); renderTable();
    } catch (e) { msg(`No se pudo leer: ${e.code || e.message}`); }
  });
}

// ------------------------------------------------------------------ stats
let games = [];
const fmtDur = (ms) => { const s = Math.round(ms / 1000); return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`; };
const pct = (n, d) => (d ? `${Math.round((100 * n) / d)}%` : '–');

function renderCards() {
  const fin = games.filter((g) => g.finished);
  const devices = new Map(); for (const g of games) devices.set(g.device, (devices.get(g.device) || 0) + 1);
  const returning = [...devices.values()].filter((n) => n > 1).length;
  const avg = (arr, f) => (arr.length ? arr.reduce((s, g) => s + f(g), 0) / arr.length : 0);
  const ai = fin.filter((g) => g.mode === 'ai');
  const humanWon = ai.filter((g) => g.winner === g.humanSide).length;
  const cards = [
    [games.length, 'partidas (últimas 500)'],
    [`${fin.length} (${pct(fin.length, games.length)})`, 'terminadas'],
    [devices.size, `dispositivos · ${returning} volvieron`],
    [fmtDur(avg(fin, (g) => g.durationMs)), 'duración media (terminadas)'],
    [Math.round(avg(fin, (g) => g.plies)), 'jugadas medias'],
    [`${pct(fin.filter((g) => g.winner === 'puma').length, fin.length)} / ${pct(fin.filter((g) => g.winner === 'dog').length, fin.length)}`, 'gana pangui / trewa'],
    [pct(humanWon, ai.length), 'humanos ganan vs IA'],
    [pct(games.filter((g) => g.mode === 'ai').length, games.length), 'partidas vs IA'],
  ];
  $('#cards').innerHTML = cards.map(([b, s]) => `<div class="card"><b>${b}</b><span>${s}</span></div>`).join('');
}

function renderTable() {
  const fm = $('#f-mode').value, fr = $('#f-res').value;
  const rows = games.filter((g) => (!fm || g.mode === fm) && (!fr || (fr === 'none' ? !g.finished : g.winner === fr)));
  const when = (g) => (g.createdAt?.toDate ? g.createdAt.toDate() : new Date(g.startedAt)).toLocaleString();
  $('#tbl').innerHTML = `<thead><tr><th>Cuándo</th><th>Modo</th><th>Jugadas</th><th>Duración</th><th>Resultado</th><th>Disp.</th></tr></thead><tbody>${rows.map((g) => `
    <tr data-id="${g.id}"><td>${when(g)}</td><td>${g.mode === 'ai' ? `IA ${g.difficulty} (${g.humanSide})` : '2 jug.'}</td><td>${g.plies}</td><td>${fmtDur(g.durationMs)}</td>
    <td>${g.finished ? `${g.winner === 'puma' ? 'pangui' : 'trewa'} · ${g.reason}` : 'abandonada'}</td><td>${g.device.slice(0, 6)}</td></tr>`).join('')}</tbody>`;
  for (const tr of $('#tbl').querySelectorAll('tbody tr')) tr.onclick = () => openReplay(tr.dataset.id, tr);
}
$('#f-mode').onchange = renderTable; $('#f-res').onchange = renderTable;

// ----------------------------------------------------------------- replay
const view = new BoardView($('#board'), () => {});
let rp = null; // { game, states: GameState[], idx, timer }

function openReplay(id, tr) {
  document.querySelectorAll('tbody tr.sel').forEach((r) => r.classList.remove('sel')); tr?.classList.add('sel');
  stop();
  const game = games.find((g) => g.id === id);
  const states = [createInitialState()];
  for (const m of game.moves) {
    const action = m.k === 'm' ? { type: 'move', from: m.f, to: m.to } : m.k === 'j' ? { type: 'jump', from: m.f, over: m.o, to: m.to } : { type: 'endTurn' };
    states.push(applyAction(states.at(-1), action));
  }
  rp = { game, states, idx: 0, timer: null };
  $('#rp-slider').max = game.moves.length; $('#rp-slider').value = 0;
  $('#rp-info').textContent = `${game.mode === 'ai' ? `vs IA ${game.difficulty}, humano = ${game.humanSide}` : 'dos jugadores'} · ${game.lang} · ${game.viewport} · pistas ${game.hints ? 'sí' : 'no'} · ${game.finished ? `${game.winner} gana (${game.reason})` : 'abandonada'}`;
  show(0);
}
function show(i) {
  if (!rp) return;
  rp.idx = Math.max(0, Math.min(i, rp.game.moves.length));
  const s = rp.states[rp.idx], m = rp.game.moves[rp.idx - 1];
  view.render(s, { selected: m ? m.to : null });
  $('#rp-slider').value = rp.idx;
  $('#rp-hud').textContent = `jugada ${rp.idx}/${rp.game.moves.length}` + (m ? ` · t=${(m.t / 1000).toFixed(1)}s · ${m.s === 'p' ? 'pangui' : 'trewa'}${m.ai ? ' (IA)' : ''} · ${m.k === 'j' ? 'salto' : m.k === 'e' ? 'fin de salto' : 'paso'}` : '') + ` · comidos ${s.capturedDogs} · quedan ${dogsRemaining(s)}`;
}
function stop() { if (rp?.timer) { clearTimeout(rp.timer); rp.timer = null; } $('#rp-play').textContent = '▶'; }
function tick() {
  if (!rp || rp.idx >= rp.game.moves.length) { stop(); return; }
  const speed = Number($('#rp-speed').value);
  const cur = rp.game.moves[rp.idx];
  const prevT = rp.idx ? rp.game.moves[rp.idx - 1].t : 0;
  const wait = speed === 0 ? 1000 : Math.min(3000, Math.max(120, (cur.t - prevT) / speed));
  rp.timer = setTimeout(() => { show(rp.idx + 1); tick(); }, wait);
}
$('#rp-play').onclick = () => { if (!rp) return; if (rp.timer) stop(); else { if (rp.idx >= rp.game.moves.length) show(0); $('#rp-play').textContent = '⏸'; tick(); } };
$('#rp-prev').onclick = () => { stop(); show((rp?.idx ?? 0) - 1); };
$('#rp-next').onclick = () => { stop(); show((rp?.idx ?? 0) + 1); };
$('#rp-slider').oninput = (e) => { stop(); show(Number(e.target.value)); };
