# Manga × Mazos — H3B-B0: explorador OCR y coincidencias textuales

Fecha: 2026-10-23. Hito implementado y validado en local, exclusivamente experimental. Los cuatro gates siguen false. Sin despliegue SQL, commit/push ni inicio de H3B-B lingüístico o H5.

## Auditoría y arquitectura

Se inspeccionó `git status`, se registraron hashes de los 1523 archivos iniciales en `.cache/h3bb0-baseline.json` y se revisaron H3B-A, H3A, H2B-A, H2A.2, DESIGN y el código real de MangaRepository, MangaSourceService, LocalMangaCatalogService, lector, overlay/selección OCR, vínculos, confirmaciones y gates. Se conserva el trabajo anterior sin operaciones Git destructivas.

Desde una tarjeta confirmada de la vista H3B-A, «Buscar en OCR» pasa únicamente su escritura japonesa a un componente standalone mediante `@defer`. La consulta no transporta LexicalIdentity ni glosa. Dos tarjetas con escritura igual permanecen separadas; pueden consultar la misma secuencia sin que sus resultados reciban una identidad compartida. No hay búsqueda automática al abrir la biblioteca o al consultar una tarjeta. El explorador queda fuera del bloque que se refresca por revisiones FSRS: invalidar el progreso no vuelve a escanear OCR.

Capas nuevas:

- `manga-ocr-text.ts`: contratos de resultados/estado, límites, digest SHA-256, recuentos de páginas y búsqueda literal pura.
- `MangaOcrSourceService`: adapta un único volumen importado o de catálogo a lecturas OCR, sin consultar otros OCR de la biblioteca.
- `MangaOcrExplorerService`: secuencia de lectura, resultados parciales, verificación de la fuente, cancelación y fences de workspace/activationRevision.
- `MangaOcrExplorer`: presentación diferida, progreso, cancelación/reanudación explícita mediante nueva exploración, estados, resultados paginados y links al lector. No se persiste el estado de búsqueda.

No se inyectan diccionario, proyección léxica global, scheduler, servicio de generación, Sync/Outbox ni transporte cloud en el explorador. No hay llamadas a servicios lingüísticos, IA, Supabase o URLs `remoteSource` de un Manga importado. El catálogo solo obtiene sus assets OCR estáticos del mismo origen de la app; nunca envía texto a otro servicio.

## Lectura OCR real y coste medido

**Importados:** `MangaRepository.page()` obtiene un registro IndexedDB con Blob de imagen y OCR juntos. IndexedDB no permite proyectar solo `ocr` de ese registro con el esquema existente. No se inventó una API ligera ni se cambió el esquema. El adaptador lee una página cada vez, devuelve OCR y tamaño lógico del Blob y deja de retener el registro completo. No decodifica la imagen, crea object URLs, lee su buffer ni conserva un array de imágenes. La verificación necesita una segunda lectura secuencial de las páginas observadas.

Antes de elegir esa estrategia se ejecutó una sonda sintética en Chromium: 50 registros, Blob de 1 MiB por página y 1000 unidades UTF-16 de OCR por página. Primera pasada **26,9 ms**, segunda **25,4 ms**, 52 428 800 bytes lógicos de imagen por pasada y cero imágenes decodificadas. Evidencia/receta local: `.cache/h3bb0-measure.cjs` y `.cache/h3bb0-io-measure.json`. Se midió acceso a registros, no el coste completo de hashes/render, memoria física, bytes reales leídos del disco ni rendimiento móvil. Los Blobs pueden estar respaldados/compartidos de formas que la sonda no certifica. No se presenta «100 MiB lógicos en dos pasadas» como consumo físico de RAM.

**Catálogo:** se añade `LocalMangaCatalogService.ocrDocument(id,signal)`, que obtiene OCR japonés fresco sin solicitar imágenes. Reutiliza validación Mokuro y comprueba páginas/rutas/dimensiones contra su manifiesto, con fetch del mismo origen y `cache:no-cache`. No modifica el caché del lector. La configuración del catálogo mantiene su descubrimiento de manifiestos existente, pero solo se descarga OCR del volumen elegido. Su formato es un JSON completo: no se afirma paginación de red de ese documento. La segunda verificación obtiene otra captura fresca; pueden coexistir temporalmente ambas. El límite de documento se aplica después de recibir su texto, no como una garantía de memoria/red con streaming.

El catálogo conserva su caché existente de manifiestos: la verificación relee el asset OCR configurado, no descubre automáticamente una nueva URL de metadata publicada en otro despliegue. Actualizar esa configuración requiere recargar la app/catálogo. No se cambia esa política del lector en este hito.

Las lecturas importadas no se pueden abortar a mitad de un `get` ya iniciado; la cancelación es cooperativa al completarlo, sin comenzar otra página ni publicar su resultado tardío. Los fetch OCR del catálogo reciben AbortSignal. No hay sleeps, polling de trabajo, reintentos automáticos ni búsqueda dentro del render Angular.

## Definición de coincidencia y Unicode

Se usa `String.indexOf` sobre cada línea original por separado, sin normalización, lematización, tokenización, unión entre líneas ni variantes. Se incluyen coincidencias solapadas y subcadenas dentro de otras secuencias. Una búsqueda de `生` puede encontrar `学生`, `生きる` y `生ビール`; eso no demuestra que sean la misma unidad, lectura o acepción.

Cada resultado conserva volumeId, índice de página/bloque/línea, fragmento original completo de esa línea, inicio/fin UTF-16 y texto encontrado; además lleva el fingerprint de la página y se entrega dentro de la captura del volumen. Los índices internos son base 0. La UI presenta página/bloque/línea base 1 y el rango de la **línea** como `[inicio, fin)` base 0. No se confunden estos offsets con los de bloque de la selección H2B-A. Siempre se cumple `fragment.slice(start,end)===found`.

Los caracteres suplementarios ocupan dos unidades UTF-16. Por ejemplo, `𠮷と𠮷野家` produce rangos `[0,2)` y `[3,5)` para `𠮷`. `ガ` no coincide con `カ` seguido de dakuten combinante, ni a la inversa. No hay un mapa de normalización porque no se normaliza. Si la tarjeta humana contiene una forma NFC y el OCR una secuencia equivalente en NFD, la búsqueda literal puede no encontrarla; se informa de la limitación, no se corrige silenciosamente el original.

## Límites, fingerprints y resultados parciales

Límites efectivos por exploración:

- Consulta no vacía de hasta 256 unidades UTF-16.
- Hasta 2000 páginas, leídas secuencialmente.
- Hasta 500 coincidencias; la siguiente produce límite explícito, sin afirmar total.
- Hasta 4000 unidades UTF-16 por línea y 2 MiB de representación OCR UTF-8 por página.
- Hasta 16 MiB de OCR acumulado; el catálogo limita además su documento a 16 MiB después de leer el texto.
- La UI muestra inicialmente 20 coincidencias y añade 20 por acción «Mostrar más».

Cada página procesada distingue texto examinado, sin texto OCR, página ausente, OCR textual inválido, error de lectura o límite. Las pendientes se calculan a partir del total del volumen menos las páginas procesadas, sin asignarles cero coincidencias. No se inventa un OCR vacío cuando la lectura falla. Un volumen sin texto OCR se distingue de un Manga ausente y de una exploración con páginas que faltan.

Los hashes SHA-256 de página representan `JSON.stringify` del OCR almacenado/parseado, con las líneas originales; no el Blob ni los bytes/espacios del archivo .mokuro original. El fingerprint de captura incluye volumeId, sello de metadata, índices, estados y hashes observados. No incluye identidad léxica. Una captura parcial solo identifica ese subconjunto y sus límites, no constituye un hash certificado del volumen completo. El sello importado incorpora pageCount/updatedAt/metadata Mokuro; cambios de metadata pueden invalidar conservadoramente la captura aunque el texto sea igual.

Después de explorar se vuelve a abrir la fuente y se comparan sello y hashes de las páginas observadas. Una edición solo de OCR, con la misma metadata, se detecta al releer los hashes. Solo se anuncia completa tras esa verificación, sin páginas ausentes, errores, límites o pendientes. El estado «verificando» no equivale a completa.

Estados explícitos: explorando, verificando, completa del OCR disponible, parcial, cancelada, fallida, sin OCR, Manga eliminado/no disponible, fingerprint cambiado y resultados sin vigencia verificada. Al recuperar el foco de la ventana se marca la captura como no verificada; no se lanza otra búsqueda. «Verificar OCR actual» compara una nueva pasada con el fingerprint anterior. Si cambia se advierte que no se trate como vigente y se ofrece explorar de nuevo. Las coincidencias conservadas siguen siendo observaciones, nunca evidencia léxica.

Las dos pasadas no son una transacción global ni una garantía contra cualquier edición después de verificar una página. Una escritura externa posterior no se detecta instantáneamente. Se conservan esa limitación temporal, el estado de vigencia al volver al foco y la verificación explícita; no se promete detección distribuida de cambios ni snapshot OCR cloud.

## Lector, revisión humana y ausencia de escrituras

El lector existente admite `?page=N` base 1, pero no un protocolo de selección textual externa que valide fingerprint, bloque/línea y offsets. Por ello el link abre **solo la página**. No se inventa selección DOM, se abre diccionario, se elige entrada ni se atribuye identidad. La prueba abre página 1 cuando el progreso anterior estaba en página 2, comprobando navegación real.

La creación de tarjetas mantiene selección OCR → revisión → significado → preview → confirmación H2B-A. Consultar, cancelar o verificar no crea tarjetas, recibos, glosas, identidades, equivalencias, progreso ni eventos. La navegación explícita al lector conserva su comportamiento normal de progreso de lectura de Manga, separado del FSRS de Mazos.

El servicio captura workspace y activationRevision antes de las lecturas y los comprueba después de los await. A→B→A rechaza la captura. La UI cerca callbacks con generación/owner/epoch, aborta al destruir o cambiar navegación y no inicia automáticamente la consulta anterior en otra activación. La página padre elimina la consulta al cambiar volumen/workspace; los cambios de FSRS solo actualizan las tarjetas.

Los cuatro gates continúan false y sin control público. La vista anterior mantiene su canMatch; el explorador no tiene ruta propia ni opción de activación por URL/localStorage. La selección de una superficie confirmada no crea un vínculo nuevo con ese registro curated. Eliminar Manga conserva mazos, pero la búsqueda comunica que ya no hay fuente disponible. Un ID de reimportación se consulta como otro volumen; no se une por título.

## UI, traducciones y carga

La sección «Apariciones en OCR» distingue recuento literal, páginas examinadas con texto, pendientes, sin OCR/ausentes y errores/límites. La advertencia visible explica homógrafos/subcadenas y prohíbe interpretar el contador como frecuencia léxica o cobertura. No hay porcentajes de comprensión ni preparación de 20 palabras.

Se usan variables semánticas claro/oscuro, botones/links de al menos 44 px, foco visible, detalles nativos, progreso y estado anunciados. Los fragmentos llevan `lang=ja` y marcado Angular escapado, sin HTML de usuario. Se añadieron 43 claves sincronizadas ES/EN/CA y se regeneró core con el compilador oficial.

Se inspeccionaron capturas de escritorio oscuro 1280 y móvil claro 390; Playwright comprueba además móvil oscuro 320, teclado y ausencia de overflow horizontal. No se certifican Safari físico, iOS/Android ni auditoría exhaustiva con lector de pantalla.

Build: inicial **748,19 kB**, frente a 739,44 kB en H3B-A (+8,75 kB de integración/copias comunes). No se amplían presupuestos. El explorador, fuente, servicio y funciones están en `chunk-DX7ll5EI.js` (14 285 bytes), su CSS lazy ocupa 1175 bytes. Ambos quedan fuera del grafo de imports estáticos iniciales. La página H3B-A es otro chunk lazy (`chunk-CjVT10hp.js`); `@defer` permite que abrirla no cargue el explorador hasta pedir una consulta. Las pruebas comprueban que con gates desactivados no se carga por deep link.

## Validación ejecutada

| Comprobación | Resultado |
| --- | --- |
| Dirigidos finales: OCR puro/servicio/UI, catálogo, H3B-A/H2B-A y ambos lectores | 108/108, 8 archivos |
| Suite Angular completa final | 1943/1943, 191 archivos; 24,78 s de runner |
| Playwright afectado | 21/21, 1,0 min; escritorio oscuro 1280, móvil claro 390, móvil oscuro 320 |
| TypeScript app/spec --noEmit | Ambos correctos, exit 0 |
| Build GitHub Pages con stats | Correcto, 40,816 s; cuatro warnings SCSS conocidos de Grammar |
| git diff --check y whitespace de nuevos archivos | Correctos, cero errores; sin archivos iniciales eliminados |

Comandos: `npm test` completo y con `--include` para los ocho archivos afectados; `npx playwright test e2e/manga-decks-assisted.spec.ts`; `npx tsc -p tsconfig.app.json --noEmit`; `npx tsc -p tsconfig.spec.json --noEmit`; `npm run build -- --base-href /kana-study/ --stats-json`; `git diff --check`.

La primera pasada OCR detectó una limitación del entorno de test: Node structuredClone de fake-indexeddb no conserva el Blob de jsdom. Se usa un Blob nativo de Node en ese fixture para verificar su tamaño; no se altera producción para ocultarlo. La sonda independiente y Playwright usan Chromium real. Se corrigieron también dos errores de tipos antes de la validación: declaración de campo y parámetro de límite inferido como literal 500.

Las pruebas puras cubren coincidencia única/repetida/solapada, subcadena y homógrafos, caracteres suplementarios, offsets exactos y ausencia de normalización/unión entre líneas. Las de servicio usan fuentes controladas para lecturas parciales con cero coincidencias, errores, ausencia de OCR/página/Manga, cancelación sin esperas, reimportación, límites, A→B→A y cambios de hashes con metadata idéntica. El adaptador importado se prueba sobre IndexedDB aislado; el catálogo fresco sin imagen tiene una prueba separada.

La UI prueba fences de destrucción/workspace, gates y obsolescencia al volver al foco; H3B-A mantiene dos tarjetas de escritura igual sin fusionarlas. Playwright utiliza selección Mokuro, confirmación y estudio reales sobre fixtures propios. Captura snapshots/eventos ya existentes y compara todo el inventario custom antes/después de buscar, sin POST; comprueba que invalidar FSRS no reescanea OCR, abrir únicamente la página, cancelar una lectura pausada con una promesa controlada y detectar una edición de OCR real en IndexedDB sin cambiar metadata. Se conservan los casos previos de undo, Manga eliminado y Japanese 1500. No se añaden skips, retries, sleeps, timeouts ni presupuestos para ocultar errores.

No se repiten PostgreSQL, PGlite ni HTTP/JWT: no cambia ningún contrato cloud o SQL. La suite completa conserva las regresiones existentes de sincronización, Stats V2, FSRS, Japanese 1500 y Manga Saved. No se atribuyen pruebas de cuentas reales o validación lingüística independiente a estas fixtures.

Evidencia local: `.cache/h3bb0-directed-final.log`, `.cache/h3bb0-suite-final.log`, `.cache/h3bb0-browser-final.log`, `.cache/h3bb0-build.log`, `.cache/h3bb0-io-measure.json`, `.cache/h3bb0-scope.json` y capturas `.cache/h3bb0-desktop-dark.png`, `.cache/h3bb0-mobile-light.png`, `.cache/h3bb0-narrow-dark.png`. Caché, dist y datos de prueba no se versionan.

## Archivos y preservación

Nuevos:

- `src/app/core/services/manga-ocr-text.ts`.
- `src/app/core/services/manga-ocr-source.service.ts`.
- `src/app/core/services/manga-ocr-explorer.service.ts` y `manga-ocr-explorer.spec.ts`.
- `src/app/features/manga/manga-ocr-explorer.ts`, `.html`, `.scss` y `.spec.ts`.
- Este informe.

Existentes modificados:

- `local-manga-catalog.service.ts` y `.spec.ts`: lectura fresca de OCR sin imagen y regresión.
- `manga-volume-vocabulary.page.ts`, `.html`, `.scss` y `.spec.ts`: integración diferida desde tarjeta confirmada.
- `e2e/manga-decks-assisted.spec.ts`: dos nuevos escenarios repetidos en tres proyectos y comprobación de gates.
- `src/assets/i18n/es.json`, `en.json`, `ca.json`, `core.generated.ts`.
- `MANGA_DECKS_DESIGN.md`: distinción de fases.

Comparación de hashes iniciales: 12 archivos existentes modificados, 9 nuevos y ninguno eliminado; los otros 1511 mantienen su contenido. MangaRepository, MangaSourceService, lector/selección originales, gates, esquema, scheduler, Stats V2, Japanese 1500, Manga Saved, Sync/Outbox, SQL y dependencias no se modifican. Se conservan todos los cambios previos sin commit.

## Requisitos lingüísticos pendientes

H3B-B0 entrega exploración textual, no análisis léxico certificado. Siguen pendientes corpus autorizado, segmentación y anotación contrastadas, revisión humana independiente, evidencia versionada de identidad/lectura/sentido/restricciones, tratamiento de ambigüedad y mappings reales de Japanese 1500. Una traducción, homógrafo, coincidencia de texto o confirmación curated local no cubre esos requisitos.

Para una futura fase lingüística hay que acordar un alcance separado, conseguir material/revisor con permisos documentados y validar identidades y segmentación antes de métricas. La preparación automática de hasta 20 palabras y cualquier porcentaje de comprensión permanecen bloqueados. Continúan los límites previos de publicación cloud, Auth real, dispositivos físicos y retención/purga. No se inicia H3B-B ni H5 automáticamente.
