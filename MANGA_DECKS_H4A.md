# Manga × Mazos — Hito 4A: fundamentos cloud

Estado al 22 de octubre de 2026: implementación y validación local completadas; validación integral de infraestructura pendiente. No se ha desplegado SQL, conectado un transporte cloud ni iniciado H4B. `CUSTOM_DECKS_ENABLED` y `MANGA_DECK_ASSISTED_ENABLED` permanecen en `false`.

## Recuperación y alcance

Se recuperó el estado desde Git y los archivos existentes, preservando los cambios anteriores sin commit. La implementación ya estaba realizada; faltaban este informe y las actualizaciones de diseño y configuración. La referencia `.cache/h4a-baseline.json` contiene las huellas SHA256 de los 151 archivos con trabajo pendiente al iniciar H4A. No se utilizó reset, clean ni checkout destructivo.

## Registro local

La base `kana-study-custom-decks-v1` pasa a versión 2 de forma aditiva. Conserva sus seis stores y añade `identities`, `confirmations`, `volume-links` y `registry-meta`, separados por workspace. La migración valida esquema y huella canónica de las operaciones originales, vuelve a comprobar la fuente antes de escribir y publica el registro en una transacción. Un fallo de cuota revierte la migración y permite recuperarla. El marcador completo evita depender posteriormente del journal para reconstruir identidades y recibos.

No se eliminan operaciones confirmadas ni se alteran tarjetas, eventos o snapshots FSRS. Se conserva el recibo H2B-A completo, actor, namespace, IDs y contexto. El orden solicitado original puede ser 0 mientras la tarjeta tiene orden canónico 1: no se reescribe la intención. Los clientes con conexiones antiguas deben cerrarlas o recargar para permitir el upgrade IndexedDB.

## Contrato remoto y SQL

Contratos versión 1 distinguen datos permanentes, journal pendiente, recibos aceptados/conflictos y proyecciones regenerables H3A. Incluyen mazos, tarjetas, identidades curadas, vínculos, confirmaciones, equivalencias locales revocables, progreso, eventos, días, manifest y planes Guest. Las revisiones bigint viajan como cadenas decimales, sin pérdida por el límite entero de JavaScript.

La migración nueva crea cuatro tablas: reloj por usuario, entidades, recibos y conflictos. Claves y referencias compuestas incluyen propietario; RLS de lectura usa `auth.uid()`. Se deniega DML directo; las escrituras pasan por RPC transaccional con search_path fijado. No se alteran tablas, permisos ni funciones anteriores.

La RPC bloquea el reloj del propietario y aplica CAS por revisión. El mismo `operationId` y petición devuelve el resultado original, incluso tras perder la respuesta. Otro contenido con ese ID se rechaza. Un conflicto conserva petición y evidencia; resolverlo requiere una operación nueva explícita. El futuro adaptador debe reconocer un ACK antiguo sin sobrescribir estados posteriores con su snapshot original.

Identidades, confirmaciones y vínculos son inmutables; dependencias idénticas no incrementan revisión. No hay LWW por reloj del navegador, merge automático de progreso ni cálculo FSRS en SQL.

## Publicación, review y ciclo de vida

Stage no representa un mazo listo vacío. Publicar verifica exactamente las tarjetas vivas y sus dependencias y guarda sus revisiones en el manifest. Un fallo revierte entidades y recibo. Archive/delete/restore actualizan el manifest en la misma transacción.

Un bundle pequeño se lee en una sentencia MVCC y exige referencias completas vigentes. Sobre 4 MiB devuelve explícitamente `paged-required`. El feed admite páginas de hasta 200 entidades, incluidos tombstones; no es una instantánea histórica inmutable entre páginas. H4B deberá montar datos provisionalmente y verificar la generación del manifest antes de publicarlos. El guard local comprueba completitud, no implementa un importador completo.

Review exige head esperado, snapshot anterior y progreso/evento/día coherentes en una transacción. Undo exige el head efectivo, restaura su snapshot y conserva el evento con `voidedBy`. Se comprueba linaje y propietario sin recalcular FSRS ni duplicar tiempo. Los días completados no se reinician ni pierden introducciones.

Archive conserva contenido e historial. Delete mantiene tombstones sin caducidad automática, incluso anteriores a crear el objeto, y bloquea escrituras retrasadas. Restore es explícito, con CAS sobre un tombstone y dependencias válidas; no reemplaza historia de estudio. Borrar un mazo no borra Manga Saved ni su FSRS independiente.

Guest está preparado como protocolo sin activación: mantiene origen e IDs bajo el propietario destino. Diferentes cuentas pueden importar los mismos IDs. Se importan ancestros antes del snapshot, fragmentando historia y conservando eventos anulados. El progreso divergente en destino, incluso un marcador nulo existente, produce conflicto; no hay merge ni borrado del origen.

## Límites y privacidad

Petición máxima 512 KiB/64 cambios; tarjeta 32 KiB, confirmación 256 KiB, manifest 1 MiB y respuesta 2 MiB. Se valida tamaño jsonb/UTF-8, escapes y pares sustitutos. Contexto japonés: 1200 caracteres/4800 bytes; expresión y lectura: 256 caracteres/1024 bytes. Se rechazan campos desconocidos, imágenes, OCR completo y cuerpos arbitrarios de diccionario.

Solo se prepara contenido confirmado y contexto corto/procedencia. Las equivalencias son owner-local, revocables y `expertCertified: false`; confirmación de usuario no significa validación lingüística experta. No se inventan correspondencias Japanese 1500: el manifiesto de confianza H3A sigue vacío, 0/1500.

Recibos, conflictos e historia contienen datos privados retenidos del propietario. RLS no es cifrado de extremo a extremo ni impide acceso de operadores/backups. H4B necesitará explicación y consentimiento traducidos antes de subir datos. Aquí no se envía contenido.

## Archivos de H4A

Modificados sobre el trabajo previo:

- `src/app/core/services/custom-deck.repository.ts`: registro permanente y upgrade.
- `src/app/core/services/custom-deck.repository.spec.ts`: upgrade de prueba relativo a la versión vigente.
- `MANGA_DECKS_DESIGN.md` y `SUPABASE_SETUP.md`.

Añadidos:

- `src/app/core/models/custom-deck-sync.model.ts`.
- `src/app/core/services/custom-deck-sync-contract.ts`.
- `src/app/core/services/custom-deck-sync.spec.ts`.
- `supabase/migrations/202610220001_custom_decks_foundation.sql`.
- `supabase/tests/custom-decks.fixture.mjs` y `supabase/tests/h2ba-fixture.json`.
- `scripts/test-custom-decks-sql.mjs` y este informe.

## Pruebas

El runner crea una base PGlite efímera sin credenciales, aplica las cinco migraciones previas y la nueva y ejecuta roles PostgreSQL con `auth.uid()` alimentado por claims de prueba. La fixture japonesa es sintética, compartida con Angular.

Los 23 escenarios SQL cubren publicación/orden; recibo perdido/idempotencia; aislamiento/DML; anon/owner falsificado; referencias entre cuentas; CAS inicial; rollback; stage/publicación; dependencias de progreso; rebase explícito; tombstones/restore; ramas review; undo; ambas órdenes review contra undo; tombstone previo; archive/delete; Guest repetido/divergente; historia Guest fragmentada; días completados; equivalencias; límites/escapes; paginación; e invariancia de permisos, RLS, índices, funciones y duraciones históricas anteriores.

Los tests Angular cubren contrato compartido, revisiones bigint, tamaños jsonb, esquemas, bundles parciales, owner capturado, upgrade v1, idempotencia, rollback por cuota, recuperación sin journal, aislamiento y recibos corruptos. Los resultados finales de la reanudación se añaden al final de este documento.

## Limitaciones y bloqueo de validación integral

PGlite usa un solo backend. Las llamadas sometidas conjuntamente y ambas órdenes review/undo prueban CAS y resultados, pero **no prueban contención entre sesiones reales, bloqueos, deadlocks ni dos conexiones independientes**. Falta una batería nativa con barreras y transacciones simultáneas.

No se ha probado PostgREST ni el gateway JWT de Supabase: firma, expiración, selección de roles y contexto de conexión quedan pendientes. Las RLS de las tablas nuevas, lecturas RPC y denegaciones indicadas sí se ejecutan en PostgreSQL; el stub de autenticación no sustituye JWT reales. No se prueban políticas de Storage/servicios externos ni un despliegue alojado.

H4B sigue pendiente: transporte, captura de workspace, ACK/aplicación local, staging paginado, dos navegadores, offline y cuentas reales. H2B-A todavía exige `confirmation.workspace === owner` y su namespace de creación: el importador debe asociar destino externamente sin reescribir procedencia. La proyección H3A puede ser indeterminada con tiempos iguales; el futuro transporte debe usar el head autoritativo. No se modifica esa lógica aquí.

La implementación y comprobación local se completan, pero **H4A no está completamente validado para infraestructura real** hasta las pruebas nativas multisesión y JWT/gateway. No se autoriza despliegue ni inicio de H4B.

## Esquema y RPC concretos

| Objeto | Responsabilidad |
| --- | --- |
| `custom_sync_clock_v1` | PK user_id, revisión bigint y bloqueo por propietario |
| `custom_sync_entities_v1` | PK user_id/kind/entity_id, payload, revisión, tombstone, archived, referencias y head/voidedBy |
| `custom_sync_receipts_v1` | PK user_id/operation_id, petición y resultado originales |
| `custom_sync_conflicts_v1` | PK user_id/operation_id, motivo/evidencia y referencia a recibo |

Las referencias de entidades incluyen owner y kind, con constraints diferibles;
las tarjetas activas tienen unicidad owner/deck/identity. Hay índices por owner/deck/kind
y owner/revision. `apply_custom_deck_operation_v1` es SECURITY DEFINER, sin propietario
aceptado del cliente; `get_custom_deck_bundle_v1` y `get_custom_deck_changes_v1` son
SECURITY INVOKER y respetan RLS. Los helpers no tienen execute para anon/authenticated.

## Validación final tras reanudar

Entorno: Windows, Node 24.21.0. Comandos ejecutados de nuevo el 22/10/2026:

| Comprobación | Resultado |
| --- | --- |
| `node scripts/test-custom-decks-sql.mjs` | 23/23 escenarios, PostgreSQL/PGlite, exit 0 |
| Angular dirigido: custom-deck-sync, custom-deck.repository, manga-deck-assisted, lexical-knowledge-projection | 73/73, 4 archivos; build 8.370 s y tests 4.02 s |
| `npm test` | 1810/1810, 178 archivos; build 19.093 s y tests 14.54 s |
| `npx tsc -p tsconfig.app.json --noEmit` | exit 0 |
| `npx tsc -p tsconfig.spec.json --noEmit` | exit 0 |
| `npm run build -- --base-href /kana-study/` | exit 0, 16.819 s; cuatro warnings SCSS Grammar conocidos |
| `git diff --check` | exit 0; avisos LF/CRLF, sin errores de whitespace |

La ejecución completa anterior a la interrupción también pasó 1810/1810. Esto aporta
dos ejecuciones correctas, no una garantía absoluta de ausencia de intermitencias.
No se ejecutó Playwright en H4A: no hay cambios de interfaz ni estilos; no se atribuyen
a esta validación resultados e2e de hitos anteriores.

De los 151 archivos con cambios previos, solo difieren frente a la referencia inicial
el repositorio custom, su spec y DESIGN (cambios H4A intencionados); los otros 148
conservan exactamente su SHA256. SETUP estaba limpio y recibe únicamente un apéndice.
Stats V2, Japanese 1500, Manga Saved FSRS, scheduler, Daily Study y código legacy de
sincronización no se modifican en este hito. La suite completa valida su comportamiento
existente; el escenario SQL 23 verifica además invariancia del catálogo y dato histórico
legacy en el entorno efímero. No se ha añadido transporte productivo ni cambiado gates.

## Plan de H4B (documentado, no iniciado)

1. Resolver las pruebas nativas multisesión y gateway JWT en entorno aislado.
2. Definir captura de owner, consentimiento y adaptador de transporte con journal/ACK
   separado del registro permanente; rechazar respuestas de otro workspace.
3. Preparar staging de bundle/feed y publicación local solo con manifest completo vigente;
   procesar recibos originales sin rebobinar estado y conservar conflictos explícitos.
4. Integrar Guest preservando procedencia y origen, con política visible de divergencias.
5. Probar dos navegadores, pérdida de respuesta, offline, cambio de cuenta, interrupción,
   cuota y recuperación antes de plantear una activación separada.

No se ejecuta ninguno de estos pasos en este cierre.

## Actualización H4A.1 — 22/10/2026

Véase `MANGA_DECKS_H4A1.md`. La concurrencia real ya se ejecutó en PostgreSQL 17.5:
16 pruebas nativas, 15 solapamientos observados por ejecución, dos ejecuciones completas
de la batería ampliada. Los 23 escenarios anteriores pasan tanto en PGlite como en
PostgreSQL nativo. PostgREST 16.5 verifica JWT firmados/expirados y aplica roles/RLS
mediante HTTP real: 8 grupos pasan en ambas ejecuciones. No se modificó SQL productivo.

Esto actualiza el pendiente multisesión descrito arriba. Supabase Auth/GoTrue y su
gateway completo siguen sin probarse: los JWT HTTP los emite el arnés local. El usuario
confirmó que no hay un entorno Supabase aislado autorizado y pidió conservar ese
pendiente. H4A.1 no se declara completamente cerrado ni se inicia H4B. Se documenta
además una salida aislada de PostgREST durante arranque cuyo motivo no quedó registrado;
las ejecuciones posteriores pasan y ahora se conservan logs redactados, sin reintentos.
