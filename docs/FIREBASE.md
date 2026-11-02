# Registro anónimo de partidas con Firebase / Anonymous game log with Firebase

**Español** · [English](#english)

## Español

Opcional y **apagado por defecto**. Si `FIREBASE_CONFIG` es `null` en
[`js/firebase-config.js`](../js/firebase-config.js), la app no contacta a ningún servidor.

### Qué se guarda (y qué no)

Por cada partida, un documento en Firestore (`games/{id}`): modo (2 jugadores / vs IA),
bando humano, dificultad, pistas sí/no, idioma, tema, clase de pantalla (teléfono/tablet/escritorio),
**un identificador aleatorio por dispositivo** (para saber si alguien vuelve a jugar; sin cuenta,
sin nombre, sin correo, sin IP), la hora de inicio/fin, la duración, **cada jugada con su tiempo**
(milisegundos desde el inicio) y el resultado. Nada más. Quien juega puede desactivarlo en el menú
(«Compartir mis partidas de forma anónima»). Si publicas resultados, informa de ello y consulta a tu comité de ética.

### Qué necesito de ti (o qué hacer tú mismo)

1. Un proyecto de Firebase (plan gratuito *Spark* alcanza de sobra).
2. El objeto `firebaseConfig` de la *app web* (no es secreto) → lo pegas en `js/firebase-config.js`
   (o me lo das y lo hago yo).
3. El correo de Google del administrador → reemplaza `TU_CORREO@gmail.com` en
   `js/firebase-config.js` **y** en `firebase/firestore.rules`.

### Paso a paso en la consola de Firebase

1. <https://console.firebase.google.com> → **Agregar proyecto** (puedes desactivar Google Analytics).
2. **Compilación → Firestore Database → Crear base de datos** → elige una región cercana
   (p. ej. `southamerica-east1`, o `us-east1`) → modo **producción** (las reglas las pondremos enseguida).
3. Pestaña **Reglas** → pega el contenido de `firebase/firestore.rules` (con tu correo) → **Publicar**.
4. **Configuración del proyecto (⚙) → Tus apps → `</>` Web** → registra la app (sin Hosting) → copia
   el `firebaseConfig`.
5. **Compilación → Authentication → Comenzar → Método de acceso → Google → Habilitar**.
   Luego **Configuración → Dominios autorizados → Agregar dominio**: `heelgueta.github.io` (y `localhost`
   ya viene). Esto es lo que permite entrar al panel de administración.
6. Pega el config en `js/firebase-config.js`, haz commit y push. Juega una partida en el sitio y verás
   el documento aparecer en Firestore → `games`.
7. Panel: abre `https://heelgueta.github.io/komikan/admin/` → **Entrar con Google** con la cuenta
   administradora. Verás estadísticas y podrás **repetir cualquier partida** (con los tiempos reales).

Con la CLI (alternativa al paso 3): `npm i -g firebase-tools`, luego en una terminal `firebase login`
(interactivo: en Claude Code escribe `! firebase login`), `firebase use --add` y
`firebase deploy --only firestore:rules`.

### Seguridad y costos

- Las reglas (`firebase/firestore.rules`) permiten **crear/actualizar** documentos con un esquema
  estricto (campos y tamaños validados, máx. 600 jugadas, una partida terminada no se modifica) y
  **solo el administrador puede leer o borrar**. Nadie puede listar las partidas desde el sitio público.
- Recomendado: activa **App Check** (reCAPTCHA v3) en Firebase y una **alerta de presupuesto**.
  Sin App Check, alguien podría escribir basura (limitada por el esquema, no por volumen).
- Cuota gratuita de Firestore: ~20 000 escrituras/día; una partida usa unas pocas (se agrupan cada 4 s).

---

## English

Optional and **off by default**. While `FIREBASE_CONFIG` is `null` in
[`js/firebase-config.js`](../js/firebase-config.js) the app contacts no server at all.

### What is stored (and what is not)

One Firestore document per game (`games/{id}`): mode (two players / vs AI), human side, difficulty, hints
on/off, language, theme, a screen class (phone/tablet/desktop), **a random per-device id** (so you can tell
whether someone comes back; no account, name, e-mail or IP), start/end time, duration, **every move with
its timestamp** (ms since start) and the result. Nothing else. Players can turn it off in the menu
("Share my games anonymously"). If you publish results, say so and check with your ethics board.

### What you need to provide (or do yourself)

1. A Firebase project (the free *Spark* plan is plenty).
2. The web app's `firebaseConfig` object (not secret) → paste into `js/firebase-config.js`.
3. The admin's Google e-mail → replace `TU_CORREO@gmail.com` in `js/firebase-config.js` **and**
   `firebase/firestore.rules`.

### Console walkthrough

1. <https://console.firebase.google.com> → **Add project** (Google Analytics can stay off).
2. **Build → Firestore Database → Create database** → pick a nearby region → **production** mode.
3. **Rules** tab → paste `firebase/firestore.rules` (with your e-mail) → **Publish**.
4. **Project settings (⚙) → Your apps → `</>` Web** → register (skip Hosting) → copy `firebaseConfig`.
5. **Build → Authentication → Get started → Sign-in method → Google → Enable**; then
   **Settings → Authorized domains → Add** `heelgueta.github.io` (`localhost` is already there).
6. Paste the config into `js/firebase-config.js`, commit and push. Play a game on the site and the
   document appears under Firestore → `games`.
7. Dashboard: open `https://heelgueta.github.io/komikan/admin/` → **Sign in with Google** as the admin.
   You get overall stats and can **replay any game** with its real timing.

CLI alternative for step 3: `npm i -g firebase-tools`, `firebase login` (interactive — in Claude Code
type `! firebase login`), `firebase use --add`, `firebase deploy --only firestore:rules`.

### Security and cost

- The rules allow **creating/updating** documents only with a strict schema (validated fields and sizes,
  max 600 moves, a finished game can't be edited) and **only the admin can read or delete**. Nobody can
  list games from the public site.
- Recommended: turn on **App Check** (reCAPTCHA v3) and a **budget alert**. Without App Check someone
  could write junk (bounded by the schema, not by volume).
- Firestore free tier: ~20,000 writes/day; a game uses only a few (batched every 4 s).
