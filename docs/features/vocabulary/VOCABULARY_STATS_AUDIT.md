# Vocabulario: auditoría y propuesta de estadísticas

> Actualización local 06/11/2026: la política diaria de Vocabulario queda sustituida por [lecciones cortas de 10/15 palabras](VOCABULARY_SHORT_DAILY_LESSONS.md). El contenido siguiente conserva el diagnóstico y los resultados de su fase; no describe la cola normal vigente.

Actualización posterior autorizada: [FSRS diario y RUSH de sesión](VOCABULARY_FSRS_RUSH_REDESIGN.md). Este informe conserva la auditoría anterior; Aprender normal ya sustituye el refuerzo sin FSRS y la ronda cerrada. El roadmap visual sigue pendiente.

Auditoría local de 06/11/2026 sobre `d681be5`, después de cerrar Mazos en Git.
**Propuesta para revisión; no se implementan estadísticas ni se cambia la cola o FSRS.**
No se consultan historiales personales, Supabase ni datos de producción.

Referencias: [cola de Vocabulario](../srs/VOCABULARY_REVIEW_QUEUE_AUDIT.md),
[arquitectura SRS](../srs/01-ARQUITECTURA-FSRS.md),
[comparación histórica](../srs/02-VOCABULARIO-VS-MAZOS.md),
[Stats V2](../stats/STATS_V2.md), [resumen/Por Tiempo de Mazos](../decks/DECK_TIME_AND_LEARNING_SUMMARY.md),
[historial de Mazos](../decks/DECK_CARD_HISTORY.md) y
[cola vigente de Mazos](../decks/DECK_DYNAMIC_DAILY_QUEUE.md).
La comparación SRS antigua describe Learning y adelanto de Mazos anteriores a la cola dinámica;
no se traslada esa política histórica a esta propuesta.

## 1. Cierre Git anterior a esta investigación

Rama `main`; remoto configurado `origin`, CarlosPuyana/kana-study. Base anterior `7cba37d`.
Puyi, Por Tiempo, resumen e historial ya estaban registrados; no se vuelven a implementar.

| Commit local | Alcance |
| --- | --- |
| `7f899be` — feat(decks): implement dynamic daily FSRS queue and mixed checkpoints | 23 archivos: elegibilidad diaria/cronología, nuevas por order, separación, checkpoint, recarga/Undo y sus pruebas; copia de cola ES/EN/CA y documentación |
| `d681be5` — fix(decks): improve settings persistence, validation and accessibility | 20 archivos: guardado fiable, límites compartidos, formulario, cupo de hoy, contraste/foco, traducciones, pruebas UI y documentación |

La continuidad mixed y la selección comparten `DeckStudyService`, sus snapshots y
la prueba de Deshacer/repetir: se incluyen juntas. Formulario, errores accesibles,
traducciones y pruebas se mantienen en el segundo commit para no fragmentarlos artificialmente.
Los generados i18n se separan de acuerdo con sus JSON en cada commit, sin tocar el árbol de trabajo.
`01-ARQUITECTURA-FSRS.md` comparte un aviso de nueva política de Mazos y un enlace a
la auditoría previa de Vocabulario: solo el aviso se registra en el primero.
La adaptación del auditor multimedia protege los motores FSRS y admite la nueva cola;
el auditor Manga prueba Ajustes custom y corrige la ubicación del aviso de almacenamiento.

Se revisa el índice antes de ambos commits, whitespace y ausencia de extras/credenciales
detectables; no se incluyen `.cache`, logs, capturas, builds ni archivos privados.
Los SHA-256 de los 39 archivos locales iniciales coinciden después de prepararlos y
versionarlos. No hay modificaciones de SQL, gates, workflows o motores FSRS.
No se ejecuta fetch/push, despliegue ni migración; no se afirma estado remoto actualizado.

Pendientes previos preservados fuera de los commits:

- `docs/features/srs/VOCABULARY_REVIEW_QUEUE_AUDIT.md`.
- `src/app/core/services/vocabulary-review-queue-audit.spec.ts`.
- El enlace a esa auditoría en `docs/features/srs/01-ARQUITECTURA-FSRS.md`.

Esta auditoría y su enlace en `docs/INDEX.md` quedan también como cambios locales para revisión.

## 2. Funcionamiento actual de Vocabulario

Fuentes inspeccionadas directamente, además de sus pruebas:

| Responsabilidad | Fuente |
| --- | --- |
| Ronda, botones y cierre | [VocabularySessionService](../../../src/app/core/services/vocabulary-session.service.ts), [builder](../../../src/app/core/services/vocabulary-round-builder.ts), [página/resultado](../../../src/app/features/vocabulary-play/vocabulary-play.page.html) |
| Progreso/eventos y estadísticas de portada | [VocabularyProgressService](../../../src/app/core/services/vocabulary-progress.service.ts), [contrato](../../../src/app/core/models/vocabulary-study.model.ts), [validación](../../../src/app/core/services/study-progress-validation.ts) |
| Programación y bloqueo diario | [SpacedRepetitionService](../../../src/app/core/services/spaced-repetition.service.ts), [DailyLearningService](../../../src/app/core/services/daily-learning.service.ts), [SessionHistoryService](../../../src/app/core/services/session-history.service.ts) |
| Intentos, asincronía y gráficos actuales | [grabación](../../../src/app/core/services/attempt-recording.service.ts), [repositorio](../../../src/app/core/services/attempt-event.repository.ts), [analítica](../../../src/app/core/services/attempt-analytics.ts), [HistoricalStats](../../../src/app/features/stats/historical-stats.ts) |
| Mazos: proyecciones y renderers | [resumen/agrupación](../../../src/app/core/services/deck-learning-presentation.ts), [proyección histórica](../../../src/app/core/services/deck-card-history.ts), [componente de historial](../../../src/app/shared/components/deck-card-history/deck-card-history.ts), [resumen visual](../../../src/app/shared/components/deck-learning-summary/deck-learning-summary.ts) |

### Identidad y construcción

La memoria pertenece a `vocab:<entryId>:<questionType>`; palabra y tarjeta no son sinónimos.
Hay cuatro direcciones: japonés→significado, significado→japonés, japonés→lectura y
lectura→japonés. Las direcciones de lectura se excluyen cuando escritura y lectura
normalizadas coinciden. Selección: N5, categorías y direcciones habilitadas; desactivar
una selección no borra su progreso. El catálogo y los homógrafos conservan sus IDs.

`VocabularyProgressService.buildRound` → `buildVocabularyRound`: hasta diez unidades,
vencidas por due ISO ≤ ahora, después nuevas sin registro, barajadas. Se intenta
evitar dos direcciones de la misma palabra; se difieren hasta necesitar relleno.
No se rellena con tarjetas futuras. La cola se copia a memoria al comenzar y no
se reconstruye con todo el catálogo después de cada respuesta.

### Respuestas, refuerzo y programación

| Flujo | Respuesta | Registros y efecto |
| --- | --- | --- |
| Autoevaluación normal | NO/Again=1, CASI/Hard=2, SÍ/Good=3, tras revelar | Primera respuesta por unidad: snapshot FSRS y VocabularyReviewEvent before/after; cada respuesta: AttemptEvent self y debilidad |
| Opciones normales | Opción correcta/incorrecta → Good/Again | Primera respuesta: FSRS/evento; cada selección válida: AttemptEvent objective; Continuar avanza, no añade otro intento |
| Refuerzo de la misma unidad | Again/Hard se reinsertan tras 2/4 posiciones, acotadas por final de cola | No recalcula FSRS ni genera VocabularyReviewEvent; sí AttemptEvent y contadores de práctica |
| Práctica libre compatible | Los mismos botones/modos | AttemptEvent/debilidad, sin programación ni evento FSRS, sin resumen completado normal ni cierre diario |
| Escritura / Listening | Escritura autoevaluada; Listening objetivo tras reproducción y confirmación | AttemptEvent con actividad propia; no mezclar con learn ni con historial FSRS |
| RUSH | Mostrar respuesta → Siguiente | Historial/tiempo RUSH propio; no inventar acierto, rating o AttemptEvent equivalente |

Máximo cuatro apariciones por unidad en una ronda: se puede marcar `resolved` por
llegar al máximo sin haber acertado. `needsPractice` queda marcado si alguna respuesta
no fue Good, aunque luego se acierte. No es una prueba de error final ni de dominio.
Solo la primera respuesta de cada unidad de la ronda normal programa memoria, incluso
si una repetición interna sucede antes o después de due. El botón Hard es recuerdo
difícil; Stats V2 no lo convierte en acierto ni error objetivo.

Motor: `SpacedRepetitionService` usa `ts-fsrs` y serializa due/lastReview ISO,
S, D, estado, reps, lapses, elapsedDays, scheduledDays y learningSteps. No se propone
ejecutar el scheduler para consultar estadísticas ni recalcular sus intervalos.

### Sesión, fecha, cuota y finalización

`VocabularyLearningSession` mantiene ID, fechas, modo, unidades, intentos y SessionItem
con apariciones, intentos, initialRating, resolved y needsPractice. El servicio y la
cola no persisten; `VocabularyPlayPage` los limpia al destruirse. No hay Undo de respuestas.
Recargar no restaura esa sesión ni su resumen, aunque los eventos ya guardados sobrevivan.

Al completar una ronda normal se guarda `CompletedSessionSummary`: ID/fecha, modo,
número de unidades, primeros Good, intentos, needsPracticeCount, segundos activos,
direcciones y conjuntos de palabras/categorías. Se deduplica por sessionId.
No guarda el resultado de cada unidad, su condición nueva/repaso inicial, el orden
de respuestas ni la fecha de inicio. Una salida anticipada no genera ese resumen.

Una ronda normal completada bloquea otra del módulo durante ese día Europe/Madrid.
No existe aquí el ajuste 10 nuevas/día de Mazos: diez es el tamaño máximo de ronda,
incluidos repasos, y el bloqueo es por ronda completada. Una tarjeta puede estar
vencida por timestamp y seguir inaccesible desde otra ronda normal hoy. Las estadísticas
deben mostrar ambas condiciones por separado; no ampliar el cupo ni cambiar ese contrato.

### Estadísticas que ya existen

- Portada: unidades activas nuevas, pendientes, Review y due; porcentaje redondeado
  `100 × unidades Review / unidades activas`. La etiqueta «memorizado» no acredita dominio.
- Resultado: unidades de ronda, porcentaje inicial Good, intentos totales, tiempo,
  unidades que necesitan práctica, próxima ronda y lista de palabras presentadas.
  La lista deduplica por entryId, no representa todas las tarjetas/direcciones.
- Todos: detalle de palabra y estado por dirección, sin cronología individual.
- Perfil: palabras únicas con progreso, sesiones/tiempo/revisiones agregados de módulos;
  no es un conteo de tarjetas por dirección ni de todas las respuestas.
- Stats V2: filtros módulo/actividad, intentos, precisión objetiva, Again/Hard/Good
  separados, repeticiones conocidas y gráficos/tendencias de 7/30/90 días Madrid.
- Debilidades: acumulados y puntuación heurística por actividad/entrada/dirección,
  no un historial de cada respuesta.

## 3. Inventario y calidad de los datos

| Fuente | Ubicación real | Alcance / límites |
| --- | --- | --- |
| Progreso por dirección | localStorage workspace, `kana-study.vocabulary-progress.v1` | Snapshot actual + primera/última fecha, totalAttempts, totalFirstTrySuccesses, totalFailures, lastRating. Incluye refuerzos normales; no una serie temporal |
| Eventos FSRS | localStorage workspace, `kana-study.vocabulary-review-events.v1` | ID, sesión, entryId/dirección, rating, fecha y fsrsBefore/fsrsAfter; solo valoraciones efectivas, sin duración ni tipo objetivo/self |
| Intentos reales Stats V2 | IndexedDB `kana-study-attempts-v1`, events `[workspace,id]` | Fecha UTC, módulo, actividad, entrada, dirección, sesión, firstAttempt y resultado objetivo/self. Incluye refuerzos y prácticas compatibles; sin FSRS ni indicador practice |
| Ronda viva | signal de VocabularySessionService | Contadores e initialRating por unidad; desaparece al salir/recargar. No conserva todos los ratings sucesivos en RAM |
| Sesiones completadas | `kana-study.completed-sessions.v1` | Resumen agregado normal; no incluye la práctica ni sesiones interrumpidas, ni correspondencia palabra→direcciones contestadas |
| Debilidades | `kana-study.weaknesses.v1` local | Score y acumulados, último intento; no recuperar una historia desde aquí |

El historial de intentos se guarda asíncronamente, sin transacción común con FSRS o resumen.
`AttemptRecordingService.settle()` permite esperar las escrituras en curso; no garantiza
que hayan tenido éxito. Hay `writeError` y reintento con IDs originales; hasta 100 fallos
se conservan solo en memoria. Tras cerrar pueden faltar intentos. No rellenarlos con
eventos FSRS: estos carecen de procedencia objective/self y excluirían los refuerzos.
No unir ambas fuentes por cercanía de timestamps: no comparten un ID de valoración.
En una ronda normal completada, su resumen puede aportar el modo por `sessionId`;
esa asociación explícita no añade la procedencia a eventos de sesiones sin resumen
ni permite inventar intentos ausentes. Para consultar una sesión, el repositorio
actual filtra por workspace/módulo/actividad/fecha y después por sessionId en el
cursor: no tiene índice por sesión o palabra. La ronda viva conserva startedAt;
un resumen antiguo no, por lo que su consulta completa puede ser más costosa.

`recordReview` guarda progreso/eventos en dos escrituras localStorage no estrictas.
Un fallo puede dejar estado en memoria distinto del persistido o una historia parcial.
Documentar/mostrar datos disponibles y errores; no declarar corrupción observada en un
usuario. Es un riesgo de durabilidad existente, ajeno a esta auditoría, sin corrección aquí.

Los contadores tampoco equivalen a ratings históricos: `totalFailures` suma Again en
la primera respuesta, pero suma no-Good en refuerzos; `totalFirstTrySuccesses` solo
los Good iniciales. No derivar Hard = totalAttempts − aciertos − errores. `lastRating`
es la última valoración FSRS; `lastSeenAt` puede venir de un refuerzo posterior.

Los eventos antiguos pueden faltar, estar filtrados por validación o proceder de otro
navegador. No hay garantía de cobertura desde el primer uso. FSRS/localStorage usa la
sincronización legacy existente; AttemptEvent es local y su importación Guest→cuenta
es explícita/idempotente, sin cloud/outbox SQL propio. No prometer igualdad histórica
entre dispositivos ni cobertura de backups fuera de su contrato actual.
El historial FSRS se lee como un array localStorage completo y se reescribe al
añadir eventos: paginar su presentación no pagina esa lectura ni acota su crecimiento.
Medir volúmenes grandes antes de prometer rendimiento de historiales extensos;
una futura indexación o retención de datos requeriría otra decisión, nunca borrado automático aquí.

## 4. Métricas recomendadas y viabilidad

En las tablas, «sin migración» significa cálculo de lectura sobre lo ya registrado,
no una garantía de que toda la historia del usuario esté disponible. Separar el
conjunto activo actual de todo el historial registrado; indicar alcance, fecha y denominador.

### A. Resumen de una sesión

| Métrica / definición | Datos necesarios y disponibilidad | Exactitud / persistencia |
| --- | --- | --- |
| Palabras únicas presentadas | SessionItem.appearances > 0 unido a units, distinct entryId | Exacta mientras vive la sesión; sin migración. Histórico de intentos solo donde exista cobertura |
| Tarjetas únicas respondidas | items.attempts > 0, distinct studyKey; históricamente `(entryId,questionType)` de intentos con sessionId | Exacta sobre registros; palabra puede aportar varias direcciones. Sin migración |
| Respuestas totales / refuerzos | session.attempts; AttemptEvents de sesión y firstAttempt=false | No confundir con número de eventos FSRS. Tras settle, contar solo eventos disponibles y anunciar error/falta; sin migración |
| Aciertos/errores y precisión | Quick: objective.correct / objective.total; errores=total−correct | Exactos sobre intentos objetivos. Cero denominador → sin datos; no incluir Hard/self. Sin migración |
| Autoevaluación | Conteos Again/Hard/Good en intentos self de sesión | No llamarlos corrección objetiva. Good inicial / unidades iniciales puede mantener el indicador existente como autoevaluación; sin migración |
| Inicial frente a refuerzo | initialRating y attempt.firstAttempt, este último dentro del contexto | No significa nueva en su vida. Desconocido no se fuerza a false; sin migración |
| Nuevas frente a repasadas al comenzar | Primer evento FSRS de cada key/sessionId: fsrsBefore=null frente a snapshot previo | Exacto para unidades con evento normal disponible; no clasificar usando el snapshot actual. En práctica no hay evento: requerir futura captura efímera inicial para clasificar, o mostrar no disponible |
| Palabras que reforzar | items.needsPractice, attempts y directions; ordenar por no-Good registrados, separando Again/Hard | Exacta en sesión; mantener el aviso de cuatro apariciones. No afirmar «no aprendidas». Ranking histórico de intentos condicionado a cobertura |
| Próximas fechas de las estudiadas | Progreso actual por key de unidades respondidas, due/estado | Exacto como programación actual, no promesa de volver ni simulación. Un refuerzo acertado no mueve due. Sin migración |
| Duración | Reloj de estudio activo y durationSeconds del resumen normal | Duración total acreditada, no por palabra/respuesta. No obtenerla de diferencias de timestamps. Sin migración |

Reabrir cualquier resumen antiguo con todos sus detalles no es equivalente al resultado
vivo: faltan datos por unidad y algunos intentos. Fase A propone enriquecer el resultado
actual; persistir resultados nuevos completos requeriría un contrato futuro explícito.
Los resúmenes históricos conservarían sus límites, sin backfill inventado.

### B. Estadísticas generales

| Métrica / definición | Datos / horizonte | Exactitud, cambios y migración |
| --- | --- | --- |
| Vocabulario estudiado | distinct entryId con progreso; aparte tarjetas/key con progreso | Conteo actual exacto de registros válidos. Selección activa vs todo guardado explícitos; sin migración |
| Nuevas pendientes | Unidades activas sin registro; desglosar estado New importado si existe | No son todas introducibles hoy. El builder solo considera nuevas sin registro; no ocultar esa diferencia con stats.state=new. Sin migración |
| Repasos pendientes ahora | Unidades activas programadas con due ≤ now, separadas del cierre diario | Exacto al instante de consulta. Reloj/refresh explícito al entrar/foco/día; no reusar un computed cuya dependencia no avanza con el tiempo. Sin migración |
| Estados FSRS | Recuento New/Learning/Review/Relearning por dirección y conjunto activo | Snapshot actual exacto; «en Review», no «dominadas». Sin migración |
| Cobertura en Review | Review / unidades activas ×100; aparte palabras con alguna dirección en Review | Porcentaje de estados, no probabilidad de dominar palabras; definir direcciones y denominador, sin migración |
| Previsión 7 días y hoy | due guardado actual, buckets de calendario Madrid, vencidas/hoy posterior/1–7/más tarde | Conteo exacto del snapshot, estimación de carga futura: cada respuesta puede reprogramar. Incluye futuras hoy sin cambiar elegibilidad. Sin migración |
| Evolución de respuestas | AttemptEvent vocabulary/learn, agrupado por día y source | 7/30/90 días y comparaciones Stats V2; exacto sobre historial disponible, sin migración. Opcional filtrar firstAttempt=true para reducir efecto de refuerzo |
| Evolución de estados | fsrsAfter por key al cierre de cada día con sus eventos previos | Parcial: no conocer el estado de unidades anteriores a la cobertura ni la selección histórica. No mostrar curva completa con snapshots actuales; más compleja, posponer |
| Recuperabilidad estimada | S y lastReview actuales, instante de cálculo y configuración verificable | Estimación del motor, no observación de aciertos ni dominio. Opcional posterior; sin inventar el valor cuando faltan parámetros/fecha. Ningún cambio de FSRS |

«Total activo», «respondidas alguna vez» y «palabras» merecen etiquetas distintas.
No promediar porcentajes diarios para la precisión global: sumar correctos/objetivos.
Los días vacíos no significan 0% de acierto; solo cero respuestas registradas.

### C. Historial por palabra y dirección

| Dato | Fuente y disponibilidad | Exactitud / cambios |
| --- | --- | --- |
| Fecha y rating de repaso | VocabularyReviewEvent reviewedAt/rating, filtrado key y deduplicado id | Historial FSRS real Again/Hard/Good. No contiene todos los refuerzos; sin migración |
| Intervalo nominal anterior/nuevo | fsrsBefore?.scheduledDays, fsrsAfter.scheduledDays | Valores guardados; pasos cortos pueden tener scheduledDays=0. Before=null significa nueva, no un intervalo anterior inventado |
| Espera nueva al responder | Date(fsrsAfter.due) − Date(reviewedAt), si válida/no negativa | Duración derivada exacta, distinta del nominal. El intervalo anterior se puede derivar de before.due−before.lastReview si ambas fechas existen, no de reviewedAt−due anterior |
| Próxima fecha, estado, S, D | Snapshots before/after y snapshot actual | Exactos donde constan. Separar programación resultante histórica de programación actual; sin migración |
| Gráfico de intervalos | Solo filas con espera derivable y rating válido, incluidas Hard | Barras cronológicas con escala explícita y tabla equivalente; huecos sin datos, sin interpolación FSRS. Sin migración |
| Práctica/refuerzos | AttemptEvent de la dirección, actividad learn, source y firstAttempt | Otra sección y otra semántica. No mostrarles un nuevo due/S/D ni emparejarlos artificialmente con FSRS. Local, cobertura parcial |

Orden: reviewedAt, contador fsrsBefore.reps disponible e ID como desempate estable;
este último no acredita orden temporal entre eventos distintos del mismo milisegundo.
Avisar historia parcial si reps supera filas verificables o faltan snapshots/fechas.
No recomputar una memoria antigua con pesos actuales ni atribuir versión histórica
del motor, fuzz, duración o parámetro de retención que no se guardó.

## 5. Comparación y reutilización real de Mazos

| Elemento existente | Uso actual | Decisión para Vocabulario |
| --- | --- | --- |
| DeckLearningSummary + deckLearningSummary | Resumen del día Madrid, eventos de cada valoración Again/Good, previsión/estados de mazo | Reutilizar patrón visual; no llamar a la función con eventos sintéticos. Sesión por UUID, Hard y procedencia necesitan otro view-model; extraer una pieza visual pequeña solo si reduce duplicación real |
| deckDayCounts / deckDayDifficulties / DeckDayPresentation | Contadores/ranking diario de eventos efectivos de mazo | No trasladar conteos ni lector; Vocabulario separa FSRS/refuerzo y direcciones. Ranking propio a partir de datos existentes |
| DeckScheduleReader / DeckPersistenceRouter | Lectura IndexedDB de builtin/custom con fence | No reutilizar para localStorage de Vocabulario. Consumir VocabularyProgressService y WorkspaceService; conservar guardas de owner/generación |
| deckTimeGroups / deckDayOffset | Agrupación due, Madrid, desempate editorial | Reutilizar el cálculo puro de diferencia de días si su extracción mínima se justifica; no fabricar DeckCardProgress/IDs de mazo para llamar al agrupador |
| DeckCardHistory / deckCardHistory | Modelo DeckReviewEvent numérico, dos ratings, retención/fuzz de mazo | No es un renderer neutral: filtra Hard y conoce scheduler/configuración de Mazos. Adaptador/proyección VocabularyHistory específica; compartir después solo gráfico/tabla sin esos supuestos |
| AttemptEventRepository / attempt-analytics / AttemptHistoryChart | Stats V2, intentos objetivos/self, periodos y gráfico con tabla | Reutilización directa preferida para actividad histórica; filtro vocabulary/learn y guardas workspace. No duplicar la base ni crear otros eventos |
| LearningSessionList / studiedSessionEntries | Lista de palabras efectivamente presentadas, localizada | Mantener y ampliar integración de resumen sin cambiar su deduplicación por entryId; mostrar cantidad de tarjetas aparte |
| ModalFocusDirective, FuriganaText, ProgressBar/Circle, StudyTimer | Accesibilidad y presentación compartidas | Reutilizar contratos existentes, temas semánticos, reloj activo y ES/EN/CA |

No importar componentes de Mazos en la portada ni añadir librería de gráficos al
bundle inicial. Usar rutas/cargas lazy existentes y medir ambos builds antes de implementar.

## 6. Propuesta de interfaz

**Resultado:** mantener lista de palabras y acciones. Cabecera con «X palabras · Y tarjetas»
y contexto ronda normal/práctica/modo; métricas compactas de respuestas y primer intento.
En Quick, aciertos/errores y precisión objetiva; en autoevaluación, Again/Hard/Good y
el indicador inicial etiquetado. Después, lista «Para reforzar», por palabra con
direcciones y evidencia; no repetir tarjetas solo para inflar una estadística.
Un desplegable muestra próximas fechas de las tarjetas respondidas; distingue
«programada hoy, más tarde» y «ronda normal de hoy completada».

**General:** bloque de estado actual y selección activa, con palabras y tarjetas separadas.
Distribución de cuatro estados con cifras, una previsión de siete días desde due
y evolución Stats V2 por actividad/procedencia. Sin gráfico decorativo de «dominio».
No cambiar los controles de estudio ni abrir automáticamente una práctica.

**Individual:** detalle de Todos → Historial → selector de dirección explícito.
Snapshot actual arriba; lista de repasos FSRS paginada, gráfico opcional y detalles
avanzados cerrados inicialmente. Sección independiente para intentos/refuerzos si hay datos.
No combinar direcciones en una única S/D, intervalo o línea de evolución.

Diseño: dos columnas amplias, una en 320px; tablas equivalentes para gráficos,
fechas con zona y texto exacto, foco visible y retorno del modal, controles semánticos,
sin depender solo de rojo/verde. Tema claro/oscuro y ES/EN/CA. Gráficos de conteos
lineales; si los intervalos usan logaritmo, declararlo y ofrecer valores exactos.
No mostrar 0 cuando corresponde «sin datos» ni asegurar accesibilidad sin validarla.

## 7. Roadmap para aprobar antes de implementar

| Etapa | Componentes/servicios y reutilización | Pruebas requeridas y riesgos | Complejidad orientativa |
| --- | --- | --- | --- |
| A — resumen vivo | VocabularyPlayPage/SessionService solo lectura, proyección pura nueva; LearningSessionList/StudyTimer; fuente AttemptEvent para respuesta detallada | Quick frente self/Hard, 1/4 apariciones, fin por límite, dos direcciones de misma palabra, práctica sin FSRS, nueva vs review con before, abandono/recarga, escritura IDB pendiente/fallida, cero escrituras al leer; responsive/ES/EN/CA | Media; primera entrega recomendada, sin migración. No prometer reapertura histórica completa |
| B — estado general | VocabularyProgressService activeUnits/allProgress, componente lazy de estadísticas; reutilizar barras/estilos; lector readonly con now explícito | Selección deshabilitada sin borrar, palabras/tarjetas, New importado, cero datos, due−1/igual/+1ms, cierre diario independiente, workspace A→B→A; no scheduler en lectura | Media; sin migración |
| C — historia por dirección | VocabularyAllPage + proyección VocabularyHistory; datos reviewEvents/current fsrs; ModalFocusDirective; renderer pequeño compartido solo si conviene | Hard conservado, fechas ISO/estado string, deduplicación, empates y reps, historia parcial, 20 filas/avance, due vs scheduledDays, dos direcciones, datos inválidos; teclado/foco/320px | Media-alta; sin migración para historia FSRS existente |
| D — evolución y previsión | HistoricalStats/AttemptHistoryChart/attempt-analytics; previsión con due actual y agrupación calendario; gráfico de intervalos de C | 7/30/90, Madrid 23/25h, fin de mes/año, periodos comparables/muestras, ausencia de datos, weighted accuracy, filtros source/actividad, errores/reintento IDB, carrera de workspace, bundle | Media para reutilizar Stats/previsión; alta si se exige evolución de estados histórica completa |

La previsión básica puede entrar en B; la evolución de intervalos depende de C y
la serie de respuestas puede reutilizar Stats V2 desde A/D. No hacer una plataforma
genérica de estadísticas antes de tener estas dos proyecciones concretas.

Decisiones pendientes: etiquetas exactas para autoevaluación/Hard; si el resumen
necesita reapertura histórica; y qué práctica se quiere distinguir cuando el contrato
actual AttemptEvent no guarda `practice`. No cambiar sus eventos históricos para
solventarlo. Una persistencia adicional requeriría revisión de versión, backup,
workspaces y sync, fuera del primer resumen de lectura.

## 8. Validación y límites de esta entrega

Resultados ejecutados durante este cierre (no copiados de informes anteriores):

- `npm test`: 2384/2384 en 230 archivos, antes de los commits, mismo contenido funcional.
- Dirigidos de Vocabulario/Stats V2: 77/77 en seis archivos, después de los commits:
  vocabulary-review-queue-audit, vocabulary-session.service, vocabulary-persistence,
  attempt-analytics, attempt-integration y vocabulary-play.page.
- `npx tsc -p tsconfig.app.json --noEmit` y spec: correctos.
- `npm run build -- --base-href /kana-study/`: correcto, cuatro warnings SCSS conocidos
  de Grammar. No se cambian rutas, bundle ni presentación durante la auditoría.
- Whitespace staged correcto antes de cada commit; verificación final de enlaces,
  `git diff --check`, hashes y scope correcta. Los tres archivos anteriores de
  Vocabulario conservan exactamente sus hashes; solo el índice documental se amplía
  después de los commits, además de crear este informe.

Evidencias regenerables ignoradas: `.cache/deck-stage-close/`, con inventario SHA-256,
diff inicial y logs. Las pruebas de integración existentes comprueban Again/Hard/Good,
refuerzos sin nuevas actualizaciones FSRS y separación objective/self; los tests de
cola usan reloj fijo y cubren los dos cambios DST. No se añaden tests que simulen
estadísticas futuras ni se presentan estos resultados como aceptación de una UI nueva.

No se repiten Playwright/candidato en esta auditoría documental; sus resultados
anteriores están en Mejoras de Ajustes. No se valida Safari, dispositivos físicos,
datos del propietario, Auth/RLS remoto ni durabilidad completa entre dispositivos.
Las métricas exactas significan exactas sobre registros disponibles, no historia completa.
No se corrigen aquí riesgos antiguos de almacenamiento, temporización reactiva o
selección ni se altera un dato para facilitar una gráfica. La implementación propuesta
queda pendiente de revisión del propietario.
