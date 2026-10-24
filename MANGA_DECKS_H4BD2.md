# Manga × Mazos — H4B-D2: integración Angular V2

Fecha: 2026-10-23. Entorno exclusivamente local y sintético. Los cuatro gates siguen false. No se despliega SQL, no se usan cuentas/material privados, no se hace commit/push y no se inicia H3B/H5.

## Referencia y arquitectura

Se inspeccionó git status antes de editar y se registró SHA256 de los 1509 archivos existentes en `.cache/h4bd2-baseline.json`, con estado en `.cache/h4bd2-status.txt`. Se revisaron DESIGN, H4A/H4A1/H4BA/H4BB/H4BC/H4BD1/SETUP y los servicios, registros, journal, Auth/workspaces, panel y contratos SQL reales. No se hizo reset, clean ni checkout destructivo.

Se reutilizan **sin cambios** las dos RPC y las migraciones V1/V2 de D1. La integración separa:

- SupabaseCustomDeckTransport: transferApply/transferGet/transferReceipt mediante el cliente Supabase existente y token de la sesión capturada. La escritura conserva CUSTOM_REMOTE_UPLOAD_APPROVED=false. Sin otro login o emisor JWT en Angular.
- CustomGuestTransferBuilder: constructor puro desde el inventario Guest real, con proyección de revisiones para CAS. No llama al scheduler.
- CustomTransferCoordinator: checkpoints, congelación de peticiones, consentimiento, recibos independientes, recuperación y acciones begin/chunk/validate/publish/complete/cancel.
- CustomGuestImportService: exclusivamente V2 para nuevas importaciones; publicación canónica local separada de la subida.
- CustomBranchArchiveService y CustomConflictRecoveryService.archives: archivo explícito de ramas y consulta readonly por referencia conocida.
- Perfil: controles experimentales ocultos, textos ES/EN/CA, estados de archivo, integridad, fragmentos ausentes, procedencia y progreso canónico separado.

No se conecta el transporte custom al SyncService/outbox legacy, no se cambian FSRS/Stats/Japanese 1500/Saved ni se añade una activación pública.

## Inventario y operaciones Guest

La captura readonly incluye todos los stores existentes, journal/contextos, registro permanente, namespaces, confirmaciones, vínculos, tarjetas, glosas/contexto, progreso, eventos, anulaciones, días y reconciliación. Se conserva íntegra en el plan, incluso cuando no puede publicarse.

El constructor ordena las operaciones originales por localRevision, comprueba su huella y contexto y prepara las peticiones V1 internas con los mismos IDs y payloads reales. La proyección calcula **revisiones y orden canónicos**, no intervalos ni snapshots FSRS. Los before/head/daily de review/undo proceden del contexto persistido de cada operación, no del estado actual del reloj ni de una reproducción de ts-fsrs. Las operaciones daily se transportan como import-history con el mismo payload/ID; no se sintetizan reviews.

Antes de subir, se coteja el resultado proyectado con tarjetas, snapshots, heads, eventos/voidedBy, días, mazos y registros permanentes capturados. Una fila de progreso nula tras undo sigue siendo historia; New requiere ausencia real de progreso, eventos y operaciones de estudio. Falta de contexto/journal verificable no se interpreta como New.

Cada petición original permanece indivisible. Los chunks agrupan peticiones completas en su orden, separando contenido de historia y respetando 64 cambios agregados/512 KiB, el escape de la petición exterior, 128 chunks, 8 MiB y 1000 tarjetas. Texto JSON, UTF-8, SHA-256, índices e inventario quedan congelados antes del primer envío. Se revalidan al reanudar. Una petición ya congelada de 65 cambios no se divide. Una familia grande con **peticiones originales individuales válidas** de review/undo sí puede viajar en varios chunks y publicarse en la única transacción final, sin borrar anulaciones.

## Checkpoints y recibos

Se añaden campos opcionales en reconciliación; no cambia la versión IndexedDB ni se elimina ningún store. El checkpoint conserva owner/workspace, protocolo, transferId, manifest, cuerpos exactos, peticiones completas, operationIds, recibos verificados, revisión, estado, fallo y localPublished. Guest permanece intacto.

El transferId depende del owner y la huella de la captura. Dos pestañas comparten el checkpoint mediante la transacción IDB existente. Cada petición se registra **antes** de la red; un checkpoint previo no se reconstruye ni se modifica silenciosamente. Tras una respuesta se consulta por separado el recibo RLS y se comprueban owner, ID, resultado, revisión y SHA-256 de la petición normalizada jsonb. Ese hash se distingue del hash de texto exacto de los chunks. Un ACK viejo solo confirma su petición: no rebobina la revisión o el estado actuales.

Al reiniciar se consulta la transferencia, se cotejan manifest y cada chunk recibido con el cuerpo congelado, se recupera el recibo pendiente y se continúa. Los recibos ya existentes no requieren otra escritura. No hay sleeps ni retries automáticos para ocultar fallos. Cancelar una transferencia staged consulta primero su revisión y conserva los cuerpos/recibos; no borra datos remotos ni Guest.

## Publicación remota y local

La nueva importación Guest no envía ninguna operación V1 independiente. Toda escritura de contenido/historia pasa por apply_custom_transfer_v2; una migración V2 ausente/incompatible queda bloqueada con un error, sin fallback.

Staging y ready-to-publish siguen fuera de entidades/feed/bundle V1. La fuente se comprueba de nuevo antes de publish. Publicar es la transacción D1 del servidor. Tras su ACK verificado se hace una inspección canónica V1 completa con controles de generación, manifest, referencias, confirmaciones y owner; se verifican los snapshots/eventos declarados y la fuente Guest otra vez. Solo después se llama a syncCommit con CAS de reconciliación, fingerprint del journal destino y fence de workspace, publicando datos y finalización local en la misma transacción.

Un fallo de cuota local después de commit remoto deja el plan pendiente y recupera el recibo al reanudar. No se repite la publicación ni se duplica tiempo. Una cuenta que añade progreso o una revisión global distinta durante staging produce bloqueo; no se recalcula un snapshot antiguo para forzarlo. Si aparecen cambios después de la publicación remota, se conserva la evidencia y se evita afirmar una finalización local no verificada.

No existe una transacción distribuida entre Guest, red y servidor. La garantía corresponde a la **captura cerrada declarada**. Una edición posterior queda en Guest y necesita otra decisión; no se promete que el dispositivo haya dejado de producir datos. Un plan ya completado y con la misma huella es un hecho histórico confirmado: repetirlo no reimporta historia ni depende de una red disponible. La sincronización ordinaria posterior conserva el estado más reciente.

El adaptador no declara Synced con transferencias pendientes/bloqueadas o una publicación local pendiente. Los estados visibles de la importación están ligados a owner/epoch para que A→B→A no publique el resultado viejo.

## Compatibilidad y bloqueos conservadores

- Datos V1 existentes en la cuenta pueden convivir con nuevas tarjetas Guest V2. El lector V1 no necesita conocer staging V2 y recibe solo su generación comprometida.
- Un checkpoint V1 pendiente/parcial se conserva con sus operaciones/recibos originales y se bloquea con explicación. No se convierte en V2 ni se completa mediante el antiguo publicador. Un checkpoint histórico completo no vuelve a enviar historia.
- El caso real de una publicación V1 antigua **ya comprometida** no se deshace retroactivamente: se prueba conservarla y bloquear su continuación. No es posible deducir desde la ausencia de progreso si una tarjeta legacy era New o estaba incompleta. Esa reparación necesita una política explícita; no se improvisa SQL ni se promete corregida una publicación insegura que ya ocurrió.
- Solapamientos de tarjetas/historia en destino se bloquean antes de subir. No se reemplaza progreso ni se fabrica un ACK para un inventario distinto. Las decisiones de rebase ordinario V1 siguen disponibles para sus conflictos propios; no se usan como fallback Guest.
- Tombstones, equivalencias no representables, múltiples namespaces, journal/contextos faltantes o preparaciones congeladas anteriores en el origen quedan conservados y bloqueados. El manifest D1 tiene un solo namespace y no admite todos los lifecycle; D2 no lo amplía.
- Una revisión global obsoleta requiere cancelar/conservar el plan y preparar explícitamente otra generación compatible. No hay rebase automático ni botón que cambie las peticiones congeladas.

Son límites declarados del flujo, no éxitos de importación ni motivos para borrar el origen. La disponibilidad pública sigue bloqueada.

## Archivo y consulta de ramas

La acción de archivar exige consentimiento versión 1 vigente **y una acción explícita** que explica el historial adicional. Conserva el conflicto recibido, sus peticiones originales, ancestros canónicos demostrables y las operaciones posteriores disponibles del journal para esa tarjeta. El orden/head/snapshot permanece intacto; no se aplica la rama al servidor ni al repositorio local para reconstruir FSRS.

Se congela un branch-archive con ID estable para esa cola capturada. begin/chunks/complete conservan recibos verificables. El resultado solo anuncia respaldo completo después de complete; si la cola cambia durante la subida no se promete respaldada toda la rama actual. La retirada de consentimiento impide nuevas escrituras, también antes de complete; commits previos permanecen consultables.

La API y UI de consulta requieren **conocer transferId**: get_custom_transfer_v2 no proporciona descubrimiento remoto. Un navegador limpio del mismo owner obtiene los cuerpos recibidos, verifica digests/inventario y distingue complete de staging/blocked con huecos. Puede ver tarjeta/procedencia actual o retenida por tombstone, operaciones, integridad, estado canónico separado y resoluciones con recibo independiente. La procedencia actual no certifica la glosa exacta que se vio históricamente si luego cambió contenido.

No hay aplicar, fusionar FSRS, restauración implícita, scheduler alternativo, purga ni exportación global de cuenta. La consulta no escribe progreso, due, estabilidad, dificultad, reps, lastReview, estadísticas o cola. Una rama nunca enviada devuelve ausencia; un hash no permite inventarla. Un dispositivo sin el checkpoint/fuente no puede subir chunks que nunca recibió el servidor. El descubrimiento, migración de checkpoints entre instalaciones y exportación/purga completa quedan fuera del contrato actual.

## Consentimiento, cuotas y aislamiento

Cada nueva escritura comprueba principal, owner, workspace, activación y consentimiento/revisión inmediatamente antes de RPC. Se fija Authorization a la sesión capturada y se cercan respuestas/commits, incluido A→B→A y logout. La retirada después de commit permite conservar la confirmación recibida, pero no autoriza otro chunk/publish/complete. No promete borrado remoto ni cifrado extremo a extremo.

Las cuotas D1 siguen intactas. La UI diferencia indisponibilidad V2, cuota local/remota, legacy incompatible, solapamiento y bloqueo seguro; conserva Guest, journal y recibos. El límite físico de disco/memoria móvil no se certifica con una excepción de prueba ni con cuotas sembradas por el arnés.

## Defecto real encontrado y regresión

La prueba nueva de rebase **ordinario** detectó una resolución aceptada por SQL que fallaba al publicar localmente: el registro permanente comparaba toda la intención recibida con el documento original. Una versión/colocación nueva de la tarjeta por rebase era incompatible con ese documento inmutable.

La corrección mínima acepta únicamente metadata de versión/colocación cuando confirmación, identidad y resto del contenido siguen siendo idénticos, y conserva `receipt.value` original. La resolución aceptada vive en reconciliación; no se reescribe el recibo/journal original. Un test rechaza cambiar la evidencia de confirmación; otro demuestra el rebase con SQL/navegadores y FSRS intacto.

## Validaciones

| Validación local | Resultado final |
| --- | --- |
| Angular dirigido: adaptador, Guest, contratos y coordinador | 63/63 en 5 archivos; después de añadir la regresión con review/undo real, 31/31 en los 2 archivos afectados |
| Suite Angular completa, última ejecución tras regenerar i18n | 1895/1895, 187 archivos; 16,34 s de runner, sin exclusiones |
| PGlite V1/V2 y límites H4BC | 23 escenarios V1 + 11 V2 y comprobaciones de límites correctos |
| PostgreSQL nativo | 33/33: 16 anteriores + 11 V2 compartidos + 6 D1 nativos; regresión SQL V1 de 23 escenarios también correcta |
| Concurrencia PostgreSQL multisesión | 15 solapamientos V1 + 5 V2 observados por el arnés, correctos |
| PostgREST HTTP/JWT local | 10/10 con firma y verificación reales de tokens sintéticos |
| Playwright H4B-A/B/C/D2 | 26/26: 3 A + 8 B + 4 C + 11 D2, 1,5 min |
| Arranque nativo en frío | 3/3: 391/320/332 ms; cierre solicitado con SIGTERM, sin exit 3 en esta ejecución |
| TypeScript | app y spec con --noEmit, ambos exit 0 |
| Build GitHub Pages | npm run build -- --base-href /kana-study/, correcto; 734,35 kB iniciales, 22,705 s; cuatro warnings SCSS conocidos, sin ampliar presupuestos |
| Revisión visual | Escritorio oscuro 1280 px y móvil claro 390 px, capturas inspeccionadas; sin overflow horizontal en la prueba móvil |
| Higiene | git diff --check correcto; sin archivos iniciales eliminados |

Comandos reproducibles principales:

```sh
node scripts/test-custom-decks-sql.mjs --transfers --limits
node scripts/test-custom-decks-native.mjs --transfers --client-v2-tests --browser-tests --guest-tests --hardening-tests --startup-probes=3
npm test
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npm run build -- --base-href /kana-study/
git diff --check
```

Evidencia local: `.cache/h4bd2-directed.log`, `.cache/h4bd2-core-unit.log`, `.cache/h4bd2-angular-final.log`, `.cache/h4bd2-pglite-final.log`, `.cache/h4bd2-all-browser-final.log`, `.cache/h4bd2-build-final.log` y ejecución nativa `.cache/h4a1-runtime/run-zxvU6u/`. Las capturas son `.cache/h4bd2-desktop-dark.png` y `.cache/h4bd2-mobile-light.png`. Estos artefactos no se publican ni se versionan.

Los tests unitarios inyectan transporte para cubrir bytes congelados, recibos discordantes, cancelación y fences. Los tests SQL prueban las transacciones/contratos, sin Angular. Los 26 tests de navegador usan Angular y PostgreSQL/PostgREST locales, revisiones/undo del servicio real y snapshots originales; las pausas, pérdida de ACK, indisponibilidad V2 y excepción de cuota local son fallos controlados del arnés. La cuota remota se alcanza con datos sintéticos sembrados solo por el administrador del arnés. No certifican capacidad física de un móvil ni Supabase Auth. Se comprobaron staging invisible, atomicidad de contenido/historia, reanudación sin segundo publish, fuente modificada, A→B→A, consentimiento, tombstone/revisión concurrente, pestañas compartidas, V1 parcial preservado, cola de rama no enviada y recuperación tras cerrar el navegador origen. El lector limpio no modifica FSRS al consultar el archivo.

La publicación local coteja además el contenido original de cada tarjeta, la cardinalidad y payload/head/voidedBy de eventos, los snapshots y los registros diarios. La familia grande de reviews anuladas conserva fechas y elapsedAnswerMs. La suite completa conserva las pruebas anteriores de Stats V2, Japanese 1500 y Manga Saved FSRS. Las ejecuciones satisfactorias delimitan lo comprobado, sin prometer ausencia absoluta de carreras.

Durante desarrollo se registraron las expectativas V1 obsoletas y se adaptaron sus garantías a V2, sin omitir tests. La fixture de JWT cambiaba a veces solo bits no significativos del último carácter base64url: ahora cambia el primer byte de firma y mantiene la prueba de rechazo real. También se corrigieron el acceso del test al servicio de tema y la fixture de tombstone previo a creación, sin cambiar producción para ocultarlos. El fallo de rebase anterior sí era productivo y tiene corrección/regresión explícitas.

Una primera validación del constructor comparaba la huella del payload completo de review/undo, mientras el productor real firma el event interno. Se alineó con ese contrato y se añadió una regresión con el servicio FSRS real. El primer build detectó orden/formato obsoleto de core.generated.ts; se regeneró mediante scripts/compile-i18n.mjs y se repitieron build y suite completa correctamente. grammar.generated.ts y dictionaries.generated.ts conservan sus hashes iniciales. El exit 3 histórico del arnés no se ha diagnosticado ni se declara resuelto: no apareció en las tres sondas actuales.

## Archivos y cierre

Comparación SHA256 contra el estado recibido: **24 archivos existentes modificados, 6 nuevos y 0 eliminados**; los otros 1485 mantienen su contenido. Lista verificable en `.cache/h4bd2-scope.json`.

- Modelos: custom-deck-reconciliation.model.ts, custom-guest-import.model.ts y custom-transfer-v2.model.ts.
- Servicios existentes: custom-conflict-recovery.service.ts, custom-deck-sync-adapter.ts, custom-deck-sync-transport.ts, custom-deck.repository.ts, custom-guest-import.service.ts y custom-transfer-v2-contract.ts.
- Servicios nuevos: custom-branch-archive.service.ts, custom-guest-transfer-builder.ts y custom-transfer-coordinator.ts.
- Pruebas Angular: custom-deck-sync-port.fixture.ts, custom-guest-import.spec.ts y el nuevo custom-transfer-coordinator.spec.ts.
- Navegador/arnés: custom-decks-guest.spec.ts, custom-decks-hardening.spec.ts, custom-decks-sync.fixture.ts, test-custom-decks-native.mjs y el nuevo custom-decks-v2.spec.ts.
- Perfil: custom-cloud-panel.ts/html/scss; traducciones es.json/en.json/ca.json y core.generated.ts generado oficialmente.
- Documentación: este informe nuevo, MANGA_DECKS_DESIGN.md y SUPABASE_SETUP.md.

No se modificaron las migraciones SQL, los gates, Auth/Workspace/WorkspaceMigration, el scheduler, Stats V2, Japanese 1500 ni Manga Saved FSRS respecto al estado recibido. Se preservaron también sus cambios anteriores sin commit.

**H4B-D2 completado técnicamente en el entorno local descrito. Publicación bloqueada.** Guest usa V2 exclusivamente; la generación queda invisible hasta el commit atómico, conserva historia original y confirma publicación local separadamente. El archivo completo puede consultarse desde un navegador limpio por referencia, sin aplicar una rama FSRS. Los estados incompletos/incompatibles permanecen explícitamente bloqueados y conservados. No se activa ningún gate, se despliega SQL ni se inicia otra fase.

Antes de publicar siguen pendientes Supabase Auth/GoTrue/gateway/CORS con un entorno aislado autorizado, Safari/iOS/Android físicos, rendimiento/cuota de máximo volumen, retención/purga y política para fuentes legacy/solapadas. El usuario no ha autorizado cuentas reales ni SQL remoto. La fase recomendada es revisar esos bloqueos y autorizar una validación acotada independiente, no activar gates ni iniciar automáticamente otro hito.
