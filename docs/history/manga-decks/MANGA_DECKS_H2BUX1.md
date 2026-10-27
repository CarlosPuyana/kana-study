# H2B-UX1 — Añadir rápido desde Manga

Fecha: 2026-10-24. Alcance: simplificar H2B-A sin cambiar identidades, contratos remotos, FSRS ni gates de producción. Se preserva el árbol previo sin commit mediante la captura SHA-256 `.cache/h2bux1-baseline.json`.

## Auditoría del flujo anterior

Se revisaron DESIGN, H2B-A, H3B-A, H3B-B0, H3B-B1 y los contratos pertinentes de H3A/H4B-D2. Se inspeccionaron selección Mokuro, JapaneseLookupService/diccionario, DictionaryPopup, MangaDeckReview, MangaDeckAssistedService, confirmMangaCard, registro permanente, journal y Reader.

El caso completo anterior necesitaba siete acciones contando la selección: seleccionar OCR, abrir revisión experimental, elegir propuesta, elegir glosa, marcar revisión, generar vista previa y confirmar. Era un diálogo con estados sucesivos, no siete pantallas. Palabra/lectura procedían de la elección y el origen OCR ya estaba congelado. Solo el último botón guardaba; esa confirmación explícita y las decisiones sobre sentidos/identidades son necesarias. El botón inicial, checkbox y segundo paso de preview no aportaban una decisión distinta cuando la propuesta estaba completa.

## Un único panel

Se reemplaza MangaDeckReview, sin mantener otra implementación antigua. La selección y consulta normal abren en el mismo popup un resumen con escritura, lectura, significado/idioma real, fragmento original, página y mazo del volumen. «Añadir al mazo» es la única confirmación. «Editar» despliega los campos avanzados sin salir del Reader. El diccionario original sigue disponible en un detalle; con gates apagados conserva su estructura ordinaria, sin ese contenedor adicional.

El formulario mantiene escritura, lectura, glosa, idioma, propuesta/sentido, reutilización de entidad y otra identidad. Los errores se muestran junto a sus campos, fuera de las etiquetas para conservar sus nombres accesibles. Se reutiliza text() con los límites actuales de bytes y unidades UTF-16; las glosas multilínea legítimas siguen admitidas. El contexto y el destino son readonly: el contrato actual fija el fragmento auténtico y el mazo por volumeId. No se añade edición ficticia de procedencia ni elección arbitraria de otro mazo.

### Propuesta completa

Solo se rellenan automáticamente todos los campos si hay exactamente una alternativa, una propuesta válida, escritura NFC igual a la selección y exactamente una glosa disponible/no truncada. Se etiqueta ES porque es el idioma real del diccionario admitido. No se inventan glosas EN/CA según el idioma de UI ni lecturas a partir de kanji. Una base flexionada diferente requiere elección/edición. El usuario ve los datos antes de confirmar; el rellenado no crea una identidad ni cuenta como confirmación humana.

### Ambigüedad y datos ausentes

Varias propuestas no se preseleccionan. Una entrada con varios sentidos no elige una glosa. La elección se hace dentro del panel, sin otra pantalla. Se conservan totalAlternatives/totalGlosses para no tratar listas truncadas como únicas.

Si falta un campo se muestran inicialmente los campos necesarios. Una entrada única sin lectura no satisface el contrato persistido de propuesta: puede conservarse su única glosa literal ES para revisión, pero no se fabrica una lectura ni una propuesta válida. En ese caso el recibo tiene selectedProposal null y la información final sigue siendo confirmación del usuario. Sin entrada, la escritura seleccionada se conserva y el usuario introduce lectura y significado/idioma. «Editar» siempre permite revisar todos los campos.

### Identidades existentes

La igualdad de escritura/lectura solo sirve para presentar la decisión, nunca para fusionar. Si hay entidades coincidentes se exige elegir explícitamente una registrada o marcar otra identidad/acepción. Se muestra la descripción previa de la entidad a reutilizar. La operación existente verifica la identidad completa y CAS de contenido; añade el recibo/contexto y conserva cardId, orden, creación e historial FSRS cuando corresponde. Otra identidad conserva un ancla independiente y no hereda repasos.

## Guardado, reintento y aislamiento

No se llama a preview/confirm al mostrar o editar la propuesta. Solo al pulsar el botón final se llama al preview/validador existente con reviewed=true y después a la única confirmación existente. Esa es ahora la revisión explícita; no se trata el origen del diccionario como autoridad léxica certificada. Se mantienen actor, alternatives, fuente exacta, expertCertified=false, entidad, recibo y journal.

El botón y los campos se bloquean durante el guardado. Se conserva una operación congelada para reintentar un error sin otro UUID/recibo. Editar invalida esa operación y vuelve a validarse al confirmar. El panel se cierra únicamente tras persistencia confirmada, anuncia el éxito y restaura el foco al visor después del render. Ante un error conserva los valores y ofrece Reintentar. Escape, Cancelar y cierre no generan operaciones por sí mismos.

El estado de edición sobrevive a los renders ordinarios, objetos de location equivalentes y cambios de pestaña Palabra/Contexto/Gramática dentro del popup. Se conserva la instancia del formulario al ocultarlo y el trap de foco excluye controles ocultos o dentro de detalles cerrados. Se invalida por cambios reales de fuente/lookup/volumen/página, destrucción o workspace. El guard comprueba el ámbito actual directamente, además del effect, para cubrir A→B→A antes del siguiente render. Los await de abrir/preview capturan la revisión de activación. La confirmación lleva la guarda UI hasta el callback transaccional existente y comprueba owner/epoch: un resultado tardío no confirma en otro ámbito.

Esto no introduce una transacción distribuida ni deshace una escritura que ya estuviera comprometida antes de cerrar. La confirmación explícita autoriza la operación; las guardas impiden iniciarla/publicarla desde un ámbito ya obsoleto antes del commit. No se modifican tombstones, revisiones de outbox, protocolo, FSRS ni SQL.

## Comparación de interacciones

Conteo desde selección hasta guardado; cada selección de opción o introducción de un campo cuenta como una acción. No se midieron tiempos de personas ni se deduce una nueva puntuación de usabilidad.

| Caso controlado | Anterior | Nuevo |
| --- | --- | --- |
| A: propuesta única, completa, sin identidad previa | 7 | 2: seleccionar y añadir |
| B: una propuesta con varios sentidos | 7 | 3: seleccionar, elegir sentido y añadir |
| B: varias propuestas y sentidos | 7 | 4: seleccionar, elegir propuesta/sentido y añadir |
| C: sin propuesta, palabra OCR conservada, lectura y glosa manuales | 7 | 4: seleccionar, escribir lectura/glosa y añadir |
| C: falta solo lectura, glosa literal única disponible | al menos 7 | 3: seleccionar, escribir lectura y añadir |

Cambiar idioma, escritura o identidad añade su decisión explícita en ambos flujos. No se cuentan las pulsaciones individuales al escribir ni el tiempo de lectura. Ambos recorridos tienen un diálogo; se eliminan la entrada «Revisar», el checkbox y la etapa separada de vista previa. La edición progresiva pertenece al mismo panel. Las propuestas ambiguas siguen necesitando decisiones reales.

## Rendimiento y seguridad del modo local

Antes: **749,43 kB** iniciales, medidos en la preparación manual y build anterior. El presupuesto de 750 kB no cambia. No hay dependencias nuevas ni imports de servicios custom nuevos desde App/Auth. El panel reutiliza la rama Manga ya lazy; la navegación H3B-B1 sigue diferida. Las copias se mantienen en ES/EN/CA y se regeneran con el compilador i18n existente. Se acorta el error antiguo y se reutilizan etiquetas para no cargar copias redundantes.

La configuración manual anterior se conserva: `npm run start:manga-manual`, únicamente localhost/127.0.0.1, Guest, UI gates activos y sync/upload/Supabase/asistencia remota desactivados. En producción los cuatro gates siguen false y no existe activación URL/localStorage/preferencias. No se alteran proveedores ni configuración de ese modo.

## Validación final

El código definitivo se validó en secuencia (TypeScript → dirigidos → suite completa → Playwright → build), sin compilaciones de tests/build simultáneas y sin cambiar timeouts ni presupuestos:

| Comprobación | Resultado |
| --- | --- |
| Dirigidos: panel, servicio, repo, diccionario, Reader/selección y dos specs adicionales de navegación/proyección | **134/134**, 8 archivos |
| Suite completa `npm test` | **1996/1996**, 194 archivos |
| Playwright `e2e/manga-decks-assisted.spec.ts` | **54/54**, 18 escenarios en 3 proyectos, cero reintentos |
| TypeScript app/spec y tsconfig manual, `--noEmit` | todos correctos, salida 0 |
| Build GitHub Pages con `--base-href /kana-study/ --stats-json` | correcto; **749,04 kB iniciales**, 183,78 kB estimados de transferencia |
| `git diff --check` y whitespace de archivos del hito | correctos; únicamente avisos LF/CRLF |

El inicial baja **0,39 kB** respecto de 749,43 kB. Se mantienen los cuatro warnings SCSS conocidos de Grammar y el presupuesto original de 750 kB. En el grafo final Reader ocupa `chunk-DcJDBBKq.js` (104 488 bytes), la localización H3B-B1 `chunk-yp2FD71Y.js` (6834 bytes) y el explorador `chunk-BACDhwW1.js`. La localización es una importación dinámica desde Reader; ni ella ni el explorador pertenecen a su clausura estática. El build usa `src/main.ts` y no contiene inputs del arranque/providers manga-manual.

Las regresiones cubren propuesta única sin escrituras, lectura/glosa ausentes, varias propuestas/sentidos, entrada manual/multilínea, datos originales y HTML como texto, una única confirmación, doble clic, error/reintento del mismo recibo, decisión explícita de reutilización, dos identidades con igual escritura y FSRS anterior intacto. Incluyen cancelación, página/volumen, cambio A→B→A durante await y antes del render, pestañas sin pérdida de edición, Escape, foco restaurado y trap de controles visibles. Se preservan estudio/undo, Japanese 1500, gates, listado por volumen, explorador e historial/fences de H3B-B1. La suite completa conserva las pruebas de Stats V2, Saved FSRS, cloud y hitos anteriores.

Se corrigieron durante el desarrollo tres problemas de integración/pruebas: el detalle del diccionario debía envolver solo el modo rápido para no cambiar su DOM ordinario; los errores no debían formar parte del nombre de las etiquetas; los selectores viejos de preview/propuesta debían comprobar ahora el resumen y los controles realmente visibles. La revisión final añadió conservación al cambiar pestañas y reutilización del validador text() para no rechazar glosas multilínea legítimas.

Una pasada concurrente con otras compilaciones terminó con **1993 correctos y dos timeouts de 5000 ms** en `navigation-audit.spec.ts` y `lexical-knowledge-projection.spec.ts`. No fallaron sus aserciones funcionales. Ambos pasan dentro de los 134 dirigidos y en la suite completa secuencial final de 1996 sin modificar esos archivos ni sus límites. Esto es evidencia de ejecución bajo esas condiciones, no prueba de estabilidad absoluta ni demostración de que la carga sea la única causa posible. No se añaden sleeps, exclusiones o reintentos del runner.

No se repiten SQL/PostgREST porque no cambia ningún contrato remoto. No se utilizan cuentas reales ni datos privados. Las fixtures Playwright crean sus propias tarjetas por selección y confirmación reales en contextos efímeros; no siembran contenido en el perfil manual del usuario. Un smoke final del servidor manual verificó Guest/gates de UI, Auth no configurado, acceso a vocabulario y ausencia de peticiones Supabase sin crear tarjetas.

Evidencia local ignorada por Git: `.cache/h2bux1-{directed,suite,browser,build}-serial.log`, `.cache/h2bux1-scope.json` y capturas siguientes, inspeccionadas visualmente. El panel usa variables semánticas, controles táctiles y scrolling vertical acotado, sin desbordamiento horizontal a 320/390/1280 px:

- [Añadir rápido, escritorio oscuro](../../../.cache/h2bux1-quick-desktop-dark.png).
- [Añadir rápido, móvil claro 390 px](../../../.cache/h2bux1-quick-mobile-light.png).
- [Añadir rápido, móvil oscuro 320 px](../../../.cache/h2bux1-quick-narrow-dark.png).
- [Edición compacta, móvil claro](../../../.cache/h2bux1-edit-mobile-light.png).
- [Edición compacta, escritorio oscuro](../../../.cache/h2bux1-edit-desktop-dark.png).

## Archivos y preservación

- Panel reemplazado: `src/app/features/manga/manga-deck-review.ts`, `.html`, `.scss` y `.spec.ts`.
- Integración: `src/app/shared/components/dictionary-popup/dictionary-popup.ts`, `.scss`; `src/app/features/manga/manga-reader.page.ts`.
- Guardas efímeras: `src/app/core/services/manga-deck-assisted.service.ts`, su spec; callback opcional de ciclo de vida y epoch en `custom-deck.repository.ts`. No cambia el payload persistido.
- Regresiones reales: `e2e/manga-decks-assisted.spec.ts`, conservando navegación OCR, estudio, undo, borrados y gates.
- Copias: `src/assets/i18n/es.json`, `en.json`, `ca.json` y `core.generated.ts`.
- Documentación: este informe, DESIGN y la guía de prueba manual.

La comparación final con la captura inicial identifica **18 archivos de este hito** (17 existentes y este informe nuevo), ninguno eliminado; todos los demás hashes previos permanecen iguales. No se modifican modelos de identidad permanente, datos Japanese 1500, scheduler, Stats V2, Manga Saved FSRS, sincronización cloud, contratos SQL, dependencias o presupuestos.

## Prueba manual y limitaciones

Usa un perfil de navegador separado. Ejecuta `npm run start:manga-manual` desde el repositorio y abre `http://127.0.0.1:4401/#/manga`. Importa un manga local con OCR e instala el diccionario si falta. Selecciona una palabra: el panel aparece directamente. Revisa lectura/significado/idioma y pulsa Añadir al mazo; o elige sentido/edita los datos necesarios. Tras guardar continúas en la misma página. En Biblioteca → Vocabulario confirmado puedes verificar la tarjeta y abrir sus apariciones mediante H3B-B1. No se siembran datos en tu perfil.

La propuesta única no demuestra que el sentido sea correcto en contexto: la revisión humana final sigue siendo necesaria. La falta de lectura requiere entrada humana. Los contratos actuales no permiten editar el contexto OCR ni escoger otro mazo arbitrario. El popup puede necesitar desplazamiento vertical para contexto largo/edición, sin desbordamiento horizontal. No se promete una medición de usabilidad humana distinta del 2/5 aportado por el usuario. Safari/dispositivos físicos y evaluación lingüística independiente siguen pendientes; las fixtures propias no son una validación lingüística independiente ni material de manga autorizado del usuario.

**H2B-UX1 terminado y validado localmente.** Queda la evaluación manual de usabilidad del usuario y las limitaciones físicas/lingüísticas indicadas; no quedan comprobaciones automatizadas solicitadas pendientes. No se inicia otro hito. Sin commit, push, despliegue SQL ni activación pública.
