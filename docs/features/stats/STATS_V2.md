# Stats V2 — historial local de intentos reales

## Arquitectura

`AttemptEvent` es un contrato de versión 1 en `core/models/attempt-event.model.ts`. `AttemptRecordingService` abre un contexto efímero al iniciar una sesión y emite en el punto donde se confirma una calificación válida. Es independiente de `WeaknessService`, FSRS, Daily Study, puntuaciones y selección de preguntas. Dibujar, mostrar respuestas, abrir opciones/diccionarios, navegar o consultar Stats/Daily Study no emite eventos.

`AttemptEventRepository` persiste en IndexedDB. `attempt-analytics.ts` reduce los registros a métricas puras. `HistoricalStats` consulta al entrar, cambiar filtros/workspace o confirmarse una inserción. Protege las cargas asíncronas con una generación: los resultados anteriores no pueden restaurar datos de otro workspace. `AttemptHistoryChart` proporciona SVG ligero y una tabla accesible con todos los valores. No se añaden dependencias ni peticiones de red.

## Contrato y semántica

| Campo | Significado |
| --- | --- |
| `version` | `1`; versiones desconocidas se descartan al leer |
| `id` | Inmutable; contexto de sesión + módulo + actividad + ordinal de la acción |
| `occurredAt` | Instante real, UTC canónico con milisegundos, antes del guardado asíncrono |
| `module` | `kana`, `kanji`, `vocabulary`, `grammar` |
| `activity` | `learn`, `writing`, `listening` |
| `itemId` | Identidad real del contenido; en Grammar, ID del ejercicio concreto |
| `questionType` | Dirección real o clase de ejercicio cuando existe |
| `sessionId` | ID de la sesión existente; contexto UUID para prácticas sin ID persistido |
| `firstAttempt` | Primera calificación del elemento/dirección dentro del contexto; no significa primera vez en toda la vida. Las repeticiones conocidas y los repasos de errores Grammar son `false`. Puede omitirse si es desconocido |
| `result.source = objective` | `correct: true/false`, comprobación automática real |
| `result.source = self` | `rating: again/hard/good`, autoevaluación explícita |

**Hard nunca se convierte en correcto ni incorrecto en Stats V2.** La escritura manual no tiene OCR: sus botones son autoevaluación Again/Good. No se inventa Hard cuando la actividad no lo ofrece. No se registran textos de respuestas, trazos, audio, tokens, glosas ni payloads de sincronización.

Validación: IDs hasta 512 caracteres, itemId hasta 2048, sessionId hasta 256 y questionType hasta 128; cadenas no vacías, fecha UTC válida, módulos/actividades/versiones conocidos y resultado discriminado. Al persistir se proyectan solo los campos definidos, evitando payloads extra y conservando un tamaño acotado. Se ignoran registros corruptos y no se transforman versiones desconocidas en intentos nuevos.

## Almacenamiento y workspaces

Base `kana-study-attempts-v1`, versión 1, store `events`, clave primaria `[workspace,id]`. Índices compuestos:

- `[workspace,occurredAt]`.
- `[workspace,module,occurredAt]`.
- `[workspace,activity,occurredAt]`.
- `[workspace,module,activity,occurredAt]`.

Se usa la identidad exacta del workspace dentro de las claves, sin la normalización de nombres de bases que podría hacer colisionar identificadores. Cada sesión captura su propietario al iniciarse; una escritura tardía no se atribuye a la cuenta activada después. Guest y cuentas consultan rangos diferentes de los mismos índices.

Se inspeccionaron `WorkspaceService` y `WorkspaceMigrationService` antes de añadir el almacenamiento. El historial nuevo no entra en claves localStorage, outbox ni SQL. La importación explícita Guest → cuenta se integra en el flujo existente como unión idempotente por ID, en páginas de hasta 100 eventos, manteniendo Guest y cualquier evento previo de la cuenta. No se importa automáticamente al cambiar de cuenta. Si la copia falla se comunica al flujo de importación existente; no se marca una importación incompleta como finalizada. Repetirla no duplica registros ya copiados.

Las inserciones repetidas/concurrentes no sobrescriben un ID existente. La unión conserva la identidad y fecha originales; la primera escritura de ese ID permanece inmutable. Las consultas recorren cursores indexados y reducen al agregado: no se usa `getAll()` ni se almacena el historial completo en memoria. Cada conexión se cierra en `finally` y ante `versionchange`; una apertura bloqueada comunica error y cierra una conexión que termine abriéndose tarde.

El aprendizaje no espera al guardado de estadísticas. Si falla se muestra un aviso recuperable en Stats y se retienen hasta 100 intentos pendientes en memoria, con su ID, instante y workspace originales. El botón de reintento no genera nuevas acciones. Si se cierra/recarga antes de que termine el guardado, o si se pierden esos pendientes en memoria, esos intentos pueden faltar en el historial: nunca se reconstruyen desde contadores. Guest importado conserva su copia persistida incluso ante un fallo.

## Cobertura real

| Módulo/actividad | Punto de confirmación | Resultado |
| --- | --- | --- |
| Kana Aprender/repasos compatibles | `LearningSessionService.registerAttempt` | Quick: objetivo; evaluación manual: Again/Hard/Good |
| Kanji Aprender/repasos compatibles | `KanjiSessionService.register` | Quick: objetivo; evaluación manual: Again/Hard/Good |
| Vocabulary Aprender/repasos compatibles | `VocabularySessionService.register` | Quick: objetivo; evaluación manual: Again/Hard/Good |
| Kana Escritura | Botón de calificación, después de revelar | Autoevaluación Again/Good |
| Kanji Escritura | Botón de calificación, después de revelar | Autoevaluación Again/Good |
| Vocabulary Escritura | Palabra terminada y calificación después de revelar | Autoevaluación Again/Good |
| Vocabulary Listening | Confirmación original en Continuar, con reproducción válida | Objetivo; se excluyen fallos de audio y palabras omitidas |
| Grammar lecciones | `GrammarPage.answer`, guardado contra duplicados | Objetivo, ID exacto del ejercicio |
| Grammar prácticas/integración/repaso de errores | `GrammarPracticeSession.answer`, solo pregunta no comprobada | Objetivo; revisión de errores marcada como repetición |

Los lienzos de APRENDER pertenecen a la actividad `learn`; dibujar en ellos no emite un intento de escritura adicional. El estudio individual de trazos sin botones de calificación tampoco emite eventos. Grammar no ofrece una actividad independiente de escritura/listening, y Kana/Kanji no tienen listening equivalente en estos flujos.

Se revisaron las fuentes de RUSH, Anki y Manga:

- RUSH solo revela/avanza: no existe una evaluación equivalente fiable; no se emiten aciertos ni autoevaluaciones.
- Anki (`DeckStudyService.rate`, `DeckDatabaseService.commitReview`) conserva `DeckReviewEvent` y su FSRS propio, incluido undo. No se duplican esos eventos como Kana/Vocabulary.
- Manga V3 (`MangaReviewSessionService`) conserva eventos de repaso objetivos/manuales en su historial específico; Manga V4 (`MangaFsrsSessionService`) conserva sus calificaciones/historial FSRS independientes. Su identidad de contenido no se introduce artificialmente entre los cuatro módulos de este contrato. Una incorporación futura requerirá un contrato/adaptador explícito.

## Fórmulas, fechas y muestras

- Intentos: número de eventos válidos confirmados y persistidos del rango/filtros.
- Respuestas objetivas: número de eventos con `source = objective`.
- Precisión objetiva: `100 × correctos objetivos / respuestas objetivas`. Denominador cero → **sin datos**, no 0 %.
- Fallos objetivos: `objetivos − correctos`.
- Autoevaluación: conteos separados de Again, Hard y Good; no alimentan precisión objetiva.
- Repeticiones: eventos con `firstAttempt === false`; lo desconocido no se considera repetición.
- Tendencias de módulo/habilidad: mismas métricas y diferencia ponderada por intentos, no media de porcentajes diarios.
- Evolución semanal: bloques consecutivos de hasta 7 días del periodo seleccionado; el último bloque puede ser parcial y se identifica como tal mediante el rótulo de la sección.

Los periodos de gráficos son 7, 30 o 90 días de calendario, incluido hoy, con agrupación **Europe/Madrid** y límite superior en el instante de consulta. Se rellenan días sin actividad con cero intentos, manteniendo precisión desconocida y rompiendo la línea en esos huecos. No se usan 24 horas UTC para determinar el inicio de un día madrileño; las regresiones cubren cambios de día y días de 23/25 horas.

Para comparar periodos equivalentes se excluye hoy, todavía incompleto: últimos N días completos frente a los N días completos inmediatamente anteriores. Se consultan hasta 2N días previos mediante el índice; solo el periodo visible alimenta los gráficos/métricas principales. La interfaz muestra las dos muestras y explica esa diferencia de rangos.

Umbral inicial: **10 respuestas objetivas en cada periodo**, también por categoría comparada. Sin esas muestras, diferencia y recomendaciones comparativas son neutrales. Mejora/caída requiere al menos 5 puntos porcentuales; estabilidad es una diferencia menor. La recomendación de dificultad recurrente requiere precisión inferior al 70 % en ambos periodos con muestra suficiente. Una habilidad se recomienda para refuerzo solo si tiene muestras suficientes en ambos periodos y está al menos 10 puntos por debajo de otra habilidad comparable en ambos.

Estos umbrales son heurísticos, no pruebas de significación estadística. Los porcentajes agregados pueden cambiar al variar la mezcla de contenidos/módulos; no se afirma causalidad ni dominio del idioma. Se incluyen tamaños de muestra y filtros para revisar esa composición. No se afirma mejora sostenida a largo plazo a partir de dos periodos.

## Compatibilidad y sincronización

El resumen principal de racha, sesiones, tiempo y dificultades activas mantiene sus fuentes existentes. Stats V1 permanece visible bajo **Históricos acumulados**, con aviso de que sus porcentajes antiguos combinan resultados y Hard no se consideraba fallo. No es precisión objetiva y no alimenta gráficos ni comparaciones V2.

No se hace backfill a partir de Weakness, contadores, sesiones o revisiones antiguas. No se modifican el algoritmo/calendario FSRS, las puntuaciones de debilidades, las sesiones históricas, Daily Study, medallas, RUSH, Anki, Manga ni los relojes.

**AttemptEvent todavía no se sincroniza entre dispositivos.** No hay SQL nuevo, llamadas Supabase nuevas, fake sync ni operaciones de outbox. Los IDs inmutables y la unión idempotente permiten incorporar después sincronización real por unión de eventos con el correspondiente contrato remoto y pruebas de aislamiento.

## Accesibilidad y presentación

Angular standalone, SCSS semántico, traducciones ES/EN/CA, cinco temas existentes. Filtros nativos con labels, focus visible, gráficos SVG etiquetados y alternativas tabulares con encabezados y scroll horizontal local. Los estados de carga, vacío y error son explícitos y el error admite reintento. La página mantiene `/stats`. Las métricas se recalculan al consultar los datos, no en cada renderizado.

## Stats V2.1

- Sincronización remota real por unión de eventos, con retención y resolución explícita de conflictos.
- Notificación entre pestañas y actualización del cambio de día mientras Stats permanece abierto; actualmente se actualiza al abrir/cambiar filtros/recibir escrituras de la instancia.
- Historial pendiente duradero ante cierre/quota, exportación y política de conservación para volúmenes muy grandes.
- Adaptadores explícitos para historiales independientes Anki/Manga si se amplía el contrato.
- Intervalos de incertidumbre, composición comparable y más periodos para evaluar tendencias sostenidas.
- Pruebas físicas en Safari iOS/Android y lápiz/tablet; la automatización Chromium no sustituye dispositivos físicos.

Sin commit ni push.


## Archivos de implementación

- Modelo: `src/app/core/models/attempt-event.model.ts`.
- Persistencia/registro/analítica: `src/app/core/services/attempt-event.repository.ts`, `attempt-recording.service.ts`, `attempt-analytics.ts`.
- Integración local de importación: `core/services/workspace-migration.service.ts`.
- Calificaciones: `learning-session.service.ts`, `kanji-session.service.ts`, `vocabulary-session.service.ts`; páginas Kana/Kanji/Vocabulary Writing y Vocabulary Listening; `GrammarPage` y `GrammarPracticeSession`.
- UI: `features/stats/stats.page.ts/.html`, `historical-stats.ts/.html/.scss`; `shared/components/attempt-history-chart/`.
- Traducciones: `src/assets/i18n/es.json`, `en.json`, `ca.json` y `core.generated.ts` regenerado.
- Tests nuevos: repositorio, analítica, integración, lecciones Grammar y vista histórica; `e2e/stats-v2.spec.ts`.
- Mock existente ajustado: `manga-saved-sync.spec.ts` incluye ahora `IDBKeyRange` junto a la factoría de IndexedDB. El nuevo índice de importación lo necesita; no se cambian expectativas ni producción Manga/sync.
- Este documento.

## Validación

Las pruebas nuevas cubren registros corruptos, UTC, límites/caracteres escapados, idempotencia simultánea, recreación del repositorio, combinación de filtros, aislamiento sin colisiones de nombres, importación paginada de más de 100 eventos, recuperación de importaciones fallidas, errores/reintentos sin duplicar ni cambiar la fecha, cuenta capturada al empezar, calificaciones reales, repeticiones, Guardado/FSRS separado, navegación/revelados sin eventos, fechas Madrid/DST, huecos de precisión y muestras mínimas.

Playwright usa datos sintéticos controlados solo como fixtures de tests; producción nunca rellena datos históricos ficticios. El test de workspaces accede al servicio real mediante el componente Angular de desarrollo, sin añadir endpoints o accesos de test a producción ni simular autenticación remota. El flujo de escritura usa botones y ratón reales y consulta después Stats para comprobar persistencia.

Se revisaron capturas de escritorio claro y móvil 320 px Nora; la automatización recorre ES/EN/CA, dark/light/nora/nora-dark/anime, escritorio/390/320 y tablet 768 px. Las capturas y logs están en `test-results/` y `.cache/`, ignorados por Git.


### Resultados finales

| Comprobación | Resultado |
| --- | --- |
| Tests dirigidos de modelo/repositorio/analítica/integración/Grammar/UI/V1 | 42 pasan antes de las dos regresiones finales de importación; ambas regresiones adicionales pasan en la suite completa |
| Importación AttemptEvent + Manga Saved Sync tras completar el mock | 48 tests pasan |
| `npm test` final | **171 archivos, 1694 tests pasan** |
| `npx tsc -p tsconfig.app.json --noEmit` | Correcto |
| `npx tsc -p tsconfig.spec.json --noEmit` | Correcto |
| `npm run build -- --base-href /kana-study/` | Correcto; cuatro warnings SCSS de Grammar ya conocidos |
| Playwright Stats V2 + RUSH writing + UX Feedback | **48 casos pasan**, 15 de Stats V2 y 33 regresiones anteriores |
| `git diff --check` | Correcto |

El fallo encontrado durante la validación final de la importación era `IDBKeyRange` ausente en el mock de Manga Saved Sync. Al hacer que una importación incompleta comunique su error en vez de silenciarlo, ese mock quedó expuesto; se completa únicamente su entorno IndexedDB. No se modifican tests para omitir fallos, calificaciones, tiempos, SQL, workflow ni lógica de sincronización.
