# Atajos de RUSH y práctica continua de Mazos

29 de octubre de 2026. Base comprobada: `50eefec5b2a3d97a33e7e45433a2b1a937d316d8`, con árbol y diff inicialmente limpios. Se conserva la práctica circular, presentación, medios r2 y todos los cambios anteriores. Sin commit, push ni despliegue.

## Contrato final

| Modo | Anverso | Reverso | Alternativa global | `aria-keyshortcuts` del botón |
| --- | --- | --- | --- | --- |
| Kana RUSH: kana→romaji y romaji→kana | Espacio muestra respuesta | Espacio avanza | Enter para ambas acciones | `Space Enter` en ambos estados |
| Kanji RUSH: kanji→significado y significado→kanji | Espacio muestra respuesta | Espacio avanza | Enter para ambas acciones | `Space Enter` en ambos estados |
| Vocabulario RUSH: japonés→significado, significado→japonés, japonés→lectura, lectura→japonés | Espacio muestra respuesta | Espacio avanza | Enter para ambas acciones | `Space Enter` en ambos estados |
| Práctica continua de Mazos | Espacio muestra respuesta | Espacio va a la siguiente palabra | Sin Enter global nuevo | `Space` en ambos estados |

Todos conservan clic y toque. El botón enfocado usa su activación nativa; Enter nativo también funciona en el botón de Mazos y no representa un atajo global. Una pulsación actúa una vez. Los keydown repetidos de Enter y Espacio se suprimen en el propio botón principal, además de bloquearse en el manejador global.

La pista visible es **Espacio / Space / Espai**, reutilizando `vocabulary.shortcuts.space`, ya presente en ES/EN/CA. No se añaden claves duplicadas ni texto sin traducir. Un `kbd` con `aria-hidden="true"` permite descubrir el atajo visualmente sin duplicar el nombre accesible; `aria-keyshortcuts` comunica las teclas a las tecnologías de asistencia. La pista permanece visible también con pantalla táctil y a 320 px, con tokens semánticos y foco visible.

## Implementación y conservación

- `shared/keyboard/study-shortcuts.ts`: se añaden `runRevealNextShortcut`, la detección de modal y el guard del botón. Los cuerpos de `studyKeyboardAvailable` y `runStudyShortcut` conservan la política anterior de los otros modos, incluidas sus respuestas numéricas.
- `shared/keyboard/study-primary-action.ts`: directiva opt-in exclusivamente en los cuatro botones principales. Su callback de bloqueo lee el estado ocupado al keydown, no solo el valor del render anterior. Evita repeticiones nativas de Enter aunque el siguiente guardado termine antes de soltar la tecla.
- `features/rush/rush-study-actions.ts`: adaptador UI común de los tres RUSH. Global y manual comparten acción original revelar/siguiente; se respetan carga, guardado, sesión terminada, resumen, ausencia de unidad o contenido resoluble y `LearningWritingPrompt.keyboardBusy()`. Errores y medallas pendientes bloquean el atajo global. El botón conserva la recuperación manual, también con activación nativa enfocada, tras un error de escritura.
- Kana y Kanji consultan el prompt de escritura existente; no se altera el lienzo, sus trazos, reinicio ni recursos. El teclado de Vocabulario deja de interceptar Salir y otros controles. El de Kana permite por fin Espacio tras revelar.
- Mazos reutiliza el mismo helper y directiva; conserva su clave por aparición, cola circular, índice, Salir, autoaudio, cancelaciones y foco. No aparecen evaluaciones, temporizadores ni pantalla final.
- `shared/styles/_learning-controls.scss`: mixin nuevo `reveal-next-hints`, usado solo en RUSH y la práctica. `hints` y los estilos de los demás modos no cambian. Se retira el wrapper SCSS exclusivo de Kana, ahora redundante.

Los atajos respetan el evento ya procesado, ruta compuesta, foco activo, descendientes de controles nativos, elementos editables, roles interactivos, IME, Ctrl/Alt/Meta/Shift, repetición, diálogo nativo y diálogo ARIA. El lienzo y sus botones conservan su teclado; un trazo activo o carga expuestos por `keyboardBusy()` impiden acciones de tarjeta. La carga opcional de una imagen/audio de Mazos no impide avanzar para poder cancelarla.

No cambian los servicios/motores/repositories de RUSH, tiempos, cobertura, medallas, FSRS, SCHEDULER-1, progreso, backups, workspaces, catálogo/IDs, ranking diario, autorización/medios r2, Grammar, gates, workflow ni SQL. La práctica continúa sin escribir progreso. No se añaden dependencias, sincronización ni datos al arranque.

### Archivos del cambio

- UI: `src/app/features/rush/{kana,kanji,vocabulary}-rush.page.{ts,html}`, `rush-session.scss`, `rush-study-actions.ts`; retirado `kana-rush-keyboard.scss` (wrapper de dos líneas). `src/app/features/anki-study/deck-intensive-practice.{ts,html,scss}`.
- Compartidos: `src/app/shared/keyboard/study-shortcuts.ts`, nuevo `study-primary-action.ts` y `src/app/shared/styles/_learning-controls.scss`.
- Unitarios: nuevos `rush-study-actions.spec.ts` y `reveal-next-shortcuts.spec.ts`; actualizados `vocabulary-rush.page.spec.ts` y `deck-intensive-practice.spec.ts`.
- Navegador: nuevos `playwright.rush-shortcuts.config.ts` y `manual-tests/rush-shortcuts/rush-shortcuts.spec.ts`; actualizados `manual-tests/mazos-roadmap/{free-practice,mazos-roadmap}.spec.ts` y `e2e/learning-ux.spec.ts`.
- Documentación: este archivo, `docs/INDEX.md`, `docs/features/LEARNING_UX.md`, `docs/features/decks/DECK_FREE_PRACTICE.md`. La guía histórica `RUSH.md` se conserva intacta por su registro de integridad; esta guía nueva es accesible desde INDEX.

## Pruebas y evidencias

Logs y capturas ignorados en `.cache/rush-shortcuts/`. Las ejecuciones finales no usan reintentos automáticos.

| Comprobación final | Resultado | Log en `.cache/rush-shortcuts/` |
| --- | --- | --- |
| Angular dirigido: teclado, RUSH y práctica | 95/95, 8 archivos | `directed-final.log` |
| Suite Angular completa | 2263/2263, 220 archivos | `full-final.log` |
| Chromium RUSH: ocho variantes y tres configuraciones vacías | 33/33 | `browser-final.log` |
| Chromium Mazos: seis proyectos, vueltas/audio/persistencia | 66/66 | `mazos-browser-final.log` |
| Regresión Chromium de aprendizaje y escritura | 63/63 | `learning-regression-final.log` |
| Regresión Manga candidato | 3/3; Auth controlado | `manga-regression-final.log` |
| TypeScript app/spec | Correcto | `ts-app-final.log`, `ts-spec-final.log` |
| TypeScript worker | Correcto; código intacto | `ts-worker.log` |
| Build normal y candidato, base `/kana-study/` | Correctos; cuatro warnings SCSS conocidos de Grammar | `build-normal-final.log`, `build-candidate-final.log` |
| Auditoría de medios y límites locales | Correctas | `media-audit-final.log`, `boundaries-final.log` |
| `git diff --check` | Correcto; índice vacío, HEAD intacto | Comprobado tras documentar resultados |

Inicial normal: **746.599 bytes**. Inicial candidato: **747.485 bytes**, margen **2.515 bytes** respecto al límite exclusivo de 750.000. Worker multimedia: 527.549 bytes, diferido. Los 4.344 recursos multimedia r2 siguen fuera del bundle inicial (109.382.203 bytes). Tamaño total de despliegue generado: normal 150.003.335 bytes; candidato 150.003.097 bytes.

Capturas del botón real, anverso y reverso, por variante y proyecto: `browser-final/*/front-hint.png` y `browser-final/*/back-hint.png`. Ejemplos:

- [RUSH escritorio ES oscuro: Siguiente · Espacio](../../.cache/rush-shortcuts/browser-final/rush-shortcuts-kana-kana-t-79af1-ls-saving-touch-and-summary-desktop-es-dark/back-hint.png).
- [RUSH móvil EN claro: Show answer · Space](../../.cache/rush-shortcuts/browser-final/rush-shortcuts-kana-kana-t-79af1-ls-saving-touch-and-summary-mobile-en-light/front-hint.png).
- [RUSH a 320 px CA Nora: Següent · Espai](../../.cache/rush-shortcuts/browser-final/rush-shortcuts-kana-kana-t-79af1-ls-saving-touch-and-summary-narrow-ca-nora/back-hint.png).
- [Mazos escritorio ES oscuro](../../.cache/rush-shortcuts/mazos/back-desktop-es-dark.png) y [móvil ES claro](../../.cache/rush-shortcuts/mazos/back-mobile-es-light.png); las capturas completas conservan contenido, indicador, Salir y botón con pista.

La matriz optimizada `playwright.rush-shortcuts.config.ts` recorre las ocho variantes en 1280×900 oscuro ES, 390×844 claro EN y 320×568 Nora CA. Cada caso usa el motor y almacenamiento reales: bloqueo de una transacción IndexedDB para carga/guardado, siete tarjetas guardadas, cobertura comprobada, error de `put` inyectado una sola vez con recuperación manual, salida nativa y resumen sin acciones nuevas. Clic, toque, Space/Enter sobre ejercicio y botón, repetición, roles y controles secundarios se reproducen mediante eventos de Chromium; IME y eventos previamente prevenidos necesitan fixtures DOM con esos flags. Los modales se abren en el DOM, incluyendo `dialog.showModal()`.

Los helpers de prueba esperan al fin del guardado antes de gestionar medallas y al cambio real del toast después de cerrarlo. La primera versión del fixture podía consultar el toast antes del refresco o intentar cerrarlo dos veces; se corrigió esa sincronización sin sleeps, reintentos ni cambios productivos. La inspección de una configuración vacía comprueba primero si existe la base para no crear por sí sola una base sin esquema.

Las pruebas de Mazos conservan varias vueltas, una sola palabra, cancelación/renovación de audio y comparación exacta de IndexedDB normal, localStorage y sessionStorage. Se añaden Enter mantenido en el botón, ausencia de Enter global, pista/ARIA, controles secundarios, IME, modificadores, diálogos, eventos prevenidos y salida con Espacio sin revelado previo. Los escenarios anteriores que exigían Espacio solo para revelar Kana RUSH se sustituyen por comprobaciones explícitas de revelar/avanzar y Enter, no se eliminan.

## Límites

Chromium automatizado y emulación táctil; pendientes Safari/iOS, dispositivos físicos, teclado/IME nativo de plataforma, lectores de pantalla y aceptación humana. La regresión Manga usa Auth controlado, sin verificar Supabase real. No se promete disponibilidad offline completa ni autoplay infalible. No se ha realizado ninguna acción remota.
