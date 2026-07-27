# TikTok Gifts — un solo archivo (index.html) + Firebase

Todo vive en `index.html`. Se sincroniza en tiempo real con Firebase
Realtime Database (la misma que usamos en `moneyscripts-overlay`, el config
ya está puesto adentro).

## Cómo funciona ahora

- **El video de la animación YA NO se ve en el panel de control.** El panel
  es solo para manejar todo (mandar regalos, ajustar fade, invitados, etc).
  El video SOLO se reproduce en la página de overlay.
- **Cada regalo (TikTok Universe, Interstellar, Zeus) tiene su propio link
  de overlay**, independiente uno del otro. Puedes agregar cada uno como su
  propia fuente en OBS si quieres, o solo el que uses.
- El overlay tiene proporción fija de teléfono (375:812), así que no importa
  qué tamaño le pongas en OBS — no se estira, se acomoda tipo "letterbox".

## 1. Subir a Netlify

1. Ve a https://app.netlify.com/drop
2. Arrastra esta carpeta completa (con `index.html`, `gift-engine.js`, los
   `.webm` y tus `.png`) a la página.
3. Te da un link tipo `https://algo-random-123.netlify.app/`.

## 2. Archivos que le faltan a esta carpeta

- Tus íconos: `tiktokcoin.png`, `like.png`, `share.png`, `people.png`,
  `gift.png`, `report.png`.
- `TikTokuniverse_alpha.webm` (los otros dos ya están incluidos).

## 3. Generar el link de cada regalo

1. Abre tu sitio normal (sin `?overlay=1`) — ese es el panel de control.
2. En el Mod Menu, cada regalo tiene su propia sección ("Video del regalo:
   Interstellar", etc.) con un botón **"🔗 Generar link de overlay"**.
3. Dale click al input para copiar el link (algo como
   `tusitio.netlify.app/?overlay=1&gift=Interstellar&room=r3f8x9k2`).
4. Pégalo en OBS / TikTok Live Studio como fuente de **Navegador**, una
   fuente por cada regalo que quieras usar.
5. Repite para cada regalo.

Cada link queda guardado en tu navegador — no hace falta regenerarlo cada
vez, a menos que quieras cambiar a un overlay nuevo.

## 4. Ajustar el fade

Ahora son dos controles separados por regalo:

- **Alcance**: qué tanto del cuadro cubre el degradado (0-100%). Si pones
  100%, el degradado ocupa TODO el cuadro de punta a punta.
- **Intensidad**: qué tan transparente se pone justo en el borde (0-100%).
  100% = invisible en el borde. Menos = se queda parcialmente visible ahí,
  aunque el alcance sea grande.

Combínalos: si con 100% de alcance se te ve "transparentoso" hasta abajo,
baja la intensidad a algo como 60-70% para que no desaparezca tanto.

Los cambios que hagas se guardan en Firebase al toque — si tienes el overlay
de ese regalo abierto en otra pestaña/ventana, lo vas a ver reflejado ahí
mismo sin recargar nada.

## 5. Probar

El botón "🔁 Probar animación" de cada regalo manda el evento por Firebase
igual que si lo hubieras mandado de verdad — pero como el video no se ve en
el panel, necesitas tener el link de overlay de ese regalo abierto en otra
pestaña (o ya puesto en OBS) para verlo.

## 6. Notificación del donador

Cada regalo tiene un toggle "Mostrar notificación del donador" — si está
activo, cuando se manda ese regalo también aparece un cartelito (foto +
nombre + "sent X") en el overlay, además de la animación. Si lo apagas, solo
sale el video, sin el cartelito.

## Notas

- **Zeus** quedó como estaba antes de que le metiera el recorte automático
  (sin crop por default) — si lo quieres ajustar, el control sigue ahí, pero
  ahora arranca en 0%.
- El "Co-host" del panel de invitados, el video de fondo, y todo lo demás
  del panel de control se maneja igual que antes.

## Reglas de Firebase (opcional, más seguro)

En Firebase Console → `moneyscripts-overlay` → Realtime Database → "Reglas":

```json
{
  "rules": {
    "rooms": { "$room": { ".read": true, ".write": true } },
    "roomConfig": { "$room": { ".read": true, ".write": true } }
  }
}
```

Como el código de cada `room` es aleatorio y solo tú lo tienes, nadie más lo
va a adivinar.
