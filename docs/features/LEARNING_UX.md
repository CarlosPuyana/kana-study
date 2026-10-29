# Aprender: teclado, ventanas y fichas de referencia

Estado local UX-1, 27/10/2026. No publicado; sin commit ni push.

Aceptación manual de UX-1 confirmada por el propietario: Kana con teclado, escritura/RUSH,
modales Aprender y responsive. Publicación pendiente de autorización posterior.

## Qué se conserva

Kana, Kanji y Vocabulario mantienen sus modos y tres calificaciones de autoevaluación
(again/hard/good), opciones reales, temporizadores, progreso, ejemplos, trazos y herramientas.
Los servicios de sesión, FSRS, Stats, sincronización, datos, IndexedDB y la beta Manga × Mazos
no se modifican. No se inventa una calificación ni se convierte una práctica en un repaso FSRS.

## Atajos de Kana

| Modo | Teclas y condiciones |
| --- | --- |
| Aprender, autoevaluación | Espacio revela; después 1=Repetir, 2=Difícil, 3=Bien, en el mismo orden de los tres botones existentes |
| Aprender, opción múltiple | 1…N eligen la opción visible correspondiente. No califican durante feedback ni antes de abrir las opciones de escritura; Continuar sigue siendo un botón accesible con Tab/Enter |
| Aprender, romaji→kana | El lienzo sigue disponible. Durante un trazo o carga no actúan los atajos; al terminar puede revelarse con Espacio, sin exigir haber dibujado |
| Escritura independiente | Espacio revela; 1=Repetir y 2=Correcto, las dos acciones que ya existían |
| Kana RUSH | Espacio y Enter revelan o avanzan, con pista Espacio visible en ambos estados. Sin calificaciones numéricas. Contrato vigente y protecciones en [atajos unificados](RUSH_SHORTCUTS.md) |
| Diálogos compatibles | Escape cancela inicio/salida, reconoce el aviso de medalla o cierra una ficha. Tab/Mayús+Tab permanecen dentro del diálogo y se restaura el foco al cerrar |

No existe actualmente una pregunta de romaji con campo de texto libre dentro de Aprender
Kana: se muestra lectura u opciones. La protección de inputs/textarea/contenteditable/IME
está implementada y probada igualmente; no se añade un nuevo modo de respuesta escrita.

Kanji y Vocabulario conservan sus atajos anteriores de autoevaluación (Espacio, 1/2/3),
con la misma protección de foco. No se les añaden opciones rápidas ni nuevas funciones.

El guard compartido ignora repetición, composición IME, modificadores, controles que poseen
la tecla y cualquier modal activo. La página comprueba además sesión, finalización, feedback,
carga y trazo activo. Solo llama a preventDefault si ejecuta una acción real: Espacio deja
de consumirse globalmente tras revelar en los modos de autoevaluación; RUSH utiliza el adaptador secuencial de revelar/siguiente. Los botones conservan Tab, Enter y Espacio nativos.
Los kbd decorativos no se leen como parte de la respuesta y se ocultan en pantallas estrechas
y punteros táctiles. Todos los textos reutilizan traducciones ES/EN/CA existentes.

## Auditoría visual y solución compartida

Se revisaron tres grupos antes de editar sus vistas:

- Inicio Aprender: LearningStartPanel, KanjiStartPanel y VocabularyStartPanel. Kana tenía
  tarjetas con iconos y resumen; los otros dos tenían botones planos y alturas/anchos distintos.
  Solo Vocabulario usaba el límite de foco compartido; Kanji carecía de nombre accesible de diálogo.
- Sesión: LearnPage, KanjiPlayPage y VocabularyPlayPage. Diferían ancho, cabecera, calificaciones,
  cierre y diálogos de salida/medallas. Vocabulario no exponía role/aria-modal en estos últimos.
- Referencia del catálogo: KanaWritingDialog nativo, KanjiAll y VocabularyAll. Se revisaron
  también las páginas de escritura y RUSH; sus herramientas/acciones propias se conservan.

Se comparten parciales SCSS pequeños para inicio, sesión/controles y referencia; no se crea
un contenedor Angular ni se reescriben contratos de componentes. Cabeceras, botones, radios,
bordes, sombras, progreso y espacios usan los tokens semánticos de cada tema. Los diálogos
tienen altura máxima y scroll interno; no se recortan lecturas, traducciones, ejemplos o trazos
para igualar alturas. Las respuestas disponen de una zona reservada para reducir saltos.

Se reutiliza ModalFocusDirective sin cambiar su contrato. Los fondos de sesión son inert
cuando un diálogo propio está abierto. El diálogo nativo Kana mantiene showModal y cancel,
y cierra su top layer antes de devolver el foco al botón de origen.

LearningStartPanel carga bajo demanda desde Home con @defer, como el lanzador RUSH existente,
para mantener el presupuesto inicial. Los servicios y el formato del progreso no cambian.
Las fichas conservan todos sus datos: guía/animación y romaji Kana, significados/lecturas/
ejemplos Kanji, y palabra/lectura/glosas/variantes/ejemplos disponibles de Vocabulario.

## Archivos de referencia y pruebas

- Código de teclado: src/app/shared/keyboard/study-shortcuts.ts; integración en las páginas
  Learn, escritura Kana, Kana RUSH y las dos páginas de autoevaluación existentes.
- Apariencia: src/app/shared/styles/_learning-{start,session,controls,reference}.scss.
- Regresiones: learn.page.spec.ts, study-shortcuts.spec.ts y e2e/learning-ux.spec.ts.
- Tests anteriores adaptados únicamente al cambio solicitado: Espacio sin revelar ya no se
  consume; el texto de una opción se comprueba separado de la pista decorativa aria-hidden.

Las capturas son fixtures sintéticos en .cache/ux1/before/ y after/, no datos de usuarios.
Cada fase contiene inicio, pregunta, respuesta y ficha para los tres módulos, tres idiomas,
dos temas y dos anchos (1280 y 320). No se confunde viewport móvil Chromium con un dispositivo.

Resultados comprobados el 27/10/2026:

| Comprobación | Resultado |
| --- | --- |
| Unitarios dirigidos, 10 archivos | 102/102 |
| Playwright de teclado, foco y flujos afectados, tres proyectos Chromium | 78/78 |
| Suite Angular completa, 204 archivos | 2111/2111 |
| TypeScript app y spec | Correcto, sin emitir archivos |
| Regresión del candidato Manga × Mazos | 3/3; ninguna solicitud cloud custom |
| Build normal GitHub Pages | Correcto; 723695 bytes iniciales |
| Build manga-candidate | Correcto; 724534 bytes iniciales |
| Presupuesto estricto | Ambos <750000; prueba de frontera acepta 749999 y rechaza 750000/750001 |
| Documentación y git diff --check | Correctos |

Los dos builds conservan únicamente los cuatro avisos SCSS preexistentes de Grammar.
Los últimos ajustes CSS eliminan declaraciones redundantes; no se amplía ningún presupuesto.
Se comprobaron 36 combinaciones visuales de sesión y otras 36 de referencia por fase:
144 capturas originales antes y 144 después. Las vistas recortadas al viewport de referencia
son copias para inspección; se conservan las capturas originales completas. Los 36 escenarios
finales de sesión comprueban contención del panel, foco, tres calificaciones y ausencia de
desbordamiento horizontal. Las capturas y logs quedan locales e ignorados en .cache/ux1/.

Ejemplos antes/después (evidencia local, sin añadir imágenes al repositorio):

- Kana: [antes](../../.cache/ux1/before/kana-es-dark-1280-start.png) y [después](../../.cache/ux1/after/kana-es-dark-1280-start.png).
- Kanji: [antes](../../.cache/ux1/before/kanji-es-dark-1280-start.png) y [después](../../.cache/ux1/after/kanji-es-dark-1280-start.png).
- Vocabulario: [antes](../../.cache/ux1/before/vocabulary-es-light-320-answer.png) y [después](../../.cache/ux1/after/vocabulary-es-light-320-answer.png).

La revisión de hashes contra los 1609 archivos originales confirma que no hay eliminaciones
ni cambios en core, datos, traducciones, Manga, gates, entradas de release, dependencias,
Supabase o workflow. HEAD permanece en cdb763a27c6c08580d0ea58f9b4ebc9dc9b79bb5;
el índice estaba vacío al cerrar la implementación. La preparación de publicación revisa y
prepara únicamente los archivos UX-1. La carga diferida conserva los límites del bundle inicial.

Durante la preparación se corrigieron dos expectativas de pruebas afectadas: las pistas
decorativas no forman parte del texto de respuesta, y Escape reconoce una medalla cada vez
cuando hay varias en cola. Se mantienen las aserciones de respuesta y avance, sin sleeps,
reintentos ni exclusiones. No quedan fallos conocidos de las validaciones ejecutadas.

Comandos desde la raíz (ejecutar suites/builds en serie):

~~~powershell
npm test -- --include=src/app/shared/keyboard/study-shortcuts.spec.ts --include=src/app/features/learn/learn.page.spec.ts --include=src/app/features/kanji-play/kanji-play.page.spec.ts --include=src/app/features/vocabulary-play/vocabulary-play.page.spec.ts --include=src/app/features/writing/kana-writing.page.spec.ts --include=src/app/shared/components/learning-writing-prompt/learning-writing-prompt.spec.ts --include=src/app/features/rush/rush-writing.spec.ts --include=src/app/shared/directives/modal-focus.directive.spec.ts --include=src/app/features/kanji-all/kanji-all.page.spec.ts --include=src/app/features/vocabulary-all/vocabulary-all.page.spec.ts
npx playwright test e2e/learning-ux.spec.ts e2e/ux-feedback.spec.ts e2e/rush-writing.spec.ts --output=.cache/ux1/playwright-output
npm test
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npm run build -- --base-href /kana-study/ --stats-json
npm run build:manga-candidate
node scripts/audit-repo-docs.mjs --links-only
git diff --check
~~~

La aceptación funcional de UX-1 ya está confirmada por el propietario. No se ha especificado
cobertura adicional con lectores de pantalla, Safari o dispositivos físicos. Playwright se ejecutó en Chromium; los ejecutables Firefox
y WebKit no están instalados y no se cuentan como validados. Las comprobaciones automatizadas no son una certificación
WCAG ni una prueba lingüística. El escenario de teclado completo utiliza autoevaluación;
la escritura a mano continúa necesitando un dispositivo apuntador. No se publica este cambio.
