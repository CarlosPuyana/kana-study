# Manga × Mazos — Hito 2B-A: flujo asistido local

Fecha: 2026-10-22. Estado: integración experimental oculta; no es la V1 pública.
Se conservan H1/H1.1, Stats V2 y los experimentos H2A–H2A.2. Este hito autoriza
la creación manual revisada, sin levantar el bloqueo de generación automática.

## Flujo implementado

1. Seleccionar una palabra en el OCR Mokuro real del lector y abrir su diccionario.
2. Con ambos gates de desarrollo activados, abrir «Revisar para mazo (experimental)».
   Se muestra el texto seleccionado, bloque japonés original, título y página (base 1).
   Si esa selección ya tiene una palabra guardada, se conserva su referencia sin
   modificar Saved Words, sus eventos o su FSRS.
3. Elegir explícitamente una propuesta del diccionario o introducir datos manuales.
   No se preselecciona la primera entrada ni un significado. Elegir una entrada rellena
   palabra/lectura; el significado exige otra elección o escritura. El usuario puede
   corregir palabra, lectura, significado e idioma ES/EN/CA.
4. Marcar la revisión y generar una vista previa. Ninguno de estos pasos crea mazos,
   tarjetas, progreso ni recibos. Un cambio de campos invalida revisión y preview.
5. Confirmar y guardar: una sola transacción escribe tarjeta, mazo si falta y recibo.
   El éxito ofrece el enlace a estudiar el mazo. Fallar conserva la misma operación
   para reintentar; no se publica éxito ni contenido parcial.
6. Estudiar con DeckStudyService/DeckSchedulerService existentes: palabra en el anverso;
   lectura, significado con su idioma, fragmento original, título y página en el reverso.
   Se conservan Again/Good, cola y undo, sin inventar intervalos, frases traducidas o audio.

Importar, abrir, consultar o analizar un manga no crea mazos ni tarjetas. No hay
conversión masiva de Saved Words, preparación automática ni análisis integral de volumen.

## Gates y presentación

`CUSTOM_DECKS_ENABLED` y `MANGA_DECK_ASSISTED_ENABLED` son señales DI con valor inicial
false. La integración exige ambos, también al preparar y confirmar en el repositorio.
No hay parámetro URL, preferencia persistida o control público que los active.
Las pruebas usan overrides DI o el inspector Angular exclusivo de desarrollo.
Una recarga vuelve a ocultar el contenido custom sin borrarlo.

La interfaz distingue datos OCR, propuestas no certificadas y revisión de usuario;
incluye errores de persistencia, límites y cambio de workspace. Todo se renderiza
como texto, incluidos glosas y contexto; no se inserta HTML. Hay etiquetas semánticas,
controles de tamaño táctil, foco tras abrir/revisar/confirmar y trap del popup ampliado
a select/textarea. Se añaden 24 claves en ES/EN/CA y estilos con variables semánticas.

## Contrato de identidad y registro persistente

La autoridad es siempre `kana-study-curated`, política versionada `manga-user-entity-v1`.
No se atribuyen identidades JMdict al ordinal/sequence de una importación Yomitan.
Un recibo de usuario no es revisión lingüística independiente ni certificación experta:
modelo y recibo contienen `expertCertified: false`.

- Registro: el journal atómico y durable de H1 conserva cada operación
  `manga-confirmation`. Su payload versionado contiene entidad, actor local/workspace,
  fecha UTC, evidencia OCR, propuesta elegida, alternativas y significado/idioma
  confirmados. Es además el registro persistente de entidades y vínculos de volumen.
  No necesita cambiar versión ni stores de IndexedDB.
- Namespace: UUID del registro local, propuesto en el primer preview y persistido en
  la primera confirmación. Las siguientes operaciones lo reutilizan. Evita atribuir
  la misma identidad global a usuarios/instalaciones independientes por compartir OCR
  builtin. Dos primeras previews con namespaces distintos no se mezclan: la segunda
  se rechaza y debe prepararse de nuevo sobre el registro ya persistido.
- Referencia de origen: SHA-256 completo de volumeId, página, bloque, línea, rango UTF-16,
  fragmento y superficie exacta. El título mutable no forma parte del ancla.
- Entidad: `mce-` + SHA-256 completo de namespace, origen, palabra, lectura NFC, rama
  y política. Repetir la selección inicial y la misma palabra/lectura reproduce la
  entidad dentro del registro. Una rama explícita de otra identidad/acepción usa UUID.
  No se unen otras ocurrencias solo por escritura, lectura o traducción.
- Reutilización: el usuario puede elegir una entidad ya registrada, viendo palabra,
  lectura y descripción previa. Deben coincidir exactamente palabra y lectura.
  El repositorio comprueba que exista y que el ancla completa sea idéntica.
- Mazo: `md-` + SHA-256 completo de la política y volumeId, con workspace en la clave
  compuesta de H1. Una confirmación posterior añade al mismo mazo; no adopta un mazo
  arbitrario sin el vínculo de volumen registrado.
- Tarjeta: `mc-` + SHA-256 completo de deckId, LexicalIdentity.key y dirección.
  Se reutilizan el tipo y función real de identidad H1 y su índice único.

Editar glosa o reemplazar contexto mediante reutilización explícita conserva cardId,
createdAt, orden y todo el progreso/eventos FSRS. El recibo anterior queda intacto.
Cambiar palabra/lectura o elegir otra identidad crea otra tarjeta sin heredar FSRS;
no sustituye ni borra la anterior. La misma entidad en dos volúmenes tiene tarjetas
y progreso independientes. No se crean equivalencias con Japanese 1500 ni coberturas.

Los IDs y evidencia son estables y serializables para un futuro protocolo. No se
afirma identidad universal entre registros separados ni soporte cloud actual.

## Atomicidad, aislamiento y límites

`confirmMangaCard` captura una copia del request y valida antes de escribir. La
transacción verifica owner/gates, registro, versión esperada y unicidad; asigna el
orden de una tarjeta nueva dentro de la transacción. El journal conserva la intención
original (orden inicial 0), mientras el registro de tarjeta recibe su orden efectivo.
Un futuro adaptador remoto debe respetar esta diferencia, no reproducir posiciones
provisionales como si fueran el estado final.

El mismo operationId/request es idempotente incluso con doble clic; reutilizarlo con
otro payload se rechaza. Las ediciones usan contentVersion como CAS y no pisan cambios
posteriores. Una transacción abortada revierte también mazo y recibo. El servicio
captura workspace y comprueba su vigencia tras await; no publica resultados de una
vista destruida. El repositorio abre/cierra conexiones como H1 y separa cada owner.

Borrar manga no hace cascada sobre esta base. Se conservan snapshots, recibos, tarjetas
y FSRS. Reimportar con otro volumeId no se une automáticamente: identidad editorial,
vínculo entre importaciones y resolución de obras siguen pendientes.

Límites: un bloque OCR de hasta 1200 unidades UTF-16/4800 bytes; rango exacto y no vacío;
palabra/lectura hasta 256 unidades/1024 bytes; significado hasta 2000 unidades/8000 bytes;
título hasta 160 unidades según contrato H1; hasta 1000 tarjetas por mazo. Los validadores
H1 rechazan NUL, surrogates inválidos y payloads de tarjeta fuera de su contrato.
Recibo máximo 256 KiB UTF-8; hasta 16 propuestas y cuatro glosas por propuesta, con
totalAlternatives/totalGlosses para distinguir el snapshot acotado del resultado total.
Una propuesta fuera de límites se omite y queda disponible la corrección manual;
el texto confirmado y el fragmento aceptado no se truncan silenciosamente.

El journal **no se limpia tras confirmar**: contiene el registro de identidad y volumen.
H4 deberá migrar ese registro antes de introducir poda/ACK remotos, con integridad
referencial y compatibilidad de versiones. Las lecturas actuales de H1 materializan
el workspace; paginación, retención y rendimiento con catálogos grandes quedan pendientes.

## Fuentes y límites lingüísticos

Solo se utiliza el diccionario existente admitido por Kana Study (JMdict Spanish
importado localmente). Sus IDs/sequence quedan como evidencia de propuesta local,
no como ent_seq verificado, sentido contextual certificado o equivalencia editorial.
Las glosas propuestas se etiquetan ES; una corrección EN/CA es aportación explícita
del usuario y se registra con `source.kind: 'user'` y referencia al recibo.

No hay imports Angular desde experiments, Lindera o el índice enriquecido. No se
redistribuye ningún léxico nuevo, se modifica el diccionario ni se envía OCR a servicios.
Las fixtures E2E son frases originales de prueba y diccionario controlado; no constituyen
material de manga autorizado ni evaluación japonesa independiente. Siguen pendientes
revisor competente, corpus autorizado y validación independiente descritos en H2A.1/2.

## Archivos de este hito

- Nuevos: `core/models/manga-deck-confirmation.model.ts`;
  `core/services/manga-deck-gate.ts`, `manga-deck-confirmation.ts`,
  `manga-deck-assisted.service.ts`, `manga-deck-assisted.spec.ts`;
  `features/manga/manga-deck-review.{ts,html,scss,spec.ts}`;
  `e2e/manga-decks-assisted.spec.ts`; este informe.
- Ampliados: `core/models/deck-catalog.model.ts`,
  `core/services/custom-deck.repository.ts`,
  `shared/components/dictionary-popup/dictionary-popup.ts`,
  `features/anki-study/anki-study.page.{ts,html,scss}`,
  `src/assets/i18n/{es,en,ca}.json` y `core.generated.ts`; apéndice DESIGN.
- Paths abreviados de core/features/shared parten de `src/app/`.
  No hay cambios en dependencias, SQL, Sync/Outbox, scheduler, Manga Saved FSRS,
  datasets Japanese 1500 ni código de Stats V2.

## Validación ejecutada

Entorno: Windows, Node 24.21.0, Angular 22.2.0 y Vitest 4.1.11. Resultados nuevos de
este hito; no se suman ejecuciones históricas H1/H2A.

| Comprobación final | Resultado |
| --- | --- |
| Tests dirigidos Angular: manga-deck-assisted, manga-deck-review, custom-deck.repository | **44/44**, tres archivos |
| `npm test` completo | **1756/1756**, 175 archivos; build 18.795 s, ejecución Vitest 13.97 s |
| TypeScript app/spec, `--noEmit` | **Correctos ambos** |
| Playwright: manga-decks-assisted, custom-decks-h1, manga-study, manga-fsrs, stats-v2, daily-study | **48/48**, tres proyectos Chromium, sin reintentos, 1.5 min |
| `npm run build -- --base-href /kana-study/` | **Correcto**, 18.981 s; cuatro warnings SCSS conocidos de Grammar |
| `git diff --check` y whitespace de los archivos nuevos | **Correctos** |
| Claves nuevas ES/EN/CA | **24**, sincronizadas |

Los 21 tests nuevos verifican ambos gates, preview sin escrituras, registro/evidencia,
repetición de selección, namespace independiente, primer registro concurrente,
doble clic/retry, cambio de identidad sin progreso heredado, reutilización explícita,
conservación de FSRS/eventos al editar, dos mazos independientes, undo, borrado del
manga, CAS, workspace durante await, rollback y error recuperable, límites y texto
HTML como texto plano. Los 23 tests H1 del repositorio siguen pasando sin modificarlos.
La suite completa incluye Saved Words, Stats V2, Japanese 1500, Daily Study y Perfil.

Playwright selecciona el primer carácter mediante arrastre real sobre el DOM Mokuro,
no llama directamente al servicio para simular la interacción. Comprueba página 2,
preview sin escrituras, doble clic, un mazo/dos tarjetas, autoridad curated, estudio,
idioma visible, solo dos ratings, undo, manga borrado, gate tras reload, 1500 tarjetas
builtin y ausencia de POST externo durante el flujo. Comprueba además foco de revisión
y confirmación, ausencia de overflow y regresiones existentes. Capturas inspeccionadas
de preview/estudio en oscuro y claro, incluyendo 320/390 px. No certifica Safari físico.

Incidencias de desarrollo resueltas: el spec de componente necesitaba el stub habitual
de matchMedia de jsdom; los selectores E2E se ajustaron a combobox y artículo real de
biblioteca. Una pasada amplia dio 47/48: el test del gate cambiaba solo la URL del
mismo lector con el popup anterior abierto, y su segunda selección podía acertar en
ese popup en vez del OCR. Se cerró con Escape y se comprobó su ausencia antes de
navegar; no se cambió el lector ni se añadieron sleeps/retries/timeouts. La ejecución
final completa de 48 casos, con foco y presentación finales, pasó. Las comprobaciones
se ejecutan con el runner Angular; Vitest directo sin su inicialización no ejecuta
estos specs. Los errores EPERM del caché temporal del sandbox se resolvieron usando
el entorno local autorizado, sin alterar pruebas/configuración.

No se afirma estabilidad absoluta ni varias suites completas nuevas: en el estado
final hay una suite Angular completa y una matriz Playwright completa correctas.
Los logs E2E de fetch fallido pertenecen a la fixture de error intencional existente
de Manga FSRS; no son fallos del flujo nuevo.

La referencia SHA-256 inicial de 127 archivos pendientes conserva 118 idénticos.
Los nueve cambios intencionales son modelo/repo H1, estudio TS/HTML, los tres JSON,
core.generated y el apéndice DESIGN. Popup/SCSS de estudio estaban limpios y se
amplían en este hito; los once archivos nuevos se enumeran arriba. Se preservan los
experimentos, corpus, informes anteriores y cambios de Stats V2. Scheduler, sync,
outbox, Manga Saved FSRS y package.json/lock no tienen diff respecto a HEAD.

## Pendientes H3, H4 y versión pública

H3: mapping/equivalencias verificadas de Japanese 1500, conocimiento readonly entre
mazos, umbral Review/S≥14 y límites/undo, cobertura con denominadores honestos,
clasificación de ambigüedades y preparación por obra. No deducir conocimiento global
a partir de estas identidades de usuario. Resolver vínculos de reimportación y edición
de obra antes de presentarlos como identidad editorial universal.

El objetivo original de seleccionar automáticamente hasta 20 palabras se conserva;
queda pendiente de certificación lingüística, corpus independiente y permisos.
Este flujo confirma una tarjeta cada vez y no implementa análisis integral, selección
automática, porcentajes de comprensión/conocimiento ni certificación experta.

H4/cloud: protocolo completo de contenido/contexto/progreso/recibos y namespaces;
RLS/validación SQL real, CAS y conflictos de revisión/undo, tombstones/restore,
Guest→cuenta sin mezclar entidades ni perder progreso, ACK perdido/reintentos,
publicación consistente y pruebas offline/dos browsers. Migrar el registro si se poda
journal y medir memoria/paginación. Nada de ello está habilitado aquí.

Antes de activar usuarios: QA pública y accesibilidad completa, Safari iOS/Chrome Android
físicos, recursos/derechos y rendimiento final. No se inicia el siguiente hito.
Sin commit ni push.
