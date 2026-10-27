# Manga × Mazos V1 — Hito 1

Fecha: 2026-10-21. Implementación local de contratos, catálogo y persistencia; funcionalidad custom oculta por defecto. Sin commit ni push.

**Estado actual:** Hito 1.1 cerrado con cuatro suites completas verdes; véase la sección final de estabilización. Los resultados de H1 que siguen se conservan como historial.

## Arquitectura y contratos

`deck-catalog.model.ts` separa `CustomDeck`, `CustomDeckCard`, `LexicalAnchor`/`LexicalIdentity`, `DeckDisplayName`, `DeckContentProvider`, `DeckStudyEntryView`, estados loading/missing/error/ready y operaciones versionadas. `DeckDefinition` aporta solo metadata necesaria al motor. La unión de vista conserva el modelo editorial original y añade un reverso custom de palabra, lectura, glosas y contexto opcional; no fabrica frases, medios, frecuencia ni furigana.

`DeckCatalogService` expone metadata, revisión, índice real y carga de contenido. La carga explícita y las revisiones invalidan consumidores; owner/generation impiden publicar una respuesta anterior después de cambiar de cuenta. El contenido editorial se mantiene en un módulo lazy y se reutilizan referencias originales. Las vistas de contenido lo reciben síncronamente dentro de sus chunks existentes; los consumidores de metadata no lo importan.

`createDeckRouteResource` gestiona cada ruta, ausencia/error, cambio de parámetro y de workspace. Los títulos custom son literales incluso si coinciden con una clave de traducción. Las glosas tienen idioma y procedencia; si falta el idioma activo se muestra la glosa disponible con su idioma explícito. Japanese 1500 mantiene CA→ES. Se reutilizan claves de traducción existentes en ES/EN/CA.

## Persistencia y recuperación

Base separada `kana-study-custom-decks-v1`, versión 1. Stores: decks, cards, progress, events, daily y journal. Cada clave incluye el workspace literal, sin saneamiento que haga colisionar `user:a:b` con `user:a_b`. Índices por workspace, por mazo de tarjetas y unicidad de `(workspace,deckId,lexicalKey,direction)`.

Una operación carga un snapshot transaccional del workspace, verifica sus precondiciones y escribe solo filas cambiadas. Todos los stores afectados y el recibo durable se confirman en la misma transacción. Crear un mazo guarda manifiesto/cantidad y tarjetas conjuntamente; una discrepancia de cantidad se trata como corrupción. Errores/quota abortan datos y journal; repetir el mismo ID con la misma solicitud es idempotente; reutilizarlo con otra solicitud falla. El journal conserva payload, revisión local monotónica, ID y fecha, sin simular un ACK cloud.

No se mantiene una conexión global abierta: se cierra en finally y versionchange; blocked rechaza con un error recuperable y cierra un éxito tardío. No se borran bases ni registros corruptos silenciosamente. Una transacción interrumpida por el navegador queda completa o abortada según IndexedDB; puede repetirse usando el recibo original después de recargar.

Validación: schemas v1, fechas ISO, settings, estados FSRS y logs numéricos finitos, IDs ≤256 bytes UTF-8, título ≤160 unidades UTF-16/640 bytes, palabra/lectura ≤256 unidades/1024 bytes, ≤3 glosas (2000 unidades/8000 bytes cada una), contexto ≤1200 unidades/4800 bytes, ≤32 grafías, tarjeta JSON ≤32 KiB. Una creación admite como máximo 1000 tarjetas y toda operación tiene payload JSON ≤1 MiB. Se rechazan controles peligrosos/surrogates inválidos y no se truncan identidades. Los tests incluyen Unicode suplementario, comillas, barras inversas y expansión de escapes.

El ancla usa autoridad JMdict con entrada numérica o autoridad curated explícita, lectura NFC y grupo homógrafo. La clave SHA-256 completa no depende del ID de importación ni de las glosas/grafías cambiantes. H1 valida el contrato y su coherencia; no demuestra por sí solo que una entrada exista en un recurso lingüístico: esa comprobación corresponde a H2/H3. La lectura de la tarjeta debe corresponder al ancla y su grafía estar en la evidencia.

## FSRS y consumidores

`DeckPersistenceRouter` captura el owner de cada operación y delega builtin al repositorio legacy; custom al repositorio nuevo. Se adapta el `DeckStudyService` existente, sin modificar `DeckSchedulerService`, parámetros, fuzz, graduación, Again/Good, estados, colas, retención, Madrid ni reglas del día completado. No existe snapshot FSRS de una tarjeta custom hasta la primera calificación.

Los reviews verifican el snapshot anterior antes del commit, guardan progreso/evento/introducciones juntos y conservan la rama exacta mostrada por preview. El mismo preview conserva un ID de evento estable por workspace/mazo/tarjeta/rating al reintentar, y su fecha Madrid original aunque la repetición cruce medianoche. Undo exige que el evento sea la cabeza actual, conserva su registro anulado y restaura el snapshot/cabeza anteriores; deshacer la primera introducción deja un marcador local null, no una tarjeta New artificial. Las consultas de eventos efectivos omiten anulados. Las modificaciones de glosa/contexto no escriben progreso. Una identidad léxica diferente exige otro card ID.

Se adaptan home Mazos, tarjetas, estudio, estadísticas, settings y deep links, además de Daily Study y Perfil. Los settings custom se escriben en el journal separado; Daily conserva títulos literales y Perfil suma eventos efectivos sin duplicar tiempo. Los cambios de owner invalidan resultados y selección/draft de vistas. El catálogo no crea un efecto raíz al leer Perfil con custom desactivado, evitando tareas reactivas nuevas en la reconciliación legacy.

## Gate y límites del hito

`CUSTOM_DECKS_ENABLED` es una señal inyectada con valor inicial false. Unit tests la sustituyen; Playwright la activa solo por el depurador Angular de desarrollo para sembrar fixtures. No hay selector público, ruta de creación, URL o localStorage que la active. Una recarga la desactiva y oculta los deep links custom, sin borrar contenido.

No se ha añadido sincronización, SQL, tokenizer, OCR, creación desde Manga, cobertura o estadísticas de Manga. No se ha modificado Manga Saved FSRS, scheduler, datasets Japanese 1500, base de datos legacy, sincronización ni los archivos pendientes de Stats V2.

Diferencias frente al diseño H0: solo el subconjunto local de operaciones necesario para H1 (create/edit-card/settings/review/undo/daily); no manifiestos remotos ready ni ACKs, borrados/restore, operaciones de obra o autoselección. Las lecturas/escrituras transaccionales aún materializan los registros del workspace; antes de catálogos grandes H4 deberá medir memoria, paginar journal/lecturas y migrar el acceso conservando claves/recibos. No se declara certificado Safari físico, sincronización ni rendimiento de diccionarios.

Hito 2 debe aportar anclas verificadas, recursos y licencias, política de ambigüedad y análisis local en Worker con corpus/mediciones. Hito 4 debe sincronizar metadata/contenido/FSRS/journal atómicamente a nivel de protocolo, implementar ACKs idempotentes/CAS, conflictos de reviews/undo, tombstones/restore e importación Guest íntegra y reintentable; comprobar dos browsers, offline/cuentas y SQL/RLS real antes de cambiar el gate público.

## Validación real

- Tests dirigidos finales: **61/61**, 7 archivos (23 de repositorio/catálogo/FSRS custom, 5 de pantallas custom y regresiones de estudio, tarjetas, settings, Daily y Perfil).
- Suite `npm test` final: **1720 aprobados, 2 fallidos; 172 archivos aprobados y 1 fallido, 173 en total**. Los 28 tests nuevos de H1 pasan. Los dos fallos están en el spec de Stats V2 descrito debajo. La pasada previa también registró la intermitencia de orden descrita debajo; no se han omitido tests ni ampliado timeouts.
- `npx tsc -p tsconfig.app.json --noEmit`: correcto.
- `npx tsc -p tsconfig.spec.json --noEmit`: correcto.
- `npx playwright test e2e/custom-decks-h1.spec.ts e2e/stats-v2.spec.ts e2e/daily-study.spec.ts`: **27/27**. Tres proyectos Chromium: desktop-dark (1280), mobile-light (390), narrow-dark (320). Verificadas las capturas de estudio custom en escritorio oscuro y móvil claro, texto escapado sin HTML, dos botones y sin overflow. Las pruebas Stats incluyen ES/EN/CA, cinco temas y tablet. No se ha probado Safari físico.
- `npm run build -- --base-href /kana-study/`: correcto (18.0 s), con los cuatro warnings SCSS conocidos de Grammar. Initial total 705.07 kB; dataset editorial en chunks lazy.
- `git diff --check`: correcto. Los warnings de conversión LF/CRLF de archivos generados previos no son errores de diff.
- Hashes SHA-256: todos los archivos pendientes de Stats V2, incluidos modelos, grabación, tests, traducciones y componentes, permanecen idénticos a la referencia previa. La única diferencia respecto a ese conjunto previo es el apéndice intencional de este hito en `MANGA_DECKS_DESIGN.md`.

Comandos unitarios ejecutados con el runner Angular (`npm test`, no Vitest sin inicialización de TestBed). La ejecución dirigida final incluyó `custom-deck.repository.spec.ts`, `custom-deck-pages.spec.ts`, `anki-study.page.spec.ts`, `anki-settings.page.spec.ts`, `anki-cards.page.spec.ts`, `daily-study-planner.service.spec.ts` y `profile-stats.service.spec.ts` mediante `--include=...`.

El gate global de validación no está verde por los fallos del trabajo previo; la implementación H1 permanece oculta. No se afirma un despliegue apto con la suite fallando.

Los archivos previos de Stats V2 se verifican contra hashes SHA-256 capturados antes de H1 en `.cache/h1-baseline.json` (referencia local no versionada). No hay cambios en ellos ni en sus traducciones. Dos tests existentes de `attempt-event.repository.spec.ts` usan fecha de evento actual y una consulta fija que termina el 9 de octubre de 2026; el 21 de octubre fallan aunque la escritura persista correctamente. Se documentan sin modificar el trabajo previo ni cambiar el reloj de la suite para ocultarlos. Otra pasada detectó una intermitencia en `attempt-integration.spec.ts`, test «Grammar practice and error reviews use exact exercise IDs and ignore duplicate submissions»: orden observado de firstAttempt `[false,true]` frente al esperado `[true,false]`; este archivo también permanece idéntico a la referencia previa.

## Archivos de H1

- `MANGA_DECKS_H1.md`.
- `e2e/custom-decks-h1.spec.ts`.
- `src/app/core/models/daily-study.model.ts`.
- `src/app/core/models/deck-catalog.model.ts`.
- `src/app/core/services/builtin-deck-content.ts`.
- `src/app/core/services/custom-deck-validation.ts`.
- `src/app/core/services/custom-deck.fixture.ts`.
- `src/app/core/services/custom-deck.repository.spec.ts`.
- `src/app/core/services/custom-deck.repository.ts`.
- `src/app/core/services/daily-study-planner.service.ts`.
- `src/app/core/services/daily-study-planner.ts`.
- `src/app/core/services/deck-catalog.service.ts`.
- `src/app/core/services/deck-persistence-router.ts`.
- `src/app/core/services/deck-route-resource.ts`.
- `src/app/core/services/deck-settings.service.ts`.
- `src/app/core/services/deck-study.service.ts`.
- `src/app/core/services/profile-stats.service.ts`.
- `src/app/features/anki-cards/anki-cards.page.html`.
- `src/app/features/anki-cards/anki-cards.page.ts`.
- `src/app/features/anki-settings/anki-settings.page.html`.
- `src/app/features/anki-settings/anki-settings.page.ts`.
- `src/app/features/anki-stats/anki-stats.page.html`.
- `src/app/features/anki-stats/anki-stats.page.ts`.
- `src/app/features/anki-study/anki-study.page.html`.
- `src/app/features/anki-study/anki-study.page.ts`.
- `src/app/features/anki-study/custom-deck-pages.spec.ts`.
- `src/app/features/anki/anki.page.ts`.
- `src/app/features/anki/components/deck-card/deck-card.html`.
- `src/app/features/anki/components/deck-card/deck-card.ts`.
- `src/app/features/daily/daily.page.html`.
- `MANGA_DECKS_DESIGN.md` (apéndice de decisiones implementadas).

## Hito 1.1 — Estabilización y cierre (2026-10-21)

Esta sección actualiza el estado de cierre; los resultados de H1 anteriores se conservan como historial. Scope exclusivo: tres specs de Stats V2 y este informe. Ningún archivo productivo ni dato histórico se modifica; el trabajo previo de H1/Stats V2 se conserva.

### Reproducción y causa exacta

1. `attempt-event.repository.spec.ts`, «captures workspace at session start even if an async write finishes after switching»: fallaba `expect((await list())[0]).toMatchObject(...)` (línea 55 previa). `list()` consulta `2026-10-01T00:00:00.000Z` a `2026-10-09T23:59:59.999Z`. El test no fijaba reloj. `AttemptRecordingService.record()` usa `new Date().toISOString()` al responder: en esta ejecución real, 21 de octubre de 2026, fuera de la consulta. No faltaba una escritura de Guest: se buscaba en una ventana anterior.
2. Mismo archivo, «storage errors do not throw into learning, and explicit retry keeps the original ID and time»: fallaba `expect(await list()).toHaveLength(1)` (línea 62 previa). El evento creado con el reloj real conserva correctamente ese timestamp al reintentar; también queda fuera de esa misma ventana fija.

Ambos se reprodujeron antes de corregir en un proceso con los dos archivos Stats aislados: 19/21 pasan, 2 fallan. Se habían reproducido asimismo en las suites completas de H1. No dependen de la presencia de Manga × Mazos. El reloj de los fixtures de inserción directa ya era 8 de octubre a las 12:00 UTC; solo las dos rutas a través del grabador usaban la fecha real.

La consulta es UTC y el grabador también serializa UTC. El 8 de octubre a las 12:00 UTC son las 14:00 en Madrid (UTC+2); el desfase no explica una separación de doce días. No se cambia ningún reloj de producción ni se amplía el rango para aceptar datos fuera de ventana.

3. `attempt-integration.spec.ts`, «Grammar practice and error reviews use exact exercise IDs and ignore duplicate submissions»: fallaba `recorded.map(e => e.firstAttempt)` esperando `[true,false]` y recibiendo `[false,true]` (línea 94 previa). Grammar inicia otra sesión con otro UUID al repasar errores. Si los dos eventos tienen el mismo milisegundo, el índice IndexedDB `(workspace,occurredAt)` desempata por la clave primaria `(workspace,id)`. Los IDs incluyen UUID de sesión: su orden léxico no implica cronología. El cursor ya ofrece un desempate determinista; no promete orden de inserción entre sesiones.

Se forzó la condición **antes de cambiar la aserción**: Date fijo en `2026-10-08T12:00:00.000Z`, primera sesión `ffffffff-ffff-4fff-8fff-ffffffffffff`, segunda `00000000-0000-4000-8000-000000000000`. El spec aislado reprodujo exactamente `[false,true]`: 11/12 pasan y 1 falla. Esto explica la apariencia dependiente de suite/orden: la carga cambia la probabilidad de empatar milisegundos, y el UUID decide entonces el orden; no se ha demostrado contaminación entre tests.

Se revisaron el grabador, repository y GrammarPracticeSession: `seen`, ordinales y promesas pendientes son de instancia/sesión; los tests esperan `settle()` antes de consultar y al desmontar; TestBed se resetea, cada test crea un IDBFactory, limpia localStorage y restaura globals/mocks. Los intervalos del StudyClock se limpian con DestroyRef. No se ha encontrado evidencia que justifique cambiar ese comportamiento productivo.

### Corrección y regresiones

- `attempt-event.repository.spec.ts`: reloj de test fijo en `2026-10-08T12:00:00.000Z` mediante `vi.useFakeTimers({toFake:['Date']})` y `vi.setSystemTime`. IndexedDB y temporizadores asíncronos siguen usando su ejecución real. Se espera settle, se desmonta TestBed y se restauran globals/mocks/Date en afterEach. Se mantienen las expectativas originales de aislamiento y retry.
- Dos casos nuevos fijan respectivamente 8 y 21 de octubre, comprueban el timestamp realmente persistido en una lectura completa y su inclusión/exclusión en la consulta **original sin ampliar**. Otro test comprueba extremos UTC inclusivos y milisegundos adyacentes. Otro explicita el desempate de timestamp por clave primaria con inserciones inversas.
- `attempt-integration.spec.ts`: el caso Grammar prueba los dos órdenes léxicos posibles de UUID con fechas exactamente iguales. Mantiene dos eventos exactos, IDs y exercise ID, timestamps, sessionId, `firstAttempt` y resultados correlacionados por ID de sesión. Verifica además el orden real del cursor esperado para el empate. No ordena por flags/resultados para encubrir mezclas; no exige cronología que el contrato no garantiza. Mantiene asimismo la igualdad exacta (`toEqual`) de los dos payloads de resultado por ID, además de las correlaciones anteriores. Restaura Date al finalizar.
- `attempt-analytics.spec.ts`: seis casos nuevos verifican ventanas de 7/30/90 **días de calendario** cruzando el adelanto y el retraso horario de Madrid, primer midnight exacto, milisegundo previo, ahora inclusivo y futuro excluido. Otros dos comprueban ambos instantes UTC del salto/repetición horaria sin pérdida/duplicación de eventos en su día Madrid. Se conservan las pruebas previas de días de 23/25 horas y periodos comparativos completos que excluyen hoy.

No se cambian cálculos, registros, esquema ni ordenación de producción. No hay sleeps, reintentos automáticos, skip/only/exclusiones ni ampliaciones de timeout.

### Validaciones H1.1

Entorno: Windows, Node **24.21.0**, npm **11.19.0**, Angular builder 22.2.0 y Vitest 4.1.11. No se afirma haber ejecutado Ubuntu/Node 24.15.0: `CI=true` reproduce la desactivación de caché del builder local, no cambia SO ni versión de Node.

| Ejecución independiente | Orden / caché | Resultado |
| --- | --- | --- |
| Reproducción original, repository + integration | habitual, antes del arreglo | 19/21; los dos fallos de fecha reproducidos |
| Reproducción aislada Grammar con empate forzado | Date fijo, UUID f… → 0…, aserción original | 11/12; intermitencia reproducida determinísticamente |
| Stats repository/integration/analytics corregidos | habitual | **42/42**, 3 archivos |
| Stats + integración H1 | archivos y tests barajados, seed 20261021 | **70/70**, 5 archivos |
| Suite completa 1, `npm test` | habitual, caché local | **1735/1735**, 173 archivos; build 19.360 s, tests 14.80 s |
| Suite completa 2 | archivos barajados, seed 20261022 | **1735/1735**, 173 archivos; build 19.222 s, tests 15.43 s |
| Suite completa 3 | archivos barajados, seed 20261023, `CI=true`, caché Angular/Vitest desactivada | **1735/1735**, 173 archivos; build 18.628 s, tests 14.73 s |
| Stats + integración H1, repetición 2 | archivos y tests barajados, seed 20261024 | **70/70**, 5 archivos; build 10.410 s, tests 4.82 s |
| Suite completa final tras conservar explícitamente igualdad exacta de payloads | habitual, proceso independiente | **1735/1735**, 173 archivos; build 18.620 s, tests 14.19 s |
| Playwright afectado | custom-decks-h1, stats-v2, daily-study; desktop-dark/mobile-light/narrow-dark | **27/27** (1.1 min), sin reintentos |
| TypeScript app y spec | `npx tsc -p tsconfig.app.json --noEmit` y equivalente spec | **correcto en ambos** |
| Build GitHub Pages | `npm run build -- --base-href /kana-study/` | **correcto**, build 18.573 s, los cuatro warnings SCSS conocidos de Grammar |
| `git diff --check` | scope final, sin commit/push | **correcto**, sin cambios de producción |

Las suites completas incluyen todos los specs sin omisiones. Se añaden **13 casos** respecto a los 1722 anteriores: cuatro de repository, un segundo orden UUID de Grammar y ocho de ventanas/DST. No se ha reproducido el fallo de fechas ni el de orden después del arreglo en estas ejecuciones. Esta matriz acotada aporta evidencia de estabilidad; no demuestra estabilidad absoluta ante cualquier entorno, semilla o carga.

### Reproducción de las ejecuciones con orden variable

La configuración de validación local `.cache/h11-order.config.mjs` (no cargada por `npm test` normal) contiene:

```js
export default {
  test: {
    sequence: {
      shuffle: {files: true, tests: process.env.H11_SHUFFLE_TESTS === '1'},
      seed: Number(process.env.H11_TEST_SEED ?? 20261021)
    }
  }
};
```

Las ejecuciones dirigidas barajan archivos y tests; las suites completas adicionales barajan archivos, conservando el orden declarado dentro de cada spec. No se configura ningún retry, filtro o exclusión en esta configuración. Cada comando inicia un proceso Angular/Vitest nuevo. Las variables se establecen solo en el proceso PowerShell de esa invocación. Para la ejecución sin caché se usa `CI=true`: con `cli.cache.environment` local por defecto, Angular 22 deshabilita su caché y pasa `cache:false` a Vitest; se ha verificado en el código del builder instalado. No se borra ni se limpia el árbol de trabajo o las cachés ajenas.

### Invariantes y estado de cierre

Confirmadas por los tests H1 sin modificar, la suite completa repetida y la comparación SHA-256 contra el estado inicial de H1.1:

- Japanese 1500 conserva datasets, IDs, proveedor, progreso legacy y estudio; el preview controlado sigue coincidiendo con el scheduler.
- FSRS custom sigue independiente por workspace/mazo/tarjeta. Again/Good y undo conservan la rama exacta, sin eventos/tiempo duplicados; editar glosas conserva progreso. El journal retiene operaciones confirmadas localmente y anulaciones, sin borrar recibos ni simular ACK remoto.
- Siguen pasando las guardas de cambios de workspace durante await, recargas y escrituras atómicas/reintentos, incluido el cruce de medianoche Madrid.
- Daily Study y Perfil conservan sus recuentos; Stats V2 conserva cálculos, persistencia y eventos. Los únicos cambios a Stats son sus pruebas y las regresiones de límites descritas.
- `CUSTOM_DECKS_ENABLED` sigue con `factory:()=>signal(false)`; ningún código productivo del H1 cambia. No se añaden sincronización cloud, SQL ni parámetros FSRS. `DeckSchedulerService` y datos Japanese 1500 no tienen diff.
- Archivos modificados en **este** hito: `src/app/core/services/attempt-event.repository.spec.ts`, `src/app/core/services/attempt-integration.spec.ts`, `src/app/core/services/attempt-analytics.spec.ts`, `MANGA_DECKS_H1.md`. Todos los demás archivos pendientes de H1 y Stats V2 conservan el mismo hash del inicio de H1.1; no hay reset ni limpieza de trabajo ajeno.

**Cierre H1.1:** satisfecho en el entorno validado. Las cuatro suites completas independientes pasan; una se ejecutó sin caché y dos variaron el orden de archivos. Las dos repeticiones dirigidas con orden de tests y archivos variable pasan. No quedan fallos abiertos de los problemas investigados ni se ha reproducido la intermitencia corregida. Se conserva la limitación empírica: no se garantiza estabilidad absoluta en cualquier entorno/carga/semilla. Se mantienen los cuatro warnings SCSS conocidos de Grammar. No se ha iniciado Hito 2. Sin commit ni push.
