# Manga × Mazos — Hito 4B-B

Fecha: 2026-10-22. Estado: H4B-B validado técnicamente en el arnés local; experimental, oculto y bloqueado para publicación real.
No se ha desplegado SQL, no se han usado cuentas ni contenido reales, no se inicia otro hito y no se hace commit/push.

## Estado inicial y alcance

Se inspeccionaron git status, diffs, las implementaciones locales y remotas y la documentación DESIGN, H1, H2BA, H3A, H4A, H4A1, H4BA y SUPABASE_SETUP. El árbol contenía numerosos cambios anteriores sin commit. La captura SHA256 inicial está en `.cache/h4bb-baseline.json`; la comparación final distingue esos cambios del trabajo de este hito. No se realizó reset, clean ni checkout destructivo.

H4B-A ya ofrecía transporte, CAS, staging, recibos, journal y consulta de conflictos. Faltaban una decisión Guest integrada, un coordinador recuperable, consentimiento y resoluciones explícitas. El nuevo código reutiliza ese protocolo: **no modifica ninguna migración SQL ni el scheduler**.

## Arquitectura y checkpoints

`CustomGuestImportService` captura el workspace Guest de forma readonly y el propietario autenticado sintético de destino. El identificador de importación es un hash del propietario y la huella del inventario. Los checkpoints viven en el registro de reconciliación existente del destino, sin incrementar la versión de IndexedDB ni tocar Guest.

Cada plan conserva el inventario original completo: mazos, tarjetas, identidades, confirmaciones, namespaces, vínculos, snapshots, eventos y anulaciones, días, journal, tombstones, equivalencias y evidencia previa. Las imágenes, archivos manga, OCR completo y diccionarios no pertenecen a estos almacenes y no se copian. No se llama a la migración del registro Guest durante la captura.

Cada paso congela su petición antes de HTTP. Conserva operationId, petición, recibo, decisión, estado y dependencias. Se consulta el recibo original antes de aplicar: una respuesta perdida o una cuota posterior al commit remoto no producen una nueva publicación. El coordinador no mantiene una transacción IDB abierta durante la red.

Contenido y dependencias se publican atómicamente por tarjeta mediante el contrato H4A y su manifest. La importación completa no es una única transacción remota. Puede haber tarjetas completas ya confirmadas mientras otras siguen pendientes. La migración global solo se cierra cuando todas las dependencias y decisiones están completas, no quedan conflictos ni journal pendiente y la publicación local canónica se ha validado. `published` se registra en el mismo commit local que la publicación del adaptador; no basta con haber enviado los pasos.

El origen se vuelve a comparar al terminar los pasos **y después del pull final**. Si cambia, se conserva el checkpoint y se pide una nueva pasada confirmada. Una captura completa antigua puede quedar vinculada mediante `supersededBy` a la nueva pasada completada; no se borra su evidencia. Una captura con conflictos pendientes no se declara superada automáticamente.

Dos pestañas calculan el mismo identificador y conservan la primera petición congelada dentro de una transacción. Los recibos/CAS del servidor arbitran los envíos coincidentes. Una pérdida de CAS local deja Pending y exige reanudar; no hay esperas arbitrarias ni reintentos automáticos que oculten errores.

## Identidad y procedencia

Se mantienen cardId, eventId, snapshots, idioma, contexto breve, namespace y ancla original. La confirmación Guest conserva `workspace: guest` y su actor original. La relación con la cuenta destino es un binding externo al recibo, validado solo al publicar evidencia remota aceptada. El propietario remoto se obtiene de la sesión verificada por PostgREST y `auth.uid()`; el UUID de un recibo nunca autoriza un envío.

Un mismo origen puede importarse en A y B, con recibos y filas remotas aislados por propietario. Si un ID ya existe, se comparan contenido, identidad y confirmaciones. Una divergencia usa CAS y queda bloqueada; no se unen entidades por superficie, lectura o glosa. No se crean equivalencias con Japanese 1500.

El adaptador puede recuperar una confirmación cuyo recibo original rechazado fue seguido de una resolución aceptada con otro operationId: busca un recibo aceptado del mismo owner, valida la petición y demuestra que contiene exactamente la confirmación publicada. No confunde el ACK histórico con la versión canónica actual.

## FSRS, historial y tiempo

No se ejecuta ts-fsrs para importar: se transfieren los snapshots y eventos originales. Los ancestros preceden al head. Un caso importante es un head activo con descendientes anulados por undo: H4A hace inmutables los eventos y rechaza importaciones posteriores a crear progreso. Por tanto, el head, sus descendientes anulados y el snapshot se publican juntos; los ancestros anteriores pueden viajar en pasos previos. Los días adicionales también se conservan, incluso días completados sin un head nuevo.

Una rama divergente no se suma, promedia, rebasa ni reproduce como nuevos repasos. El progreso destino permanece canónico. La rama Guest completa sigue en Guest y en el inventario durable del plan; el servidor conserva la petición rechazada y su recibo. No se promete que un navegador limpio recupere todo el inventario local de una rama rechazada: eso no forma parte del protocolo H4A actual.

Durante una importación parcial puede existir evidencia remota de ancestros sin snapshot final. Esos eventos se conservan, pero solo los alcanzables desde un head canónico cuentan como eventos efectivos. Al elegir el estado confirmado se reemplaza la proyección local con la publicación validada; la rama perdedora permanece en journal, plan y archivo de conflictos, sin doble conteo. Se preservan `elapsedAnswerMs`, los relojes FSRS y los timestamps originales.

## Conflictos y decisiones

Se distinguen contenido, duplicados, identidades incompatibles, review, undo, delete/edit, restore, progreso Guest y dependencias. Se muestra el objeto, el origen, la versión confirmada leída del servidor, la propuesta, el tipo de incompatibilidad y las consecuencias. No se muestran IDs privados, recibos crudos o tokens.

- **Mantener confirmado**: nueva operación CAS sobre el manifest/estado vigente. Archiva la evidencia rechazada y las intenciones locales dependientes. `suppressed` indica una decisión explícita verificada; no fabrica ACK para las operaciones rechazadas ni borra el journal.
- **Nueva edición**: solo contenido con identidad idéntica y dependencias válidas. Usa revisión vigente, nueva versión de contenido y operationId propio. No toca FSRS. Si cambia otra vez la revisión, la resolución también queda rechazada y requiere otra decisión explícita.
- **Restaurar**: requiere un tombstone conocido y revisión vigente. Restaura el contenido canónico guardado, nunca aplica implícitamente la edición Guest antigua ni reemplaza estudio. La evidencia del borrado y sus recibos permanecen.
- **FSRS/undo**: mantener confirmado y archivar la rama; volver a estudiar después sería una sesión real nueva. No existe botón de fusionar historiales.

Identidades incompatibles no se pueden rebasar. Dependencias ausentes, registros H1 sin confirmación demostrable, ediciones no respaldadas por su confirmación, conflictos anteriores Guest sin cerrar y capturas inválidas permanecen bloqueados. Las dependencias remotas rechazadas por SQL no se convierten en un éxito local.

Los límites H4A siguen vigentes: 64 cambios y 512 KiB por petición. Una familia de head con demasiados descendientes anulados para publicarse atómicamente queda bloqueada y conservada; este hito no introduce un protocolo nuevo para saltarse esos límites. Tampoco ofrece rebase de ajustes divergentes de mazo ni de días de estudio: puede elegirse conservar lo confirmado; no se mezclan contadores automáticamente.

## Cuenta, consentimiento y UI

`Utilizar mi cuenta` no crea planes ni copia Guest. `Revisar fusión Guest` presenta inventario, consecuencias, consentimiento y confirmación separados, inicialmente sin marcar. Login solo detecta la necesidad de decidir; nunca inicia una importación custom.

El flujo legacy continúa copiando sus propios almacenes al confirmar merge. Su resultado confirmado no se revierte por un fallo custom. Al haber datos custom, la decisión global queda pendiente hasta `finishCustomGuestImport()` y su prueba de publicación completa. Se comprueban propietario, generación de Auth y revisión de activación, también para A→B→A.

No existe atomicidad entre localStorage, las bases legacy y el registro custom. Una interrupción puede dejar módulos legacy importados y custom pendiente; se conserva el resultado de los primeros y se reanuda el segundo. No se añaden operaciones custom a SyncService/SyncOutboxService.

El panel usa Perfil y la decisión Guest de Auth. Está condicionado por los tres gates, con controles semánticos, foco visible, confirmaciones, estados accesibles y estilos por variables de tema. Las actualizaciones de UI se cercan por cuenta/activación; un resultado antiguo no publica versiones privadas en el panel de otra cuenta. Perfil ignora una lectura de estadísticas invalidada por cambio de workspace; no modifica cálculos de Stats V2.

Consentimiento afirmativo versión 1, historial y revisión asociados a cada workspace. Se verifica justo antes de cada apply y la retirada cancela subidas futuras. Un commit remoto ya aceptado se conserva y se puede consultar; retirar consentimiento no elimina datos remotos. Se explica qué sube/no sube, privacidad por controles de acceso, ausencia de cifrado extremo a extremo y acceso posible del operador. ES/EN/CA sincronizados.

`CUSTOM_DECKS_ENABLED`, `MANGA_DECK_ASSISTED_ENABLED` y `CUSTOM_DECK_SYNC_ENABLED` siguen false. Además `CUSTOM_REMOTE_UPLOAD_APPROVED` es false y bloquea el apply del SDK real. No hay URL/localStorage/provider productivo para activarlo. Los tests sustituyen el puerto exclusivamente en el navegador de desarrollo, con propietarios sintéticos del arnés. JWT y claves de firma permanecen en Node, nunca en el frontend.

## Validación y entornos

Los tests Angular usan IndexedDB real simulado y fallos controlados de transporte para cuotas, checkpoints, consentimiento y cercas. No se atribuye a esos doubles validación SQL. Playwright sí usa los servicios de la aplicación, FSRS real, repositorios reales, RPC reales de PostgreSQL/PostgREST y dos o más contextos por escenario. El binding HTTP de Node conserva los JWT fuera del navegador; no representa CORS ni el cliente Auth de Supabase.

Entorno: Windows x64, Node 24.21.0, PostgreSQL 17.5, PostgREST 16.5, PGlite 0.3.14. No se atribuye esta ejecución a Ubuntu/CI ni a Supabase Auth.

| Comprobación | Resultado observado |
| --- | --- |
| Dirigidos Guest/custom/sync/identidad + Grammar | 158/158, 10 archivos; 8.60 s, compilación 11.586 s |
| Grammar aislado tras el timeout bajo carga | 14/14; 2.79 s de tests, 6.52 s de proceso, sin cambiar timeout |
| Angular completo, primera pasada | 1851/1851, 181 archivos; antes de ampliar las regresiones finales |
| Angular completo, segunda pasada | 1857/1857, 182 archivos; 14.38 s |
| Angular bajo build + navegador concurrentes | 1856 correctos, 1 timeout Grammar; 19.70 s, documentado abajo |
| Angular final sin otros compiladores concurrentes | **1859/1859**, 182 archivos; 13.32 s, compilación 19.235 s |
| PGlite, proceso separado | 23/23 escenarios SQL/protocolo |
| PostgreSQL nativo, regresión | 23/23 escenarios SQL/protocolo |
| PostgreSQL multisesión | 16/16, 15 solapamientos bloqueados observados en backends distintos |
| HTTP/JWT PostgREST | 8/8 grupos; firma, expiración, aislamiento, RLS, DML y permisos |
| Playwright nuevo H4B-B | 8/8, servicios y RPC reales, al menos dos contextos por escenario |
| Playwright regresión H4B-A | 3/3; pasada conjunta final 11/11, 48.4 s, retries=0 |
| Probes PostgREST | 3/3 arranques independientes en la pasada final; sin salida 3 |
| TypeScript app/spec | Ambos exit 0 |
| Build GitHub Pages | exit 0, 19.938 s |
| git diff --check | exit 0; avisos de normalización LF/CRLF, sin errores |
| Whitespace de los 13 archivos nuevos | Sin espacios al final de línea |
| Revisión visual | Capturas desktop dark 1280 px / mobile light 390 px inspeccionadas; sin overflow horizontal móvil |

El build conserva los cuatro warnings SCSS Grammar conocidos y añade un aviso no bloqueante de presupuesto inicial: **754.97 kB frente a 750 kB (+4.97 kB)**. No se aumentó el presupuesto ni se silenció el aviso. Se deja señalado para revisar antes de publicación.

La pasada integrada final está en `.cache/h4a1-runtime/run-Nze0do/`: results.json separa SQL/concurrencia/HTTP y browser-tests.log registra 11/11. Una pasada anterior con los ocho escenarios nuevos también terminó 11/11 en 34.5 s (`run-8KpJ1Z`). No se suman resultados de versiones anteriores para aparentar cobertura adicional. Logs PostgreSQL/PostgREST redactados; procesos terminados por el arnés. Capturas en `.cache/h4bb-mobile-light.png` y `.cache/h4bb-desktop-dark.png`.

Comparación final de la captura: **1477 archivos iniciales, 1457 idénticos, 20 modificados de alcance H4B-B y 13 nuevos; ninguno eliminado**. Se preservaron los cambios anteriores. Esto confirma que los archivos de Stats V2, Japanese 1500, FSRS/scheduler, Manga Saved, SyncService, SyncOutboxService y SQL mantienen su contenido inicial.

Cobertura end-to-end:

| Escenarios solicitados | Prueba |
| --- | --- |
| 1–5, 9–10 | Guest crea/estudia; UI cuenta sin importar, merge explícito, repetición, otra cuenta, idioma/contexto, logout |
| 6–8 | Destino preexistente, progreso divergente, conservar canónico con evidencia sin segundo evento |
| 11–12 | Offline, recarga, checkpoint y pérdida de ACK tras commit |
| 13–14 | Cambio A/B y A/B/A con respuesta detenida; dos pestañas, CAS y fuente modificada |
| 15–16 | Tombstone contra edición antigua, restore explícito y rebase de glosa sin tocar FSRS |
| 17–19 | Undo obsoleto contra review posterior, rebase inseguro bloqueado, importación incompleta sin Synced |
| 20 | Suite legacy completa, SQL de tablas/grants históricos sin cambios, regresiones H4B-A |
| Historial adicional | Head activo con hijo anulado, ancestros, tiempos exactos y días distintos en un navegador limpio |

La suite no usa skip/todo/only, exclusiones para ocultar fallos ni aumentos de timeout. Los reintentos del propio escenario son recuperaciones explícitas del usuario, no reintentos automáticos del runner.

## Incidencias encontradas durante desarrollo

1. Cierre prematuro si Guest cambiaba durante el pull final: ahora hay segunda comprobación y regresión.
2. Una rama o ancestro importado sin head podía entrar en la proyección efectiva: se distingue evidencia de eventos alcanzables canónicos.
3. Head y descendientes anulados no se podían enviar en orden ingenuo por la inmutabilidad SQL: se publican juntos. Se conserva la validación SQL sin relajarla.
4. Perfil podía dejar una promesa rechazada al cambiar de workspace durante su carga: se descarta únicamente la lectura cuya activación cambió.
5. Fixtures: el test concurrente escribía Guest desde una pestaña activa en cuenta (el repositorio lo rechazaba correctamente); se activó Guest en la pestaña editora. La comparación de eventos no debe asumir orden cronológico de IndexedDB: compara IDs y registros completos, conservando todos los campos.
6. Una ejecución completa paralela a build y arnés de navegador agotó 5 s en el recorrido exhaustivo preexistente de Grammar (`grammar.spec.ts`, línea 132; 6628 ms). No se cambió Grammar ni el timeout. Se registra la validación posterior sin compiladores concurrentes; la coincidencia con carga es evidencia, no una demostración de estabilidad absoluta.

No se ha reproducido salida 3 de PostgREST en las pasadas de este hito. Se mantienen los logs redactados, pool HTTP=1, LC_ALL/LANG=C y probes de arranque. La causa previa Windows/libpq/locale **sigue sin demostrarse**. Los probes abortan al primer fallo, sin ocultarlo mediante retry. La concurrencia real de SQL se mide en conexiones independientes; el pool HTTP de una conexión no demuestra contención multisesión de producción.

## Archivos de este hito

Nuevos:

- `src/app/core/models/custom-guest-import.model.ts`.
- `src/app/core/services/custom-guest-import.service.ts`, `custom-guest-import-helpers.ts`, `custom-conflict-resolution.service.ts`.
- `src/app/core/services/custom-guest-import.spec.ts`, `custom-guest-auth.spec.ts`, `custom-deck-sync-port.fixture.ts`.
- `src/app/features/profile/custom-cloud-panel.ts`, `.html`, `.scss`.
- `e2e/custom-decks-guest.spec.ts`, `e2e/custom-decks-sync.fixture.ts`.
- Este informe.

Modificados respecto a la captura inicial H4B-B:

- CustomDeckRepository, CustomDeckSyncAdapter y su spec, CustomDeckSyncTransport y modelo de reconciliación.
- WorkspaceMigrationService, AuthService y su spec.
- Perfil y Auth (`.ts`/`.html`); sin rediseñar sus pantallas.
- Traducciones ES/EN/CA y `core.generated.ts`.
- Arnés nativo y spec H4B-A (helpers compartidos y consentimiento sintético explícito).
- MANGA_DECKS_DESIGN.md y SUPABASE_SETUP.md.

No se modifican en este hito Stats V2, Japanese 1500, Manga Saved FSRS, scheduler/FSRS, SyncService, SyncOutboxService, SQL, package.json ni lockfile. Algunos ya tenían cambios de hitos previos: se preservan tal cual la captura inicial.

## Bloqueos de publicación y siguiente fase

Supabase Auth/GoTrue permanece pendiente de validación independiente: signup, login, refresh, logout y gateway real de Supabase con sus cabeceras/CORS, además de dispositivos/Safari físicos. Los propietarios del arnés no sustituyen esa prueba. No se ha utilizado ningún entorno real.

Antes de publicar: resolver esa validación, revisar límites/casos bloqueados y política de retención de evidencia, revisar el presupuesto inicial del build, probar UX y accesibilidad en dispositivos reales, investigar la incidencia previa de arranque y obtener autorización separada para SQL y activación. La próxima fase recomendada es esa validación acotada y revisión de publicación; **no se inicia automáticamente**.
