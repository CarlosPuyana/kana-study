# Manga × Mazos — H4B-C: durabilidad, límites y preparación técnica

Fecha: 2026-10-22. Investigación y endurecimiento exclusivamente local. No se usan cuentas, credenciales ni material privados; no se despliega SQL, no se activan gates y no se hace commit/push. Supabase Auth no se da por validado.

## Referencia inicial

Se inspeccionó git status y se registraron SHA256 de los 1490 archivos existentes no ignorados en `.cache/h4bc-baseline.json`. Se leyeron DESIGN, H4A, H4A1, H4BA, H4BB, H3A y SETUP y se revisaron repositorio, importador, adaptadores, contratos, migración y arneses. El árbol incluye numerosos cambios previos sin commit: la comparación final permite distinguirlos. No se hizo reset, clean ni checkout destructivo.

## 1. Auditoría de conservación y recuperación

Se distinguen tres cosas:

- **Conservada:** existe en el journal/Guest/checkpoint local o en una fila remota.
- **Recuperable:** un dispositivo autorizado puede obtener y verificar esa evidencia concreta.
- **Aplicada:** forma parte del head y la proyección FSRS canónicos. Un conflicto no implica aplicación.

El servidor H4A conserva indefinidamente las peticiones que recibió, su recibo original y la evidencia rechazada. Las resoluciones son peticiones nuevas con `resolvesOperationId`; el conflicto original no se elimina. Los eventos aceptados, anulaciones y tombstones también se conservan. El adaptador deja de enviar al primer conflicto: los repasos siguientes de la rama pueden existir **solo en el journal local**. Un hash, cardId o recibo anterior no permite inventar esa cola ni sus snapshots.

### Recuperación de solo lectura implementada

`CustomConflictRecoveryService.inspect()` consulta las tablas existentes con RLS, pagina los conflictos y verifica por separado cada recibo. Comprueba propietario capturado, principal, revisión de activación (también A→B→A), igualdad exacta petición/evidencia, motivo, esquema, operationId, revisión y prueba de resoluciones aceptadas. Reutiliza la inspección canónica validada del adaptador y sus pruebas de confirmación/identidad.

Devuelve las operaciones rechazadas **tal como llegaron**, sus eventos, snapshots propuestos, elapsedAnswerMs, ancestros disponibles, estado/head canónicos actuales, tarjeta confirmada o tombstoned y resoluciones verificadas. No ejecuta ts-fsrs, no suma eventos, no crea un journal sintético, no confirma operaciones ni escribe IndexedDB. No promueve esa evidencia a progreso aplicado.

La procedencia devuelta es la tarjeta confirmada actual o retenida en el tombstone. Un review H4A no guarda la versión de contenido vista al contestar; no se presenta la glosa actual como prueba del contexto histórico exacto del repaso. La identidad del cardId sigue protegida por la inmutabilidad del servidor.

La API declara `applied:false`, `localTail:unknown`, `coverage:observed-submitted-operations` y `consistentSnapshot:false`. Puede reconstruir íntegramente la **operación enviada** y los ancestros disponibles, pero no promete reconstruir toda la rama local. La paginación de conflictos tampoco es una instantánea MVCC: un conflicto insertado con clave anterior al cursor podría quedar fuera, y un rechazo no incrementa necesariamente la generación de entidades. No se presenta la consulta como un inventario remoto exhaustivo y consistente.

La exportación está acotada: páginas de 8 conflictos, máximo 1000 páginas, 32 MiB de evidencia contabilizada (incluye estado canónico, peticiones, recibos y resoluciones), hasta 100 resoluciones por conflicto. Duplicados, owner distinto, recibos incompatibles, páginas no progresivas o exceso de presupuesto rechazan la consulta completa, sin devolver un falso resultado vacío/completo. La inspección canónica previa todavía materializa el catálogo: este límite no es una garantía de pico de RAM del navegador.

### Matriz de recuperación

| Situación | Conservación y recuperación | Progreso aplicado |
| --- | --- | --- |
| Dos navegadores activos | Ganador en servidor; perdedor y cola en journal; petición rechazada también remota | Solo head aceptado |
| Perdedor después de recarga | Reconciliación, journal, Guest y checkpoints sobreviven; consulta remota verifica la operación recibida | No se reejecuta el review |
| Pérdida del almacenamiento del perdedor | Se recuperan petición/recibo rechazados, snapshots incluidos y ancestros disponibles; **no** la cola nunca enviada ni el inventario Guest local | Canónico intacto |
| Navegador limpio | Puede consultar evidencia RLS sin escribir progreso; un pull canónico separado recibe el ganador | Ninguna rama rechazada se cuenta |
| Guest parcialmente importado | Guest y plan local conservan la captura; remoto solo conserva los pasos que recibió | No existe atomicidad de toda la importación; véase bloqueo de publicación debajo |
| Conflicto resuelto explícitamente | Recibo original, conflicto y resolución aceptada siguen consultables; archivo local añade journal dependiente | Decisión canónica confirmada; evidencia rechazada aparte |
| Tombstone posterior | La tarjeta/contexto retenidos y recibos permiten consultar el rechazo sin restaurar nada | No resucita la tarjeta |
| Misma fuente desde otro origen | IDs e intención idénticos pueden reconocerse/repetirse sin doble review; cada owner queda aislado. Una identidad/namespace diferente no se une por palabra/lectura | No mezcla FSRS entre identidades |

La prueba real usa un ancestro aceptado compartido, dos reviews divergentes y otro review del perdedor que nunca se envía. Tras cerrar ese navegador, el dispositivo limpio obtiene el primero y su ancestro, pero no el último: se demuestra la pérdida potencial en lugar de ocultarla. Después consulta la resolución, el tombstone y otra cuenta sin evidencia ajena. La retirada de consentimiento permite lecturas autorizadas y no añade applies.

### Extensión futura propuesta, no implementada

Para conservar íntegra una cola rechazada después de perder el dispositivo hace falta un archivo de ramas explícito/versionado: manifest de rama con owner derivado de sesión, base/head, identidad, operaciones originales, orden, hashes y chunks inmutables; recibos por chunk y publicación/retención explícita. También hace falta un cursor/generación de evidencia o lectura consistente para exportar todos los conflictos. Debe ser aditivo, con RLS, presupuestos, pruebas de interrupción/cuota/CAS/concurrencia y consentimiento. No se reutiliza user_preferences como blob, no se aplican esas ramas ni se recalcula FSRS. Es una fase de protocolo separada, no una funcionalidad terminada de H4B-C.

## 2. Límites y correcciones acotadas

Se conserva el contrato H4A: 64 cambios, 512 KiB por petición, límites por campo, 1000 tarjetas por manifest y 4 MiB para el bundle completo. No se relaja SQL ni se elimina contexto, alternativas o eventos.

### Preflight antes de la primera subida

El importador ahora prepara/valida de antemano los pasos de contenido, historia y días, incluyendo la familia atómica de head y descendientes anulados, y el manifest conservador con tarjetas vivas del destino y origen. Detecta 65 cambios, exceso de bytes o más de 1000 IDs antes del primer apply. El plan guarda paso, tipo, cambios, bytes y motivo; la UI experimental lo explica en ES/EN/CA. Guest queda intacto y `published` no se marca.

El preflight se repite al reanudar: una solución válida puede continuar con los mismos recibos. Una familia congelada que sigue superando el contrato permanece bloqueada; no se divide el head de sus dependencias ni se descartan eventos para desbloquearla. Un cambio concurrente del destino después del preflight continúa protegido por CAS y puede producir otro bloqueo.

Los checkpoints antiguos con una petición ya congelada se validan sobre esa petición exacta, conservando operationId y cuerpo: no se reconstruyen silenciosamente. La regresión nueva conserva una petición de 65 cambios y el Guest intactos, bloquea antes de cualquier apply y explica el límite. Soportar esa petición requiere una migración/protocolo versionados; no se promete desbloqueo automático de cualquier checkpoint V1.

La ordenación de ancestros deja de usar recursión y búsquedas cuadráticas de padres. Usa mapas y recorridos iterativos, detecta ciclos, padres ausentes y referencias a otra tarjeta antes de subir. Hay regresión con cadena de 10000 eventos y con head que tiene descendientes anulados. Esto mejora el recorrido, no certifica todo el importador para 10000 eventos: checkpoints y consultas completas siguen teniendo costes de escala.

### Bundle paginado

El cliente antes rechazaba `paged-required` aunque ya tenía el feed completo. Ahora materializa el bundle exclusivamente desde ese staging: mismo manifest/revisión, todas las referencias presentes con revisión exacta, sin tombstones/duplicados y mismo conteo de tarjetas. Mantiene las comprobaciones de generación, bundle, tail, propietario y commit local atómico. Una referencia ausente o generación distinta conserva la publicación local anterior. No convierte un stage en un mazo listo.

La prueba SQL genera 50 tarjetas con alternativas sintéticas válidas; dos navegadores limpios descargan y publican el bundle paginado, y una recarga no duplica tarjetas ni crea eventos. No se añade una RPC ni se cambia el tamaño permitido del bundle completo.

### Mediciones SQL reales

Los mismos fixtures se ejecutan en PostgreSQL nativo y PGlite:

| Caso | Observado |
| --- | --- |
| Head + 61 hijos anulados + progreso + día | 64 cambios, 67063 bytes, aceptado |
| Añadir otro hijo al mismo lote | 65 cambios, rechazado; el evento adicional no existe |
| Petición válida ajustada al límite jsonb exacto | 524288 bytes aceptados |
| Un byte adicional | 524289 bytes rechazados |
| Manifest de 1001 tarjetas | Rechazado, sin mazo parcial |
| Bundle 10 tarjetas con alternativas | 1013679 bytes, complete |
| Bundle 25 tarjetas | 2533854 bytes, complete |
| Bundle 50 tarjetas | 5067479 bytes, paged-required; cliente lo materializa desde feed validado |

La regresión browser comprueba además la familia de 65 cambios en Guest: **cero applies**, captura original idéntica y checkpoint bloqueado. Una fuente distinta con familia de 64 cambios sí se importa con el motor real, manteniendo solo un repaso efectivo y todas las anulaciones.

Se materializan también 10/50/200/1000 intenciones sintéticas repartidas en 1/1/2/10 mazos. Ocupan 25971 / 130211 / 522011 / 2614011 bytes JSON. Son **listas de intenciones Node**, no una exportación Guest completa con todos sus stores, ni un benchmark de importación remota de 1000 tarjetas. Los tiempos y deltas de heap/RSS se conservan en hardening-limits.json; el GC y el motor PGlite cambian esos deltas, que no son picos de memoria del navegador.

### Cuota, memoria y costes pendientes

Los tests conservan el fallo de cuota antes de HTTP y después de commit remoto; al reanudar se consulta el recibo original sin repetir publicación. Una transacción IDB abortada no borra Guest ni declara Synced. No se solicita borrar almacenamiento para continuar.

El repositorio todavía carga todos los stores del owner para sus transacciones y guarda planes/reconciliación como documentos grandes. Staging y revalidación de cada paso pueden reserializar/releer el inventario; no hay garantía de RAM móvil, almacenamiento persistente, quota disponible ni latencia para catálogos arbitrarios. La fixture de 50 tarjetas es deliberadamente pesada en procedencia, no representa una certificación de todos los volúmenes. Una V2 con cursores IDB, checkpoints por paso, índices de dependencias y publicación por generaciones requiere diseño y medición físicos separados.

### Bloqueo demostrado: contenido Guest antes del historial

**H4A no puede publicar contenido e historia Guest en una única operación.** `publish/stage` no admite datos de estudio; `import-history` solo admite estudio. H4B-B publica contenido/manifest y después los snapshots. Si la respuesta del primer commit se pierde, el importador origen queda pendiente y conserva todo, pero un navegador limpio puede recibir la tarjeta lista **sin su FSRS todavía** y verla como nueva. La prueba nueva reproduce exactamente esta ventana; después reanuda y recupera un único evento/snapshot original.

El preflight elimina la publicación parcial causada por límites conocidos, pero no elimina esta ventana de fallo de red. No se presenta el caso como resuelto por haber pasado una prueba de recuperación. **Bloquea una V1 pública.** Corregirlo exige publicación/importación versionada con staging no estudiable, manifest de generaciones y declaración de dependencias de estudio, o una envoltura transaccional nueva con presupuestos y recibos explícitos. Hay que probar interacción entre dispositivos, progreso concurrente, tombstones, interrupciones y CAS. No se simula atomicidad con un flag local que otro dispositivo desconoce ni se relaja el contrato existente.

## 3. Bundle inicial

Se generaron build production con --base-href /kana-study/ --stats-json antes y después. El grafo inicial se obtiene de index.html y los imports estáticos de browser-stats.json; se excluyen imports dinámicos y se cuentan archivos únicos. Las sumas gzip/Brotli son compresión por archivo (Node zlib), no tamaños de source map ni estimación de RAM.

| Medida | H4B-B al inicio | H4B-C | Diferencia |
| --- | ---: | ---: | ---: |
| Raw inicial | 754971 B | 727087 B | -27884 B |
| Gzip por fichero | 228184 B | 220523 B | -7661 B |
| Brotli por fichero | 185479 B | 178202 B | -7277 B |
| Margen respecto a 750000 B | -4971 B | +22913 B | Presupuesto sin cambios |

La causa evitable era WorkspaceMigrationService importando repositorio, validadores, registro y transporte custom desde Auth en el arranque. Los tokens ligeros pasan a custom-deck-gates.ts; las rutas antiguas reexportan los mismos tokens, sin alterar sus instancias o defaults. El puente CustomGuestWorkspaceMigration se importa dinámicamente solo si todos los gates permiten el flujo. Un test comprueba que con gates false ni siquiera se instancia el repositorio.

Salen del grafo inicial custom-deck.repository, custom-deck-validation, manga-deck-confirmation, custom-deck-reconciliation, custom-guest-import-helpers y custom-deck-sync-transport. Panel Guest y resoluciones ya pertenecían a chunks diferidos; no se atribuye su ausencia inicial a una eliminación nueva. No se quita ninguna comprobación de seguridad. El build vuelve a tener solo los cuatro avisos SCSS Grammar conocidos.

## 4. Grammar: reproducción y corrección del test

No se ha encontrado un fallo funcional de Grammar. El caso original de grammar.spec.ts:132 acumulaba los doce temas y todas sus microlecciones en un único deadline de 5000 ms.

- Tres procesos aislados, código original: 14/14 cada uno; ese caso tarda 2027 / 2065 / 2081 ms.
- Tres procesos con build y Playwright concurrentes, solo spec Grammar: 14/14 cada uno; 2908 / 2870 / 3156 ms.
- Suite completa original bajo esa carga: 1871 correctos y un fallo en ese mismo caso, a 5029 ms; se conserva el JSON/stack del runner en `.cache/h4bc-grammar/full-loaded.json`. El stack corresponde a la guarda withTimeout del runner. Reproduce la fragilidad temporal, sin una aserción funcional fallida.

Se parametriza **solo el test** por tema. Se mantienen todas las rutas, conteos de lesson-card, encabezados, opciones de ejercicio/check-answer y datos originales. Se añade la comprobación de que ninguna lección pertenece a un tema fuera del catálogo, para evitar que el filtrado omita una ruta. El timeout no cambia y no se toca ninguna implementación Grammar.

Aislado después: 25/25, doce casos de navegación; máximo 436 ms por tema y 2737 ms total entre ellos. La suma es comparable al trabajo previo, pero deja de depender de un único deadline agregado. La validación posterior bajo carga y la suite final se registran abajo. No se afirma ausencia absoluta de problemas en cualquier CI o máquina más lenta; se distingue contención observada de un defecto funcional inexistente.

Reproductor: scripts/measure-grammar-contention.mjs, con etiquetas isolated/loaded e isolated-after/loaded-after, máximo tres procesos secuenciales por etiqueta. No configura timeouts ni modifica el código. Para la carga se lanzaron explícitamente build y el arnés nativo/Playwright en paralelo; la suite completa se midió también así. Entorno: Windows 10.0.26200 x64, Node 24.21.0, 24 procesadores disponibles según Node. No se atribuye a Ubuntu ni al runner GitHub Actions.

## 5. Arranque de PostgREST

Se conservan los diagnósticos de salida 3, versión PostgREST 16.5, PostgreSQL 17.5, pool HTTP=1 y LC_ALL/LANG=C. El arnés ahora registra por proceso PID, inicio, readiness, latencia, salida/señal y parada solicitada en postgrest-startups.json, además del log redactado. Una salida por parada explícita no se confunde con un fallo antes de readiness.

La batería acotada arranca cinco procesos fríos consecutivos contra cada clúster efímero de prueba. Cada proceso tiene su pool nuevo, sin reintentar un arranque fallido. No son cinco instalaciones completas de Supabase ni cinco máquinas: PostgreSQL sigue vivo durante los cinco probes. Se han ejecutado también clústeres independientes en las pasadas de desarrollo y finales. Los resultados finales están abajo.

No se ha reproducido salida 3 en este hito. No hay stack nativo que pruebe locale, libpq o Gettext como causa. La incidencia se conserva **no diagnosticada**, sin invalidar los tests que sí pasan. Si vuelve a ocurrir, los logs/PID/configuración permiten contrastar la hipótesis falsable de fallo de inicialización nativa variando una variable por vez en otro clúster aislado. No se cambia locale de producción ni se recomienda un retry de servicio como solución.

## 6. Consentimiento y aislamiento

Se verifica retirada antes de apply y después de un commit remoto. La retirada posterior conserva el recibo remoto, bloquea la finalización/publicación pendiente y no duplica al reanudar con consentimiento renovado. No promete eliminación del servidor. La recuperación nueva es una lectura autorizada, no requiere volver a conceder permiso de subida y no envía operaciones.

Los tests cubren propietario de fila/respuesta, recibo independiente, resolución falsificada, páginas repetidas, A→B→A durante recuperación y durante importación, dos pestañas con IDB compartida y Guest separado. Los nuevos métodos SDK fijan Authorization a la sesión capturada y filtran owner; las tablas continúan usando RLS y sin DML directo. No se introduce un login paralelo, token en frontend ni emisor de JWT en Angular.

Los cuatro gates permanecen false, incluido CUSTOM_REMOTE_UPLOAD_APPROVED. La consulta interna se carga en el panel experimental, no se añade un control público de activación. Se amplía la redacción de logs para patrones JWT además de contraseña/clave efímeras; se conserva failure.log también si falla una comprobación del arnés.

## 7. Validaciones finales

| Validación | Resultado observado |
| --- | --- |
| Tests dirigidos custom antes del último guard de checkpoint | 104/104, 9 archivos |
| Grammar aislado después de parametrizar | 25/25 |
| Suite completa con build + arnés nativo/Playwright concurrentes | 1883/1883, 185 archivos; máximo 1008 ms por tema y suma 5586 ms entre los doce temas |
| Suite completa posterior sin carga intencional | 1883/1883, 185 archivos |
| Suite completa final con regresión de checkpoint congelado | 1884/1884, 185 archivos; 14,96 s de runner y compilación de tests 19,716 s |
| PGlite | 23 escenarios originales y nuevas comprobaciones de límites correctos |
| PostgreSQL 17.5 nativo final | 23 escenarios originales; límites nuevos correctos; 16/16 multisesión, 15 transacciones bloqueadas observadas |
| PostgREST 16.5 HTTP/JWT | 8/8; JWT sintéticos verificados realmente, sin Supabase Auth |
| Playwright final sobre PostgreSQL/PostgREST reales | 15/15 en 54,2 s: H4B-A 3, H4B-B 8, H4B-C 4 |
| Arranques fríos finales | 5/5 listos en 328 / 287 / 293 / 388 / 389 ms; PID 9604 / 33944 / 21824 / 25984 / 11864 |
| TypeScript app/spec final | Ambos correctos, exit 0 |
| Build GitHub Pages final | Correcto, 18,567 s; inicial 727087 B; solo cuatro avisos SCSS conocidos |
| git diff --check y archivos nuevos | Exit 0; sin whitespace final en los 35 archivos de este hito |

El último arnés completo está en `.cache/h4a1-runtime/run-8IIfpf/`: results.json, hardening-limits.json, postgrest-startups.json, browser-tests.log y logs de servidor redactados. Los SIGTERM fueron paradas solicitadas, no fallos de arranque. También pasaron las ejecuciones completas run-XYU8Vz y run-qhlFR3 (15 Playwright cada una); no se afirma estabilidad absoluta a partir de esas pasadas.

La suite final se registra en `.cache/h4bc-final-tests.log`. La comparación Grammar bajo carga está en `.cache/h4bc-grammar/full-loaded-after.json`. Los límites PGlite están en `.cache/h4bc-pglite-limits.json`. En la última medida nativa, materializar el inventario sintético de 1000 tarjetas/10 mazos tardó 40,06 ms, con delta heap 19828128 B y RSS 135921664 B; no es el pico de RAM de una importación browser completa.

Durante desarrollo se registró una fixture SQL con expectedHead incorrecto para import-history; el servidor la rechazó y se corrigió la fixture. Otra ejecución de navegador perdió su contexto mientras se editaban fuentes del dev server; no se presenta como una pasada correcta, y las validaciones posteriores se hicieron sin editar fuentes durante los tests. El límite de páginas de la fixture pesada se hace explícito (25 entidades por página) frente a las dos usadas deliberadamente por las pruebas de interrupción; producción conserva sus páginas solicitadas de 100. No se aumentan timeouts o budgets.

## 8. Alcance y archivos

Comparación SHA256 con la referencia inicial: 23 archivos existentes modificados, 12 nuevos y ninguno eliminado. El resto de los 1490 archivos iniciales permanece idéntico. Los cambios anteriores del árbol no se atribuyen a este hito.

- Documentación: MANGA_DECKS_H4BC.md (nuevo), MANGA_DECKS_DESIGN.md y SUPABASE_SETUP.md.
- Recuperación: custom-conflict-recovery.model.ts, custom-conflict-recovery.service.ts y custom-conflict-recovery.spec.ts (nuevos); custom-deck-sync.model.ts, custom-deck-sync-transport.ts y custom-cloud-panel.ts.
- Bundle paginado: custom-deck-sync-contract.ts, custom-deck-sync-adapter.ts y su spec.
- Importación y límites: custom-guest-import.model.ts, custom-guest-import.service.ts, custom-guest-import-helpers.ts, custom-guest-import.spec.ts; nuevos custom-import-limits.ts y custom-guest-import-helpers.spec.ts; custom-cloud-panel.html y traducciones es/en/ca/core.generated.ts.
- Carga diferida: workspace-migration.service.ts, custom-deck.repository.ts; nuevos custom-deck-gates.ts, custom-guest-workspace-migration.ts y su spec.
- Pruebas y medidas: grammar.spec.ts, e2e/custom-decks-sync.fixture.ts, scripts/test-custom-decks-native.mjs y scripts/test-custom-decks-sql.mjs; nuevos e2e/custom-decks-hardening.spec.ts, scripts/measure-grammar-contention.mjs y supabase/tests/custom-decks-limits.mjs.

Los modelos y servicios anteriores están en src/app/core/models y src/app/core/services; el panel está en src/app/features/profile y el spec Grammar en src/app/features/grammar.

No se modifican algoritmos/parámetros FSRS, Stats V2, Japanese 1500, Manga Saved FSRS ni tablas legacy. La migración SQL H4A queda idéntica. El único archivo Grammar modificado es su spec, por el problema reproducido y conservando cobertura. Se preservan todos los cambios previos sin commit.

## 9. Cierre y bloqueos para V1

H4B-C queda cerrado como investigación/endurecimiento local con las validaciones registradas, sin certificar Supabase Auth. No equivale a V1 pública lista.

Siguen bloqueando o condicionando publicación:

1. **Atomicidad Guest contenido/FSRS**: ventana demostrada de tarjeta visible sin su historia; necesita protocolo de publicación seguro antes de activar.
2. **Pérdida de la cola no enviada**: falta archivo remoto de rama completo y una política de retención/recuperación explícita. La API readonly no puede recuperar lo que nunca se envió.
3. **Familias mayores de 64 cambios / peticiones mayores de 512 KiB**: permanecen bloqueadas, sin fragmentación indebida. Necesitan protocolo nuevo si se quiere soportarlas.
4. **Escala y dispositivos reales**: stores/planes completos, presupuesto RAM/cuota, Safari/iOS/Android y volúmenes grandes sin certificación física. El bundle paginado resuelve el umbral 4 MiB, no todos los costes.
5. **Supabase Auth/gateway/CORS**: pendiente de un entorno aislado autorizado; los JWT sintéticos locales no lo certifican.
6. **PostgREST salida 3**: incidencia histórica sin causa demostrada; seguir conservando diagnósticos. No se da por resuelta por pasar esta batería.

Recomendación: diseñar y autorizar por separado una extensión versionada mínima para publicación Guest y archivo de ramas; después validar Auth y móviles en entornos autorizados. No iniciar H3B, H5, generación automática ni sincronización real. No desplegar SQL a partir de este informe.
