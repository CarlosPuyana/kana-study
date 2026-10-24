# Manga × Mazos — H4B-A: transporte y reconciliación aislados

Fecha: 22/10/2026. Integración técnica preliminar, oculta y local-first. No autoriza sincronización de cuentas reales. Supabase Auth sigue pendiente; H4A.1 no se declara cerrado. No se implementa ni inicia H4B-B.

## Arquitectura

- `custom-deck-sync-transport.ts`: puerto inyectable y transporte con el cliente Supabase existente. Reutiliza AuthService y la sesión, sin otro sistema de autenticación. Fija Authorization al token capturado para impedir que una búsqueda posterior del SDK seleccione otra cuenta durante el envío. No contiene tokens de desarrollo ni secretos de firma.
- `custom-deck-sync-protocol.ts`: prepara peticiones H4A desde operaciones reales del journal y combina revisiones sin rebobinar entidades. No ejecuta FSRS.
- `custom-deck-sync-adapter.ts`: push secuencial, verificación independiente de recibos, staging paginado, validación de manifest, publicación y estados internos Pending/Offline/Error/Conflict/Synced.
- `CustomDeckRepository`: upgrade aditivo de IndexedDB a versión 3, store `reconciliation`, contexto de journal y publicación atómica con CAS local.

El nuevo gate `CUSTOM_DECK_SYNC_ENABLED` es `signal(false)` por defecto, sin preferencia localStorage ni ruta/URL que lo habilite. `CUSTOM_DECKS_ENABLED` y `MANGA_DECK_ASSISTED_ENABLED` siguen false. El catálogo solo ofrece un acceso interno lazy al adaptador; construirlo no inicia sincronización. No hay temporizador de sincronización, pantalla pública, llamada desde SyncService ni nuevas operaciones en SyncOutboxService legacy.

## Persistencia y journal

Cada workspace conserva por separado:

1. Journal original, sin borrar ni cambiar IDs/request/payload tras ACK.
2. Registro permanente H4A de identidades, confirmaciones completas y vínculos.
3. Peticiones preparadas congeladas, recibos verificados y conflictos.
4. Mirror de revisiones conocidas y staging de la descarga actual.

Review, undo y sus estados diarios registran el head y snapshot previos junto con el commit local. La preparación reutiliza el evento original y el ID real del journal. No crea un nuevo evento por reintentar, no reconstruye reviews desde snapshots ni suma elapsedAnswerMs. El estado diario preparado es el que realmente se conservó localmente, incluidas introducciones y completedAt.

Para journal anterior a H4B-A, se recuperan el orden de la tarjeta durable y el head del evento original. Undo exige el progreso de su review original conservado en el journal. Si falta evidencia, la operación queda pendiente con Error; no se inventa. Un create genérico H1 sin identidad curada y confirmación H4A verificables tampoco se promociona artificialmente al protocolo: necesita migración explícita. No se copian ni relabelan registros Guest.

El namespace local queda fijado por instalación/workspace para seguir rechazando propuestas iniciales concurrentes obsoletas. Los recibos importados de otro navegador pueden tener otro namespace, conservando hashes e IDs originales; no se infieren equivalencias ni se fusionan historiales.

## Push y ACK

Se captura workspace, principal y revisión monotónica de activación. Se verifica después de cada await y dentro de las transacciones de escritura. La revisión de activación detecta también A→B→A. Las respuestas llevan un owner de transporte y los recibos incluyen user_id comprobado.

Antes de enviar se persiste exactamente la petición preparada. Se consulta el recibo por el ID original; si falta, se envía la RPC y se vuelve a consultar el recibo. Solo se confirma cuando petición y resultado coinciden, con el propietario y esquema esperados. Una respuesta perdida tras commit se recupera consultando el mismo recibo, sin crear otro opId. Un ACK no publica sus snapshots históricos sobre contenido local: actualiza únicamente el registro de confirmación y el mirror de revisiones con comparación monotónica.

Si aparece una escritura local durante ACK/pull, no se publica una descarga que la sustituya y el estado queda Pending. El CAS del registro de reconciliación evita que dos adaptadores/pestañas reemplacen sus peticiones preparadas. Una colisión local exige un ciclo posterior explícito; no hay reintentos artificiales del adaptador.

## Pull, staging y publicación

Cada ciclo reconstruye un staging desde cursor 0, porque el feed H4A expone últimas filas y no un log histórico inmutable. Los checkpoints sobreviven una recarga; el siguiente ciclo reinicia deliberadamente su generación, conservando el último contenido completo. Cada página exige cursor creciente, revisiones válidas y serverRevision constante. Las entidades conocidas no pueden desaparecer de una respuesta vacía o retroceder de revisión.

Se comprueba cada manifest contra un bundle fresco y sus referencias/revisiones. El control final de generación rechaza cambios detectados durante el recorrido. Bundles `paged-required`, manifests incompletos, contenido staged sin publicación y progreso sin contenido quedan sin publicar; el staging durable sirve de cuarentena. Una descarga incompleta no equivale a un mazo vacío.

La publicación usa una sola transacción IndexedDB que compara versión local y journal capturado. Las peticiones HTTP y las validaciones asíncronas ocurren fuera de la transacción. Se aplican primero mazos y después tarjetas, independientemente del orden de revisiones del feed; se actualizan contenido, registro permanente, snapshots, eventos, días y estado de reconciliación atómicamente. Un fallo de cuota revierte la publicación y permite retomar desde recibos ya guardados.

Los tombstones permanecen en el mirror durable y en el servidor. Se retira contenido de estudio, conservando evidencia e historial; no hay restauración automática. Cambios de glosa confirmados mantienen el mismo ID y FSRS. Los fragmentos/procedencia y las confirmaciones se validan antes de publicar, sin depender de Manga o diccionario instalados en el receptor.

Límites conservadores: este primer adaptador requiere bundles completos de H4A. Un bundle que excede el presupuesto y devuelve `paged-required` se rechaza para estudio; no se implementa una publicación parcial para simular soporte de catálogos grandes. Las descargas materializan el inventario completo y el registro por workspace; falta medir memoria/cuota en dispositivos reales. No se han ejecutado benchmarks no afectados.

## Conflictos, offline y pestañas

Una respuesta CAS Conflict guarda durablemente petición, fuente original, resultado y motivo, consultables con `conflicts()`. La rama local perdedora sigue disponible como evidencia y el mirror ganador no la sobreescribe silenciosamente. No se promedian parámetros ni fechas. Con conflictos, no se declara Synced ni se procesan automáticamente las operaciones dependientes. No se implementa una pantalla ni una política automática de resolución.

Offline permite confirmar y estudiar con el repositorio y scheduler existentes. Se conserva el journal y se informa Offline al fallar el transporte sin conexión. Las operaciones nuevas cambian Synced a Pending. BroadcastChannel informa invalidaciones locales entre pestañas, sin transmitir contenido privado; hay invalidación conservadora al recuperar foco como fallback. Los datos siempre se releen de IndexedDB, no se aceptan mensajes de canal como autorización ni como contenido.

El cliente puede mostrar un estado completo de una generación ya comprobada mientras el servidor cambia después: no se promete una instantánea distribuida permanente. Un ciclo posterior vuelve a comprobar el servidor. No hay transporte automático en segundo plano activado para usuarios reales.

## Defectos encontrados y corregidos

### Reloj de preview frente a reloj de pulsación

El flujo real calcula FSRS al mostrar la respuesta, mientras reviewedAt registra la pulsación posterior. H4A rechazaba el evento al exigir igualdad de fsrsLog.review y reviewedAt, y también vinculaba card.lastReview/linaje al reloj equivocado. La fixture anterior usaba el mismo instante para todo y ocultaba la incompatibilidad.

Se corrigió únicamente la validación de la migración H4A todavía no desplegada: el instante FSRS no puede ser posterior a la pulsación, card.lastReview coincide con fsrsLog.review y el linaje compara instantes FSRS. Se conservan ambos valores originales. No se cambian scheduler, temporizadores, revisiones CAS, RLS ni registros históricos. El escenario SQL 12 añade dos reviews con pulsación posterior al preview y rechaza un preview futuro; se ejecuta tanto en PGlite como en PostgreSQL nativo. Playwright utiliza además el flujo real Mostrar respuesta→Bien.

### Orden del feed y dependencias locales

La prueba de ACK retrasado añadió ajustes antes de que otro navegador descargara el mazo. El deck pasó a tener una revisión posterior a la de sus tarjetas. La primera implementación recorría ese orden y omitía la tarjeta al no existir aún el padre local. La publicación ahora ordena por dependencias dentro de la misma transacción. Hay regresión Angular de receptor vacío y prueba real de dos navegadores.

## Pruebas nuevas de navegador

`e2e/custom-decks-sync.spec.ts` tiene tres escenarios con contextos independientes y un caso adicional de dos pestañas compartiendo IDB. Solo usan usuarios, contenido y JWT sintéticos del clúster local. Los tokens se quedan en Node: un binding de prueba implementa el puerto HTTP inyectable hacia PostgREST; no se incorpora un endpoint o emisor de pruebas al frontend.

| Escenario | Comprobaciones |
| --- | --- |
| Roundtrip y estudio | A confirma; ACK queda detenido después de commit; A añade ajustes; el ACK antiguo no los rebobina; B descarga y estudia con UI real sin Manga/diccionario; se pierde la respuesta de review; reload/reintento recupera recibo; A/B conservan mismos IDs, eventos y snapshots; edición confirmada de glosa mantiene FSRS |
| Offline y tombstones | A/B estudian offline usando DeckStudyService/ts-fsrs real; una rama gana y la otra conserva conflicto y evidencia tras reload; receptor limpio ve el ganador; delete retira la tarjeta; un restore de navegador con revisión obsoleta produce Conflict y no resucita el servidor |
| Recuperación y aislamiento | Feed se interrumpe tras una página, staging sobrevive reload; cuenta cambia mientras una página está detenida y no recibe datos de la anterior; dos pestañas comparten IDB y CAS sin perder journal |

El binding permite cortar o detener respuestas de forma determinista; no prueba CORS, proxy/TLS, fetch del navegador hacia Supabase ni emisor GoTrue. El modo offline combina navigator.onLine del contexto y un transporte de prueba que rehúsa enviar sin conexión. Las peticiones que sí se envían son HTTP reales y pasan por JWT/RLS/RPC de PostgREST. No se presentan mocks Angular como prueba del gateway.

## Reproducción y entorno

Se reutilizan PostgreSQL 17.5 portátil, PostgREST 16.5, pg 8.16.3, PGlite 0.3.14 y Node 24.21.0 de H4A.1 en Windows x64. Configuración y descargas están descritas en SUPABASE_SETUP. Todo escucha en loopback y se detiene al salir.

```powershell
node scripts/test-custom-decks-sql.mjs
node scripts/test-custom-decks-native.mjs --browser-tests --startup-probes=3
npm test
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npm run build -- --base-href /kana-study/
git diff --check
```

Los probes son arranques independientes controlados: cualquier fallo aborta, no se reintenta el arranque que ha fallado. Se conservan results.json, postgres.log, postgrest.log y browser-tests.log redactados en el directorio run-* de caché. No se consumen credenciales de producción ni se despliega remotamente.

## Incidencia de arranque PostgREST

Se reprodujo salida 3 antes de completar el arranque, incluso con db-pool=1. No se diagnosticó una causa exacta con stack nativo. Se mantiene un pool HTTP acotado y se normaliza el locale del proceso a C; esto no altera JWT, SCRAM ni RLS. Las pruebas de contención PostgreSQL siguen usando conexiones independientes.

Un [informe oficial antiguo de PostgreSQL sobre Windows/libpq/gettext](https://www.postgresql.org/message-id/17299-7270741958c0b1ab@postgresql.org) describe un síntoma parecido. Es una hipótesis para aislar variables, no una identificación demostrada del fallo de esta versión. Los arranques posteriores comprobados se registran en los resultados; no se declara resuelta definitivamente la incidencia ni estabilidad absoluta.

## Archivos de este hito

Nuevos: modelo `custom-deck-reconciliation.model.ts`; transporte, protocolo y adaptador `custom-deck-sync-*.ts`; specs `custom-deck-sync-adapter.spec.ts` y `custom-deck-sync-transport.spec.ts`; e2e `custom-decks-sync.spec.ts`; este informe.

Modificados: `custom-deck.repository.ts`, `deck-catalog.model.ts`, `deck-catalog.service.ts`, `manga-deck-assisted.service.ts`, `workspace.service.ts`, migración H4A preparada, runner SQL y runner nativo; DESIGN y SETUP. La referencia `.cache/h4ba-baseline.json` permite verificar que el trabajo previo ajeno permanece intacto.

## Pendientes y criterio de cierre

Supabase Auth/GoTrue, login/refresh/JWKS reales, consentimiento traducido, dispositivos físicos, catálogos superiores al bundle completo, UX de resolución y migración Guest quedan pendientes. Guest no se copia, borra ni reetiqueta. Para H4B-B habrá que acordar copia y divergencias conservando origen, además de los controles de consentimiento y activación separados.

H4B-A solo puede considerarse completado técnicamente para el entorno aislado cuando pasen las validaciones finales registradas debajo. Esto no cierra H4A.1 ni autoriza cuentas reales, SQL productivo o H4B-B. No se hace commit ni push.

## Validación final y decisión

| Comprobación nueva de H4B-A | Resultado real |
| --- | --- |
| Adaptador/reconciliador/transporte y regresiones dirigidas | 97/97, 6 archivos; 24 casos nuevos de H4B-A y 73 existentes; build 9.148 s, tests 4.09 s |
| Suite Angular completa final | 1834/1834, 180 archivos; build 20.909 s, tests 13.40 s |
| Playwright nuevo, desktop Chromium | 3/3 escenarios, 24.8 s; contextos independientes y caso de pestañas compartidas; sin reintentos |
| SQL PGlite 0.3.14 | 23/23, incluida la regresión nueva de relojes dentro del escenario 12 |
| SQL PostgreSQL 17.5, regresión monoconexión | 23/23, misma regresión de reloj real |
| PostgreSQL nativo multisesión | 16/16; 15 bloqueos/solapamientos observados, con tres repeticiones de las carreras críticas |
| PostgREST 16.5 HTTP/JWT | 8/8 grupos; separado de las pruebas de navegador y PGlite |
| Probes de arranque finales | 3/3, LC_ALL/LANG=C y pool HTTP=1; no demuestra resolución definitiva de la salida 3 |
| TypeScript app/spec | Ambos exit 0 |
| Build Pages --base-href /kana-study/ | exit 0, 19.248 s; cuatro warnings SCSS Grammar conocidos |
| git diff --check | exit 0; avisos LF/CRLF preexistentes, sin errores |

La última ejecución integrada del arnés quedó en `.cache/h4a1-runtime/run-dnl5QN/`:
results.json distingue los resultados SQL/concurrencia/HTTP; browser-tests.log conserva
la pasada Playwright. Los logs PostgreSQL/PostgREST están redactados. Los procesos se
han detenido. Hubo otras pasadas correctas durante implementación, pero la tabla registra
la versión final, no suma resultados históricos para aparentar más cobertura.

Se registran sin ocultarlos los fallos de desarrollo: fixture de perfiles con username
duplicado (corregida con usernames sintéticos únicos), formato de import de la fixture
e2e (adaptado al runner CommonJS existente), igualdad incorrecta de relojes SQL,
orden de publicación dependiente del feed y propuestas locales de namespace que debían
seguir rechazándose. Ningún test se ha omitido ni relajado para aceptar esos fallos.

El snapshot inicial tenía 1469 archivos: 1459 permanecen idénticos por SHA256. Los diez
modificados son los enumerados en este informe y los apéndices DESIGN/SETUP. Se añaden
ocho archivos H4B-A. Stats V2, Japanese 1500, scheduler/FSRS, Manga Saved, SyncService,
SyncOutboxService, migraciones legacy y recursos experimentales quedan intactos. No
hay cambios de estilos, cadenas ni temas; no se atribuye a esta pasada QA físico ni
validación de Safari. Los tres gates siguen false; paquete/lock raíz sin cambios.

**H4B-A queda completado técnicamente en el entorno aislado probado.** Los bloqueos de
Supabase Auth/consentimiento/Guest/dispositivos reales y la incidencia de arranque no
se dan por resueltos. La API de lifecycle es interna y encola intenciones; no añade UX
pública de borrado/restauración offline. La resolución explícita de conflictos sigue
siendo una decisión pendiente de producto: solo se ofrece consulta interna durable.
No se inicia H4B-B, no se habilita sincronización real y no se despliega SQL. Sin commit
ni push.
