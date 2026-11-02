# Komikán

*«el que se lo come todo»* · *"the one that eats everything"*

**Español** · [English](#english)

![status](https://img.shields.io/badge/status-playable-brightgreen)
![license](https://img.shields.io/badge/license-AGPLv3-blue)

**[▶ Jugar / Play](https://hicealgo.github.io/komikan/)** · [Repositorio / Repository](https://github.com/hicealgo/komikan)

---

## Español

Versión de código abierto, jugable en el navegador, de **Komikán** («el que se
lo come todo»), un juego tradicional de estrategia del pueblo mapuche: una
persona controla al *pangui* (el puma, una sola ficha que caza saltando) y la
otra a doce *trewa* (los perros, que ganan solo si lo acorralan). Puedes jugar
contra otra persona en el mismo dispositivo, contra una IA con tres
dificultades, o aprender desde cero con un tutorial interactivo. Está en
**español e inglés**, con **modo claro y oscuro**.

Sin instalación, sin cuenta, sin compilación: es un sitio estático.

### Hecho con respeto

Este proyecto se hizo con respeto, como una forma de facilitar el acceso y la
exploración del patrimonio del pueblo mapuche, a quien pertenece este juego. No
reemplaza jugarlo en un tablero físico con fichas, o en uno dibujado en el suelo
con piedras pequeñas: solo busca que más personas puedan conocerlo.

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
- **Tutorial**: seis diapositivas con tableros de demostración interactivos,
  que terminan en una práctica contra la IA más fácil con pistas activadas.
- En el menú puedes cambiar el idioma (ES/EN), el modo claro («lana cruda») u
  oscuro («añil») y activar o no las pistas. Las preferencias se guardan en tu
  navegador (`localStorage`) y nunca se envían a ningún sitio.

### Datos y privacidad

Las preferencias (idioma, tema, pistas) se guardan en tu navegador. Si quien administra este sitio activa el
registro de partidas, se guardan **de forma anónima** las jugadas y su duración (sin cuenta, nombre, correo ni IP)
para estudiar cómo se juega; puedes desactivarlo en el menú. Detalles en [`docs/FIREBASE.md`](docs/FIREBASE.md).

### Licencia

AGPLv3 — ver [`LICENSE`](LICENSE). El juego en sí es patrimonio cultural mapuche
y no es de nadie en particular; la licencia cubre solo esta implementación.

---

## English

An open-source, browser-playable version of **Komikán** ("the one that eats
everything"), a traditional Mapuche strategy game: one player controls the
*pangui* (a puma, a single piece that hunts by jumping), the other controls
twelve *trewa* (dogs, who win only by cornering it). Play locally against
another person, against an AI at three difficulties, or learn the game from
scratch with an interactive tutorial. Available in **Spanish and English**, with
**light and dark modes**.

No installation, no account, no build step: it's a static site.

### Made with respect

This project was made with respect, as a way to make the heritage of the Mapuche
people easier to access and explore — the people to whom this game belongs. It
doesn't replace playing it on a physical board with pieces, or on one drawn on
the ground with small stones: it only hopes more people can get to know it.

### Why this exists

Komikán has been documented since at least 1776 but, like a lot of oral and
regional games, it can fade simply because there's almost no accessible way left
to encounter it. Putting it in a browser means anyone can try it and, since it's
open source, look at exactly how it's modelled and correct it if something's off.

Full rules and historical sources: [`docs/RULES.md`](docs/RULES.md). How the code
works: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

### Playing

- **Two players**: pass-and-play on one device.
- **Play against the AI**: pick Easy / Medium / Hard and your side (the pangui,
  with 1 piece and the harder objective; or the trewa, with 12 pieces).
- **Tutorial**: six slides with interactive board demos, ending in a practice
  match against the easiest AI with hints on.
- From the menu you can switch language (ES/EN), light ("lana cruda") or dark
  ("añil") mode, and turn hints on or off. Preferences live in your browser
  (`localStorage`) and are never sent anywhere.

### Data and privacy

Preferences (language, theme, hints) live in your browser. If the site's admin enables game logging, moves and
durations are stored **anonymously** (no account, name, e-mail or IP) to study how the game is played; you can
switch it off in the menu. Details in [`docs/FIREBASE.md`](docs/FIREBASE.md#english).

### License

AGPLv3 — see [`LICENSE`](LICENSE). The game itself is a piece of Mapuche cultural
heritage and belongs to no one in particular; the license covers this particular
implementation of it.
