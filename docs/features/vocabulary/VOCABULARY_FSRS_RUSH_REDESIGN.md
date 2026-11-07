# Vocabulario: FSRS diario y RUSH de sesión

> Actualización local 06/11/2026: la política diaria de Vocabulario queda sustituida por [lecciones cortas de 10/15 palabras](VOCABULARY_SHORT_DAILY_LESSONS.md). El contenido siguiente conserva el diagnóstico y los resultados de su fase; no describe la cola normal vigente.

Entrega local de 06/11/2026 sobre `d681be5`. Conserva los commits de Mazos `7f899be`
y `d681be5`. Sin commit, push, despliegue, SQL ni acceso a datos personales.
Sustituye la política de la [auditoría de cola](../srs/VOCABULARY_REVIEW_QUEUE_AUDIT.md)
y actualiza la base de la [propuesta de estadísticas](VOCABULARY_STATS_AUDIT.md).
No implementa todavía ese rediseño de estadísticas.

## Qué se elimina

Antes había una ronda cerrada de hasta diez unidades; solo la primera respuesta por
unidad actualizaba FSRS. NO/CASI reinsertaban tras dos/cuatro posiciones, los siguientes
intentos eran práctica y la cuarta aparición podía resolver la unidad sin acertar.
Una vuelta completada bloqueaba otra ronda normal del día.

En **Aprender normal** desaparecen los gaps por posiciones, el máximo de cuatro,
las respuestas sin actualización FSRS y el cierre por primera vuelta/primer SÍ.
La práctica voluntaria compatible conserva sus reglas anteriores sin programar memoria;
esos límites de práctica no se aplican a Aprender. RUSH conserva su motor y mecánica.

## Cada respuesta y su identidad

NO → Again=1; CASI → Hard=2; SÍ → Good=3. En opciones, error → Again y acierto → Good.
Cada acción normal calcula una transición real desde el snapshot actualizado y crea
un evento before/after. La segunda y tercera apariciones no usan una excepción de práctica.
Continuar, revelar, consultar resultados, recargar y reintentar no califican otra vez.

La memoria sigue siendo `vocab:<entryId>:<questionType>`: japonés→significado,
significado→japonés, japonés→lectura y lectura→japonés son independientes. Se conservan
las restricciones de lectura existentes, las selecciones N5/categorías/direcciones,
los IDs y los datos del catálogo. Desactivar contenido no borra sus registros.
No se cambian SpacedRepetitionService, pesos, fórmulas o parámetros del motor.

## Cola diaria y separación

`VocabularyProgressService.buildRound` usa `buildVocabularyRound` sobre la selección activa:

1. Todas las programadas con fecha Europe/Madrid de hoy o anterior, incluso horas posteriores.
2. Orden por timestamp completo, con key estable como desempate; sin prioridad por estado.
3. Nuevas seleccionadas dentro del presupuesto, después de programadas; conservan barajado
   y preferencia de palabras distintas. No se copia mixed/order/configuración de Mazos.
4. Tras cada respuesta: guardar FSRS/evento, reconstruir, retirar las de mañana u otro
   día futuro, reordenar y aplicar separación. No se adelanta cambiando due.

Una tarjeta programada para hoy puede aparecer antes de su hora; no hay espera ni umbral
de veinte minutos. Si SÍ todavía produce Learning de hoy, continúa pendiente.

La separación permite hasta dos identidades FSRS distintas antes de repetir: dos
alternativas→dos; una→una; ninguna→inmediata. Se reconstruye desde eventos reales
del día, también al reanudar. Si hay restricciones incompatibles, se desbloquea una
candidata real según el orden de respuestas, sin bucle artificial.
Entre candidatas admisibles se prefiere otra palabra si existe, sin fusionar direcciones.
La lista final conserva el orden real de primera presentación aunque cambie la cola.

## Nuevas, cambio de día y finalización

- **Diez introducciones por día Madrid, por tarjeta/dirección**, sin nuevo ajuste configurable.
  Diez deja de ser el tope de repasos. Una palabra en dos direcciones consume dos unidades.
- El consumo une keys con evento inicial before=null de hoy y snapshots con firstSeenAt
  de hoy. Incluye progreso deshabilitado y no suma dos veces. Así, un historial antiguo
  incompleto no reinicia la cuota; no se inventan eventos para completarlo.
- La sesión conserva sus nuevas seleccionadas mientras siga el mismo día. Reconstruir
  no elige otras nuevas indefinidamente; los repasos elegibles no tienen límite de diez.
- Un resumen histórico completado hoy conserva cerradas las introducciones. Nunca
  bloquea Learning/Review/Relearning pendientes. Cambiar selección o reabrir no concede cuota extra.
- Al salir/recargar se reconstruye desde datos guardados, sin obligación de restaurar la
  UI antigua. Las nuevas sin responder pueden volver a seleccionarse dentro del presupuesto restante.
- Al cambiar de fecha se recalculan cuota y candidatas del nuevo día. Una sesión que
  cruza medianoche mantiene su ID; eventos y resumen usan sus instantes reales.
- Termina cuando no quedan programadas elegibles ni nuevas seleccionadas pendientes.
  El resumen cuenta unidades realmente respondidas y se escribe estrictamente por sessionId.
  Un fallo mantiene el estado de finalización para reintentar, sin otro evento FSRS.

Portada, panel de inicio y Daily Study distinguen introducciones cerradas de pendientes.
Daily Study recibe las keys elegibles y el cierre efectivo de Vocabulario; no se cambia
la elegibilidad de Kana/Kanji/Mazos. DailyLearningService conserva su lectura histórica
genérica; Vocabulario añade `completedToday`, que comprueba también trabajo pendiente.

## Persistencia recuperable y Stats V2

`VocabularyReviewStore` conserva las claves canónicas existentes de progreso/eventos.
Antes de escribir prepara un recibo estable, snapshot, evento y AttemptEvent en
`kana-study.vocabulary-review-intent.v1`, local al workspace. Guarda estrictamente
pendientes Stats, progreso y eventos; retira la intención y publica el estado confirmado.

Un fallo se muestra con Reintentar. Se conservan rating, fecha, selección objetiva e ID
originales. La recuperación completa las escrituras al reintentar/inicializar sin volver
a invocar FSRS. Un estado incompatible se rechaza, sin éxito ficticio ni sobreescritura
a ciegas. Si falla antes de guardar la intención, no se guarda la respuesta.

Las filas históricas válidas se conservan. Incluso filas no reconocidas del contenedor
de eventos permanecen intactas al anexar; los lectores siguen validando. Un registro de
tarjeta inválido/conflictivo bloquea la recuperación en vez de reemplazarse silenciosamente.
Los refuerzos antiguos no se convierten en eventos FSRS nuevos.

Cada acción normal prepara **un** AttemptEvent versión 1, con source=self y rating, u
objective y correct real. firstAttempt conserva su significado dentro del contexto,
no de primera vez en la vida. No pasa además por la grabación efímera de prácticas.
Los intentos se guardan en `kana-study.vocabulary-attempt-pending.v1` hasta confirmar
la inserción IndexedDB. El repositorio existente deduplica por workspace/ID; una
confirmación perdida se puede repetir sin otro FSRS. El botón de reintento de Stats V2
también drena estos pendientes. Práctica y demás actividades conservan su mecanismo.

La sesión y los handoffs capturan owner y epoch, incluyendo A→B→A. Las confirmaciones
tardías usan el propietario original. Las claves canónicas conservan sincronización
legacy; las intenciones y pendientes son locales, sin nuevos contratos SQL/cloud.
Esta recuperación no pretende ser una transacción remota multi-tabla.

## Los dos RUSH del resultado

«Práctica adicional» ofrece, en ES/EN/CA:

- **RUSH: toda la sesión**: palabras efectivamente presentadas y respondidas.
- **RUSH: palabras difíciles**: al menos un NO o CASI en esa sesión; SÍ posterior no
  borra la dificultad. En opciones cuentan los errores objetivos, sin inventar Hard.

Se deduplica por entryId, sin usar el contador global de debilidades. Cada palabra usa
una dirección auténtica respondida; el RUSH difícil utiliza una dirección que presentó
dificultad. No hay palabras ajenas ni contenido duplicado del catálogo. Sin difíciles
se muestra un estado vacío y no se ofrece un botón sin contenido.

`VocabularySessionRush` conserva un único conjunto acotado en memoria, con owner/epoch.
La URL lleva solo un token opaco de un uso. Token cambiado, obsoleto, recargado o de otra
cuenta → Vocabulario, **sin sustitución por un pool aleatorio**.
El RUSH normal mantiene categorías/direcciones y sus preferencias no se sobrescriben.

Se reutilizan RushSessionService/RushEngine y Mostrar respuesta → Siguiente. Al volver
se conserva el resultado en memoria; repetir ese RUSH mantiene el conjunto concreto.
Recargar pierde handoff/resultado de UI, no memoria FSRS. Un guard evita iniciar durante
un cambio de cuenta y una generación impide publicar un Next/inicio viejo tras clear.
No se cambian puntuación, umbrales de tiempo, medallas o ciclos. RUSH no llama a FSRS.

## Datos para las siguientes estadísticas

Se distinguen palabras, tarjetas/direcciones y respuestas. Los items nuevos conservan
conteos NO/CASI/SÍ y needsPractice mientras vive el resultado. Cada respuesta normal
tiene evento FSRS, snapshot before/after, sesión y fechas; el progreso conserva due actual.
CompletedSessionSummary mantiene su contrato, sin nueva serie de estadísticas avanzada.
Los resultados antiguos conservan sus campos, huecos y semántica. No se normaliza
retrospectivamente totalFailures: antes, Hard de refuerzo podía incrementarlo sin evento.

## Ejemplo reproducible con el motor real

Tarjeta nueva, UTC `2026-11-06T11:00:00.000Z`, mismo instante para tres respuestas sin
alternativas; resultados de ts-fsrs existente, contrastados con SpacedRepetitionService:

| Respuesta | Rating | reps | Estado | Due UTC | S | D |
| --- | --- | --- | --- | --- | --- | --- |
| NO | 1 | 1 | Learning | 11:01:00 | 0.212 | 6.4133 |
| CASI | 2 | 2 | Learning | 11:06:00 | 0.212 | 7.60420977 |
| SÍ | 3 | 3 | Learning | 11:10:00 | 0.24668919 | 7.59183393 |

Tres eventos de la misma dirección, cada before igual al after anterior. Continúa hoy:
no se fuerza graduación por SÍ. Evidencia: `.cache/vocabulary-fsrs-rush/real-fsrs-example.json`.

El navegador usa tres palabras reales del catálogo en un perfil efímero, programadas
a 11:00/12:00/18:00 UTC; las demás son futuras. NO en primera → otras dos → CASI → SÍ:
cinco eventos y dos RUSH (tres palabras/toda la sesión; una difícil), con progreso y
eventos FSRS idénticos antes/después de RUSH. No se usan datos del propietario.

## Archivos y validación

- Servicios Vocabulario: progress/session/round-builder; nuevos review-store y session-rush.
- SessionItem: contadores opcionales; DailyNormalSnapshot: keys elegibles.
- Daily Study: adaptación exclusiva de la lectura de Vocabulario.
- AttemptRecordingService: reintento de pendientes duraderos; RushSessionService: guardas.
- Portada/panel de inicio, Aprender/resultados y página RUSH de Vocabulario.
- ES/EN/CA, compilador y copia lazy; tests unitarios/integración/Playwright, guías e índice.

Resultados sobre la fuente final, cuyo inventario SHA-256 se compara después de validar:

| Comprobación | Resultado |
| --- | --- |
| Dirigidos Angular, 11 archivos | 108/108 |
| Suite Angular completa, 232 archivos | 2404/2404 |
| TypeScript app/spec, ambos con --noEmit | Correctos |
| Build normal /kana-study/ | Correcto; inicial 747020 bytes |
| Build candidato /kana-study/ y auditor de bundle | Correcto; inicial 747906 bytes, estrictamente <750000 |
| Playwright Vocabulario FSRS/RUSH | 15/15, ES oscuro / EN claro / CA oscuro, 1280/390/320px |
| Playwright Mazos (historial/resumen/Por Tiempo/cola) | 33/33 |
| Playwright atajos RUSH Kana/Kanji/Vocabulario | 33/33, incluyendo toque y Nora estrecho |
| Auditoría Manga candidato | 3/3, SDK con HTTP controlado, sin Auth remoto real |
| Auditoría SRS | 67 transiciones correctas, ts-fsrs 5.4.2 / FSRS-6.0 |
| Auditoría multimedia/ambos grafos | Correcta; medios fuera del inicial |
| Paridad ES/EN/CA, placeholders y generados core/estudio | Correcta |
| Enlaces documentales / whitespace | Correctos |

Los builds solo muestran los cuatro warnings SCSS conocidos de Grammar. Tamaño total
de despliegue normal/candidato, incluyendo medios: 150153027 / 150152772 bytes.
Se comprueba que los motores, datos Japanese 1500, lógica de Mazos, gates, release,
workflows y SQL no tienen cambios respecto a HEAD. HEAD permanece en `d681be5`.

Playwright utiliza Edge instalado; no se descargan navegadores. Para los atajos se
usa una configuración ignorada que selecciona ese canal y el cwd del servidor,
sin modificar la configuración compartida ni reducir su cobertura. Un primer intento
de ese wrapper no arrancó por resolver scripts desde .cache; se corrigió el cwd.
No se presentan ejecutables Firefox/WebKit ausentes como pruebas superadas.

Evidencias y hashes locales: `.cache/vocabulary-fsrs-rush/`. Capturas inspeccionadas:
`results-desktop-es-dark.png`, `results-mobile-en-light.png`, `results-narrow-ca-dark.png`.
Sin desbordamiento horizontal; acciones semánticas con foco/Enter y tamaños táctiles,
lista original y controles existentes. No se afirma certificación WCAG global.

Una prueba grande de backup excedió cinco segundos con Edge en paralelo; su aislado
pasó 28/28 y la suite sin ese trabajo concurrente pasó 2403/2403. No se cambió timeout
ni Mazos. El primer browser pasó 13/15: dos móviles quedaron tapados por una medalla
RUSH; la prueba se adapta para cerrarla por su botón existente, sin force-click,
sleeps ni reintentos de configuración. No se presenta esa ejecución como verde.

## Limitaciones

No se promete UI restaurada al recargar, resultados históricos enriquecidos ni backfill.
Progreso/eventos e intentos tienen confirmaciones distintas. Los pendientes locales
no crean sincronización entre dispositivos ni un nuevo backup de intenciones incompletas.
Se rechazan conflictos detectables; no se añade serialización global de varias pestañas
escribiendo simultáneamente en localStorage.
Safari, dispositivos físicos, Auth/RLS remoto y concurrencia real entre navegadores
no se presentan como validados. Gates, Grammar restringida, Japanese 1500, Manga Saved
FSRS y motores de programación no cambian. Estadísticas avanzadas quedan para otro encargo.

## Inventario exacto para revisión

Incluye los informes locales previos conservados y actualizados; no incluye cachés, capturas ni builds.

- [docs/INDEX.md](../../INDEX.md)
- [docs/features/srs/01-ARQUITECTURA-FSRS.md](../srs/01-ARQUITECTURA-FSRS.md)
- [docs/features/srs/02-VOCABULARIO-VS-MAZOS.md](../srs/02-VOCABULARIO-VS-MAZOS.md)
- [docs/features/srs/VOCABULARY_REVIEW_QUEUE_AUDIT.md](../srs/VOCABULARY_REVIEW_QUEUE_AUDIT.md)
- [docs/features/vocabulary/VOCABULARY_FSRS_RUSH_REDESIGN.md](VOCABULARY_FSRS_RUSH_REDESIGN.md)
- [docs/features/vocabulary/VOCABULARY_STATS_AUDIT.md](VOCABULARY_STATS_AUDIT.md)
- [manual-tests/vocabulary-fsrs-rush/vocabulary-fsrs-rush.spec.ts](../../../manual-tests/vocabulary-fsrs-rush/vocabulary-fsrs-rush.spec.ts)
- [playwright.vocabulary-fsrs-rush.config.ts](../../../playwright.vocabulary-fsrs-rush.config.ts)
- [scripts/compile-i18n.mjs](../../../scripts/compile-i18n.mjs)
- [src/app/core/models/daily-study.model.ts](../../../src/app/core/models/daily-study.model.ts)
- [src/app/core/models/learning-session.model.ts](../../../src/app/core/models/learning-session.model.ts)
- [src/app/core/services/attempt-integration.spec.ts](../../../src/app/core/services/attempt-integration.spec.ts)
- [src/app/core/services/attempt-recording.service.ts](../../../src/app/core/services/attempt-recording.service.ts)
- [src/app/core/services/daily-study-planner.service.spec.ts](../../../src/app/core/services/daily-study-planner.service.spec.ts)
- [src/app/core/services/daily-study-planner.service.ts](../../../src/app/core/services/daily-study-planner.service.ts)
- [src/app/core/services/daily-study-planner.ts](../../../src/app/core/services/daily-study-planner.ts)
- [src/app/core/services/learn-weakness-integration.spec.ts](../../../src/app/core/services/learn-weakness-integration.spec.ts)
- [src/app/core/services/rush-session.service.spec.ts](../../../src/app/core/services/rush-session.service.spec.ts)
- [src/app/core/services/rush-session.service.ts](../../../src/app/core/services/rush-session.service.ts)
- [src/app/core/services/study-time-flows.spec.ts](../../../src/app/core/services/study-time-flows.spec.ts)
- [src/app/core/services/vocabulary-progress.service.ts](../../../src/app/core/services/vocabulary-progress.service.ts)
- [src/app/core/services/vocabulary-review-queue-audit.spec.ts](../../../src/app/core/services/vocabulary-review-queue-audit.spec.ts)
- [src/app/core/services/vocabulary-review-store.ts](../../../src/app/core/services/vocabulary-review-store.ts)
- [src/app/core/services/vocabulary-round-builder.ts](../../../src/app/core/services/vocabulary-round-builder.ts)
- [src/app/core/services/vocabulary-session-rush.spec.ts](../../../src/app/core/services/vocabulary-session-rush.spec.ts)
- [src/app/core/services/vocabulary-session-rush.ts](../../../src/app/core/services/vocabulary-session-rush.ts)
- [src/app/core/services/vocabulary-session.service.spec.ts](../../../src/app/core/services/vocabulary-session.service.spec.ts)
- [src/app/core/services/vocabulary-session.service.ts](../../../src/app/core/services/vocabulary-session.service.ts)
- [src/app/features/rush/vocabulary-rush.page.html](../../../src/app/features/rush/vocabulary-rush.page.html)
- [src/app/features/rush/vocabulary-rush.page.ts](../../../src/app/features/rush/vocabulary-rush.page.ts)
- [src/app/features/rush/vocabulary-session-rush.page.spec.ts](../../../src/app/features/rush/vocabulary-session-rush.page.spec.ts)
- [src/app/features/vocabulary-play/vocabulary-play.page.html](../../../src/app/features/vocabulary-play/vocabulary-play.page.html)
- [src/app/features/vocabulary-play/vocabulary-play.page.scss](../../../src/app/features/vocabulary-play/vocabulary-play.page.scss)
- [src/app/features/vocabulary-play/vocabulary-play.page.spec.ts](../../../src/app/features/vocabulary-play/vocabulary-play.page.spec.ts)
- [src/app/features/vocabulary-play/vocabulary-play.page.ts](../../../src/app/features/vocabulary-play/vocabulary-play.page.ts)
- [src/app/features/vocabulary/components/vocabulary-start-panel/vocabulary-start-panel.html](../../../src/app/features/vocabulary/components/vocabulary-start-panel/vocabulary-start-panel.html)
- [src/app/features/vocabulary/components/vocabulary-start-panel/vocabulary-start-panel.ts](../../../src/app/features/vocabulary/components/vocabulary-start-panel/vocabulary-start-panel.ts)
- [src/app/features/vocabulary/vocabulary.page.html](../../../src/app/features/vocabulary/vocabulary.page.html)
- [src/app/features/vocabulary/vocabulary.page.ts](../../../src/app/features/vocabulary/vocabulary.page.ts)
- [src/app/shared/components/learning-session-list/learning-session-list.spec.ts](../../../src/app/shared/components/learning-session-list/learning-session-list.spec.ts)
- [src/assets/i18n/ca.json](../../../src/assets/i18n/ca.json)
- [src/assets/i18n/core.generated.ts](../../../src/assets/i18n/core.generated.ts)
- [src/assets/i18n/deck-study.generated.ts](../../../src/assets/i18n/deck-study.generated.ts)
- [src/assets/i18n/en.json](../../../src/assets/i18n/en.json)
- [src/assets/i18n/es.json](../../../src/assets/i18n/es.json)
