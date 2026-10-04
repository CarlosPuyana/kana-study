# Manga Reader

## Implementado

Manga es una herramienta de lectura asistida: leer japonés original, consultar una palabra y volver a la historia. No traduce páginas automáticamente.

- `/manga`: hero, tres pasos, instalación del diccionario, biblioteca y eliminación secundaria con confirmación.
- `/manga/guide`: guía visual, formatos, funcionamiento y privacidad, traducida a ES/EN/CA.
- Importación local ZIP/CBZ con imágenes y un único `.mokuro`, versión 0.2 o posterior. Se conservan el parser, validación de rutas/imágenes, instalación por etapas y recuperación de importaciones incompletas existentes. También se conserva la importación remota compatible.
- Imágenes, OCR y progreso de lectura permanecen en IndexedDB por workspace. No se cambió ningún esquema ni migración.
- OCR seleccionable horizontal/vertical; el click conserva bloque, línea y los textos de los bloques adyacentes. Estos bloques siguen el orden Mokuro; no se afirma que sea siempre el orden narrativo de las viñetas.
- JMdict Español se instala desde el asset del mismo origen, o manualmente en Opciones avanzadas. La base de diccionario sigue siendo global. Una actualización fallida conserva la instalación anterior. Los significados del diccionario siguen en español aunque la interfaz esté en EN/CA. Atribución: JMdict / EDRDG.
- Desconjugación por sufijos: cortés, negación, pasado, て/で, progresivo y contracciones, deseo, exceso, potencial, pasiva, causativa, volitivo e imperativo. Incluye excepciones como 行った y 来なかった. No es un analizador lingüístico completo.
- Búsqueda pura limitada a cuatro transformaciones y 95 candidatos; deduplicación por base y clase. Una transformación exige reglas POS compatibles `v1`, `v5*`, `vs*`, `vk` o `adj-i`; reglas vacías no validan desconjugaciones. Las coincidencias exactas sí admiten sustantivos y reglas vacías. Las lecturas conjugadas solo se reconstruyen si la cadena de sufijos lo permite. Se añade únicamente el negativo ～ぬ (negative-nu), sin gramática clásica completa.
- Lookup caret: conserva la coincidencia exacta del run completo, como 死ぬ. Después genera hasta 136 spans que contienen el caret, de hasta 16 codepoints, sin cortar pares UTF-16. Los límites del run/Segmenter aportan evidencia; se priorizan exactos con límites fiables, superficies con morfología/POS válidos, exactos de varios caracteres y finalmente fragmentos/kana aislados. Una continuación morfológica validada debilita análisis internos o un segmento que cruza su final, como たん en させたかったんですけど. Dentro de categoría: profundidad, score, sequence, cercanía al caret y longitud como desempate. No se aplica «más largo siempre gana». Máximo 384 queries distintas, cada una busca expresión y después lectura. Se recuperan hasta 32 filas por índice; hasta ocho términos, reservando representantes de expresiones distintas para conservar ambigüedades.
- Popup compacto: palabra, lectura, forma base, razones, significados y alternativas desplegables; contexto con resaltado. Desktop popover, móvil bottom sheet, Escape, foco inicial/restaurado, ciclo de Tab y controles de 44 px.
- Toolbar agrupada en Navegación / Lectura / Ayuda. Se conservan zoom, fullscreen, preload de páginas adyacentes, reloj, progreso, teclado, clic lateral y ajustes.

## Preparado / pendiente: ayuda contextual

**No hay traducción IA desplegada por esta implementación.** El relay Mokuro existente (`kana-study-mokuro-relay.carlospuyana.workers.dev`) sirve importaciones remotas; su Worker no está versionado aquí. No se modificó ni se reutilizó como endpoint de traducción.

`MangaContextService` y los modelos implementan el contrato frontend. Sin configuración, los botones están desactivados y no se hace ninguna petición. No hace falta desplegar un Worker para el diccionario.

Para activar la ayuda debe existir un backend independiente compatible y configurar el token público `MANGA_ASSISTANT_ENDPOINT` mediante un provider Angular, o un meta en el HTML de despliegue:

```html
<meta name="kana-study-manga-assistant" content="https://TU-SERVICIO/assist">
```

Esto es configuración pública, nunca una API key. Se aceptan HTTPS o HTTP del mismo origen para desarrollo. El backend debe permitir el origen de la aplicación si es externo, validar el contrato, limitar abuso/coste y mantener cualquier secreto exclusivamente en servidor/Worker secrets. El backend independiente existe ahora en `workers/manga-assistant`, con contrato, validación, AI binding, rate limiting y tests simulados. **No está desplegado ni conectado al frontend.** Instrucciones y benchmark local opcional: `workers/manga-assistant/README.md`. El relay Mokuro no se modifica.

### Contrato backend, versión 1

POST al endpoint configurado, sin cookies ni credenciales:

```json
{
  "schemaVersion": 1,
  "mode": "translate",
  "request": {
    "selectedText": "食べなかった",
    "selectedExpression": "食べなかった",
    "previousText": "bloque vecino opcional",
    "nextText": "bloque vecino opcional",
    "targetLanguage": "es"
  }
}
```

`mode` admite `translate` y `study`; `targetLanguage`, `es`, `en` o `ca`. `selectedText` mantiene la selección manual exacta; `contextText` opcional conserva el bloque Mokuro contenedor cuando la selección pertenece a un solo bloque. En caret, `selectedText` ya contiene el bloque y `contextText` se omite para evitar duplicarlo; `selectedExpression` identifica la palabra encontrada. Las selecciones entre bloques no inventan un bloque contenedor. Se envían como máximo 1.200 unidades UTF-16 de selectedText, 1.200 de contextText, 100 de la expresión y 300 de cada vecino. `pageTexts` existe en el modelo compatible, pero el envío lo omite: nunca se envía la página completa ni imágenes ni identificadores del usuario/volumen.

Respuesta de traducción:

```json
{"natural":"No comí.","literal":"No comí.","notes":["El sujeto no está expreso."]}
```

Respuesta de estudio:

```json
{"natural":"No comí.","vocabulary":[{"expression":"食べなかった","reading":"たべなかった","baseForm":"食べる","meaning":"comer"}],"grammar":[{"expression":"なかった","explanation":"Pasado negativo."}]}
```

El backend debe pedir significado natural en el idioma solicitado (español por defecto), conservar nombres propios, distinguir literal/natural, evitar sobreexplicación y explicar solo gramática presente. No inventar sujetos omitidos y señalar ambigüedad. Para estudio, priorizar explicaciones útiles para N5/N4 sin afirmar que toda la frase pertenezca a esos niveles. Respuesta estrictamente JSON, sin Markdown libre ni HTML.

El cliente valida estructura/tipos/tamaños, limita la respuesta a 100 KB cuando hay stream y presenta los datos como texto Angular. Los botones gestionan loading/error/cancel; cerrar/destruir el popup aborta la petición y descarta resultados tardíos. Los errores no afectan a JMdict.

### Cache local

Si se configura un servicio compatible, sus resultados válidos se guardan en `localStorage`, clave `kana-study-manga-context-v1`: hasta 20 resultados, sin Supabase ni outbox. La identidad incluye endpoint, volumen, página, bloque, idioma, modo, versión, contexto enviado y textos originales completos de selectedText y contextText; una modificación del bloque contenedor invalida la identidad aunque la selección no cambie. Se usa comparación exacta, sin depender de colisiones de hash. Si storage/cuota fallan, la ayuda sigue disponible sin cache. El cache contiene texto y explicaciones en este navegador; no imágenes. Las entradas antiguas demasiado grandes o inválidas no se reutilizan (claves inferiores a 8.000 caracteres).

## Privacidad y conexión

Las consultas de diccionario y la lectura del manga importado son locales. La importación remota requiere descargar archivos y puede pasar sus URLs por el relay existente. El asistente solo transmite texto limitado al pulsar explícitamente una acción y con un endpoint configurado.

Manga importado y JMdict instalado funcionan sin red mientras la aplicación esté abierta. No se promete poder abrir de nuevo la web offline: no se añadió un service worker. Descargar archivos, instalar/actualizar JMdict y obtener nuevas respuestas contextuales requiere red. No hay tracking nuevo, subida de imágenes, sincronización de cache ni secretos frontend.

## Fuentes de verdad y verificación

- Contenido OCR: `.mokuro` importado; imágenes/páginas/progreso: MangaRepository existente.
- Diccionario: asset `public/dictionaries/JMdict_spanish.zip` y DictionaryRepository global; no se duplicó importer/parser.
- UI: JSON ES/EN/CA y `node scripts/compile-i18n.mjs` para regenerar dictionaries.generated.ts.
- Desconjugación: japanese-deinflection.service.ts; lookup: japanese-lookup.service.ts.
- Contexto: manga-context.model.ts y manga-context.service.ts. Configuración desactivada por defecto.

Tests relevantes: `npm test -- --include=src/app/features/manga/*.spec.ts --include=src/app/core/services/japanese*.spec.ts --include=src/app/core/services/manga-context.service.spec.ts`.
Validación completa: `npm test`, `npx tsc -p tsconfig.app.json --noEmit`, `npx tsc -p tsconfig.spec.json --noEmit`, `npm run build`.

Las pruebas de contrato usan respuestas simuladas: no demuestran un servicio IA real. La ambigüedad lingüística, errores OCR y el orden narrativo Mokuro requieren contexto humano. Safari usa el fallback caretRangeFromPoint cuando es necesario; la validación manual se realiza en el navegador disponible, no afirma una ejecución real en Safari.

## Archivos de esta implementación

Creados:

- `MANGA_READER.md`
- `src/app/core/models/manga-context.model.ts`
- `src/app/core/services/japanese-deinflection.service.ts`
- `src/app/core/services/japanese-deinflection.service.spec.ts`
- `src/app/core/services/japanese-lookup.service.spec.ts`
- `src/app/core/services/manga-context.service.ts`
- `src/app/core/services/manga-context.service.spec.ts`
- `src/app/features/manga/manga-guide.page.ts`
- `src/app/features/manga/manga-library.scss`
- `src/app/features/manga/manga-assistance.spec.ts`

Modificados:

- `src/app/core/models/dictionary.model.ts`
- `src/app/core/services/dictionary.repository.ts`
- `src/app/core/services/japanese-lookup.service.ts`
- `src/app/features/manga/dictionary-install.component.ts`
- `src/app/features/manga/manga-ocr.component.ts`
- `src/app/features/manga/manga-reader.page.ts`
- `src/app/features/manga/manga.page.ts`
- `src/app/features/manga/manga.routes.ts`
- `src/app/features/manga/manga.scss`
- `src/app/shared/components/dictionary-popup/dictionary-popup.ts`
- `src/app/shared/components/dictionary-popup/dictionary-popup.scss`
- `src/assets/i18n/es.json`
- `src/assets/i18n/en.json`
- `src/assets/i18n/ca.json`
- `src/assets/i18n/dictionaries.generated.ts`

## Resultado de validación (2026-10-04)

- Suite Angular/Vitest: 629 tests en 80 archivos, incluidos 62 nuevos tests de esta fase.
- TypeScript app/spec: sin errores. Build: correcto; conserva avisos del presupuesto inicial (1,09 MB frente a 750 kB) y cuatro estilos de Gramática fuera de su presupuesto, sin cambios en esos módulos.
- Navegador disponible: instalado/no instalado; JMdict real (55.017 entradas), palabra exacta, verbo/adjetivo conjugados, sin resultados, OCR vertical/horizontal, desktop/390 px, Light/Dark/Nora/Nora Dark/Anime, Escape/foco, zoom, fullscreen, navegación y guía/FAQ. Se usaron dos muestras sintéticas propias, sin imágenes externas.
- Backend contextual no configurado: acciones desactivadas y sin peticiones. Éxito, cache, error y cancelación se comprueban con mocks de contrato, no con IA real.
- No se ejecutó Safari real. No se hizo commit ni push.

## Corrección de selección OCR (2026-10-04)

Una selección nativa no colapsada dentro del OCR tiene prioridad sobre el caret. Range identifica líneas/bloques y offsets; dentro del mismo bloque se recortan las líneas Mokuro y se unen con `\n`. Entre bloques se conserva Selection.toString(), normalizando CRLF y recortando solo espacios exteriores, sin inventar orden narrativo. Se captura al soltar el pointer y se espera a que se estabilicen las selecciones hechas con teclado o handles; no se cancela la selección nativa ni se usa preventDefault.

`lookupSelection` consulta exclusivamente el texto completo seleccionado (o su desconjugación validada), nunca lo reemplaza por una palabra interna. El popup muestra «Texto seleccionado» y un mensaje neutral si no existe una entrada única. `lookupAt` conserva el motor de caret: entradas de varios caracteres validadas tienen prioridad sobre coincidencias de un kana; score/sequence ordenan alternativas y la longitud solo desempata. La regla irregular existente de 行った → 行く precede a las reglas genéricas para evitar priorizar 行う.

El contrato contextual conserva `selectedText` exacto en modo manual; en modo caret recibe el bloque completo y `selectedExpression` con la palabra consultada. Una selección manual superior al límite de 1.200 caracteres no se envía truncada: la UI pide seleccionar menos texto. El texto mostrado permanece completo.

Verificación: 149 tests relevantes, 660 tests totales en 81 archivos (31 más que antes de esta corrección); TypeScript app/spec y build correctos. Permanecen los avisos de presupuesto documentados arriba. Pruebas nativas con JMdict real en horizontal/vertical, desktop y 390 px: ひとり, ここ, ありがとう, 食べなかった, 読んでる y 行った; selección de frase y dos líneas Mokuro. Pulsar ひ, と o り devuelve ひとり. Safari y long-press en dispositivo físico no se ejecutaron; los handlers touch y Range se verifican unitariamente.

Archivos creados en esta corrección:

- `src/app/features/manga/manga-ocr-selection.ts`
- `src/app/features/manga/manga-ocr-selection.spec.ts`

Archivos modificados en esta corrección (los cambios previos permanecen sin commit):

- `src/app/core/models/dictionary.model.ts`
- `src/app/core/services/japanese-lookup.service.ts`
- `src/app/core/services/japanese-lookup.service.spec.ts`
- `src/app/core/services/japanese-deinflection.service.ts`
- `src/app/features/manga/manga-ocr.component.ts`
- `src/app/features/manga/manga-reader.page.ts`
- `src/app/features/manga/manga-reader.page.spec.ts`
- `src/app/features/manga/manga-assistance.spec.ts`
- `src/app/shared/components/dictionary-popup/dictionary-popup.ts`
- `src/assets/i18n/es.json`
- `src/assets/i18n/en.json`
- `src/assets/i18n/ca.json`
- `src/assets/i18n/dictionaries.generated.ts`
- `MANGA_READER.md`

## Corrección final dirigida de Manga V2

- El popup entrega por separado `selectedText: "しょうがない"` y `contextText: "しょうがないだろ。明日早いんだから。"`. Solo se añade el bloque contenedor para selección dentro de un mismo bloque; se mantienen los vecinos y los límites descritos arriba. Backend desactivado, sin imágenes ni página completa.
- La desconjugación reúne todos los candidatos compatibles con el diccionario/POS de una misma superficie, deduplica y ordena antes de escoger principal y alternativas (máximo ocho). Las reglas con evidencia kanji preceden a sufijos genéricos; después se usan profundidad, score, sequence y grafía como desempate estable. `行った` prioriza `行く`; `いった` conserva `行く` y `言う`; `きた` conserva `来る` y `着る`. Las reglas kana irregulares no eliminan interpretaciones regulares y el popup reutiliza su sección de alternativas.
- `pointercancel` protege el snapshot válido con releasedSelection, igual que pointerup, hasta emitirse; un colapso posterior no lo borra. No se añade preventDefault ni se bloquean handles.
- Se elimina el label/CTA antiguo de importación. Hero y empty state activan el mismo input oculto y etiquetado; importFile sigue conectado a change. Los botones semánticos mantienen el acceso por teclado.
- Archivos de esta corrección: manga-context.model.ts, manga-context.service.ts y su spec; japanese-lookup.service.ts y su spec; japanese-deinflection.service.ts; manga-ocr.component.ts y manga-ocr-selection.spec.ts; dictionary-popup.ts; manga.page.ts; manga-assistance.spec.ts; este documento. Sin cambios en IndexedDB, importación Mokuro, Gramática ni traducciones.
- Validación final: 15 tests nuevos, 675 tests pasan en 81 archivos; TypeScript app/spec sin errores; build correcto con los avisos de presupuesto ya existentes. Sin commit ni push.

## Corrección dirigida del lookup tras pages.zip

- Causa de します → しる: 汁 tiene definitionTags `n n-suf`, rules vacío y score 1999800, frente a 999800 de する/vs. La validación anterior aceptaba rules vacío antes del ranking. Ahora queda excluido de la transformación, sin alterar scores ni coincidencias exactas.
- Se separan «Más significados» (misma expresión principal) y «Posibles interpretaciones» (expresiones base distintas en análisis morfológico). Etiquetas y negative-nu traducidas en ES/EN/CA.
- Prueba real final con el volumen ya importado, sin tocar OCR ni reglas durante la repetición: します devuelve する desde inicio/centro/final; 負けぬ devuelve 負ける, lectura まけぬ y negative-nu en las tres posiciones; させたかった conserva la superficie completa en las tres posiciones. Principal 差す/さす, lectura de superficie させたかった, razones past/desire/potential; sobreviven する y otras bases plausibles. No se fuerza el significado contextual.
- Se reprodujo y corrigió con test el caso de Segmenter たん que cruzaba el final de la superficie verbal. La comprobación final del navegador ya no devuelve ese fragmento. No se guardan capturas de las páginas privadas.
- 30 tests nuevos frente a 675: 705 tests pasan en 81 archivos. TypeScript app/spec y build correctos; permanecen los presupuestos inicial/Grammar existentes. Regresiones: palabras reales, ひとり, 食べなかった, 読んでる, 行った y ambigüedades いった/きた; selección nativa y contexto conservados por la suite existente.
- Archivos de esta fase: japanese-lookup.service.ts y su spec; japanese-deinflection.service.ts; dictionary-popup.ts; manga-assistance.spec.ts; ES/EN/CA y dictionaries.generated.ts; este documento. Sin cambios en OCR/Mokuro, selección nativa, IndexedDB, importación ni backend. Sin commit ni push.

## Estado final Manga Assistant V1: solo Translate publicado

Translate listo con Gemma/Cloudflare Workers AI: plain JSON, thinking=false, sin retries ni fallback, una inferencia máxima. Study se conserva internamente como experimental, sin botón ni invocación desde el popup. Known limitation: su análisis léxico puede ser pedagógicamente incorrecto; se aplaza sin más inferencias ni cambios de prompt.

El flujo existente permite Translate con endpoint, carga, cancelación y caché local; presenta natural/literal/notes como texto y sus errores no rompen JMdict. Reader/JMdict siguen funcionando sin IA. No hay deploy ni endpoint de producción configurado. Después de desplegar Worker, añadir en el head de src/index.html el meta `kana-study-manga-assistant` con la URL pública real terminada en `/assist`; el factory de MANGA_ASSISTANT_ENDPOINT lo lee. Sin claves ni URL inventada. Location/IDs se mantienen solo en la clave de caché local, sin enviarlos al Worker.

BENCHMARK.md y MODEL_OUTPUT_DIAGNOSTIC.md se conservan como histórico. El informe siguiente describe la fase experimental previa; la decisión final publica únicamente Translate.

Validación de cierre: 114/114 tests Worker, 42/42 Angular afectados, TypeScript Worker/app/spec y build correctos; avisos de tamaño existentes. Sin llamadas AI, benchmark ni deploy. Study no visible y rechazado desde el popup; errores de Translate conservan el diccionario y notes se renderizan como texto.

## Manga Assistant V1: notes opcionales de estudio (experimental)

MangaStudyExplanation conserva natural/vocabulary/grammar y admite notes opcionales: hasta cinco avisos de 500 caracteres para OCR, ambigüedad o análisis incierto. Respuestas sin notes siguen siendo válidas. Validación en MangaContextService y Worker; el contrato Worker reutiliza el modelo Angular y su schema incluye el campo opcional. El popup muestra cada aviso mediante interpolación de texto bajo natural, sin innerHTML ni label nuevo. Idioma ES/EN/CA según targetLanguage, con los estilos existentes del popup; no se añaden traducciones de etiquetas.

El detector de salida distingue etiquetas HTML de símbolos normales <, > y flechas; no se cambia el filtro de entrada. Arrays vacíos siguen siendo válidos, y las expresiones de vocabulary/grammar deben seguir siendo substrings literales de selectedText, sin duplicados. Prompt conservador sobre fragmentos, OCR y formas conjugadas. Gemma sigue plain JSON/thinking=false, sin reparación, retry ni fallback. Endpoint no configurado y Worker no desplegado.

Validación de esta fase: 22 tests Worker y 7 Angular nuevos; 114/114 Worker y 40/40 Angular afectados pasan. TypeScript Worker/app/spec y build correctos, avisos de tamaño existentes. Tres llamadas reales Gemma, sin retry: B translate, D study, E study; 3/3 contratos válidos. B avisa de ambigüedad y E advierte OCR, pero D mantiene análisis léxico dudoso (baseForm い para かった); no se recomienda deploy aún. Informe y outputs completos en workers/manga-assistant/BENCHMARK.md. Sin commit ni push.
