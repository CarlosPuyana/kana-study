# Kanji K0 — Integridad del progreso

## Ronda durable y Deshacer (11/11/2026)

Se conserva la ronda normal abierta en `kana-study.kanji-open-round.v1`, con
workspace, día Madrid, modalidad, unidades, cola/posición, apariciones, contadores,
respuesta revelada, feedback, duración y transición pendiente. El diario de K0
incluye los snapshots de ronda anterior/posterior a la respuesta; recuperar un
review parcial también confirma su ronda, sin volver a calcular FSRS. La recarga
reanuda la misma ronda, incluidos los refuerzos de NO/CASI. Un marcador durable
de cierre y el resumen canónico impiden reabrir una ronda terminada.

Deshacer usa un diario inverso local identificable por el intento confirmado.
Comprueba el head de la ronda, progreso y debilidad antes de restaurar; anula el
intento compartido con una fila IndexedDB que no es un AttemptEvent y no entra
en métricas. Un envío atrasado no puede resucitarlo. Se retira solo su review FSRS,
se restaura el snapshot de progreso/debilidad y la misma ronda/tarjeta. Los IDs de
nuevas respuestas son únicos aunque se responda otra vez al mismo ordinal.
No se fabrican reviews inversos ni se cambia la matemática del programador.

El diario precede a toda reversión; ante fallo bloquea valoraciones y conserva
la operación para Reintentar después de recargar. Las lecturas verifican el estado
anterior/posterior y las estadísticas K4 rechazan una lectura durante una reversión
pendiente. Se confirma la outbox local antes de retirar el diario. Los cambios de
activación, incluido A→B→A, no reactivan vistas antiguas ni escriben en otro usuario.
No se presenta localStorage + IndexedDB como una transacción única.

Límites: solo rondas normales abiertas del día; sin Deshacer en práctica voluntaria,
rondas cerradas o recibos históricos sin snapshots. No hay coordinación distribuida
entre pestañas/dispositivos. La prueba de backup verifica serialización/restauración
local del snapshot; no añade Kanji al formato de backups de Mazos ni modifica ese
módulo. Los trazos del lienzo siguen siendo efímeros; no se inventa tinta histórica.
La sección histórica inferior describe K0 anterior a esta extensión.

Validación: 20 tests nuevos de ronda/reversión, 6/6 Playwright (ES/EN/CA,
1280/390/320 px, claro/oscuro), 71/71 dirigidos finales. La única suite global
obtuvo 2920/2923: tres fixtures no reflejaban claves canónicas o la nueva
reanudación; se corrigieron y sus dos archivos pasan 21/21, sin repetir la global.
Build definitivo correcto: 749224 bytes iniciales, 776 de margen; los tres
servicios nuevos están diferidos. Siete warnings SCSS, uno nuevo en Kanji Play
(174 bytes sobre su presupuesto de estilos; no cambia el límite inicial).

Entrega local del 9 de noviembre de 2026 sobre `c59da61`. Sin commit, push, despliegue o SQL. Se conserva el informe anterior [KANJI_FUNCTIONAL_UX_AUDIT.md](KANJI_FUNCTIONAL_UX_AUDIT.md).

## Fallos originales y alcance

- **K-01:** la ronda de Kanji permanecía en memoria al cambiar de workspace. Progreso y debilidad elegían el workspace activo al escribir; el registrador de intentos conservaba el de inicio. Una misma respuesta podía quedar repartida entre propietarios. El reloj tenía una barrera propia, pero no protegía las escrituras.
- **K-02:** se modificaba memoria y se escribían progreso/eventos por separado con errores capturados por StorageService. La sesión avanzaba aun sin persistencia. Los intentos se enviaban de forma independiente y sin un recibo común con la debilidad.

K0 protege Aprender normal, práctica voluntaria y Escritura Kanji independiente. No implementa aprendizaje mediante palabras, K-03, rediseño responsive o nuevas estadísticas. Permanecen los 80 kanji, dos direcciones, NO/CASI/SÍ, un review FSRS por primera respuesta de unidad/ronda, refuerzos posicionales, cuatro apariciones y límite diario. RUSH y Anti-AFK V2 no cambian.

## Diseño previo y mecanismos reutilizados

Se revisaron KanjiSessionService, KanjiWritingPage/Session, KanjiProgressService, StorageService, AttemptRecordingService/Repository, WeaknessService, WorkspaceService y SpacedRepetitionService. También VocabularyReviewStore y VocabularySessionService.

Se adopta el patrón ya existente en Vocabulario: **diario local previo a las proyecciones, snapshots congelados, IDs inmutables y recuperación hacia delante**. No se añade base de datos, motor FSRS, backend o dependencia. KanjiAnswerStore adapta ese patrón a los contratos de Kanji y exige además confirmar la inserción del intento antes de permitir avance visual. Los almacenes y formatos canónicos siguen siendo los actuales.

No se presenta localStorage + IndexedDB como una transacción. Cada escritura de localStorage es independiente; puede existir una proyección parcial visible para otro consumidor mientras se recupera. La garantía es recuperación e idempotencia de una operación iniciada, con bloqueo de avance del ejercicio mientras no esté confirmada.

## Aislamiento de propietario y ciclo de vida

Cada ronda conserva workspace y revisión de activación. Las lecturas de sesión dejan de exponer inmediatamente una ronda cuya revisión ya no coincide; antes de responder se vuelve a comprobar y se limpian estado, pendientes de UI, medallas temporales y reloj. A→B→A también invalida: no basta con que el ID final vuelva a ser A.

Escritura conserva la misma barrera y una generación de ronda. Invalida cola, dibujo, estado revelado y resultados de carga de trazos. Las respuestas asíncronas verifican revisión/generación antes de modificar UI. El feedback y la transición de Aprender vuelven a comprobar la generación después de confirmar el guardado: una continuación antigua no puede poner feedback en una ronda nueva.

El inicio desde el panel también comprueba la revisión después de recuperar y de cualquier sincronización previa ya existente. No se arranca una ronda para una activación distinta de la que pulsó el botón.

StorageService admite un propietario explícito para la escritura y su outbox. Sin esa opción conserva su API habitual. El destino de la outbox se captura con el de la escritura, incluso ante un cambio de activación reentrante. Los diarios son locales y nunca se añaden al protocolo cloud.

**Límite importante:** una transacción IndexedDB ya enviada puede terminar en su propietario A después del cambio a B. No se puede deshacer esa transacción comprometida; nunca se redirige a B ni reactiva la UI antigua. El diario sigue perteneciendo a A y una activación posterior válida de A puede recuperar la operación. Recuperar datos no restaura la ronda invalidada.

## Contrato de persistencia de una valoración

1. Se conserva la decisión, timestamp e ID del intento. Se preparan una sola vez los snapshots y la debilidad resultante. Si ni siquiera se puede leer almacenamiento, la decisión queda en memoria para reintentar la preparación.
2. Se escribe estrictamente `kana-study.kanji-answer-intent.v1` en el workspace propietario. Si falla, no hay avance ni confirmación.
3. Se proyectan progreso, evento FSRS cuando corresponda y debilidad. Se aceptan únicamente el estado anterior esperado o el posterior de la misma operación; otro estado deja un conflicto recuperable, sin sobrescribirlo a ciegas. Los eventos se deduplican por ID y los snapshots no se recalculan al recuperar.
4. Se espera la confirmación de AttemptEventRepository.insert con el propietario explícito. Si falla IndexedDB, la pregunta permanece pendiente y el intento completo sigue durable en el diario.
5. Se guarda `kana-study.kanji-answer-receipt.v1` y se retira el diario. Fallar al escribir el recibo o limpiar el diario permite reintentar sin repetir FSRS, incrementar contadores o duplicar el intento.
6. Solo entonces se aplican contadores de la ronda, feedback, refuerzo o avance. Doble clic y otra valoración durante el guardado quedan bloqueados. El reintento usa la decisión original.

El recibo conserva únicamente la última operación confirmada del workspace; no es otro historial. Los historiales actuales siguen siendo las fuentes canónicas. La sesión impide comenzar otra operación con un diario diferente pendiente.

La debilidad usa la misma función de puntuación que WeaknessService; se sustituye su registro concreto sin eliminar registros ajenos. La práctica voluntaria y Escritura no crean reviews FSRS. Las repeticiones normales mantienen los contadores originales, incluida la semántica histórica de CASI; K0 no la redefine.

La validación de snapshots reutiliza readStudyProgress/readReviewEvents. Las tarjetas antiguas sin learningSteps siguen siendo compatibles por la normalización existente; los eventos antiguos no se reescriben para añadir ese campo. Una nueva valoración mantiene su firstSeenAt y encadena la memoria existente.

## Final de ronda y recarga

También se protege el resumen final: `kana-study.kanji-finish-intent.v1` conserva el resumen antes de SessionHistoryService.record estricto. Un fallo impide mostrar finalización; reintentar o recargar recupera el mismo sessionId y resumen, sin duplicarlo. Así un fallo del resumen no permite eludir el límite diario después de recargar.

KanjiAnswerStore recupera diarios al entrar en las páginas Kanji que lo consumen, al cambiar a un workspace con pendientes y mediante el reintento general existente de AttemptRecordingService. El panel recupera antes de iniciar otra ronda. Un conflicto o almacenamiento todavía no disponible conserva el diario y expone error; no se borra para desbloquear artificialmente.

La recuperación hace durables las respuestas que ya habían iniciado su guardado, pero **no añade reanudación de la cola**. Una ronda incompleta sigue siendo de memoria, como antes. El diario de finalización conserva su timestamp original; una recuperación no refecha el resumen histórico.

## Interfaz y fallos

Mensaje traducido ES/EN/CA, botón Reintentar y estado aria-busy en las pantallas existentes. Opciones/valoraciones se deshabilitan durante el guardado o al mostrar el error. La pregunta y el dibujo permanecen hasta confirmación; el reintento no acepta otra valoración para el mismo intento. No hay pantallas nuevas ni rediseño.

Se reutiliza el contador compartido: pausa durante la espera del guardado, conserva la aparición para reintentar y continúa con el mismo presupuesto. No se modifican el motor Anti-AFK, sus 180 segundos, visibilidad o protección de suspensión. Los avisos globales de almacenamiento/estadísticas no se silencian: pueden corresponder a otros fallos pendientes.

## Archivos

Producción:

- `src/app/core/services/kanji-answer-store.ts`: diario, recibo, snapshots, recuperación, confirmación de intentos y cierre de ronda.
- `src/app/core/services/kanji-session.service.ts`: owner/epoch, generaciones, valoración confirmada y reintento.
- `src/app/features/kanji-writing/kanji-writing.page.ts` y HTML: barrera de ronda/carga, dibujo conservado y guardado confirmado.
- `src/app/features/kanji-play/kanji-play.page.ts` y HTML: bloqueo de teclado/controles y error accesible.
- `src/app/features/kanji/kanji.page.*`, `kanji-all/kanji-all.page.*` y panel de inicio: recuperación y acceso a reintento.
- `src/app/core/services/storage.service.ts`: opción de destino explícito, conservando el contrato estricto y la outbox existente.
- `src/app/core/services/weakness.service.ts`: extracción de la función de puntuación compartida, sin modificar reglas.
- Diccionarios ES/EN/CA y `core.generated.ts`: una clave nueva; Reintentar reutiliza common.retry. No se añaden dependencias al bundle inicial para cargar el coordinador Kanji.

Pruebas:

- `kanji-integrity.spec.ts`: regresiones con store real, fake-indexeddb y fallos inyectados por etapa.
- Specs existentes de motor, escritura, intentos, débiles, reloj, lista de sesión y presentación: ahora esperan la confirmación asíncrona; se mantienen sus aserciones de aprendizaje. Los resúmenes exigen strict.
- `kanji-answer-store.test-support.ts`: adaptador explícito para tests unitarios anteriores con progreso simulado. No sustituye las regresiones del store real ni entra en el bundle.
- `manual-tests/kanji-k0/integrity.spec.ts` y `playwright.kanji-k0.config.ts`: cuota parcial, reintentos, recarga, doble clic, cambio durante IDB y dibujo conservado, en ES/EN/CA y claro/oscuro, incluyendo 320 px.

## Validación

Evidencias locales en `.cache/kanji-k0/`: logs Angular/TypeScript/builds, traces/capturas y manifest de integridad. No se añaden esos artefactos a Git.

| Comprobación final | Resultado real |
| --- | --- |
| Suite Angular | **2696/2696**, 251 archivos; incluye **26 regresiones nuevas** con persistencia real/simulada en sus límites |
| TypeScript app / spec | Ambos correctos, salida 0 |
| Playwright K0 | **15/15**, ES/EN/CA, claro/oscuro, 1280/390/320 px |
| Playwright Anti-AFK existente | **15/15** en la ejecución final sin HMR |
| Playwright estadísticas Vocabulario | **18/18** |
| Auditoría de navegador Manga/candidato | **3/3**, diccionario, creación manual, FSRS/Deshacer, backup/reinicio y cuentas HTTP controladas; no Auth real |
| Builds normal / candidato | Correctos, ruta `/kana-study/`; iniciales **748.894 / 749.780 bytes**, ambos estrictamente menores de 750.000 |
| FSRS | **67 transiciones** matemáticas, equivalencia, snapshots, serialización y UTC/Madrid correctas |
| i18n | Auditoría ES/EN/CA correcta; **4/4** tests de representación/dominios Gramática-Conjugaciones; claves compiladas sincronizadas |
| Bundle / scope | Coordinador Kanji lazy; helper de tests ausente de ambos artefactos; catálogo, scheduler, Anti-AFK, RUSH, gates, SQL y workflows intactos |
| Git / whitespace | `git diff --check` correcto; HEAD sigue en `c59da61`, índice vacío, trabajo anterior conservado |

El candidato mantiene **220 bytes de margen hasta el límite exclusivo**. Persisten los seis warnings SCSS conocidos; no se amplían presupuestos. Se inspeccionaron visualmente los estados de error y dibujo conservado en oscuro/escritorio y claro/320 px. Firefox y WebKit no estaban instalados para la auditoría opcional de motores; no se afirma validación en ellos.

Los tests de regresión cubren Guest, A→B, A→B→A, cambio antes/durante escritura y entre confirmación/continuación, respuesta tardía, recuperación tras recarga, errores de lectura/escritura, fallo en cada proyección, fallo IndexedDB, recibo y retirada de diario, reintentos fallidos/exitosos, doble clic, snapshots históricos, preservación de otros módulos y cierre diario.

Los primeros ensayos adicionales de Anti-AFK fueron invalidados por recargas del servidor de desarrollo mientras se cerraban cambios: desapareció el componente al navegar de nuevo con el reloj virtual pausado. Se conservan traces/logs y se repite la comprobación en servidor aislado sin HMR. No se alteran ni omiten las pruebas para ocultarlo.

## Límites y pendientes

- No hay transacción distribuida ni aislamiento de lectura entre localStorage, IndexedDB y la outbox legacy. Puede existir estado parcial hasta recuperar. Las operaciones cloud conservan su contrato eventual; no se afirma atomicidad remota ni se valida Supabase real.
- No se garantiza concurrencia de dos pestañas escribiendo simultáneamente sobre el mismo workspace. Se detectan estados distintos de los esperados y se bloquea el replay en vez de sobrescribirlos; no se afirma que una comprobación CAS de localStorage sea un lock entre procesos.
- Si se borra el almacenamiento del navegador, se pierde también el diario; no es un backup ni introduce sincronización de pendientes entre dispositivos. Los diarios permanecen con su propietario original, no se trasladan automáticamente al cambiar de cuenta.
- La persistencia duradera depende de que el navegador conserve al menos el diario. Si su primera escritura falla, solo queda la decisión en memoria y la UI no la confirma. No se promete supervivencia tras cerrar esa pestaña sin haber podido escribir nada.
- Almacenamiento corrupto o cambios concurrentes incompatibles conservan el pendiente y requieren resolver el conflicto; no hay limpieza destructiva automática.
- Safari/dispositivos físicos y Auth/RLS remoto quedan pendientes. Los perfiles de pruebas son sintéticos, sin cuentas privadas ni datos cloud reales.
- K-03, UX compacta, pedagogía mediante palabras y estadísticas nuevas son trabajos posteriores. Los fallos antiguos de logout de Gramática y scheduler de Mazos siguen fuera de alcance.
