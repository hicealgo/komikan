# Komikán — reglas y fuentes

*Read in English: [RULES.md](./RULES.md)*

Komikán («el que se lo come todo») es un juego tradicional de estrategia para
dos personas del pueblo mapuche, documentado desde al menos 1776. Pertenece a
la misma familia que otros «juegos de caza» del mundo —Bagh Chal (Nepal), el
Zorro y las Ocas (Europa), Adugo (Brasil)—, donde un bando controla una sola
pieza poderosa y el otro muchas más débiles, cada uno con un objetivo y una
manera de ganar distintos.

Este documento registra lo que implementa la aplicación y, sobre todo,
**de dónde sale cada regla**, porque las fuentes históricas no coinciden del
todo entre sí.

## La leyenda

> Cuando se acerca el frío invierno, el Pangui (puma) baja hambriento
> desde la cordillera al valle en busca de alimentos. Los Trewas (perros)
> que custodian la Ruka intentan que no lleguen hasta ella, y buscan
> cerrarle el camino.
> — [Fundación Casa Rafael](https://www.casarafael.org.ar/wp-content/uploads/2020/10/Komikan-Tablero.pdf)

## Fuentes primarias

1. **Molina, Juan Ignacio.** *Compendio de la historia civil del Reyno de
   Chile.* Madrid, 1788–1795 (describe lo que vio en el sur de Chile en
   1776), p. 124 — la descripción escrita más antigua que se conoce; comparó
   el juego con el ajedrez.
2. **Manquilef, Manuel.** *Comentarios del pueblo araucano II: la jimnasia
   nacional (juegos, ejercicios y bailes).* Santiago, 1914, pp. 104–105.
3. **Matus Z., Leotardo.** *Juegos i ejercicios de los antiguos araucanos
   (contribución al estudio de la etnolojía chilena).* Santiago, 1920, pp.
   9–10 — lo describió más cercano a las damas y registró una variante de
   movimiento (ver más abajo).
4. **[Chile Para Niños — Biblioteca Nacional de Chile](https://www.chileparaninos.gob.cl/639/w3-article-639005.html)**,
   «El juego del Komikan» — una guía educativa moderna que reconstruye el
   tablero y las reglas a partir de las fuentes 1–3, con ejemplos ilustrados.
   Es la fuente más detallada y mejor ilustrada, y es la que sigue esta
   aplicación por defecto.
5. **[Fundación Casa Rafael](https://www.casarafael.org.ar/wp-content/uploads/2020/10/Komikan-Tablero.pdf)** —
   una versión educativa más corta y simplificada; se usa para contrastar y
   como fuente del umbral alternativo de capturas («partida rápida»).

## El tablero

38 puntos en total, en dos figuras unidas (la cifra viene directamente de las
fuentes):

- **El valle** (*el cuadrado*): un cuadrado de 4×4 unidades con una retícula
  de 5×5 puntos — 25 puntos. En cada uno de sus cuatro cuadrantes de 2×2 hay
  una «X» dibujada, así que solo las esquinas y los centros de cada cuadrante
  tienen movimientos diagonales; los puntos a mitad del borde de un cuadrante
  solo se conectan en línea recta. Aquí está la ruka y aquí empiezan los
  trewa.
- **La montaña** (*el triángulo*): un triángulo invertido sobre el cuadrado,
  de 4 unidades de ancho arriba y 2 de alto, con **13** puntos. Su vértice es
  el punto central superior del cuadrado, el **paso de montaña**, que es la
  única conexión entre ambas figuras (y se cuenta como parte del cuadrado).

Dentro del triángulo, la vertical central se divide en tres pasos iguales; dos
barras horizontales la cruzan (a un tercio y a dos tercios de la altura) y dos
verticales más suben desde los extremos de la barra inferior hasta el borde
superior. Hay un punto donde se juntan dos líneas dibujadas, incluido el lugar
donde esas verticales laterales cruzan la barra superior. Los puntos interiores
del triángulo **no tienen diagonales**: solo se mueven por las barras y
verticales dibujadas, mientras que sus dos lados inclinados se pueden recorrer
hasta el paso.

Las líneas rectas continúan a través del paso: por ejemplo, el lado inclinado
derecho del triángulo sigue en la diagonal inferior izquierda del cuadrado, de
modo que un salto puede cruzar de una figura a la otra por esa línea. Mira
[`ARCHITECTURE.es.md`](./ARCHITECTURE.es.md#topología-del-tablero) para ver
cómo se construye el tablero en el código.

## Preparación

- **1 pangui/komikelu** (el puma), que empieza en medio de la montaña (el punto
  central de la barra superior).
- **12 trewa** (los perros), que empiezan en el borde del valle más alejado de
  la montaña: llenan sus dos filas inferiores más las dos esquinas exteriores de
  la segunda fila, igual que en el diagrama de Chile Para Niños.

## Turnos y movimiento

- **El pangui siempre mueve primero**; luego los turnos se alternan una pieza a
  la vez (un movimiento del pangui, luego uno de los trewa, y así).
- Cualquier pieza se mueve **un paso** a lo largo de una línea dibujada, en
  **cualquier dirección** — adelante, atrás o en diagonal, donde exista línea.

> *Variante, no usada por defecto:* Leotardo Matus (1920) registró un juego
> emparentado, el *Leoncito*, donde los trewa solo pueden avanzar, nunca
> retroceder, mientras el pangui sigue pudiendo moverse en ambos sentidos. La
> aplicación no ofrece esa variante, pues la fuente principal (Chile Para
> Niños) usa movimiento libre para ambos bandos.

## Capturas

Solo el pangui captura, y solo los trewa pueden ser capturados:

- Si un trewa está en un punto adyacente al pangui, en línea recta, y el punto
  inmediatamente siguiente está vacío, el pangui puede saltar sobre él y
  retirarlo del tablero — como en las damas.
- Si, al aterrizar, hay otro salto disponible, el pangui **puede** seguir
  saltando en el mismo turno — **incluso cambiando de dirección** — sin gastar
  un turno extra. Continuar es opcional: se puede parar después de cualquier
  salto.
- Los trewa nunca saltan ni capturan; su única herramienta es bloquear.

## Cómo se gana

- **El pangui gana** comiéndose suficientes trewa. Las fuentes no coinciden en
  el número exacto: Chile Para Niños (citando a Molina/Manquilef/Matus) dice
  **9 de los 12**; la ficha simplificada de Casa Rafael dice 6. La aplicación
  usa **9** por defecto, por estar mejor fundamentado, pero el umbral es una
  sola constante (`DEFAULT_WIN_THRESHOLD` en `js/gameState.js`), fácil de
  cambiar para una «partida rápida».
- **Los trewa ganan** acorralando al pangui hasta que no tenga ningún
  movimiento legal — ni paso ni salto.
- *(Regla de la casa, no cubierta por ninguna fuente: si el bando de los trewa
  se quedara sin ningún movimiento legal —muy improbable—, se da la victoria al
  pangui. Ver `winReason: 'dogs_stuck'` en el código.)*

## Lo que esta aplicación añade a las reglas históricas

Todo lo anterior tiene fuente. Se añadió lo siguiente solo para la experiencia
digital, y **no** se afirma que sea tradicional:

- **Niveles de dificultad** de la IA (Fácil/Media/Difícil) — el juego original
  es de dos personas.
- **Pistas** (resaltar movimientos legales) — una ayuda opcional para aprender.
  Nunca formó parte del juego tradicional; se ofrece porque el objetivo de esta
  aplicación es que cualquiera que nunca lo haya visto pueda aprenderlo.
- **Las posiciones de demostración del tutorial** son escenarios ilustrativos
  hechos para enseñar, no jugadas de una partida histórica registrada.
