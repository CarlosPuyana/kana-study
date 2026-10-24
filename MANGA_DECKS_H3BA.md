# Manga × Mazos — H3B-A: vocabulario confirmado por volumen

Fecha: 2026-10-23. Implementación experimental local, oculta con los cuatro gates desactivados. Se preserva el trabajo previo sin commit. No se despliega SQL, se habilita cloud, se inicia H3B-B ni se hace commit/push.

## Arquitectura y fuentes

Se revisaron DESIGN, H1, H2B-A, H3A, H4B-D2, lector Mokuro, catálogo, persistencia y FSRS reales. El estado inicial quedó registrado mediante hashes en `.cache/h3ba-baseline.json`. No se ejecutaron operaciones Git destructivas.

La biblioteca ofrece «Vocabulario confirmado» por volumen exclusivamente cuando ambos gates DI custom/assisted existentes están activos en desarrollo. La ruta `manga/vocabulary/:volumeId` tiene `canMatch` con ambos gates antes del `loadComponent`; la página comprueba los mismos gates. No se añade activación por URL, localStorage o preferencias. La ruta también queda documentada en el inventario de navegación existente.

`CustomDeckRepository.confirmedVocabularyInventory()` lee en una sola transacción readonly los mazos, tarjetas, recibos, entidades, vínculos, snapshots y eventos del workspace capturado. No llama a `permanentRegistry()` ni a su migración. La apertura puede crear el esquema de una base inexistente, como las APIs existentes; no crea registros de contenido, estudio o registro permanente.

`MangaVolumeVocabularyService` valida los recibos originales con `validateMangaConfirmedOperation`, su pertenencia/binding Guest al owner, entidad persistida, vínculo exacto de volumen y tarjeta actual. Excluye tarjetas sin confirmación demostrable y tarjetas que ya no están en el contenido. Un recibo histórico no resucita contenido borrado. El conteo es por `(deckId,cardId)`, nunca por escritura japonesa ni por número de recibos. Todos los contextos confirmados disponibles de una tarjeta permanecen consultables.

La página lazy `MangaVolumeVocabularyPage` permite búsqueda NFC sobre escritura, lectura, glosas actuales y fragmentos confirmados; filtros por estado; orden por primera página de origen o última confirmación. Los desempates usan deckId/cardId. Las fechas de confirmación se muestran en ISO UTC con `<time datetime>`, sin inventar fechas ausentes. El detalle nativo expandible conserva el fragmento y significado/idioma del recibo histórico, además de las glosas actuales de la tarjeta. No crea tarjetas ni utiliza propuestas OCR sin confirmar.

No se carga `LexicalKnowledgeProjectionService` ni el inventario builtin/diccionario para esta vista: se reutiliza directamente su contrato puro `classifyLexicalCard`, clasificando la tarjeta concreta. No hay una consulta cloud ni dependencia del SDK de sincronización en el nuevo servicio.

## Clasificación y resumen

Se conserva el criterio de H3A: conocida requiere Review, estabilidad finita ≥14 y snapshot/cabeza coherentes; Learning/Relearning/Review inferior son aprendiendo; ausencia de progreso e historial efectivo es pendiente; corrupción o evidencia contradictoria es indeterminada. El historial residual sin snapshot sigue el comportamiento existente de H3A y no inventa estabilidad.

Los eventos anulados o no canónicos no aportan progreso efectivo. El servicio no fusiona FSRS, consulta equivalencias textuales, ejecuta scheduler ni escribe snapshots. Dos tarjetas con la misma escritura e identidades diferentes conservan filas y estado independientes. No se atribuye conocimiento universal desde una entidad curated local ni certificación experta desde una confirmación manual.

El resumen cuenta exclusivamente tarjetas confirmadas disponibles: total y conocidas/aprendiendo/pendientes/indeterminadas, antes de filtrar. Con asociaciones o recibos incompletos se muestra una advertencia de lista no garantizada, sin presentar el subconjunto como inventario completo. No se usan estos recuentos como denominador de cobertura. No hay porcentajes de comprensión, frecuencia de obra, total léxico, estimaciones de palabras desconocidas o selección automática. Los contratos puros de cobertura H3A permanecen intactos. Japanese 1500 continúa sin mappings certificados reales.

## Corrección acotada encontrada en navegador

La primera ejecución de la nueva prueba Playwright reprodujo `Indeterminada` después de un repaso real. H3A exigía igualdad exacta entre `event.reviewedAt` (pulsación de calificación) y `progress.card.lastReview`/`event.fsrsLog.review` (preview al mostrar respuesta). El flujo real separa ambos instantes; las pruebas previas pasaban la misma fecha fija a preview y rate.

Se corrige únicamente la comparación en `lexical-knowledge.ts`: la cabeza se identifica por el evento efectivo más reciente, se coteja el snapshot con el timestamp original de su log FSRS y se exige que no sea posterior a la calificación. Se mantienen las comprobaciones de ambigüedad, before/after, reps, estabilidad y dificultad. No se cambia la programación, preview, puntuación, duración, persistencia ni historial. La regresión comprueba un desfase de 2500 ms, rechaza un log distinto y una calificación anterior al preview; otra prueba utiliza rate/undo reales con desfase explícito de 1500 ms. Playwright vuelve a verificar el flujo real sin alterar relojes.

## Asociación, aislamiento y refresco

- Se consulta `volumeId` y el vínculo persistido; títulos iguales no unen volúmenes. Una reimportación con otro ID comienza sin asociación automática.
- Borrar Manga no elimina mazos ni snapshots. Se conservan contexto y estudio desde Mazos; la consulta no requiere que exista el Manga original.
- Los mazos archivados se pueden consultar. No se ofrece un enlace de estudio que fallaría: el catálogo actual solo estudia mazos activos. No se implementa desarchivado ni se cambian sus reglas.
- La ausencia de tarjetas muestra un estado vacío; vínculos/confirmaciones inconsistentes muestran incompletitud o error de lectura, sin reparación automática. Los registros legacy sin asociación permanente requieren la política/migración existente, no una escritura al consultar.
- El servicio captura owner y activationRevision, comprobándolos después de cada await; detecta también A→B→A. La página descarta callbacks destruidos y recarga al cambiar ruta, workspace, dataRevision, catalogRevision o progressRevision, incluyendo estudio/undo y publicación V2. No se conserva un caché adicional ni estado persistente de filtros.
- La prueba de coordinador V2 confirma que los registros importados, con binding Guest y review/undo originales, son consultables en el workspace destino. Usa el puerto de protocolo controlado existente; no equivale a una prueba nueva de Supabase remoto.

## UX, accesibilidad y carga

Diseño con variables semánticas de tema, filas/tarjetas responsive, escritura japonesa destacada y lectura/glosa/idioma separados. Búsqueda/selects etiquetados, links semánticos, `<details>/<summary>` operables con teclado, foco visible, estado anunciado y controles de al menos 44 px. Fragmentos japoneses llevan `lang=ja`, glosas su idioma, y Angular escapa el texto. No se añade HTML de usuario.

Se inspeccionaron capturas de escritorio oscuro 1280 px, móvil claro 390 px y móvil oscuro 320 px. Las pruebas verifican ausencia de overflow horizontal. No se certifican Safari/iOS/Android físicos ni accesibilidad exhaustiva con lector de pantalla.

Build inicial: **739,44 kB**, frente a 734,35 kB del cierre anterior (+5,09 kB, principalmente copias i18n comunes y la integración mínima). No se aumentan presupuestos. La página y su servicio/modelo están en `chunk-CxEJT4ZR.js` (13 690 bytes), separado del arranque; su CSS lazy ocupa 1555 bytes. El chunk no está entre scripts/modulepreload iniciales. Playwright comprueba que la biblioteca oculta el enlace y que el deep link con parámetros no carga la página con gates desactivados. La lectura actual materializa los stores del workspace, como el repositorio existente: queda pendiente paginación para catálogos grandes, sin hacer ahora una refactorización del protocolo.

## Pruebas y resultados

| Validación | Resultado |
| --- | --- |
| Regresiones dirigidas: consulta, UI, H3A, repositorio, FSRS/Mazos y coordinador V2 | 112/112, 8 archivos |
| Suite Angular completa final | 1918/1918, 189 archivos; 16,79 s de runner |
| Playwright del flujo asistido y nueva consulta | 15/15, 45,6 s; Chromium escritorio oscuro 1280, móvil claro 390 y móvil oscuro 320 |
| TypeScript app/spec | Ambos --noEmit correctos, exit 0 |
| Build GitHub Pages | Correcto, 24,807 s; cuatro warnings SCSS conocidos de Grammar |
| git diff --check y whitespace de nuevos archivos | Correctos, sin errores |

Comandos ejecutados: `npm test` completo y con `--include` para los ocho archivos afectados; `npx playwright test e2e/manga-decks-assisted.spec.ts`; `npx tsc -p tsconfig.app.json --noEmit`; `npx tsc -p tsconfig.spec.json --noEmit`; `npm run build -- --base-href /kana-study/ --stats-json`; `git diff --check`.

Las pruebas del servicio utilizan IndexedDB aislado por test y confirmaciones reales del servicio asistido. Los umbrales exactos S13,999/S14, corrupción y archivado emplean snapshots/estados controlados; las pruebas de estudio/undo utilizan el motor y persistencia reales. El test de UI de carga lenta utiliza promesas controladas para verificar descarte por workspace. El coordinador V2 usa su puerto de contrato controlado. Playwright crea tarjetas mediante selección Mokuro, preview y confirmación reales, consulta sin POST ni cambios en contenido/journal, busca/filtra, abre contexto con teclado, estudia y comprueba el nuevo estado. Mantiene además los escenarios previos de dos tarjetas, undo, borrado del manga y Japanese 1500. No hay afirmación de Supabase real ni certificación lingüística.

Evidencia local: `.cache/h3ba-final-directed.log`, `.cache/h3ba-final-suite.log`, `.cache/h3ba-final-browser.log`, `.cache/h3ba-final-build.log`, `.cache/h3ba-scope.json` y capturas `.cache/h3ba-desktop-dark.png`, `.cache/h3ba-mobile-light.png`, `.cache/h3ba-narrow-dark.png`. No se versionan los artefactos de caché o dist.

La primera pasada dirigida fue 99/99. La primera ejecución de navegador reprodujo el defecto de timestamps (12 correctas/3 fallidas); una ejecución diagnóstica aislada confirmó `missing-or-ambiguous-head`. La primera suite posterior tuvo 1915 correctas/1 fallo por faltar la nueva ruta en `NAVIGATION_AUDIT`; se añadió su entrada manteniendo la aserción íntegra. También se corrigió una asignación readonly en un fixture de corrupción antes del cierre. No se omiten tests ni se amplían timeouts o presupuestos.

Una repetición dirigida detectó contextos en orden `[9,2]` en lugar de `[2,9]`: IndexedDB devolvía recibos por UUID, no por origen. Se ordena ahora la copia de contextos por página, fecha e ID, sin reescribir recibos. La prueba de varios estados comprueba además que un snapshot corrupto asociado a una tarjeta no contamina la clasificación de las otras; la corrupción sin asociación suficiente permanece conservadoramente indeterminada. El resumen se prueba antes del filtro y el orden por fecha utiliza fechas fijas.

No se repite PGlite, PostgreSQL multisesión ni HTTP/JWT H4B-D2 porque no cambia SQL, transporte, protocolo ni política cloud. No se atribuyen sus resultados anteriores a este hito. Todos los nuevos datos y recibos de pruebas son sintéticos/controlados; no se usan cuentas o materiales privados.

## Archivos

Nuevos:

- `src/app/core/services/manga-volume-vocabulary.ts`: contratos y filtros puros.
- `src/app/core/services/manga-volume-vocabulary.service.ts` y `.spec.ts`: lectura validada y pruebas.
- `src/app/features/manga/manga-volume-vocabulary.page.ts`, `.html`, `.scss` y `.spec.ts`: vista y tests.
- Este informe.

Existentes modificados:

- `custom-deck.repository.ts`: captura readonly, sin cambiar escrituras o sincronización.
- `lexical-knowledge.ts` y `.spec.ts`: corrección de comparación temporal y regresión.
- `custom-transfer-coordinator.spec.ts`: consulta de datos importados V2.
- `manga.page.ts`, `manga.routes.ts`, `navigation-audit.ts`: enlace oculto, ruta protegida y documentación de navegación.
- `e2e/manga-decks-assisted.spec.ts`: pruebas de consulta, teclado y gates, conservando las anteriores.
- `src/assets/i18n/es.json`, `en.json`, `ca.json` y `core.generated.ts`: 27 claves ES/EN/CA generadas con el compilador oficial.
- `MANGA_DECKS_DESIGN.md`: estado H3B-A.

El alcance se compara por SHA256 con el árbol recibido en `.cache/h3ba-scope.json`. No se modifican gates, migraciones, Sync/Outbox, Stats V2, Manga Saved FSRS, Japanese 1500, scheduler ni dependencias. Todos los demás cambios anteriores se preservan.

Balance final: 13 archivos existentes modificados, 8 nuevos y ninguno eliminado. **H3B-A completo técnicamente en el entorno local validado; continúa experimental y oculto.** La publicación mantiene todos los bloqueos previos.

## Limitaciones y plan concreto H3B-B

H3B-A ofrece la consulta local confirmada; no demuestra análisis integral ni comprensión. Una asociación ausente/corrupta no se deduce por título ni se repara automáticamente. Un Manga eliminado no recupera sus imágenes desde este panel. La fecha mostrada es la del recibo humano, no una fecha editorial supuesta. No se introducen mappings o equivalencias nuevas.

Antes de H3B-B se propone: acordar un alcance independiente; reunir evidencia lingüística revisada y materiales autorizados; definir qué asociaciones ambiguas pueden resolverse manualmente sin unión por título; diseñar contratos de resultados parciales/errores y paginación; validar las métricas sobre análisis realmente completo antes de cualquier porcentaje; y revisar UX/QA físico sin habilitar cloud. La evaluación humana independiente sigue pendiente. La futura preparación automática de hasta 20 palabras permanece bloqueada por esos requisitos, sin implementar atajos en esta fase. Supabase Auth real, retención/purga y demás bloqueos de publicación de H4B-D2 siguen vigentes. No se inicia H3B-B automáticamente.

Propuesta concreta de H3B-B para aprobación futura: un piloto de análisis léxico verificable, solo lectura. Primero reunir un corpus autorizado y anotación/revisión independiente con procedencia documentada; después versionar segmentación, identidades, ambigüedades y spans sin resolver, sin convertir propuestas en autoridad. Integrar paginación/cancelación y presentar evidencia parcial explícita antes de conectar las funciones puras de cobertura. Aceptación: resultados contrastados con esa anotación, ausencia de escrituras FSRS/tarjetas y de porcentajes globales sin análisis integral, y QA de workspaces/dispositivos. Si no existen corpus o revisor, documentar el bloqueo; no sustituirlos por ejemplos del agente. La resolución de reimportaciones exigiría otro alcance explícito y nunca inferencia por título.
