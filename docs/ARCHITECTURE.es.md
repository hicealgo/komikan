# Arquitectura

*Read in English: [ARCHITECTURE.md](./ARCHITECTURE.md)*

Es un sitio estático: HTML, CSS y módulos ES de JavaScript, sin paso de
compilación, sin dependencias y sin servidor. Abre `index.html` desde cualquier
servidor web (o GitHub Pages) y funciona. Fue una decisión deliberada: así es
fácil de bifurcar, de leer de principio a fin y trivial de publicar.

```
index.html          la página: menú, HUD, <svg> del tablero, superposiciones
css/styles.css       todos los estilos: diseño, temas claro/oscuro, efecto CRT
js/
  board.js           el tablero como grafo (nodos, aristas, saltos)
  gameState.js        el motor de reglas (funciones puras sobre un estado)
  ai.js               oponente minimax, ambos bandos, tres dificultades
  ui.js               dibuja el tablero en <svg> y traduce clics a nodos
  tutorial.js          las diapositivas de introducción (reutiliza ui.js)
  i18n.js             textos en español/inglés y cambio de idioma
  main.js             la aplicación: une menú, HUD y turnos de la IA
tests/run.mjs         pruebas sin dependencias (`npm test`)
test/                 laboratorio visual DESACTIVADO por defecto (ver test/README.md)
docs/
  RULES.md / RULES.es.md                reglas del juego + fuentes históricas
  ARCHITECTURE.md / ARCHITECTURE.es.md  este archivo
```

## Por qué un grafo y no una cuadrícula

El tablero de Komikán no es una cuadrícula simple: es un cuadrado de 5×5 unido
en un solo punto a un triángulo invertido cuyos puntos interiores no tienen
diagonales. Modelarlo como grafo (`js/board.js`) en vez de una matriz 2D hace
que el mismo código de movimiento y captura sirva en todas partes, y el
dibujo simplemente pinta lo que haya en el grafo, sin saber nada de su forma.

### Topología del tablero

`board.js` se construye directamente a partir de las **líneas dibujadas** del
tablero físico. Las coordenadas son enteros en tercios de unidad (así las
divisiones en 1/3 y 2/3 del triángulo son números enteros); el origen `(0, 0)`
es el paso de montaña, el cuadrado llega hasta `y = 12` y el triángulo hasta
`y = -6`.

- **`LINES`**: cada línea dibujada, como una sucesión ordenada de puntos. Las
  aristas de movimiento son simplemente los puntos consecutivos de cada línea,
  así que agregar o quitar un punto (o una línea entera) es un cambio de una
  línea. Hoy hay 38 puntos: 25 en el cuadrado + 13 en el triángulo.
- **`adjacency`**: `Map<nodeId, Set<nodeId>>`, derivado de `LINES`.
- **`jumpMap`**: `Map<"A|B", C>` — una pieza en `A` puede saltar sobre un
  perro en `B` y aterrizar en `C`. Se *deriva de la geometría*: `A→B` y `B→C`
  deben ser pasos consecutivos sobre la misma recta (colineales, misma
  dirección). Por eso el lado inclinado derecho del triángulo continúa por el
  paso hasta la diagonal del cuadrado sin ningún caso especial.
- **`START`**: las casillas iniciales del puma y de los 12 perros.

`tests/run.mjs` fija lo importante: los 38 puntos, qué diagonales existen (y
cuáles no), que el paso es el único vínculo y los saltos a través de él.

## El motor de reglas (`gameState.js`)

Un `GameState` es un objeto simple: un `Map` con las posiciones, de quién es el
turno, las capturas, el ganador (si hay) y un campo extra, `chain`, que existe
solo para el salto múltiple opcional del puma:

- Tras una captura, si hay otro salto disponible, se fija `chain` y el turno
  *no* pasa a los perros: el puma puede seguir saltando o llamar a `endTurn`
  para parar (las reglas permiten continuar, no lo obligan).
- `getLegalActions(state)` conoce el turno: en medio de una cadena devuelve solo
  los saltos desde la posición actual del puma más `endTurn`; si no, devuelve
  todos los pasos y saltos del bando al que le toca.

Todas las funciones son puras: `applyAction(state, action)` devuelve un estado
*nuevo* en vez de modificar el recibido. Así el mismo código corre dentro del
árbol de búsqueda de la IA y respalda el juego en pantalla.

## La IA (`ai.js`)

Minimax con poda alfa-beta, ejecutado con **profundización iterativa dentro de
un presupuesto de tiempo** en vez de a profundidad fija. Importa porque los dos
bandos tienen factores de ramificación muy distintos: el puma suele tener pocas
opciones, pero un turno de los perros puede tener 30–60. Un presupuesto de
tiempo se adapta solo y siempre devuelve algo legal.

La evaluación puntúa desde el lado del puma (positivo = bueno para el puma); los
perros minimizan el mismo número. Premia: perros capturados, la movilidad del
puma (pasos y saltos) y qué tan bien conectado está su punto actual.

La dificultad son tres ajustes (`DIFFICULTIES` en `ai.js`) de profundidad,
tiempo y —en Fácil— una probabilidad de elegir un movimiento al azar.

## Dibujo (`ui.js`)

La forma del tablero nunca cambia, solo lo que hay en él: `BoardView.build()`
dibuja una sola vez las líneas y un círculo («socket») por punto, y `render()`
solo toca las fichas y unas pocas clases CSS (`is-selected`, `is-legal-move`,
`is-legal-jump`). Las fichas son pequeños mapas de bits de 7×7 hechos de
`<rect>` (ver `GLYPHS`), sin archivos de imagen. La ficha seleccionada siempre
muestra un anillo, estén o no activadas las pistas.

## Idioma, tema y aspecto (`i18n.js`, `styles.css`)

Todo el texto visible está en `js/i18n.js` (español e inglés). El texto estático
lleva atributos `data-i18n`; el dinámico llama a `t('clave')`. Los temas claro y
oscuro son dos juegos de variables CSS en `:root` / `:root[data-theme='dark']`.
`test/` guarda un laboratorio visual desechable que sirvió para elegir el
aspecto actual; está desactivado por defecto.

## La aplicación (`main.js`)

No contiene reglas del juego: solo decide *cuándo* llamar a `gameState.js` y
`ai.js` y cómo reflejar el resultado. Lo interesante es `afterStateChange()`:
toda acción, humana o de la IA, pasa por ahí, de modo que turnos humanos, turnos
de la IA y cadenas de saltos comparten el mismo camino de dibujo.

## Tutorial (`tutorial.js`)

En vez de crear un segundo motor de reglas guionado, la mayoría de las
diapositivas arman un pequeño escenario `{ pieces: Map }` y lo entregan a otra
instancia de `BoardView`. Lo que ve quien aprende es el tablero *real* y el
cálculo *real* de movimientos y saltos, no una maqueta que pueda desincronizarse
del juego.
