# Manga × Mazos — Hito 3A: identidad y conocimiento entre mazos

Fecha: 2026-10-22. Estado: infraestructura interna de solo lectura; sin nueva UI pública.
H1/H1.1, H2A–H2A.2, H2B-A y Stats V2 se conservan. Ambos gates custom siguen false.

## Arquitectura implementada

`LexicalKnowledgeProjectionService` consulta el catálogo real y el progreso/eventos
efectivos de cada mazo del workspace. `DeckCatalogService.knowledgeInventory()` ofrece
una lectura interna con builtins y todos los customs, incluidos archivados. No modifica
el catálogo visible ni incorpora archivados a Daily Study. Esta lectura no depende de
activar la UI experimental; nadie inyecta la proyección en una pantalla pública.

Se reutilizan LexicalIdentity, CustomDeckRepository, los recibos H2B-A y DeckDatabaseService.
No se consulta Manga Saved FSRS como si fuera progreso de Mazos. Saved Words permanece
independiente, sin puente por expresión/lectura ni copia de eventos. Daily Study y Perfil
siguen utilizando sus APIs actuales; no se cambian sus cálculos ni Stats V2.

Cada resultado conserva identidad y ámbito de evidencia, grupo equivalente, IDs de
equivalencias y tarjetas que lo justifican, estado de cada tarjeta, eventIds efectivos,
estabilidad validada, indicador de archivado, completitud y razones de indeterminación.
El snapshot final está congelado en profundidad para evitar que un consumidor lo mute.

La proyección no guarda snapshots, eventos, glosas, equivalencias o FSRS. Las aperturas
readonly de repositorios pueden inicializar una base vacía como sus APIs existentes;
no crean registros de estudio. No se añade una base/store ni migración SQL.

## Identidad, evidencia y equivalencias

Hay cuatro situaciones distintas:

1. Identidad demostrada: registro de un manifiesto revisado, con fuente, versión,
   SHA-256, referencia, restricciones y revisión documentadas.
2. Identidad local confirmada: entidad H2B-A validada contra su operación/recibo en el
   workspace, namespace y ancla completos. Su propio FSRS puede clasificarla; esa
   clasificación no se atribuye a otras ocurrencias o registros por coincidencia textual.
3. Posible equivalencia: una propuesta con claves candidatas sigue siendo `unlinked`.
4. Sin vínculo: forma OCR, ordinal Yomitan, ancla arbitraria sin registro o identidad
   ajena al workspace devuelve `unlinked`; nunca equivale automáticamente a `unknown`.

`LexicalEvidenceService` valida el contrato del manifiesto readonly inyectado. Incluye
identidades, mapping `(deckId,entryId)` y equivalencias con IDs y estado `revoked`.
Cada nueva versión del manifiesto debe cambiar `revision`. Las pruebas sustituyen
este proveedor con evidencia controlada; no son certificación lingüística real.
El manifiesto de producción está vacío (`h3a-unmapped-1`). No hay editor/importador
público de evidencia ni un flag de usuario que convierta propuestas en verificadas.

Se compara el ancla y registro completo además de la clave SHA-256. Los enlaces activos
entre identidades demostradas forman componentes de equivalencia; todos los enlaces
deben representar equivalencia demostrada, nunca semejanza. Revocar uno reconstruye
los grupos y puede separar conocimiento sin reescribir tarjetas, IDs o historial.
No se usa una glosa, escritura/lectura idéntica, primera coincidencia o ent_seq provisional.
Las equivalencias locales explícitas de H2B-A que reutilizan una misma entidad comparten
su clave dentro del registro; no se convierten por eso en equivalencias universales.

El esquema permite versionar/revocar evidencia, pero no implementa administración
persistente, autoridad remota o firma/certificación automática. Esos adaptadores y la
revisión semántica real siguen pendientes. Validar campos de una evidencia no demuestra
que sea lingüísticamente correcta: el proveedor debe ser revisado y confiable.

## Clasificación y coherencia

Por tarjeta presente en el contenido actual:

- Sin snapshot y sin eventos efectivos, o State.New con reps=0, lastReview=null y sin
  eventos: `pending`.
- Snapshot válido de Learning/Relearning/Review con eventos efectivos coherentes:
  `learning`, salvo Review con estabilidad finita ≥14, que es `known`.
- Review 13,999 es learning; Review 14 es known. Estar vencida no cambia ese criterio.
- Snapshot ausente con eventos efectivos válidos: learning, estabilidad null. No se
  reconstruye memoria ni se inventa un estado actual a partir de ese historial residual.
- Snapshot corrupto, New con historial, discrepancia snapshot/evento o cabeza ausente/
  ambigua: `indeterminate`. No se convierte una lectura fallida en New.

La cabeza efectiva debe coincidir con lastReview, state/due/stability/difficulty actuales,
timestamp del log y reps anteriores+1. Su cardBefore debe concordar con los campos
before y no tener un lastReview posterior. Los eventos pasan los validadores H1;
IDs repetidos/cabezas simultáneas ambiguas no justifican conocida. No se exige reconstruir
todo un historial remoto aún no disponible ni se completan eventos que faltan.

Por grupo: known > learning > indeterminate > pending; sin tarjetas se permite unknown
**solo con inventario completo**. Los resultados positivos siguen mostrando
`inventoryComplete:false` si quedan entradas sin mapping o lecturas fallidas: la tarjeta
justifica lo observado, pero no se afirma haber descartado evidencia adicional.
Con inventario incompleto y ninguna tarjeta correspondiente se devuelve indeterminate.
Una identidad que ni siquiera tiene registro verificable devuelve unlinked.

Dos tarjetas equivalentes mantienen FSRS independiente. Una Review/S20 basta aunque
otra esté Learning/S1: no se suma estabilidad, dificultad, tiempo o eventos. Si desaparece
o se revoca la última evidencia madura puede quedar learning. Undo consulta los eventos
efectivos existentes: custom excluye anulados, builtin elimina el evento deshecho.
Deshacer la única introducción vuelve a pending sin perder el recibo del journal custom.

Los archivados aportan conocimiento. Solo se enumeran IDs del contenido actual: progreso
o eventos de una tarjeta eliminada no la resucitan ni aportan su FSRS actual. No se añade
una operación destructiva de borrado ni un tombstone remoto. Si el contenido es ilegible,
el inventario queda incompleto, no se presume borrado.

## Japanese 1500: mapping real y bloqueo

Auditoría reproducible: `node scripts/audit-japanese-1500-lexical.mjs`.
Fuente local: `src/app/data/japanese-1500.generated.ts`, SHA-256:
`5cd896e525eb047430b3231f9929e553368bea35e6b9023cb7e426c23da57d75`.

- Entradas examinadas estructuralmente: **1500**, con 1500 IDs distintos.
- Entradas revisadas lingüísticamente para este mapping: **0**.
- Vinculaciones realmente verificadas y distribuidas: **0/1500 (0 %)**.
- Vinculaciones pendientes: **1500**. No se presenta un mapping parcial como completo.
- Campos verificables de ent_seq, grupo léxico o restricciones en el dataset: ninguno.
  guid/ID/source y traducciones editoriales no certifican esos datos ausentes.
- Hay 12 grupos de escritura+lectura repetida (24 entradas): 聞く, よく, もう, 高い,
  今度, ただ, 早い, 起きる, しっかり, 結構, 起こす y まずい. Son puntos para revisar,
  no 12 homógrafos o equivalencias certificadas. El número real de ambigüedades semánticas
  sigue sin determinar; no se ha hecho revisión japonesa independiente.

El mapping requiere evidencia de entrada, lectura, grupo estable y restricciones,
ausencia de ambigüedad material y revisión de la relación con la tarjeta editorial.
El contrato además fija un digest de la entrada completa y comprueba forma/lectura
compatibles. Un cambio editorial invalida el vínculo, no regenera el dataset.
Los tests prueban un mapping parcial controlado de 1/1500; **no se distribuye ni se
cuenta ese fixture como una vinculación real**. El XML/índice experimental no se importa
en producción ni se utiliza para fabricar un homographGroup certificado.

Consecuencia actual: los 1500 builtins sin mapping hacen incompleto el inventario léxico
global. Se puede clasificar una entidad local por sus tarjetas, pero no concluir
desconocimiento exhaustivo de una propuesta nueva. Falta evidencia para un puente real
Japanese 1500↔Manga: el resultado explícito es unlinked/indeterminate según el caso.

## Cobertura preparada, sin página de estadísticas

`calculateLexicalCoverage` es pura. Recibe un análisis ya verificado y no solapado,
con versión, spans por página/bloque y claves léxicas; no extrae ni analiza OCR.
Agrupa tipos por componente equivalente y cuenta cada aparición separada. Dos mazos
no duplican tipos. Expresión compuesta y subpalabras solapadas invalidan la segmentación;
IDs de aparición repetidos y rangos inválidos también bloquean los ratios.

Para el subconjunto de unidades con registro verificable, R=tipos deduplicados y
O=apariciones resueltas; K=known, A=learning, P=pending, U=unknown e I=indeterminate:

- Tipos estricta = |K| / |R|; familiaridad = (|K|+|A|) / |R|.
- Apariciones estricta = apariciones(K) / |O|; familiaridad añade apariciones(A).
- P nunca aumenta cobertura real. I permanece separado, no se convierte en U.
- Denominador cero devuelve null, nunca un porcentaje fabricado.
- Hipótesis para una selección S = cobertura de K∪S, deduplicada por equivalencia,
  **suponiendo** que S llegase a conocida. No toca FSRS ni cambia los ratios reales.

Las apariciones sin identidad vinculable quedan fuera de esos denominadores y se
cuentan aparte. Su número de tipos es null cuando no puede deduplicarse; no se agrupan
por texto para inventar tipos. Spans sin resolver y excluidos se conservan por separado,
sin contarlos como palabras desconocidas. Los contratos no estiman comprensión lectora.

`knowledgeComplete:false` indica conocimiento parcial: los ratios observados de conocidas
son cotas de evidencia demostrada en ese subconjunto, no una cobertura completa exacta.
`fullVolumeCalculable` solo puede ser true con análisis integral, segmentación verificada,
inventario completo y sin spans excluidos/sin resolver, apariciones sin vínculo o estados
indeterminados. Actualmente no hay análisis integral fiable integrado, por lo que no se
publica cobertura del manga ni se usa el número de tarjetas manuales como porcentaje.

## Caché y workspace

Clave: workspace, dataRevision, revisión de progreso builtin, revisión de catálogo/contenido
custom, revisión de progreso/undo custom, versión de evidencia y refresco explícito.
DeckDatabaseService añade únicamente una señal de invalidación tras commitReview,
undoReview y mergeFromCloud locales completados, antes del enqueue posterior. No altera
las transacciones, payloads, programación o sincronización: incluso si outbox falla,
la lectura no conserva una caché anterior al cambio ya persistido.

Un effect de la proyección interna recarga solo al cambiar revisiones. Queries concurrentes
con la misma clave comparten promesa/snapshot; Angular render no recalcula OCR ni FSRS.
Una lectura captura owner y clave; valida tras await y antes de publicar. Un cambio
durante la consulta rechaza el resultado antiguo. `snapshot()` oculta inmediatamente
cualquier valor de otra clave. La destrucción del servicio impide publicaciones tardías.

No hay feed de revisiones entre pestañas/instancias externas: el consumidor debe llamar
`invalidate()` tras cambios fuera de estas APIs. Un futuro archivado/borrado debe emitir
catalogRevision; las lecturas incluyen el estado actual después del refresh. No se añade
un sistema público de archivado/borrado ni se modifican sus reglas. H4 debe resolver
invalidation distribuida, Guest, publicación parcial y revisiones remotas.

## Archivos y validaciones

Nuevos (paths de core parten de `src/app/`):

- `core/models/lexical-knowledge.model.ts`.
- `core/services/lexical-evidence.service.ts`, `lexical-knowledge.ts`,
  `lexical-knowledge-projection.service.ts`, `lexical-coverage.ts`.
- `core/services/lexical-knowledge.fixture.ts`, `lexical-knowledge.spec.ts`,
  `lexical-knowledge-projection.spec.ts`.
- `scripts/audit-japanese-1500-lexical.mjs` y este informe.

Ampliados: `deck-catalog.service.ts` (lectura interna incl. archivados),
`deck-database.service.ts` (señal de revisión) y apéndice DESIGN.
No se cambian scheduler, contenido editorial, Stats V2, Saved FSRS, Sync/Outbox,
SQL, dependencias, gates, traducciones o UI. No son necesarias nuevas claves i18n ni
revisión visual de temas: no existe cambio de presentación en este hito.

Entorno: Windows, Node 24.21.0, Angular 22.2.0/Vitest 4.1.11. No se atribuyen aquí
las pruebas de navegador de H2B-A ni las repeticiones históricas de H1.1.

| Validación ejecutada | Resultado |
| --- | --- |
| Nuevos tests puros y del servicio | **35/35**, dos archivos, dentro de la pasada dirigida final |
| Dirigidos + custom-deck.repository + manga-deck-assisted | **76/76**, cuatro archivos; build 7.276 s, tests 3.52 s |
| Suite completa final `npm test` | **1791/1791**, 177 archivos; build 21.435 s, tests 14.70 s |
| `npx tsc -p tsconfig.app.json --noEmit` | **Correcto** |
| `npx tsc -p tsconfig.spec.json --noEmit` | **Correcto** |
| `npm run build -- --base-href /kana-study/` | **Correcto**, 18.873 s, cuatro warnings SCSS conocidos de Grammar |
| Auditoría estructural Japanese 1500 | **1500 entradas**, contenido sin cambios; **0 vínculos reales verificados** |
| `git diff --check` y whitespace de archivos nuevos | **Correctos** |

La primera suite completa pasó 1790/1790. Tras añadir el caso de commit local con fallo
posterior de outbox y reforzar la coherencia before pasó 1791/1791. La pasada final de
1791 incluye además la guarda contra datos legacy corruptos y eventos malformados.
Son tres procesos completos correctos en estados sucesivos del desarrollo; solo la
última pasada corresponde al estado final. No se afirma estabilidad absoluta ni pruebas
sin caché/orden variable nuevas, que no se solicitaron en H3A.

Las pruebas cubren New/Learning/Review/Relearning, S13.999/S14, vencimiento, cabeza
ausente/ambigua/incoherente, snapshot corrupto, historial residual, dos tarjetas maduras/
jóvenes equivalentes sin mutación, revocación, homófonos/homógrafos, ámbito local,
mapping parcial/cambiado/revocado, undo real y eventos anulados, archivados, contenido
eliminado con progreso residual, caché, cambio de workspace durante await y commit
persistido seguido de fallo outbox. Cobertura verifica tipos/apariciones, familiaridad,
denominador cero, spans no vinculables/excluidos/sin resolver, solapamientos, alias y
escenarios hipotéticos sin modificación de datos. La suite completa incluye las
regresiones existentes de Japanese 1500, Stats V2, Manga Saved, Daily Study y Perfil.

La comparación SHA-256 conserva **138/140** archivos pendientes iniciales idénticos;
solo cambian el apéndice DESIGN y DeckCatalogService de ese conjunto. Además se amplía
DeckDatabaseService, que estaba limpio, y se añaden los diez archivos enumerados.
Scheduler, dataset, recursos experimentales, Stats V2, Saved FSRS, Sync/Outbox, SQL y
package.json/lock permanecen intactos. Los avisos LF/CRLF preexistentes de generated i18n
no son errores de diff. No se ejecuta Playwright nuevo porque no se cambia UI ni rutas.

## H3B y riesgos para H4

H3B necesita fuentes y revisión semántica verificables para mappings y equivalencias,
segmentación/análisis integral fiable, métricas honestas con ambigüedades y una UX que
muestre ámbito/incompletitud. No debe deducir equivalencias universales desde recibos
locales ni generar hasta 20 palabras automáticamente sin resolver los gates lingüísticos.
La revisión independiente, material autorizado, derechos de recursos y QA físico siguen
pendientes. No se inicia H3B ni la generación automática.

H4 necesita sincronizar contenido/identidades/recibos/equivalencias y revocaciones con
revisiones/CAS, conflictos, tombstones/restore y Guest sin colisiones ni pérdida de FSRS;
publicación consistente y progreso/eventos fuera de orden deben dejar indeterminación
visible hasta reconciliar. El journal H2B-A sigue siendo registro durable y no puede
podarse sin migrarlo. Faltan lectura transaccional distribuida, señales entre pestañas,
persistencia del registro de evidencia y memoria/paginación para catálogos grandes.
No se interpreta un estado learning/pending con inventario parcial como una exclusión
demostrada de cualquier evidencia madura todavía no vinculable.

Sin commit ni push.
