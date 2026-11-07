# Vocabulario: estadísticas avanzadas

Entrega local del 07/11/2026. Las estadísticas permanecen **sin commit**. Sin push, despliegue, SQL, cambios de datos personales, de Mazos ni de las reglas de aprendizaje.

## A. Cierre Git anterior a las estadísticas

Rama `main`. Se creó `80e385c7d03b951224f66a16c17486eceed9855d` — `feat(vocabulary): implement short daily lessons, consolidation and session RUSH`.

Incluye exactamente los 64 archivos revisados de la renovación anterior: aprendizaje 10/15, reparto, consolidación, FSRS inicial, journal/Stats, reanudación, Daily Study, traspaso RUSH, UI, traducciones, pruebas y documentos históricos. Se agruparon porque comparten servicios, resultados, traducciones y cobertura; separarlos por archivos habría dejado commits intermedios incompletos. No se creó un tercer commit artificial.

Antes del commit se revisaron estado, diff, archivos nuevos y patrones de secretos. El staging se preparó con una lista explícita, se comparó con el manifiesto local y se verificaron todos los hashes normalizados y `git diff --cached --check`. No se incluyeron cachés, capturas, logs, builds, archivos privados ni credenciales detectadas. El árbol quedó limpio; **2451/2451 tests** pasaron después del commit y antes de modificar estadísticas. Se conservaron intactos `7f899be` y `d681be5`. No hubo push ni reescritura de historial.

Las evidencias de cierre están en `.cache/vocabulary-stats/commit-a-files.json`, `staged.diff` y `closure-tests.log`, ignoradas por Git. El estado sucio posterior corresponde exclusivamente a esta nueva etapa de estadísticas.

## B. Arquitectura y fuentes

| Capa | Archivo | Función |
| --- | --- | --- |
| Proyecciones puras | `src/app/core/services/vocabulary-statistics.ts` | Palabras/direcciones, cuatro estados, fechas Madrid, resumen, intervalos reales y clasificación de intentos |
| Lectura local | `src/app/core/services/vocabulary-stats-reader.ts` | Lectura validada de los contenedores actuales y consultas cursor a AttemptEventRepository; nunca guarda ni recupera journals |
| Resumen | `src/app/features/vocabulary/components/vocabulary-lesson-summary.*` | Métricas compactas, primeras respuestas, dificultad observada y previsión |
| Estado y evolución | `src/app/features/vocabulary/components/vocabulary-statistics.*` | Selección actual y filtros de actividad/7/30/90 días |
| Historial individual | `src/app/features/vocabulary/components/vocabulary-word-history.*` | Dirección explícita, estado actual, valoraciones e intentos en secciones independientes |
| Previsión compartida | `src/app/features/vocabulary/components/vocabulary-forecast.ts` | Siete días, vencidas y posteriores, con cantidades legibles equivalentes a las barras |

No se añaden claves de almacenamiento, bases de datos, índices, migraciones ni dependencias. Se usan:

- Progreso por dirección en `kana-study.vocabulary-progress.v1`, validado sin reescribirlo.
- Eventos reales de `kana-study.vocabulary-review-events.v1`; no se generan valoraciones.
- Composición/contadores V1/V2 de `kana-study.vocabulary-daily-lessons.v1` para contextualizar una lección.
- Intentos disponibles en IndexedDB `kana-study-attempts-v1` mediante el repositorio existente.
- Metadatos del catálogo y selección actual. No se borran progresos desactivados.

CompletedSessionSummary y SessionHistoryService se auditaron: sus resúmenes agregados antiguos no contienen evidencia suficiente para reconstruir rachas o todas las respuestas. No se usan para inventar detalle por palabra ni precisión. Se mantienen sus escrituras y contratos.

## Resumen final

Acceso: finalizar Aprender normalmente. Se mantienen el reloj, la lista de palabras, las acciones RUSH y el regreso a Vocabulario. La nueva presentación distingue:

- Palabras distintas completadas frente a respuestas confirmadas.
- Primeras respuestas NO/CASI/SÍ en autoevaluación; correctas/incorrectas en opciones. No se calcula una precisión mezclada.
- Eficiencia de consolidación: solo en V2 completa, sin completadas heredadas. Mínimo `2 × entryId distintos`; adicionales `respuestas − mínimo`. No se llama memoria ni dominio.
- Palabras que más costaron: intentos descendentes, desempate por NO, CASI e ID estable. Muestra las cinco primeras con lectura, significado, dirección y primera respuesta en detalles. La lista completa se conserva debajo.
- Previsión de las direcciones trabajadas, desde los eventos de esa sesión. En V2 se usa la programación inicial; en contratos antiguos con varias valoraciones se conserva la última programación real registrada de esa sesión. Si falta el evento, se avisa y no se sustituye por una fecha inventada ni por el snapshot de otra valoración posterior.

El enlace de una palabra difícil abre el detalle existente en Todos y conserva el resultado al regresar, mediante la retención de resultados ya utilizada para RUSH. No inicia prácticas automáticamente.

Ejemplo verificable: diez palabras, primeras respuestas 4 NO/3 CASI/3 SÍ; todas llegan después a dos aciertos consecutivos. Resultado: **10/10 palabras, 27 respuestas, mínimo 20 y 7 adicionales**. Hay diez valoraciones iniciales reales, no 27. Los siete intentos adicionales no se convierten en eventos FSRS.

## Estado general y evolución

Acceso: **Vocabulario → Tu progreso en Vocabulario**, dentro de la página existente; no se crea otra ruta. El panel se carga bajo demanda.

El estado actual se limita a la selección activa. Cuenta por separado palabras con algún progreso, direcciones con progreso y palabras sin registros previos en ninguna dirección (incluidas las desactivadas, para no llamar nueva a una palabra conocida). Las palabras con progreso y las sin estudiar no se fuerzan a formar un desglose de estados FSRS: los cuatro estados pertenecen a direcciones, no a palabras.

La distribución New/Learning/Review/Relearning usa los snapshots guardados. Las direcciones sin snapshot se muestran aparte como sin iniciar; no se fabrican estados New. Review se etiqueta como repaso, sin afirmar aprendizaje definitivo. La portada conserva su porcentaje existente, con una etiqueta de estado de repaso en vez de dominio/memorización.

La previsión cuenta direcciones y usa `due` real: vencidas de días anteriores, hoy completo Madrid, los seis días siguientes y posteriores. Hoy incluye horas futuras del mismo día, sin alterar la elegibilidad del aprendizaje. Los cambios de horario se resuelven por claves de calendario Europe/Madrid, no sumando bloques de 24 horas como si fueran medianoches locales. No se simulan respuestas.

La evolución reutiliza **AttemptAnalytics/historicalAccumulator y AttemptHistoryChart** de Stats V2: intentos por día, resultados autoevaluados separados y precisión exclusivamente objetiva. Los gráficos tienen tablas accesibles. Se ofrecen 7/30/90 días y un filtro de primeras respuestas con `firstAttempt===true`; las no identificadas no se inventan.

Aprender es la actividad predeterminada. Escritura y Escucha se consultan explícitamente o juntas con Aprender. RUSH no es una actividad de AttemptEvent en el contrato existente y queda excluido; no se copian sus contadores a este historial. No se promete un filtro RUSH ficticio. Si no hay respuestas objetivas, no se muestra un porcentaje ni un gráfico de precisión.

Los datos se consultan al abrir, cambiar filtros, cambiar de workspace, recibir revisiones de AttemptEventRepository o actualizar manualmente. Una importación/cambio externo de localStorage puede requerir Actualizar. No se añade un temporizador de estadísticas ni se cambian relojes de estudio.

## Historial por palabra y dirección

Acceso: **Vocabulario → Todos → una palabra → Historial de aprendizaje**. Se carga bajo demanda en el modal actual. El selector ofrece las direcciones válidas de esa palabra, con independencia de que tengan memoria iniciada; las preguntas de lectura respetan su disponibilidad real.

Para la dirección elegida muestra estado actual, última revisión del snapshot, siguiente fecha, cantidad de valoraciones **registradas** y detalles de estabilidad/dificultad/contador del programador. Estos últimos son valores guardados, no métricas derivadas de las repeticiones de consolidación. El contador del programador no se presenta como número garantizado de filas del historial.

Las valoraciones se ordenan del más reciente al antiguo, con ID como desempate estable. Se presentan páginas de veinte. El intervalo anterior usa `fsrsBefore.due − fsrsBefore.lastReview`, cuando existe; el resultante usa `fsrsAfter.due − reviewedAt`. Ausencias y diferencias negativas se muestran como no disponibles. El gráfico representa intervalos de esa página con escala logarítmica declarada; la tabla conserva fechas y duraciones exactas hasta milisegundos. No se genera una curva desde el snapshot actual.

La sección separada de práctica consulta únicamente Aprender y esa palabra/dirección. Incluye las primeras respuestas y las repeticiones. Una repetición solo se etiqueta **práctica interna** si consta el contrato V2 mediante una lección de esa sesión o un evento marcado `lessonVersion:2` para esa dirección; no se unen eventos por cercanía temporal. En contratos desconocidos se muestra que no puede identificarse su posición/contrato.

Ejemplo: un evento V2 Again y tres intentos NO/SÍ/SÍ producen **una fila de valoración** y **tres intentos**, dos de ellos internos. Nunca aparecen tres valoraciones.

Los intentos también se paginan de veinte en veinte con cursor `(occurredAt,id)`, comparado con el mismo orden binario estable al filtrar y ordenar. Se mantienen como máximo veintiún candidatos durante cada consulta. No se mezclan direcciones, actividades ni usuarios.

## Fiabilidad, pendientes e historia parcial

Las proyecciones son de solo lectura. No llaman a FSRS, no aplican VocabularyReviewStore.recover(), no transicionan lecciones V1 ni retiran operaciones pendientes. La recuperación normal de estudio al entrar en la portada sigue siendo responsabilidad del flujo previo; abrir las estadísticas no añade otra recuperación ni un reintento de escritura.

Se consultan intentos ya confirmados en IndexedDB. El journal y la cola durable existentes de Aprender solo se inspeccionan para informar de guardados pendientes; no se aplican, fusionan ni deduplican mediante escrituras desde estadísticas. Escritura/Escucha conservan su guardado asíncrono previo; no se garantiza que los últimos intentos hayan terminado y se informa de ese alcance. Actualizar vuelve a consultar. Si IndexedDB falla, aparece un error de lectura, no una evolución inventada con ceros.

Las consultas capturan workspace y revisión de activación. A→B→A invalida las respuestas antiguas; los componentes limpian sus resultados antes de consultar y descartan consultas de generaciones anteriores. La destrucción del componente también invalida la entrega.

Los registros inválidos se omiten de la proyección y se avisa; los bytes originales permanecen intactos. Los eventos válidos se deduplican por ID para su presentación, no por fecha ni calificación. No se reconstruyen intentos desde eventos FSRS, primeras respuestas desde contadores antiguos ni curvas desde S/D. Los contadores históricos con semánticas distintas no se usan para inferir NO/CASI/SÍ. Las lecciones V1 y V2 con completadas heredadas no reciben una eficiencia artificial de dos intentos mínimos.

## Reutilización y diseño

Se reutilizan el gráfico/tablas de Stats V2, sus agregadores y calendario Madrid, los controles/retención de navegación existentes, la lista de palabras, el reloj y el modal/foco. De Mazos se conserva el patrón visual de métricas compactas, detalles progresivos e intervalos paginados; no se importan su scheduler, modelos o fórmulas ni se modifica su UI.

Los colores son semánticos y los controles nativos. Las columnas se apilan a 320 px, las tablas desplazan dentro de su contenedor, y foco, estados vacíos/errores, fechas y etiquetas están disponibles en ES/EN/CA. Todo el texto nuevo pertenece al dominio diferido de estudio. No se añaden bibliotecas de gráficos ni entradas públicas de activación.

## Archivos y pruebas

Además de los archivos de arquitectura anteriores: integración en `vocabulary.page.*`, `vocabulary-play.page.*`, `vocabulary-all.page.*`; ES/EN/CA y `deck-study.generated.ts`; pruebas puras/lector/componentes, adaptación de las aserciones de la lista para el nuevo resumen y `manual-tests/vocabulary-stats` con `playwright.vocabulary-stats.config.ts`.

Validación final del 07/11/2026:

- Suite Angular: **2480/2480**, 237 archivos (`final-tests.log`). Antes del commit de cierre: 2451/2451; los tests añadidos verifican proyecciones, datos parciales, consultas, aislamiento, paginación y actualización pasiva de pendientes.
- TypeScript app/spec: correctos (`final-app.log`, `final-spec.log`).
- Builds normal y candidato: correctos con `/kana-study/` (`final-normal.log`, `final-candidate.log`). Inicial **747.061 / 747.947 bytes**, sin aumento respecto al cierre anterior y por debajo de 750.000. Se conservan los cinco avisos SCSS conocidos: cuatro de Gramática y el de Vocabulario (8.280 frente al aviso de 8.000); no se amplían presupuestos.
- Auditoría i18n: ES/EN/CA con mismas claves y placeholders; dominios generados exactos. Auditoría del grafo: estadísticas, lector e historial fuera de ambas entradas iniciales (`final-i18n-lazy.log`).
- Playwright de estadísticas **18/18**, tres perfiles ES oscuro escritorio, EN claro móvil y CA oscuro a 320 px (`final-playwright.log`). Cubre 10/15 palabras, respuestas/eficiencia, modo opciones, filtros, tablas 7/30/90, medianoche Madrid, historial 20+3, dirección, teclado, ausencia de desbordamiento, lecturas sin cambios y fallos de IndexedDB.
- Regresiones finales: lecciones **15/15**, RUSH de sesión **15/15**, Mazos **33/33**, RUSH original **33/33** (`final-lessons.log`, `final-session-rush.log`, `final-deck.log`, `final-rush-shortcuts.log`). Total Playwright: **114/114**, sin reintentos automáticos ni ampliaciones de timeout.
- Auditoría SRS: **67 transiciones correctas**, matemáticas, equivalencia, logs, serialización, UTC y DST Madrid (`final-srs.log`).
- Auditoría multimedia/entradas/gates: correcta (`final-media.log`). Despliegue generado normal/candidato **150.313.060 / 150.312.805 bytes**, con medios estáticos existentes fuera del inicial. No se publica el artefacto.

La primera ejecución de navegador detectó un desbordamiento de la tabla diaria en móvil: se corrigieron los mínimos de los elementos de grid y el contenedor del gráfico dentro de los estilos nuevos. Las opciones de respuesta se buscan por texto exacto en la prueba, evitando confundir «be» con «be understood». La prueba de paginación utiliza también IDs con mayúsculas/minúsculas y el mismo orden al filtrar y ordenar. Las capturas de historial usan el viewport del modal para no capturar todo el catálogo subyacente.

Se revisaron visualmente el panel general de escritorio oscuro y 320 px oscuro, el resumen estrecho y el historial móvil claro con foco visible. Los avisos de guardado del resumen reaccionan a revisiones del repositorio y permiten Actualizar sin aplicar el journal; hay una regresión específica que verifica ausencia de escrituras.

Evidencias locales en `.cache/vocabulary-stats/`, ignoradas por Git. Capturas `general-*`, `summary-*` e `history-*` para los tres perfiles. Las pruebas usan datos sintéticos, reloj fijo y Supabase bloqueado o SDK controlado; no datos personales.

- Tests dirigidos finales: **269/269**, 25 archivos (`final-directed.log`).
- Regresión Manga candidato: **3/3** (`final-manga.log`), con datos sintéticos y SDK controlado. No valida Supabase Auth real; los smoke Firefox/WebKit quedaron sin ejecutar porque sus binarios no están instalados, y no se cuentan como aprobados.
- Auditoría documental y `git diff --check`: correctos. El staging está vacío, HEAD permanece en `80e385c` y no hay nuevos commits de estadísticas ni push.

Comandos principales ejecutados desde la raíz:

```powershell
npm test
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npm run build -- --base-href /kana-study/ --stats-json
npm run build:manga-candidate
npx playwright test --config playwright.vocabulary-stats.config.ts
npx playwright test --config playwright.vocabulary-short-lessons.config.ts
npx playwright test --config playwright.vocabulary-fsrs-rush.config.ts
npx playwright test --config playwright.deck-learning.config.ts
npx playwright test --config .cache/vocabulary-fsrs-rush/rush-edge.config.ts
node --import ./.cache/deck-daily-queue/edge-audit-loader.mjs scripts/audit-manga-candidate.mjs
node scripts/audit-srs.mjs
node scripts/audit-kaishi-media.mjs
node scripts/audit-repo-docs.mjs --links-only
git diff --check
```

Los adaptadores Edge de las dos referencias `.cache` ya existían y no se versionan. No cambian las aserciones ni los datos de producción. Angular utiliza TEMP/TMP en `.cache/vocabulary-stats/tmp` para evitar el EPERM del temporal del entorno ya documentado anteriormente. Se comprueban también todos los hashes del commit de cierre frente a su manifiesto y las fuentes finales frente al snapshot validado.

## Limitaciones

- Historia disponible en este navegador/workspace; no se garantiza cobertura desde el primer uso, igualdad entre dispositivos ni datos de actividades que nunca se registraron.
- AttemptEvent no conserva un indicador general de práctica voluntaria. Las sesiones antiguas registradas como `learn` pertenecen a ese filtro, sin reclasificación retrospectiva como lecciones V2 ni como valoraciones FSRS.
- V1 y contratos antiguos conservan sus propios datos y límites; no se recalculan retrospectivamente. La eficiencia se omite cuando no es comparable.
- El array de eventos FSRS se lee desde localStorage completo. Paginar la UI no pagina esa lectura. Cada página de intentos recorre el índice existente de Aprender; no hay índice por palabra ni nuevas migraciones.
- Los filtros y páginas son estado de interfaz, no una nueva preferencia persistida. Actualizar puede ser necesario tras cambios externos o escrituras aún pendientes.
- No se añade exclusión mutua entre pestañas, recuperación nueva ni sincronización cloud.
- Safari, dispositivos físicos y Supabase Auth/RLS real requieren comprobaciones independientes. Las pruebas locales no sustituyen esas validaciones.

## Inventario del diff pendiente de estadísticas

- `docs/features/vocabulary/VOCABULARY_ADVANCED_STATS.md`
- `manual-tests/vocabulary-stats/vocabulary-stats.spec.ts`
- `playwright.vocabulary-stats.config.ts`
- `src/app/core/services/vocabulary-statistics.spec.ts`
- `src/app/core/services/vocabulary-statistics.ts`
- `src/app/core/services/vocabulary-stats-reader.spec.ts`
- `src/app/core/services/vocabulary-stats-reader.ts`
- `src/app/features/vocabulary/components/vocabulary-forecast.ts`
- `src/app/features/vocabulary/components/vocabulary-lesson-summary.html`
- `src/app/features/vocabulary/components/vocabulary-lesson-summary.ts`
- `src/app/features/vocabulary/components/vocabulary-statistics.html`
- `src/app/features/vocabulary/components/vocabulary-statistics.scss`
- `src/app/features/vocabulary/components/vocabulary-statistics.spec.ts`
- `src/app/features/vocabulary/components/vocabulary-statistics.ts`
- `src/app/features/vocabulary/components/vocabulary-word-history.html`
- `src/app/features/vocabulary/components/vocabulary-word-history.ts`
- `docs/INDEX.md`
- `docs/features/vocabulary/VOCABULARY_STATS_AUDIT.md`
- `src/app/features/vocabulary-all/vocabulary-all.page.html`
- `src/app/features/vocabulary-all/vocabulary-all.page.ts`
- `src/app/features/vocabulary-play/vocabulary-play.page.html`
- `src/app/features/vocabulary-play/vocabulary-play.page.ts`
- `src/app/features/vocabulary/vocabulary.page.html`
- `src/app/features/vocabulary/vocabulary.page.ts`
- `src/app/shared/components/learning-session-list/learning-session-list.spec.ts`
- `src/assets/i18n/ca.json`
- `src/assets/i18n/deck-study.generated.ts`
- `src/assets/i18n/en.json`
- `src/assets/i18n/es.json`
