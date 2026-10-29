# Práctica intensiva — repaso libre

29 de octubre de 2026. Base verificada: `6788f76ebd81016faeac075b4b99ba76e121147e`. La continuación circular parte del rediseño libre todavía sin commit y conserva todos sus cambios locales, revisados mediante status/diff y snapshot en `.cache/deck-continuous/initial.diff`. Esta entrega adapta exclusivamente la práctica intensiva del [roadmap de Mazos](MAZOS_UX_ROADMAP.md); conserva el estudio programado, el resumen diario y todos los cambios anteriores. Sin commit, push, despliegue ni operaciones remotas.

## Recorrido vigente

Desde el resumen diario, seleccionar las palabras para reforzar y pulsar Practicar selección. La selección inicial sigue siendo de hasta diez, ajustable con las casillas existentes. El inicio filtra el ranking por la selección, conservando su orden incluso al desmarcar y volver a marcar una palabra. Los IDs se deduplican sin modificar el catálogo. Una selección vacía no inicia la práctica.

La cola recorre las palabras seleccionadas continuamente y conserva su orden. El anverso muestra solo la palabra. Mostrar respuesta revela su contenido; el mismo botón cambia a Siguiente palabra. Espacio realiza la misma acción. Al avanzar desde la última palabra vuelve automáticamente al anverso de la primera y el indicador vuelve a 1 de total. Con una sola palabra, cada Siguiente palabra vuelve a su propio anverso. No existe estado ni pantalla final, ni acciones de reinicio manual. La práctica continúa hasta pulsar Salir, siempre en la cabecera, que vuelve al resumen inmediatamente.

La cabecera de práctica sustituye a la normal: título, posición n de total y Salir. No hay evaluaciones, objetivos de aciertos, límites de respuestas, resultados de práctica, bloques ni temporizadores visibles o internos de práctica. El reloj normal conserva su implementación y se pausa/desmonta al entrar. No se acredita tiempo de práctica al estudio programado.

## Presentación y accesibilidad

La palabra japonesa es el elemento principal del reverso. Su lectura se muestra una sola vez si difiere de la palabra tras normalización NFKC y espacios extremos; no se eliminan datos del catálogo. Se destaca el significado; la frase conserva furigana y audio próximo, con traducción desplegable. La imagen usa `contain` y altura adaptativa, sin deformar ni recortar. El acento respeta su preferencia y aparece en un renglón identificado como Acento tonal.

`KaishiCardMedia` incorpora el input explícito `layout="practice"`. Solo esa variante hace visible el título tonal y distribuye los elementos de práctica. El valor predeterminado `study`, el resumen y toda la lógica de carga/audio conservan su comportamiento. No se modifica su plantilla ni sus métodos de reproducción.

El pie fijo mantiene accesible un único botón principal, con espacio inferior y safe-area. Documento desplazable único, sin recortar contenido. Se usan exclusivamente tokens semánticos del proyecto; la acción principal tiene fondo suave, borde de acento y texto de alto contraste con la superficie, en lugar de texto oscuro sobre un azul saturado.

El componente de práctica es el único que maneja su atajo. El manejador normal ya ignora eventos mientras está abierta. Se respetan botones, enlaces, campos, summary, elementos editables y roles interactivos, IME, modificadores y eventos repetidos. El botón principal conserva su nodo entre Mostrar/Siguiente para usar el Espacio nativo. Después de avanzar, incluido última→primera, el botón principal recibe el foco; al salir, el foco vuelve a Practicar selección en el resumen. Mantener la tecla no salta palabras. Los botones de audio conservan nombres distintos y superficies de 44×44 px.

## Audio y aislamiento

Se conserva el resolver existente: medios locales prioritarios, fallback estático r2, autoaudio por defecto con opt-out por workspace, palabra seguida de frase tras `ended`, botones manuales y recuperación ante bloqueo. No cambian las exclusiones de 永遠 ni del audio ausente, los créditos, hashes o la autorización comunicada por el propietario.

Revelar monta el componente multimedia de esa aparición. Avanzar o salir solicitan la cancelación de audio inmediatamente; cada avance renueva además una clave de aparición en memoria que Angular usa para recrear el artículo y su componente multimedia. Se abortan las peticiones restantes y se descarta la segunda grabación pendiente. La clave cambia incluso si entryId es idéntico y si anverso y siguiente revelado ocurren antes del mismo render. No es un contador de vueltas ni se persiste. Destruir la vista conserva la limpieza existente. Cambio de workspace y ocultación de pestaña conservan las cancelaciones ya existentes. Una nueva vuelta genera una aparición nueva; refrescos, acento o foco no reinician una aparición existente.

`DeckIntensiveSession` contiene únicamente selección única, índice y avance circular. El cálculo modular está protegido para selección vacía; no existe índice terminal ni método de reinicio. `DeckIntensivePractice` contiene presentación, revelado, navegación y foco. No tienen acceso a repositorios de progreso, scheduler, journal, estadísticas ni sincronización. No generan eventos. La recarga descarta la práctica y conserva el resumen del día. No quedan métodos de puntuación o continuación de bloques ni traducciones de controles retirados.

## Archivos modificados

- `src/app/core/services/deck-intensive-session.ts` y su spec: recorrido circular sin estado terminal.
- `src/app/features/anki-study/deck-intensive-practice.ts`, nueva plantilla `.html`, nuevo `.scss` y nuevo `.spec.ts`: dinámica, cabecera, tarjeta, teclado y foco.
- `src/app/features/anki-study/anki-study.page.ts/.html/.scss/.spec.ts`: orden de selección al iniciar, ocultar cabecera normal y espacio exclusivo de práctica; sus contadores, reloj, respuestas y scheduler no cambian.
- `src/app/shared/components/kaishi-card-media/kaishi-card-media.ts/.scss/.spec.ts`: input visual opt-in y estilos acotados; carga y reproducción intactas.
- `src/assets/i18n/{es,en,ca}.json` y `deck-study.generated.ts`: nuevas cadenas y eliminación de las obsoletas, en dominio diferido.
- `manual-tests/mazos-roadmap/mazos-roadmap.spec.ts`: sustituye las aserciones de la dinámica anterior; nuevo `free-practice.spec.ts` añade cobertura específica.
- Esta guía, `MAZOS_UX_ROADMAP.md` e `docs/INDEX.md`.

## Validación

Evidencias de esta continuación en `.cache/deck-continuous/`, ignoradas por Git. Las evidencias previas en `.cache/deck-free-practice/` se conservan sin sobrescribir.

| Validación de la continuación circular | Resultado | Log |
| --- | --- | --- |
| Cola, componente, página y multimedia dirigidos | **44/44**, 5 archivos | `directed.log` |
| Suite Angular completa | **2227/2227**, 218 archivos | `full.log` |
| Práctica circular y regresión normal, seis perfiles | **60/60**, sin reintentos automáticos | `browser-final.log` |
| Comprobación adicional de descriptores completados/abortados | **6/6** | `descriptor-check.log` |
| SCHEDULER-1, tres tamaños/temas | **6/6** | `scheduler-browser.log` |
| Manga candidato ES/EN/CA | **3/3** | `manga-regression.log` |
| TypeScript app/spec/worker | Correcto | `ts-*.log` |
| Builds normal/candidato con base `/kana-study/` | Correctos; cuatro avisos SCSS conocidos | `build-normal.log`, `build-candidate.log` |
| Integridad multimedia, separación inicial y límites locales | Correcto | `media-audit.log`, `boundaries.log` |
| Documentación y whitespace final | Correcto | `docs-audit-final.log`, `diff-check-final.log` |

La primera ejecución de navegador terminó 59/60: el test del estudio normal contaba una petición abortada como una carga extra. La traza registró un descriptor con `net::ERR_ABORTED` y una respuesta 200 del mismo URL durante la recuperación inicial del almacén local. No se cambió producción: la prueba ahora exige un único descriptor distinto, exactamente una carga completada con 200 y que cualquier petición adicional esté abortada; cualquier otro HTTP falla. Conserva las comprobaciones estrictas de secuencia única y de dos audios. La suite completa volvió a pasar 60/60, y la aserción completa de estados HTTP pasó adicionalmente 6/6. No se añadieron sleeps ni reintentos automáticos.

Se verifican tres vueltas con varias palabras, tres apariciones de una sola palabra, retorno al anverso, indicador 1 de total, ausencia de controles finales, salida desde anverso/reverso y foco en el resumen. Se compara exactamente IndexedDB normal, localStorage y sessionStorage antes/después de varias vueltas, salida y recarga. El test de render revela otra vez el mismo ID antes del siguiente render y comprueba que cambia la instancia multimedia, con cancelación inmediata de la anterior.

La revisión de seis diffs previos ajenos a esta continuidad confirma que permanecen idénticos al snapshot inicial (`preserved-prior-diffs.json`), incluidos la variante multimedia y estilos anteriores. Scheduler, cola normal, proyección diaria, reloj normal, dataset, medios públicos, permiso, gates, workflow y SQL no tienen cambios frente a HEAD. La importación del APKG y todo el catálogo e2e no se han repetido: no cambia el importador. Manga usa SDK Auth controlado, sin Supabase real. HEAD e índice conservados, sin commit ni push.

| Artefacto | Inicial | Completo browser con medios r2 |
| --- | ---: | ---: |
| Normal | 746599 bytes | 149999121 bytes |
| Candidato | **747485 bytes** | 149998899 bytes |

Margen inicial: 2515 bytes bajo 750000, sin aumentar el presupuesto ni incorporar la práctica al arranque. Medios r2: 1500 descriptores, 4344 recursos íntegros y 109382203 bytes multimedia; worker diferido de 527549 bytes.

Capturas actuales, inspeccionadas visualmente, sin pantalla final:

| Perfil | Anverso | Reverso | Retorno automático a la primera |
| --- | --- | --- | --- |
| Escritorio oscuro 1280×900 | [Ver](../../../.cache/deck-continuous/front-desktop-es-dark.png) | [Ver](../../../.cache/deck-continuous/back-desktop-es-dark.png) | [Ver](../../../.cache/deck-continuous/wrap-desktop-es-dark.png) |
| Móvil claro 390×844 | [Ver](../../../.cache/deck-continuous/front-mobile-es-light.png) | [Ver](../../../.cache/deck-continuous/back-mobile-es-light.png) | [Ver](../../../.cache/deck-continuous/wrap-mobile-es-light.png) |

Los tests de navegador usan el candidato optimizado bajo `/kana-study/`, perfiles nuevos Chromium y originales r2: escritorio 1280×900 oscuro ES y Nora oscuro CA, portátil 1280×720 claro EN, móvil 390×844 claro ES, 360×640 Nora CA y 320×568 Anime ES. Incluyen reproducción real, rechazo de navegador y cancelación del resolver existente, una y varias palabras, selección vacía, tres vueltas con varias palabras, apariciones sucesivas del mismo ID, salida desde anverso/reverso, foco, controles nativos, teclado mantenido y comparación exacta de todos los almacenes IndexedDB normales. Las pruebas unitarias conservan la cancelación por workspace/visibilidad y opt-out del componente multimedia.

Capturas `front-*`, `back-*`, `wrap-*` de los seis proyectos; `zoom-*` documenta traducción abierta al 200 % CSS. La prueba de contenido extenso añade explícitamente texto de maquetación al DOM de una traducción en el perfil temporal; no modifica el catálogo ni la persistencia. Los ejemplos originales de las dos palabras tienen imágenes cuadrada (800×800) y vertical (327×400), respetadas sin recorte. La geometría comprueba que el reverso habitual cabe en 390×844 y 1280×720 y que las acciones permanecen en pantalla con zoom.

## Revisión previa a publicación

La revisión final corrigió la ayuda de selección ES/EN/CA que todavía describía una sola vuelta. Ahora indica que el repaso se repite hasta salir; el dominio diferido se ha regenerado y los tamaños anteriores corresponden a ese estado final.

## Pendiente

Aceptación humana del diseño y audio; Safari/iOS y dispositivos físicos, zoom nativo del navegador y suspensión real de pestañas. Las pruebas Chromium y de zoom CSS no sustituyen esas verificaciones ni garantizan autoplay en cada navegador. No se ha usado Supabase real. No se han alterado FSRS/SCHEDULER-1, contadores ni ranking normal, backups, workspaces, Grammar, gates Guest-only/custom cloud/upload, medios r2 o SQL.
