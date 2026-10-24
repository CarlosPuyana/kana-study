# Manga × Mazos — H4B-D1: protocolo remoto V2

Fecha: 2026-10-22. Protocolo experimental preparado y aplicado únicamente en bases efímeras. No despliegue SQL, cuentas reales, activación, commit ni push. **Angular/Guest continúan utilizando V1: D2 no está implementado y la funcionalidad pública sigue bloqueada.**

## Referencia y alcance

Se inspeccionó git status antes de editar y se registró la huella de todos los archivos existentes en `.cache/h4bd1-baseline.json`, con el estado en `.cache/h4bd1-status.txt`. Se revisaron DESIGN, H4A, H4A1, H4BA, H4BB, H4BC y SETUP; migración/RPC V1, manifest/feed, recibos, conflictos, importador Guest, recuperación, adaptador y registro/journal. Se conserva el trabajo previo sin reset, clean ni checkout destructivo.

La migración aditiva `202610220002_custom_transfers_v2.sql` no sustituye funciones V1 ni modifica sus cuerpos, tablas o permisos. El arnés compara sus definiciones antes/después. Se mantienen sus reglas de payload, identidad, confirmación, linaje, CAS y tombstones. No hay cambios de scheduler, Stats V2, Japanese 1500, Manga Saved FSRS o sincronización legacy.

## Decisión de protocolo y frontera de visibilidad

Una transferencia `guest-import` tiene un manifest cerrado e inmutable y chunks separados de las entidades canónicas. Cada chunk contiene texto JSON UTF-8 exacto de registros `{type:'operation', value:<petición V1 original>}`. La secuencia conserva operationId, cambios, snapshots, eventos, anulaciones, tiempos y peticiones originales. Su SHA-256 se calcula sobre **ese texto exacto**, sin volver a serializar floats FSRS para verificarlo. Cambiar espacios cambia el digest del chunk. Los recibos de transporte identifican además la petición jsonb normalizada que recibió PostgreSQL.

El manifest declara:

- Versión 2, procedencia `guest`, namespace original y revisión canónica del propietario capturada.
- Lista ordenada/cerrada de chunks, índice contiguo, bytes UTF-8 y SHA-256.
- Conjunto cerrado de entidades modificadas, por kind/ID; las revisiones esperadas de contenido/dependencias están en los cambios originales incluidos en esos chunks.
- Cada tarjeta esperada, mazo, identidad permanente, contentVersion, confirmación Guest, declaración explícita `new` o `history`, snapshot original completo, head y todos los eventIds.
- Los días, vínculos, confirmaciones, identidades y manifests V1 pertenecen al inventario cerrado y a las peticiones originales hasheadas; se validan sus referencias y payloads. No se demuestra completitud mediante un simple número de tarjetas.

El owner procede siempre de auth.uid(). No se acepta user_id del cliente. Confirmación Guest y namespace no se convierten en certificación lingüística.

`validate` ejecuta toda la generación con las RPC V1 dentro de una subtransacción que **se revierte intencionalmente**, incluidas entidades, reloj y recibos V1. Comprueba el inventario final, identidad/procedencia, manifest publicable y snapshot/head/eventos exactos. Solo después conserva `ready-to-publish` en las tablas V2. No aparecen tarjetas canónicas durante esa prueba.

`publish` repite toda la comprobación bajo el bloqueo de reloj del propietario y CAS, y conserva las escrituras V1 **en una única transacción**. Sus publicaciones parciales internas no son visibles desde otra sesión antes del commit. Cualquier conflicto o dependencia inválida revierte todas las entidades y recibos V1 de esa generación; el estado V2 queda bloqueado con motivo seguro. Un error transaccional/cuota también revierte el recibo V2 y permite consultar/repetir su petición original.

Esto proporciona atomicidad de visibilidad final, no atomicidad de todas las subidas ni una transacción distribuida con IndexedDB. Se eligió reutilizar validadores V1 en lugar de duplicar reglas FSRS/identidad en otro escritor SQL.

## Estados y RPC

| Estado | Significado |
| --- | --- |
| staging | Manifest recibido; chunks todavía incompletos o todavía no verificados. Nunca estudiable |
| ready-to-publish | Prueba completa revertida con éxito; publicación todavía pendiente. Nunca estudiable |
| published | Importación completa comprometida en entidades V1 y recibo final V2 |
| complete | Archivo de rama completo y verificado; **no** progreso canónico |
| blocked | Generación inválida, divergente, obsoleta o incompleta; evidencia retenida |
| cancelled | Cancelación explícita terminal; evidencia y recibos retenidos, sin publicación |

No se añade `superseded` sin un contrato de sustitución: un manifest nunca se reescribe. Una fuente distinta/revisión nueva necesita otro transferId explícito. Un bloqueo por chunks faltantes permite seguir subiendo los que faltan y validar otra vez; otros bloqueos requieren cancelar/conservar la transferencia y preparar una generación nueva. Nunca se cambia el cuerpo de una operación congelada para conseguir que pase.

| RPC | Contrato |
| --- | --- |
| apply_custom_transfer_v2(op jsonb) | schemaVersion 2, transferId, operationId, expectedRevision decimal; acciones begin/chunk/validate/publish/complete/cancel |
| get_custom_transfer_v2(transfer_id text, after_index integer=-1) | Lectura RLS: manifest/estado/revisión y como máximo un chunk posterior al cursor; null si no existe para ese propietario |

`begin` exige expectedRevision=0. Cada mutación incrementa la revisión V2; el chunk repetido se recupera con **el mismo** operationId/petición y devuelve el recibo original. Reutilizar el ID con otro cuerpo se rechaza. Dos finalizadores idénticos reciben el mismo ACK; dos peticiones distintas desde la misma revisión se serializan y la obsoleta falla CAS. Un ACK histórico no cambia el estado canónico actual.

CAS de publicación usa la revisión **global del propietario** compartida con V1. Es conservador: incluso una operación no relacionada puede invalidar la generación. Este coste es deliberado; D2 debe mostrarlo y pedir preparar otra generación, no rebasar silenciosamente snapshots. Cambios V2 de staging/archivo no incrementan el reloj de entidades V1.

## Compatibilidad y casos de historia

Un lector H4B-A/V1 no conoce las tablas V2: bundle, feed e incluso SELECT de entidades V1 no muestran el staging V2. Después del commit recibe entidades/manifests V1 completos con los mismos IDs y formatos, incluidos progreso, eventos anulados y estados diarios. No necesita interpretar un manifest V2 y no se modifica su manifest existente silenciosamente.

- `new` exige declaración expresa, snapshot/head nulos, eventIds vacío **y ausencia real** de progreso y eventos en destino.
- `history` exige snapshot/head iguales a lo declarado y todos los eventos, además de las dependencias y linaje validados por V1.
- Historia ausente, divergencia, tombstone o revisión cambiada bloquean la generación completa.
- La importación no restaura implícitamente un tombstone ni sustituye progreso existente. Restore y resolución siguen siendo operaciones explícitas V1 separadas.
- Las acciones de una importación V2 son stage/publish/import-history/review/undo. Las dos últimas permiten conservar una historia totalmente anulada mediante sus peticiones y snapshots originales, terminando con progreso nulo y eventos voided retenidos. No se ejecuta el scheduler ni se generan eventos desde un snapshot: SQL comprueba y persiste los documentos originales. Si faltan peticiones/dependencias para representar esa historia con seguridad, queda bloqueada y no se etiqueta New.

El servidor comprueba una declaración cerrada, no puede descubrir historia offline que el cliente omita deliberadamente al declararse New. D2 debe capturar **todos** los stores/journal/undo y probar ese constructor antes de usar V2. Los clientes antiguos todavía pueden iniciar importaciones Guest V1 inseguras: esta migración no intercepta ni cambia sus RPC. Los gates continúan false; no se promete corregida la interfaz existente por añadir un protocolo que aún no utiliza.

## Archivo remoto de ramas

`branch-archive` reutiliza almacenamiento de transferencia/chunks separado de entidades canónicas. Declara cardId, identidad, baseHead/head, conflicto remoto de anclaje, orden exacto de operationIds, ancestorIds, resoluciones verificables y hashes de chunks. Los registros `ancestor` incluyen payload original, parentHead y voidedBy, demostrados contra la evidencia canónica retenida. El primer request archivado debe coincidir exactamente con el conflicto de ese owner; operaciones posteriores conservan la secuencia de head/snapshot, sin aplicarse.

`complete` verifica hashes, todos los chunks declarados, inventarios/orden, anclaje al conflicto, identidad de la tarjeta (también retenida por tombstone), referencias de tarjeta/mazo, cierre topológico de ancestros, heads y recibos de resoluciones aceptadas. Guarda únicamente estado/recibo V2. No llama al scheduler, ni aplica la rama para validarla, ni crea recibos V1 de operaciones adicionales. Review/undo/import-history siguen como documentos originales; las anulaciones y elapsedAnswerMs no se pierden.

`complete` significa **archivo íntegro de lo declarado por su propietario**, no certificación lingüística, verificación matemática del scheduler ni prueba de que el dispositivo no tuvo otros eventos offline. No se transforma el archivo en un segundo scheduler. No entra en due/stability/difficulty/reps, estadísticas ni restauración de tarjetas. La evolución futura de resoluciones/revocaciones se consulta en las evidencias V1; no modifica retroactivamente los chunks o el manifest archivado.

| Situación | Garantía |
| --- | --- |
| Rama transmitida íntegramente y completada | Otro cliente autorizado obtiene manifest/chunks originales, verifica SHA-256 e inventario, sin almacenamiento del emisor |
| Transmisión parcial | Recupera solo chunks existentes y el manifest esperado; estado staging/blocked y huecos detectables. No se presenta como historia íntegra |
| Nunca transmitida | RPC devuelve null; no se puede reconstruir desde un hash ni desde el ganador |
| Tombstone posterior | Archivo retenido y legible; no resucita ni altera el estado canónico |
| Otro propietario | RLS/RPC devuelve ausencia y deniega escritura directa; no recibe contenido ajeno |

Protección preventiva estudiada: al recibir un conflicto, D2 podría ofrecer/subir el manifest de toda la cola capturada y sus chunks con consentimiento válido mientras exista conexión, comprobando ACK antes de anunciar protección. Este protocolo exige conflicto remoto de anclaje: no implementa archivo anticipado de una rama todavía sin conflicto. Offline/pérdida antes de transmitir sigue siendo irrecuperable. Cambiar ese requisito requiere otra decisión de privacidad/contrato; no se anuncia protección continua.

## Seguridad, privacidad y retención

Cuatro tablas nuevas: custom_transfers_v2, custom_transfer_chunks_v2, custom_transfer_receipts_v2 y custom_transfer_usage_v2. PK/FK compuestas con propietario; RLS SELECT auth.uid() en las cuatro; sin INSERT/UPDATE/DELETE directos para anon/authenticated. La RPC escritora es SECURITY DEFINER con search_path vacío; getter SECURITY INVOKER y RLS. Helpers privados sin EXECUTE de usuarios. Se conserva JWT exclusivamente en el proceso Node del arnés.

Los recibos contienen hash de la petición y resultado, sin duplicar cuerpos grandes. Los chunks conservan las peticiones originales. No se admiten blobs, imágenes o diccionarios arbitrarios: registros y payloads están limitados a esquemas V1 de contexto corto/confirmaciones/FSRS. No se reutilizan user_preferences ni tablas legacy. RLS no es cifrado de extremo a extremo; operadores/backups pueden acceder según la infraestructura.

Retención D1: sin expiración automática. Ni cancelación, resolución, tombstone ni antigüedad borran chunks, conflictos o recibos. No hay RPC de purga ni promesa de borrado remoto al retirar consentimiento. Un borrado de cuenta administrativo sigue la FK auth.users como el esquema actual; no se ofrece como función de producto nueva. Antes de activar hacen falta contrato explícito de exportación UX/purga, auditoría, backups y política de retención aprobada. Retirar consentimiento en D2 debe detener subidas futuras; commits previos permanecen consultables. La RPC solo conoce autenticación/autorización, no el consentimiento local del navegador.

## Límites y costes

| Límite | Valor / comportamiento |
| --- | --- |
| Petición V2 | 524288 bytes de jsonb::text, **incluido escape del texto del chunk** |
| Peticiones V1 internas / cambios agregados por chunk | Máximo 64 cambios, conservando los 512 KiB V1 y límites por payload |
| Chunks por transferencia | 1–128, inmutables, índices contiguos declarados |
| Bytes declarados por transferencia | Máximo 8388608 B (8 MiB) de cuerpos |
| Tarjetas declaradas | 1–1000; manifests V1 conservan máximo 1000 |
| Propietario | 64 MiB contabilizados, 32 transferencias retenidas, 8192 recibos |
| Contabilidad | Manifest jsonb, cuerpos exactos y reserva conservadora de 2048 B por recibo/metadatos; no equivale al tamaño físico de PostgreSQL |

La contabilidad y contadores comparten el bloqueo de propietario con V1. Un límite de owner aborta toda la mutación, incluido chunk/recibo. Retry idéntico no consume cuota otra vez. Las cuotas son de staging/archivo V2; no limitan retroactivamente el almacenamiento canónico/recibos V1.

Los chunks permiten subir una generación mayor de 512 KiB sin exponerla. No se fragmenta una operación V1 de 65 cambios, ni se eliminan anulaciones para bajar tamaño: queda bloqueada. Para familias mayores hace falta extensión específica futura. La publicación final materializa hasta 8 MiB y conserva un bloqueo de owner; no se certifica rendimiento para 1000 tarjetas/historias máximas o clientes móviles. Una transferencia con límites incompatibles se conserva/cancela, no se promete reparación automática.

Las cuotas se retienen tras cancelar y, al agotarlas, incluso otra mutación que necesite recibo puede ser rechazada. Eso preserva evidencia y evita crecimiento ilimitado; es otro motivo para exigir un contrato de purga/retención antes de producción. Límites no son un rate limiter del gateway ni garantía de pico RAM.

## Pruebas y resultados

Entorno: Windows x64, Node 24.21.0, PostgreSQL 17.5, PostgREST 16.5 y PGlite 0.3.14. Solo loopback y datos originales sintéticos; ninguna URL de base externa. Resultados finales reales:

| Comprobación | Resultado |
| --- | --- |
| PGlite `--transfers --limits` | 23 escenarios V1 + 11 grupos V2 + límites H4BC correctos |
| PostgreSQL nativo, regresión anterior en base separada | 23/23 |
| PostgreSQL nativo, protocolo final | 33/33: 16 grupos anteriores, 11 V2 compartidos y 6 específicos D1 |
| Contención real | 15 solapamientos V1 y 5 V2 observados con pg_blocking_pids en PID distintos |
| HTTP/JWT final | 10/10: 8 anteriores y 2 nuevos V2 |
| Playwright A/B/C con la migración V2 aplicada | 15/15 en 55,2 s; sin retries |
| Angular dirigido | 51/51, 4 archivos, 2,52 s |
| Angular completo | 1887/1887, 186 archivos; runner 14,81 s, compilación 22,316 s |
| TypeScript app/spec | Ambos exit 0 |
| Build Pages | Exit 0, 22,981 s; inicial 727,09 kB, solo los cuatro warnings SCSS conocidos |
| git diff --check / whitespace nuevo | Exit 0, sin errores; sin whitespace final en archivos del hito |

El arnés final de protocolo es `.cache/h4a1-runtime/run-zOhiYR/`: results.json conserva 33 grupos nativos/10 HTTP y contadores 15+5. El arnés integrado anterior `.cache/h4a1-runtime/run-A4DPYY/` conserva 32 grupos nativos/10 HTTP y browser-tests.log con 15/15; después solo se añadió al arnés la prueba de interrupción entre chunks ancestrales, sin cambiar la migración ni Angular. Otra ejecución integrada run-ktZojh también pasó 15/15. No se suman estas pasadas para inventar escenarios ni afirmar estabilidad absoluta.

PostgREST final: 3/3 procesos fríos listos en 318/279/306 ms, PID 15880/25244/19436; SIGTERM posteriores fueron paradas solicitadas. La salida 3 histórica no se reproduce ni se declara diagnosticada. Logs PostgreSQL/PostgREST redactados y procesos detenidos por el arnés. Resultados PGlite, Angular, dirigido y build: `.cache/h4bd1-pglite-final.log`, `h4bd1-angular-final.log`, `h4bd1-directed.log` y `h4bd1-build-final.log`.

| Casos prioritarios del encargo | Evidencia |
| --- | --- |
| 1–4: New legítimo, historia ausente/completa e interrupciones | Grupos V2 1–4 y 11; cero entidades canónicas incluso con contenido/ancestros ya subidos |
| 5–7: reanudación, publicadores concurrentes, ACK perdido | Getter/chunks inmutables, cliente HTTP limpio y barreras nativas; recibos exactos en reintentos |
| 8–9: destino divergente/tombstone | Revisión de propietario cambiada, delete/restore/review V1 concurrentes, otro origen sin sobrescritura de progreso |
| 10–13: ramas completas/parciales/nunca enviadas | Grupos V2 5 y 8 y HTTP; recuperación hash por hash desde servidor, sin aplicar la cola archivada |
| 14–15: aislamiento y repetición | RLS cuatro tablas, DML real denegado, anon/JWT inválido/expirado, receipt/chunk repetido sin duplicación |
| 16: límites | 524288 B exactos aceptados / exceso rechazado; 64/65 cambios; declaración 128 chunks/8 MiB/1000 tarjetas y excesos; cuotas owner con fixtures administrativas de frontera |
| 17–18: V1 y evidencia histórica | Sesión lectora V1 durante commit retenido, RPC/feed y Playwright anteriores; familias anuladas, snapshot nulo tras undo total y elapsedAnswerMs exactos |

Las pruebas de 128 chunks/8 MiB/1000 tarjetas verifican **fronteras declarativas**, no una publicación máxima completa de ese volumen. El límite owner de 64 MiB/32 transferencias/8192 recibos se lleva a su frontera con contabilidad sintética sembrada únicamente por el administrador del clúster de pruebas: no se presentan esas comprobaciones como 64 MiB efectivamente transmitidos. La cuota revierte chunk/recibo; el inventario original permanece en la fixture y el staging anterior sigue intacto.

La prueba de concurrencia usa conexiones PostgreSQL con PID distintos y pg_blocking_pids antes de liberar commit. PostgREST verifica firmas JWT reales emitidas por el arnés local; no es Supabase Auth. Los lectores nuevos de V2 son conexiones/clientes HTTP sin cache del emisor; no se presenta como integración UI V2 en navegador. Los Playwright de regresión ejercen los flujos V1 existentes.

Incidencias durante desarrollo: variable SQL `bytes` ambigua, corregida en la migración nueva; PATCH HTTP vacío no ejercía UPDATE, cambiado a escritura real con columna válida. Se conservaron fallos/logs y no se añadieron retries/timeouts para ocultarlos.

## Archivos y preservación

Comparación final con la referencia: 1502 archivos iniciales, 1498 idénticos, cuatro modificados, siete nuevos y ninguno eliminado. No se sobrescribió trabajo previo.

Nuevos:

- `supabase/migrations/202610220002_custom_transfers_v2.sql`.
- `supabase/tests/custom-transfers-v2.mjs` y `custom-transfers-native.mjs`.
- `src/app/core/models/custom-transfer-v2.model.ts`.
- `src/app/core/services/custom-transfer-v2-contract.ts` y `custom-transfer-v2-contract.spec.ts`.
- `MANGA_DECKS_H4BD1.md`.

Modificados: `scripts/test-custom-decks-sql.mjs`, `scripts/test-custom-decks-native.mjs`, `MANGA_DECKS_DESIGN.md` y `SUPABASE_SETUP.md`. Los contratos preparados no se importan en servicios productivos, no añaden bytes iniciales ni alteran UI/temas/traducciones. El único spec nuevo es de contrato puro. Gate defaults, SQL H4A, scheduler y todos los archivos previos de Stats/FSRS/Saved/Japanese 1500/Guest conservan sus hashes iniciales.

## Cierre y plan D2 (no iniciado)

**H4B-D1 queda completado técnicamente para el protocolo remoto y el entorno aislado probados.** El staging V2 no aparece en lectores V1 antes del commit; contenido/historia se publican juntos; las ramas declaradas completas se recuperan íntegras y las parciales/nunca enviadas no se confunden con ellas. No significa publicación ni integración de producto completadas.

D2 deberá construir manifests cerrados desde el inventario real completo, capturar owner/epoch/consentimiento, persistir petición/chunks exactos antes de HTTP, consultar recibos tras ACK perdido, reanudar desde otro cliente, reconocer blocked/cancelled sin declarar Synced y publicar localmente tras la generación remota verificada. Debe archivar toda la cola rechazada consentida, comprobar completitud/digests antes de mostrar recuperación y conservar Guest/journal. Necesita pruebas UI de actualización V1→V2 y políticas para los estados no expresables/quotas, sin convertirlos en New.

Siguen pendientes Supabase Auth/gateway/CORS reales, iOS/Android/Safari físicos, carga máxima y política de retención/purga. Todos los gates continúan false. No iniciar D2, H3B o H5 ni desplegar esta migración desde este informe.
