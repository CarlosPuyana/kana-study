# Vocabulario: lecciones diarias cortas de 10/15 palabras

Entrega local del 06/11/2026 sobre `d681be5`. Sin commit, push, despliegue, SQL ni datos personales. Conserva los commits de Mazos y el trabajo local previo de FSRS/RUSH.

## Recorrido y reglas

Vocabulario ofrece una lección breve; Mazos conserva su cola intensiva independiente. En **Vocabulario → Ajustes → Selección de aprendizaje → Palabras por lección** se elige 10 (predeterminado) o 15. Se conservan categorías, niveles y tipos de pregunta. El ajuste se guarda por workspace mediante la selección existente; cambiarlo afecta a la siguiente lección, nunca a una ya iniciada.

El límite cuenta `entryId` distintos, no direcciones ni respuestas:

| Disponibles | Tamaño | Selección |
|---|---:|---|
| 30 repasos y 100 nuevas | 10 | 7 repasos + 3 nuevas |
| 30 repasos y 100 nuevas | 15 | 10 repasos + 5 nuevas |
| 4 repasos y 100 nuevas | 10 | 4 repasos + 6 nuevas |
| 20 repasos y ninguna nueva | 10 | 10 repasos, si no hay direcciones adicionales elegibles |
| Ningún repaso y 100 nuevas | 10 | 10 nuevas |
| 2 repasos y 3 nuevas | 10/15 | 5 palabras, sin relleno |

Un repaso tiene memoria FSRS y `due` en un día anterior o en el día actual de **Europe/Madrid**, aunque su hora sea posterior. Se ordena por `due` ascendente y clave estable. Si una palabra tiene varias direcciones elegibles, solo entra la más antigua; las demás memorias permanecen intactas. Los límites del día se prueban también en ambos cambios de horario de Madrid.

Una palabra es realmente nueva si no existe progreso ni evento previo de ese `entryId`, incluidas direcciones desactivadas. Se escoge una dirección activa con orden estable, sin aleatoriedad. Las nuevas se intercalan proporcionalmente entre repasos; se conserva el orden relativo de estos. Por ejemplo, 7+3 produce R,R,R,N,R,R,N,R,R,N.

**Direcciones adicionales:** una dirección sin memoria de una palabra conocida tiene categoría propia; no se llama nueva ni repaso y no se inventa un `due`. Solo es candidata si esa palabra no tiene una dirección programada elegible. Puede ocupar plazas que quedarían vacías, hasta una en lecciones de 10 o dos en las de 15. Al agotarse las palabras realmente nuevas, se reserva una plaza no nueva para una dirección adicional, aun con atraso, para permitir su introducción progresiva. Nunca desplaza las plazas de palabras realmente nuevas. Tras responder obtiene su primera memoria FSRS real.

## Consolidación actual: dos aciertos consecutivos

Actualización del 07/11/2026: la composición fija se conserva, pero cada palabra necesita **dos aciertos consecutivos**. SÍ/acierto incrementa la racha; NO/CASI/error la reinicia. Solo la primera respuesta por dirección actualiza FSRS; las posteriores son intentos reales de práctica interna, sin nuevas valoraciones ni cambios de `due`.

Las pendientes se organizan en una cola circular FIFO estable y recuperable. Una palabra completada no vuelve a aparecer en esa lección. No hay un máximo de intentos que fuerce su finalización. Arquitectura, ejemplos, transición V1→V2 y resultados actuales en [consolidación de dos aciertos](VOCABULARY_TWO_SUCCESS_CONSOLIDATION.md).

El texto técnico «Cada respuesta actualiza FSRS…» desaparece de la sesión. Se muestran progreso x/N, resultados, conteos NO/CASI/SÍ, lista de palabras y acciones existentes.

## Persistencia, día y recuperación

La composición se guarda **antes de presentar la primera palabra** en `kana-study.vocabulary-daily-lessons.v1`, con versión, fecha Madrid, tamaño, categorías, ID/modo de sesión, unidades ordenadas, respuestas y tiempo confirmado. Es almacenamiento local por workspace. No se añade sincronización cloud de esta selección.

Cada valoración conserva el journal de intención existente y añade el recibo de la lección: progreso, evento FSRS, intento Stats pendiente y racha, cola y palabra completada se recuperan con IDs estables. Un fallo no recalcula FSRS ni duplica el intento. Los registros históricos no reconocidos se conservan. Una selección corrupta bloquea el inicio con error recuperable; no concede una cuota nueva silenciosamente.

Al recargar se restaura el mismo ID, modo y orden, omitiendo las palabras completadas y conservando las rachas y los siguientes turnos. Salir no descarta la lección. Cambiar tamaño/categorías/direcciones o hacer A→B→A no sustituye una selección iniciada ni aplica acciones asíncronas de otro workspace. El tiempo confirmado se restaura sin acreditar la ausencia; en opciones el feedback sigue contando hasta Continuar, con el límite existente de 10 segundos por aparición.

Solo hay una lección normal diaria. Un resumen histórico normal completado hoy también cierra el día. Si una lección queda incompleta al pasar medianoche, se termina primero esa misma selección; su día de selección y el día de finalización quedan cerrados. La siguiente selección estará disponible al día siguiente de finalizar. Este criterio evita abandonar/restablecer cuotas con cambios de fecha.

Daily Study permite reanudar pendientes y no reabre una lección completada por existir más tarjetas con `due` hoy. Una composición con todas las palabras completadas pero resumen pendiente puede finalizar de forma idempotente tras recargar.

## RUSH y estadísticas

Los resultados conservan **RUSH de toda la sesión** y **RUSH de difíciles**, deduplicados por palabra y limitados a palabras respondidas. NO/CASI mantienen la marca de dificultad; en opciones cuentan errores objetivos. Si no hay difíciles se muestra el estado vacío. Los tokens siguen siendo opacos, efímeros y vinculados al workspace. RUSH no modifica FSRS.

Se conservan eventos con fecha, dirección, calificación y snapshots antes/después; intentos Stats V2, conteos NO/CASI/SÍ, dificultad y resumen. No se recalculan registros antiguos ni se implementan estadísticas avanzadas.

## Arquitectura y archivos

- `src/app/core/models/vocabulary-lesson.model.ts`: contrato versionado de selección.
- `src/app/core/services/vocabulary-lesson.repository.ts`: validación y persistencia local estricta.
- `vocabulary-round-builder.ts`: selección pura, reparto, deduplicación y direcciones.
- `vocabulary-settings.service.ts`, `vocabulary-selection.ts`, `vocabulary-study.model.ts`: preferencia y resúmenes.
- `vocabulary-progress.service.ts`, `vocabulary-session.service.ts`, `vocabulary-review-store.ts`: recuperación, respuestas, cierre y reanudación.
- `card-study-time.ts` y `study-clock.ts`: restauración explícita del tiempo confirmado; comportamiento predeterminado de otros módulos intacto.
- `daily-study.model.ts`, `daily-study-planner.ts` y `daily-study-planner.service.ts`: lección cerrada/reanudable.
- Páginas y plantillas de selección, Vocabulario, panel inicial y sesión: controles, progreso y resultado, sin explicación técnica.
- `es.json`, `en.json`, `ca.json` y dominios generados: textos sincronizados; mensajes de estudio diferidos.
- Tests de builder, repositorio, ajustes, sesión, Daily Study, integración Stats/tiempo/lista; Playwright en `manual-tests/vocabulary-short-lessons` y actualización de `manual-tests/vocabulary-fsrs-rush`.

El árbol contiene también archivos previos de persistencia, Stats y RUSH del encargo anterior; se mantienen y se validan juntos. El motor FSRS, datos Japanese 1500, Mazos, SQL, gates y workflow no forman parte de esta modificación.

## Validación histórica del contrato V1 (06/11/2026)

Estos resultados corresponden a la fase de una respuesta por palabra. Las ejecuciones posteriores, con cobertura sustituida para dos aciertos, se registran en la guía de consolidación enlazada arriba.

Ejecución final del código el 06/11/2026, después de los cambios de persistencia, reloj y aislamiento:

- Angular completo: **2427/2427**, 234 archivos, `tests-verified.log`. Una ejecución previa de esta fase pasó 2425/2425 antes de añadir dos regresiones finales.
- TypeScript app/spec: ambos correctos, `ts-app-verified.log` y `ts-spec-verified.log`.
- Builds normal y candidato GitHub Pages: correctos con `/kana-study/`; `build-normal-verified.log` y `build-candidate-verified.log`.
- Inicial normal **747.061 bytes**, candidato **747.947 bytes**, ambos estrictamente menores de 750.000. Cinco avisos SCSS: cuatro históricos de Gramática y uno de Vocabulario (8.280 bytes frente a aviso de 8.000). No se elevan presupuestos.
- Playwright de lecciones cortas **12/12**, `playwright-verified.log`: 10/15, reparto, una aparición, día cerrado, recarga 4+6, siguiente día con nuevo tamaño, contenido insuficiente, tres idiomas, escritorio/390/320 px, claro/oscuro, radios con foco y ausencia de desbordamiento horizontal.
- Playwright FSRS/RUSH de sesión **15/15**, `rush-verified.log`: memoria antes/después, ámbito de palabras, errores recuperables, vacíos, tokens manipulados/recargados.
- Auditoría FSRS **67 transiciones correctas**, equivalencia, logs, serialización, UTC y DST Madrid; `srs-audit.log`.
- Auditoría de bundle/medios, gates y motores intactos: correcta, `bundle-audit.log`; Gramática, traducciones y publicación estática se verifican también en prebuild.
- ES/EN/CA: mismas claves y placeholders, dominios generados exactos, banner retirado; `i18n.log`.

Durante la última validación, cuatro tests nuevos de selección necesitaron declarar su propio `matchMedia` de navegador. Se añadió el doble local y su limpieza, sin modificar producción ni depender de otro archivo. Una ejecución dirigida encontró además un EPERM en el temporal del entorno de herramientas; se repitió con TEMP/TMP dentro de `.cache/vocabulary-short-lessons/tmp` y pasó. No se ocultan ni omiten tests.

Evidencias locales en `.cache/vocabulary-short-lessons/` (ignoradas por Git). Capturas `study-*`, `results-*`, `settings-*` para los tres perfiles. Revisadas visualmente la sesión a 320 px oscuro, los resultados de escritorio oscuro y móvil claro, y los ajustes a 320 px con foco. Las pruebas usan datos sintéticos y no acceden a cuentas reales.

- Regresión Playwright Mazos **33/33**, `deck-regression.log`: Todos/Por Tiempo, historial, cola dinámica, programación, resumen, undo y persistencia.
- Regresión Playwright atajos RUSH **33/33**, `rush-shortcuts-regression.log`: Kana, Kanji y las cuatro direcciones de Vocabulario; teclado, táctil y configuraciones vacías.
- Total Playwright de estas cuatro ejecuciones: **93/93**.
- Auditoría Manga candidato **3/3**, `manga-regression.log`: importación/diccionario, FSRS/undo, backup/reinicio y restricción de cuenta con SDK controlado. No valida Supabase Auth real. Los smoke adicionales Firefox/WebKit no se ejecutaron porque sus binarios no están instalados; no se cuentan como aprobados.
- `git diff --check` y comprobación de whitespace/conflictos en archivos sin seguimiento: correctos. No hay staging ni nuevos commits; HEAD sigue en `d681be57dcc09e2e6ecbe716c3dc6a38633642c0`.

Comandos principales reproducibles desde la raíz:

```powershell
npm test
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npm run build -- --base-href /kana-study/ --stats-json
npm run build:manga-candidate
npx playwright test --config playwright.vocabulary-short-lessons.config.ts
npx playwright test --config playwright.vocabulary-fsrs-rush.config.ts
npx playwright test --config playwright.deck-learning.config.ts
node scripts/audit-srs.mjs
node scripts/audit-kaishi-media.mjs
node scripts/audit-repo-docs.mjs --links-only
git diff --check
```

Para la regresión de atajos se reutiliza la configuración local ignorada `.cache/vocabulary-fsrs-rush/rush-edge.config.ts`, que solo cambia el canal de navegador a Edge y fija el directorio raíz. La auditoría Manga utiliza `node --import ./.cache/deck-daily-queue/edge-audit-loader.mjs scripts/audit-manga-candidate.mjs`, el adaptador Edge local existente. No se modifican configuraciones productivas ni dependencias. Los tests Angular se ejecutan con TEMP/TMP en el temporal local indicado para evitar el EPERM del entorno de herramientas.

Tests dirigidos finales: **212/212**, 21 archivos, `directed-verified.log`. Incluyen servicios de Vocabulario, selección, pantalla, RUSH de sesión, integración Stats, Daily Study, debilidades, tiempo y lista de sesión.

## Limitaciones

- La selección diaria es local al navegador/workspace; no establece una cuota global entre dispositivos.
- Se recuperan escrituras interrumpidas, pero no se incorpora exclusión mutua real entre pestañas. La concurrencia simultánea entre pestañas queda pendiente.
- La antigua cola dinámica no guardaba una composición reanudable: no se inventa una retroactivamente. Se conservan progreso, eventos y resúmenes.
- Safari y dispositivos físicos no se han probado. Playwright utiliza Edge/Chromium con perfiles aislados de prueba, no equivale a aceptación humana en esos navegadores.
- No se valida Supabase Auth/RLS remoto ni se publica nada.

## Inventario del árbol local entregado

Incluye los cambios conservados del encargo previo de Vocabulario/Stats/RUSH; no implica que todos se hayan creado en esta fase.

- `docs/features/srs/VOCABULARY_REVIEW_QUEUE_AUDIT.md`
- `docs/features/vocabulary/VOCABULARY_FSRS_RUSH_REDESIGN.md`
- `docs/features/vocabulary/VOCABULARY_SHORT_DAILY_LESSONS.md`
- `docs/features/vocabulary/VOCABULARY_STATS_AUDIT.md`
- `manual-tests/vocabulary-fsrs-rush/vocabulary-fsrs-rush.spec.ts`
- `manual-tests/vocabulary-short-lessons/vocabulary-short-lessons.spec.ts`
- `playwright.vocabulary-fsrs-rush.config.ts`
- `playwright.vocabulary-short-lessons.config.ts`
- `src/app/core/models/vocabulary-lesson.model.ts`
- `src/app/core/services/vocabulary-lesson.repository.spec.ts`
- `src/app/core/services/vocabulary-lesson.repository.ts`
- `src/app/core/services/vocabulary-review-queue-audit.spec.ts`
- `src/app/core/services/vocabulary-review-store.ts`
- `src/app/core/services/vocabulary-session-rush.spec.ts`
- `src/app/core/services/vocabulary-session-rush.ts`
- `src/app/features/rush/vocabulary-session-rush.page.spec.ts`
- `src/app/features/vocabulary-selection/vocabulary-lesson-settings.spec.ts`
- `docs/INDEX.md`
- `docs/features/srs/01-ARQUITECTURA-FSRS.md`
- `docs/features/srs/02-VOCABULARIO-VS-MAZOS.md`
- `scripts/compile-i18n.mjs`
- `src/app/core/models/daily-study.model.ts`
- `src/app/core/models/learning-session.model.ts`
- `src/app/core/models/vocabulary-study.model.ts`
- `src/app/core/services/attempt-integration.spec.ts`
- `src/app/core/services/attempt-recording.service.ts`
- `src/app/core/services/card-study-time.ts`
- `src/app/core/services/daily-study-planner.service.spec.ts`
- `src/app/core/services/daily-study-planner.service.ts`
- `src/app/core/services/daily-study-planner.ts`
- `src/app/core/services/learn-weakness-integration.spec.ts`
- `src/app/core/services/rush-session.service.spec.ts`
- `src/app/core/services/rush-session.service.ts`
- `src/app/core/services/study-clock.ts`
- `src/app/core/services/study-time-flows.spec.ts`
- `src/app/core/services/vocabulary-progress.service.ts`
- `src/app/core/services/vocabulary-round-builder.spec.ts`
- `src/app/core/services/vocabulary-round-builder.ts`
- `src/app/core/services/vocabulary-selection.ts`
- `src/app/core/services/vocabulary-session.service.spec.ts`
- `src/app/core/services/vocabulary-session.service.ts`
- `src/app/core/services/vocabulary-settings.service.ts`
- `src/app/features/rush/vocabulary-rush.page.html`
- `src/app/features/rush/vocabulary-rush.page.ts`
- `src/app/features/vocabulary-play/vocabulary-play.page.html`
- `src/app/features/vocabulary-play/vocabulary-play.page.scss`
- `src/app/features/vocabulary-play/vocabulary-play.page.spec.ts`
- `src/app/features/vocabulary-play/vocabulary-play.page.ts`
- `src/app/features/vocabulary-selection/vocabulary-selection.page.html`
- `src/app/features/vocabulary-selection/vocabulary-selection.page.scss`
- `src/app/features/vocabulary-selection/vocabulary-selection.page.ts`
- `src/app/features/vocabulary/components/vocabulary-start-panel/vocabulary-start-panel.html`
- `src/app/features/vocabulary/components/vocabulary-start-panel/vocabulary-start-panel.ts`
- `src/app/features/vocabulary/vocabulary.page.html`
- `src/app/features/vocabulary/vocabulary.page.ts`
- `src/app/shared/components/learning-session-list/learning-session-list.spec.ts`
- `src/assets/i18n/ca.json`
- `src/assets/i18n/core.generated.ts`
- `src/assets/i18n/deck-study.generated.ts`
- `src/assets/i18n/en.json`
- `src/assets/i18n/es.json`
