# Komikán

**Español** · [English](#english)

![status](https://img.shields.io/badge/status-playable-brightgreen)
![license](https://img.shields.io/badge/license-MIT-blue)

**[▶ Jugar / Play](https://heelgueta.github.io/komikan/)** · [Repositorio / Repository](https://github.com/heelgueta/komikan)

---

## Español

Versión de código abierto, jugable en el navegador, de **Komikán**, un juego
tradicional de estrategia del pueblo mapuche: una persona controla al *pangui*
(el puma, una sola ficha que caza saltando) y la otra a doce *trewa* (los
perros, que ganan solo si lo acorralan). Puedes jugar contra otra persona en el
mismo dispositivo, contra una IA con tres dificultades, o aprender desde cero
con un tutorial interactivo. Está en **español e inglés**, con **modo claro y
oscuro**.

Sin instalación, sin cuenta, sin compilación: es un sitio estático. Abre
`index.html` o visítalo en GitHub Pages.

### Hecho con respeto

Este proyecto se hizo **con respeto, como una forma de facilitar la difusión del
patrimonio del pueblo mapuche**, a quien pertenece este juego. No reemplaza
jugarlo en un tablero dibujado a mano con piedrecitas: solo busca que cualquiera
con un teléfono pueda conocerlo y aprenderlo. Los colores se inspiran en la
textilería y la platería mapuche (lana cruda, añil, rojos de tintes naturales);
se usan solo como referencia decorativa y **no** se emplean símbolos sagrados ni
ceremoniales, ni la bandera. Si algo de lo que ves aquí es inexacto o poco
respetuoso, por favor abre un [issue](https://github.com/heelgueta/komikan/issues):
será bienvenido, sobre todo de quienes conocen el juego de primera mano.

### Por qué existe

Komikán está documentado desde al menos 1776 pero, como muchos juegos orales y
regionales, puede ir desapareciendo simplemente porque ya casi no hay una forma
accesible de encontrarse con él. Ponerlo en un navegador permite que cualquiera
lo pruebe y, al ser de código abierto, que se vea exactamente cómo está
modelado y se corrija si algo no está bien.

Reglas completas y fuentes históricas: [`docs/RULES.es.md`](docs/RULES.es.md).
Cómo funciona el código: [`docs/ARCHITECTURE.es.md`](docs/ARCHITECTURE.es.md).

### Cómo se juega

- **Dos jugadores**: por turnos en un mismo dispositivo.
- **Jugar contra la IA**: elige Fácil / Media / Difícil y el bando (el pangui,
  con 1 ficha y el objetivo más difícil; o los trewa, con 12 fichas).
- **Tutorial**: seis diapositivas con tableros de demostración interactivos
  (no imágenes fijas), que terminan en una práctica contra la IA más fácil con
  pistas activadas.
- Durante la partida solo se ven el turno, los botones *Reiniciar* y *Menú* y el
  tablero, para que quepa completo en pantalla sin desplazarse.
- En el menú puedes cambiar el **idioma** (ES/EN), el **modo** claro
  («lana cruda») u oscuro («añil») y activar o no las **pistas**. Las
  preferencias se guardan en tu navegador (`localStorage`) y nunca se envían a
  ningún sitio.

### Ejecutarlo en local

Sin dependencias ni empaquetador. Sirve cualquier servidor estático, por ejemplo:

```bash
cd komikan
python3 -m http.server 8080
# y abre http://localhost:8080
```

### Pruebas

```bash
npm test        # o: node tests/run.mjs
```

No necesita `npm install`. Comprueba que el grafo del tablero esté bien formado
(38 puntos, diagonales, el paso de montaña), que movimiento, capturas y cadenas
se comporten según las reglas, que ambas condiciones de victoria funcionen y que
la IA nunca devuelva un movimiento ilegal.

### Publicar en GitHub Pages

Ya está publicado en <https://heelgueta.github.io/komikan/>. Para un fork: sube
la carpeta a un repositorio, en *Settings → Pages* elige la rama `main` (carpeta
raíz) y listo; no hay artefactos que generar.

### Estructura

```
index.html         la página
css/styles.css      estilos, temas claro/oscuro, efecto CRT retro
js/                 tablero, reglas, IA, dibujo, tutorial, idiomas, app
tests/run.mjs        pruebas
test/               laboratorio visual (DESACTIVADO; ver test/README.md)
docs/               reglas + fuentes, arquitectura (ES y EN)
```

### Contribuir

Issues y pull requests son bienvenidos, en especial de quienes conocen las
reglas tradicionales con más autoridad que unas guías educativas digitalizadas.
La geometría exacta del tablero ([documentada aquí](docs/ARCHITECTURE.es.md#topología-del-tablero))
se reconstruyó a partir de un diagrama dibujado a mano y agradecería una segunda
opinión. `test/` contiene un laboratorio visual (paletas, fichas, efecto CRT,
tipografías) apagado por defecto: para usarlo en local, pon `ENABLED = true` en
`test/lab.js`.

### Licencia

MIT — ver [`LICENSE`](LICENSE). El juego en sí es patrimonio cultural mapuche y
no es de nadie en particular; la licencia cubre solo esta implementación.

---

## English

An open-source, browser-playable version of **Komikán**, a traditional Mapuche
strategy game: one player controls the *pangui* (a puma, a single piece that
hunts by jumping), the other controls twelve *trewa* (dogs, who win only by
cornering it). Play locally against another person, play against an AI at three
difficulties, or learn the game from scratch with a short interactive tutorial.
Available in **Spanish and English**, with **light and dark modes**.

No installation, no account, no build step. It's a static site — open
`index.html`, or visit it on GitHub Pages.

### Made with respect

This project was made **with respect, as a way to help share the heritage of the
Mapuche people**, to whom this game belongs. It doesn't replace playing on a
hand-drawn board with pebbles — it just means anyone with a phone can meet it
and learn it. The colours are inspired by Mapuche textiles and silverwork
(undyed wool, indigo, natural-dye reds) and are used only as a decorative
reference: **no** sacred or ceremonial symbols and not the flag. If anything
here is inaccurate or disrespectful, please open an
[issue](https://github.com/heelgueta/komikan/issues) — corrections are very
welcome, especially from people who know the game first-hand.

### Why this exists

Komikán has been documented since at least 1776 but, like a lot of oral and
regional games, it can fade simply because there's no accessible way left to
encounter it. Putting it in a browser means anyone can try it and, since it's
open source, look at exactly how it's modelled and correct it if something's off.

Full rules and the historical sources: [`docs/RULES.md`](docs/RULES.md). How the
code works: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

### Playing

- **Two players** — pass-and-play on one device.
- **Play against the AI** — pick Easy / Medium / Hard and your side (the pangui,
  with 1 piece and the harder objective; or the trewa, with 12 pieces).
- **Tutorial** — six short slides with live, interactive board demos (not static
  images), ending in a practice match against the easiest AI with hints on.
- During a game you only see whose turn it is, *Restart*, *Menu* and the board,
  so the whole board fits on screen without scrolling.
- From the menu you can switch **language** (ES/EN), **light** ("lana cruda") or
  **dark** ("añil") mode, and turn **hints** on or off. Preferences live in your
  browser (`localStorage`) and are never sent anywhere.

### Running it locally

No dependencies, no bundler. Any static file server works:

```bash
cd komikan
python3 -m http.server 8080
# then open http://localhost:8080
```

### Running the tests

```bash
npm test        # or: node tests/run.mjs
```

No `npm install` needed. It checks the board graph is well-formed (38 points,
diagonals, the mountain pass), movement/capture/chain rules behave as specified,
both win conditions trigger, and the AI never returns an illegal move.

### Deploying to GitHub Pages

Already live at <https://heelgueta.github.io/komikan/>. For a fork: push the
folder to a repository, in *Settings → Pages* pick the `main` branch (root
folder), done — there's no build artifact to generate.

### Project structure

```
index.html         page shell
css/styles.css      styling, light/dark themes, the retro CRT effect
js/                 board graph, rules, AI, rendering, tutorial, i18n, app shell
tests/run.mjs        sanity-check test suite
test/               visual lab (DISABLED; see test/README.md)
docs/               rules + sources, architecture (ES and EN)
```

### Contributing

Issues and pull requests are welcome — especially from anyone who can speak to
the traditional rules with more authority than a set of digitized worksheets.
The board's exact geometry ([documented here](docs/ARCHITECTURE.md#board-topology))
was reconstructed from a hand-drawn diagram and would benefit from a second
opinion. `test/` holds a visual lab (palettes, pieces, CRT, fonts) that is off by
default: to use it locally, set `ENABLED = true` in `test/lab.js`.

### License

MIT — see [`LICENSE`](LICENSE). The game itself is a piece of Mapuche cultural
heritage and belongs to no one in particular; the license covers this particular
implementation of it.
