/**
 * telemetry.js — optional, anonymous logging of played games to Firestore.
 *
 * What is stored per game: mode/side/difficulty, hints on/off, language, theme,
 * a coarse viewport class, a random per-device id (no account, no IP, no name),
 * every move with its time offset, and the result. Nothing else.
 * Players can switch it off in the menu ("Compartir mis partidas…").
 *
 * Writes are batched (debounced) so a long game costs a handful of writes, and
 * everything is a no-op unless FIREBASE_CONFIG is filled in (js/firebase-config.js).
 */
import { FIREBASE_CONFIG, FIREBASE_SDK } from './firebase-config.js';

const MAX_PLIES = 600; // stop logging absurdly long (e.g. endless shuffling) games
const FLUSH_MS = 4000;
const APP_VERSION = 1;

export const telemetryAvailable = !!FIREBASE_CONFIG;

let dbPromise = null;
function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const [{ initializeApp }, fs] = await Promise.all([
        import(`${FIREBASE_SDK}/firebase-app.js`),
        import(`${FIREBASE_SDK}/firebase-firestore.js`),
      ]);
      const app = initializeApp(FIREBASE_CONFIG);
      return { db: fs.getFirestore(app), fs };
    })();
  }
  return dbPromise;
}

function deviceId() {
  try {
    let id = localStorage.getItem('komikan-device');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('komikan-device', id); }
    return id;
  } catch { return 'anon'; }
}

const viewportClass = () => (innerWidth < 600 ? 'phone' : innerWidth < 1100 ? 'tablet' : 'desktop');

/** One logger instance per game; call `start()` once, `move()` per action, then `end()` or `abandon()`. */
export class GameLogger {
  constructor(enabled) {
    this.enabled = enabled && telemetryAvailable;
    this.id = null;
    this.doc = null;
    this.timer = null;
    this.t0 = 0;
    this.dirty = false;
  }

  start({ mode, humanSide = null, difficulty = null, hints, lang, theme }) {
    if (!this.enabled) return;
    this.id = crypto.randomUUID();
    this.t0 = performance.now();
    this.doc = {
      v: APP_VERSION, device: deviceId(), mode, humanSide, difficulty, hints: !!hints,
      lang, theme, viewport: viewportClass(), startedAt: Date.now(), endedAt: null,
      durationMs: 0, finished: false, winner: null, reason: null, captured: 0, plies: 0, moves: [],
    };
    this.dirty = true;
    this.#schedule(300);
    addEventListener('pagehide', this.#onHide);
    document.addEventListener('visibilitychange', this.#onHide);
  }

  /** @param action the game action object; @param side 'puma'|'dog'; @param byAi boolean */
  move(action, side, byAi) {
    if (!this.enabled || !this.doc || this.doc.finished || this.doc.moves.length >= MAX_PLIES) return;
    const m = { t: Math.round(performance.now() - this.t0), s: side === 'puma' ? 'p' : 'd' };
    if (action.type === 'move') Object.assign(m, { k: 'm', f: action.from, to: action.to });
    else if (action.type === 'jump') Object.assign(m, { k: 'j', f: action.from, o: action.over, to: action.to });
    else Object.assign(m, { k: 'e' });
    if (byAi) m.ai = 1;
    this.doc.moves.push(m);
    this.doc.plies = this.doc.moves.length;
    this.dirty = true;
    this.#schedule(FLUSH_MS);
  }

  end(state) {
    if (!this.enabled || !this.doc || this.doc.finished) return;
    Object.assign(this.doc, { finished: true, winner: state.winner, reason: state.winReason, captured: state.capturedDogs });
    this.#close();
  }

  /** The player left (menu/restart/closed the tab) before the game ended. */
  abandon(state) {
    if (!this.enabled || !this.doc || this.doc.finished) return;
    this.doc.captured = state?.capturedDogs ?? this.doc.captured;
    this.#close();
  }

  #close() {
    this.doc.endedAt = Date.now();
    this.doc.durationMs = Math.round(performance.now() - this.t0);
    this.dirty = true;
    this.flush();
    removeEventListener('pagehide', this.#onHide);
    document.removeEventListener('visibilitychange', this.#onHide);
    this.enabled = false; // this logger is done; the next game gets a new one
  }

  #onHide = () => {
    if (document.visibilityState === 'hidden' || document.visibilityState === undefined) {
      if (this.doc) { this.doc.durationMs = Math.round(performance.now() - this.t0); this.dirty = true; this.flush(); }
    }
  };

  #schedule(ms) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), ms);
  }

  async flush() {
    clearTimeout(this.timer);
    if (!this.doc || !this.dirty) return;
    this.dirty = false;
    const snapshot = { ...this.doc, moves: [...this.doc.moves] };
    try {
      const { db, fs } = await getDb();
      const ref = fs.doc(db, 'games', this.id);
      // `createdAt` is the server's clock (trustworthy); set once, kept on later updates.
      if (!this.created) { await fs.setDoc(ref, { ...snapshot, createdAt: fs.serverTimestamp() }); this.created = true; }
      else await fs.updateDoc(ref, { ...snapshot });
    } catch (err) {
      this.dirty = true; // try again at the next flush; never disturb the game
      console.debug('[telemetry]', err?.code || err);
    }
  }
}
