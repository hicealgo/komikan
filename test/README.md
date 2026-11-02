# Visual lab / Laboratorio visual (disabled / desactivado)

A throw-away playground for trying palettes, piece drawings, CRT settings,
fonts and sizes live on top of the real game. It is **off by default** and not
linked from the app.

Un banco de pruebas para probar paletas, dibujos de fichas, efecto CRT,
tipografías y tamaños sobre el juego real. Está **desactivado por defecto** y
no aparece enlazado en la app.

**To enable it locally / Para activarlo en local**

1. In `test/lab.js`, set `ENABLED = true`.
2. `python3 -m http.server 8000` from the repo root.
3. Open <http://localhost:8000/test/>.

The lab only injects CSS and tweaks the DOM inside an iframe; it never modifies
the game's own files. Once you pick a look, bake it into `css/styles.css`.
