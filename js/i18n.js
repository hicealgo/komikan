/**
 * i18n.js — Spanish / English strings and the tiny helper that applies them.
 *
 * Static text in index.html carries `data-i18n="key"` (text), `data-i18n-html="key"`
 * (text with markup) or `data-i18n-attr="attr:key;attr2:key2"` (attributes).
 * Dynamic text (turn label, win messages, tutorial) calls `t('key', { vars })`.
 * Spanish is the original language of the game, so it is the fallback.
 */

export const REPO_URL = 'https://github.com/heelgueta/komikan';
const DOC_BASE = `${REPO_URL}/blob/main/docs`;

const STRINGS = {
  es: {
    'doc.title': 'Komikán — el pangui y los trewa',
    'app.subtitle': 'el pangui y los trewa · juego mapuche de estrategia',
    'menu.human': 'Dos jugadores (mismo dispositivo)',
    'menu.ai': 'Jugar contra la IA',
    'menu.difficulty': 'Dificultad de la IA',
    'menu.easy': 'Fácil',
    'menu.medium': 'Media',
    'menu.hard': 'Difícil',
    'menu.playAs': 'Quiero jugar como…',
    'menu.asPuma': 'Pangui (el puma, 1 ficha)',
    'menu.asDog': 'Trewa (los perros, 12 fichas)',
    'menu.start': 'Comenzar',
    'menu.tutorial': 'Cómo se juega (tutorial)',
    'menu.hints': 'Pistas (resaltar movimientos legales)',
    'menu.lang': 'Idioma',
    'menu.themeToLight': '☀ Modo claro',
    'menu.themeToDark': '☾ Modo oscuro',
    'menu.footnote': 'Juego tradicional del pueblo mapuche, de código abierto, hecho con respeto para difundir ese patrimonio.',
    'menu.linkRules': 'Reglas y fuentes',
    'menu.linkCode': 'Cómo funciona el código',
    'menu.linkRepo': 'Repositorio',
    'hud.eatenTitle': 'Trewa comidos por el pangui',
    'hud.leftTitle': 'Trewa que quedan en el tablero',
    'hud.eaten': 'comidos:',
    'hud.left': 'quedan:',
    'hud.turn': 'Turno: {who} {control}',
    'hud.you': '(tú)',
    'hud.ai': '(IA)',
    'hud.puma': 'Pangui',
    'hud.dog': 'Trewa',
    'hud.over': 'Partida terminada',
    'hud.aiPuma': 'La IA piensa como pangui…',
    'hud.aiDog': 'La IA piensa como trewa…',
    'hud.endChain': 'Terminar salto',
    'hud.restart': 'Reiniciar',
    'hud.menu': 'Menú',
    'board.label': 'Tablero de Komikán: la montaña y el valle',
    'win.eaten': '¡El pangui se comió a {n} trewa y gana la partida!',
    'win.trapped': 'Los trewa acorralaron al pangui. ¡Los trewa ganan!',
    'win.dogsStuck': 'Los trewa ya no tienen ningún movimiento posible. ¡El pangui gana!',
    'win.over': '¡Partida terminada!',
    'win.again': 'Jugar otra vez',
    'win.toMenu': 'Volver al menú',
    'tut.close': 'Cerrar tutorial',
    'tut.prev': 'Anterior',
    'tut.next': 'Siguiente',
    'tut.practice': 'Practica ahora mismo, contra una IA suave y con pistas activadas:',
    'tut.asPuma': 'Practicar como Pangui',
    'tut.asDog': 'Practicar como Trewa',
    'tut.1.title': 'La leyenda',
    'tut.1.body': `Cuando se acerca el frío del invierno, el <strong>pangui</strong> (el puma) baja
      hambriento desde la cordillera hacia el valle, buscando comida. Los
      <strong>trewa</strong> (los perros) que custodian la ruka intentan cerrarle el
      paso antes de que llegue.<br><br>
      Así se cuenta el origen de este antiguo juego de estrategia mapuche: uno
      contra doce, cada bando con un objetivo distinto.`,
    'tut.2.title': 'El tablero',
    'tut.2.body': `El tablero tiene dos zonas unidas por un único paso: la <strong>montaña</strong>
      (el triángulo, arriba) y el <strong>valle</strong> (el cuadrado, abajo, donde
      está la ruka). El pangui empieza en la montaña; los doce trewa empiezan
      en el extremo más lejano del valle.`,
    'tut.3.title': 'Cómo se mueven',
    'tut.3.body': `Cada turno, una ficha se mueve <strong>un solo paso</strong>, siguiendo
      cualquier línea dibujada del tablero — hacia adelante, atrás, o en
      diagonal. El pangui y los trewa se mueven igual; la diferencia está en
      lo que pueden hacer al llegar. Prueba: los puntos resaltados son todos
      los movimientos posibles desde aquí.`,
    'tut.4.title': 'La cacería',
    'tut.4.body': `Solo el <strong>pangui</strong> puede comer. Si un trewa está en una línea recta
      junto a él y el punto siguiente está vacío, el pangui salta por encima
      y se lo come — igual que en las damas. Los trewa nunca pueden comerse
      al pangui, solo bloquearlo.`,
    'tut.5.title': 'Saltos encadenados',
    'tut.5.body': `Si después de comer a un trewa hay otro salto disponible, el pangui
      puede seguir comiendo en el mismo turno — incluso <strong>cambiando de
      dirección</strong>. En este ejemplo, el pangui puede saltar hacia el norte y
      luego, sin perder el turno, seguir hacia el este.`,
    'tut.6.title': 'Cómo se gana',
    'tut.6.body': `El <strong>pangui gana</strong> si logra comerse suficientes trewa (9 de 12, en la
      variante clásica que usa este juego).<br><br>
      Los <strong>trewa ganan</strong> si logran acorralar al pangui hasta dejarlo sin
      ningún movimiento posible.<br><br>
      Es un juego desigual a propósito: cada bando tiene una cantidad de
      fichas distinta y una manera distinta de ganar.`,
  },
  en: {
    'doc.title': 'Komikán — the pangui and the trewa',
    'app.subtitle': 'the pangui and the trewa · a Mapuche strategy game',
    'menu.human': 'Two players (same device)',
    'menu.ai': 'Play against the AI',
    'menu.difficulty': 'AI difficulty',
    'menu.easy': 'Easy',
    'menu.medium': 'Medium',
    'menu.hard': 'Hard',
    'menu.playAs': 'I want to play as…',
    'menu.asPuma': 'Pangui (the puma, 1 piece)',
    'menu.asDog': 'Trewa (the dogs, 12 pieces)',
    'menu.start': 'Start',
    'menu.tutorial': 'How to play (tutorial)',
    'menu.hints': 'Hints (highlight legal moves)',
    'menu.lang': 'Language',
    'menu.themeToLight': '☀ Light mode',
    'menu.themeToDark': '☾ Dark mode',
    'menu.footnote': 'A traditional game of the Mapuche people, open source, made with respect to help share that heritage.',
    'menu.linkRules': 'Rules and sources',
    'menu.linkCode': 'How the code works',
    'menu.linkRepo': 'Repository',
    'hud.eatenTitle': 'Trewa eaten by the pangui',
    'hud.leftTitle': 'Trewa left on the board',
    'hud.eaten': 'eaten:',
    'hud.left': 'left:',
    'hud.turn': 'Turn: {who} {control}',
    'hud.you': '(you)',
    'hud.ai': '(AI)',
    'hud.puma': 'Pangui',
    'hud.dog': 'Trewa',
    'hud.over': 'Game over',
    'hud.aiPuma': 'The AI is thinking as the pangui…',
    'hud.aiDog': 'The AI is thinking as the trewa…',
    'hud.endChain': 'End jumping',
    'hud.restart': 'Restart',
    'hud.menu': 'Menu',
    'board.label': 'Komikán board: the mountain and the valley',
    'win.eaten': 'The pangui ate {n} trewa and wins the game!',
    'win.trapped': 'The trewa cornered the pangui. The trewa win!',
    'win.dogsStuck': 'The trewa have no possible move left. The pangui wins!',
    'win.over': 'Game over!',
    'win.again': 'Play again',
    'win.toMenu': 'Back to menu',
    'tut.close': 'Close tutorial',
    'tut.prev': 'Back',
    'tut.next': 'Next',
    'tut.practice': 'Practice right now, against a gentle AI with hints turned on:',
    'tut.asPuma': 'Practice as the Pangui',
    'tut.asDog': 'Practice as the Trewa',
    'tut.1.title': 'The legend',
    'tut.1.body': `As the cold of winter approaches, the <strong>pangui</strong> (the puma) comes
      down hungry from the mountains into the valley, looking for food. The
      <strong>trewa</strong> (the dogs) who guard the ruka try to block its way
      before it gets there.<br><br>
      That is how the origin of this ancient Mapuche strategy game is told: one
      against twelve, each side with a different goal.`,
    'tut.2.title': 'The board',
    'tut.2.body': `The board has two zones joined by a single pass: the <strong>mountain</strong>
      (the triangle, on top) and the <strong>valley</strong> (the square, below, where
      the ruka stands). The pangui starts in the mountain; the twelve trewa start
      at the far end of the valley.`,
    'tut.3.title': 'How they move',
    'tut.3.body': `Each turn, one piece moves <strong>a single step</strong> along any
      drawn line of the board — forward, backward or diagonally. The pangui and
      the trewa move the same way; the difference is in what they can do once they
      arrive. Try it: the highlighted points are every move possible from here.`,
    'tut.4.title': 'The hunt',
    'tut.4.body': `Only the <strong>pangui</strong> can eat. If a trewa stands next to it on a
      straight line and the next point beyond is empty, the pangui jumps over it
      and eats it — just like in draughts. The trewa can never eat the pangui,
      only block it.`,
    'tut.5.title': 'Chained jumps',
    'tut.5.body': `If, after eating a trewa, another jump is available, the pangui can keep
      eating in the same turn — even <strong>changing direction</strong>. In this
      example, the pangui can jump north and then, without losing its turn, carry
      on east.`,
    'tut.6.title': 'How to win',
    'tut.6.body': `The <strong>pangui wins</strong> by eating enough trewa (9 of 12, in the
      classic variant this game uses).<br><br>
      The <strong>trewa win</strong> by cornering the pangui until it has no
      possible move left.<br><br>
      It is an unequal game on purpose: each side has a different number of
      pieces and a different way to win.`,
  },
};

const LANG_KEY = 'es';
export const LANGS = ['es', 'en'];
let lang = 'es';
const listeners = new Set();

export function detectLang(saved) {
  if (LANGS.includes(saved)) return saved;
  const nav = (typeof navigator !== 'undefined' && navigator.language) || LANG_KEY;
  return nav.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function getLang() { return lang; }

export function setLang(next) {
  lang = LANGS.includes(next) ? next : 'es';
  document.documentElement.lang = lang;
  applyI18n();
  listeners.forEach((fn) => fn(lang));
}

/** Register a callback to re-render dynamic text after a language change. */
export function onLangChange(fn) { listeners.add(fn); }

export function t(key, vars = {}) {
  const raw = STRINGS[lang]?.[key] ?? STRINGS.es[key] ?? key;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

/** Per-language links to the docs, rendered by GitHub. */
export function docUrl(name) {
  return `${DOC_BASE}/${name}${lang === 'es' ? '.es' : ''}.md`;
}

export function applyI18n(root = document) {
  document.title = t('doc.title');
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of root.querySelectorAll('[data-i18n-attr]')) {
    for (const pair of el.dataset.i18nAttr.split(';')) {
      const [attr, key] = pair.split(':');
      if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
    }
  }
  for (const a of root.querySelectorAll('a[data-doc]')) a.href = docUrl(a.dataset.doc);
}
