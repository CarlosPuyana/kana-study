# UX Feedback Improvements V1

Fecha: 9 de octubre de 2026. Cambios limitados a las seis correcciones solicitadas. Sin commit ni push.

## 1. Kana: dibujo en Romaji → Kana

Archivos: `features/learn/learn.page.ts/.html`, nuevo `shared/components/learning-writing-prompt/learning-writing-prompt.ts/.spec.ts`, `shared/components/kana-writing-canvas/kana-writing-canvas.ts/.html/.spec.ts` (rutas bajo `src/app`).

- Se reutiliza `KanaWritingCanvas`; los trazos permanecen en memoria del componente.
- Solo aparece en `romaji-to-kana`. La dirección contraria conserva la interfaz anterior.
- Autoevaluación: lienzo vacío, Mostrar respuesta, comparación y los tres ratings existentes.
- Práctica rápida: lienzo, Continuar a las opciones o Continuar sin dibujar, y las opciones originales. Ningún intento se registra hasta seleccionar una respuesta.
- Mientras la respuesta está oculta, `guide=false` y `helpAvailable=false`. También se excluyen del SVG las definiciones de los trazos de referencia.
- La identidad sesión/unidad/aparición reinicia el lienzo y la puerta de opciones incluso cuando se repite el mismo carácter. La llegada asíncrona de recursos no borra el dibujo.
- Se conservan Pointer Events, captura del puntero, normalización, presión, Deshacer y Limpiar. `touch-action:none` se limita a la superficie de dibujo.

## 2. Kanji: dibujo en Significado → Kanji

Archivos: `features/kanji-play/kanji-play.page.ts/.html` y el mismo componente/lienzo compartido.

- Solo aparece en `meaning-to-kanji`; el significado usa el idioma activo.
- Se usan `JapaneseGlyphService`, los recursos locales existentes y `app-japanese-writing-canvas`.
- Se conservan ambos modos y sus métodos originales de respuesta/calificación. Tras revelar se habilitan la guía y los trazos.
- Un recurso ausente mantiene el lienzo dibujable y muestra el aviso existente, sin bloquear la respuesta.
- Los botones de dibujo respetan el teclado: Espacio sobre Deshacer/Limpiar no activa el atajo de revelado de la página.
- No se añade OCR ni evaluación automática de semejanza.

En ambos módulos, los tests integran los servicios reales de sesión con observadores de sus escritores: dibujar y abrir opciones generan cero reviews; Again/Hard/Good y las repeticiones conservan una sola review FSRS inicial y los intentos posteriores existentes. No se modifican servicios de aprendizaje, FSRS, relojes, historial ni sincronización.

## 3. RUSH Kanji

Archivos: `src/assets/i18n/es.json`, `en.json`, `ca.json` y `core.generated.ts`; tests de contrato y navegador.

Se añade la clave que ya utilizaba `KanjiPage.rushContent`, `kanji.level.N5`: **Kanji N5 / N5 Kanji / Kanji N5**. No se cambian IDs, selección, configuraciones ni reglas RUSH. Se regeneran los diccionarios mediante `scripts/compile-i18n.mjs`. El navegador revisa los modales Kana, Kanji y Vocabulary en los tres idiomas buscando claves sin resolver.

## 4. Vocabulario previsto de Grammar

Archivos: `core/services/japanese-local-vocabulary.ts/.spec.ts`, `features/grammar/components/grammar-intended-vocabulary.ts/.spec.ts`, `features/grammar/data/grammar-vocabulary-reference.ts/.spec.ts`, `features/grammar/pages/grammar.page.ts/.html`.

- Adaptador puro del formato `Palabra（lectura）`, con coincidencia exacta de forma y lectura en `VOCABULARY_N5`.
- No se resuelven homógrafos ambiguos ni similitudes parciales eligiendo una entrada arbitraria.
- Se conservan el orden editorial y los términos distintos; únicamente se deduplican cadenas idénticas tras quitar espacios exteriores.
- Cada ficha presenta palabra, lectura y significados en el idioma activo. Su botón japonés permite consulta por ratón, Enter o Espacio.
- Ocho entradas iniciales, Ver todas / Mostrar menos y reinicio al cambiar de lección; el panel exterior sigue siendo desplegable.
- Se reutilizan explicaciones locales exactas cuando las hay. Se revisaron además los datos locales Japanese 1500: siete entradas adicionales y nueve correcciones de glosas conservan sus glosas ES/EN y añaden CA, con tests de procedencia por ID, forma y lectura. No se carga el mazo completo en la página ni se cambia su contenido.

Cobertura global de `GRAMMAR_LESSONS`, contando entradas editoriales únicas:

| Fuente | Entradas |
| --- | ---: |
| Catálogo N5, glosas originales | 103 |
| Catálogo N5, glosas revisadas con fuente local | 9 |
| Complemento revisado de Japanese 1500 | 7 |
| Total con ES/EN/CA | **119** |
| Sin cobertura fiable | **15** |
| Total | **134** |

Complemento: 私（わたし）, 日本（にほん）, 日本語（にほんご）, 思う（おもう）, 急ぐ（いそぐ）, 食事（しょくじ）, 速い（はやい）. Los tests verifican sus glosas contra los registros locales originales.

Correcciones del adaptador, sin modificar el catálogo de estudio: 誰, 降る, 来る, 待つ, 働く, 開く, 開ける, 好き y 大変. La revisión visual detectó «OMS» para 誰 en ES/CA; la revisión del vocabulario previsto detectó también «tardor» para 降る, formas verbales incorrectas y glosas que no servían como referencia gramatical. Se utilizan referencias locales exactas y revisadas (por ejemplo, «quién / who / qui» y «caer / to fall / caure»).

Pendientes: 田中（たなか）, 山田（やまだ）, 勉強する（べんきょうする）, 運動する（うんどうする）, 電話する（でんわする）, 早い（はやい）, 七時（しちじ）, 五月三日（ごがつみっか）, 一本（いっぽん）, 漫画（まんが）, 結婚する（けっこんする）, 大阪（おおさか）, 寿司（すし）, 早く（はやく）, 九時（くじ）. Se muestran honestamente como significado no disponible; no se derivan glosas componiendo palabras ni escogiendo sentidos ambiguos.

## 5. Diccionario de consulta en Grammar

Archivos: nuevo `shared/components/japanese-dictionary-popover/` (componente TS/HTML/SCSS, helper `japanese-text-caret.ts` y tests), `core/services/japanese-lookup.service.ts`, integración en `grammar.page.ts/.html` y traducciones.

- Componente pequeño de consulta; reutiliza `JapaneseLookupService.lookupAt()` / `lookupSelection()`, `DictionaryRepository` y sus tipos. No duplica la desinflexión ni las funciones de guardado de Manga.
- Ámbito: texto con `lang="ja"` de las lecciones, patrones, ejemplos, tablas y fichas. Las referencias inline y furigana reciben marcado japonés cuando corresponde.
- Botones ordinarios, enlaces, inputs, contenidos editables y componentes de ejercicios quedan excluidos. Las fichas tienen un botón explícito de consulta.
- El helper de caret combina nodos de texto y excluye `rt`/`rp`, conservando offsets UTF-16 y el DOM original. Pulsar la lectura ruby identifica su texto base.
- Selección nativa de texto, sin impedir arrastre o scroll; no se procesan selecciones occidentales, selecciones fuera del ámbito ni selecciones superiores a 200 unidades UTF-16.
- Forma, lectura, hasta tres glosas por entrada y forma base cuando el servicio la acredita. Se muestran hasta tres entradas como alternativas, sin fundir sentidos distintos. Las glosas se interpolan como texto.
- Sin diccionario instalado: fallback N5 exacto y único por escritura o lectura; se rechazan lecturas ambiguas. En ausencia de coincidencia, aviso y enlace al instalador existente en Manga. No se descarga nada automáticamente ni se consulta ningún servicio externo.
- Escape, cierre y clic fuera; restauración de foco al cerrar con teclado. El popover se limita al viewport, con scroll interno para glosas largas y reposición al desplazar la página.
- Generación, lección y workspace descartan resultados obsoletos. Cambiar de cuenta/lección o destruir el componente cierra y cancela la presentación pendiente. Una selección descartada no se reabre por eventos tardíos de la misma selección.
- Se añade un token de mantenimiento de importaciones, activado por defecto para los consumidores existentes. La instancia local de Grammar lo desactiva: su construcción no ejecuta `cleanup()` ni elimina importaciones ajenas. El comportamiento previo de Manga se conserva.
- No se inyectan escritores de progreso, FSRS, sesiones o outbox. Los tests verifican consultas offline, estados asíncronos, ausencia de mantenimiento y conservación de los datos de aprendizaje.

Las consultas pendientes a IndexedDB pueden terminar; se cancela su presentación, sin borrar datos ni alterar el repositorio compartido. El fallback del popover es el catálogo N5; el complemento editorial de siete palabras pertenece al listado previsto.

## 6. Etiqueta de Kana Writing

Archivos: `features/writing/kana-writing.page.html/.spec.ts`.

La etiqueta se muestra siempre desde `kana.type`, en Hiragana, Katakana, Ambos y Weakness. Se elimina únicamente la condición que la ocultaba. No se cambian filtros ni reglas de sesión. La regresión cubre también un carácter Katakana de Weakness con el filtro de configuración Hiragana.

## Tests e idiomas

Las cinco suites de Grammar que simulaban únicamente `TranslationService.t()` incorporan el método `language()` al mock. Sus expectativas pedagógicas y de progreso se conservan: `grammar.spec.ts`, `grammar-audit.spec.ts`, `grammar-expansion.spec.ts`, `grammar-interactive.spec.ts`, `grammar-progress.spec.ts`.

`e2e/ux-feedback.spec.ts` cubre Kana, Kanji, Grammar, RUSH y diccionario instalado. Revisa escritura real con ratón, controles accesibles, aislamiento de datos, guía oculta, reinicio, traducciones, glosas largas, importaciones no eliminadas y funcionamiento offline.

Resultados de validación:

| Comprobación | Resultado |
| --- | --- |
| Tests dirigidos de componentes, Grammar, FSRS y sincronización | **516 pasan**, 41 archivos |
| Comprobación posterior de glosas, procedencia y diccionario | **20 pasan**, 4 archivos; la nueva regresión de lectura exacta también pasa en la suite completa |
| `npm test`, versión final | **1646 pasan**, 165 archivos |
| `npx tsc -p tsconfig.app.json --noEmit` | Correcto |
| `npx tsc -p tsconfig.spec.json --noEmit` | Correcto |
| `npm run build -- --base-href /kana-study/` | Correcto; cuatro avisos SCSS conocidos |
| `npx playwright test e2e/ux-feedback.spec.ts` | **15 pasan**, tres perfiles |
| Auditorías Grammar e i18n ejecutadas por prebuild | Correctas |
| `git diff --check` | Correcto |

La validación de navegador incluye viewports 1280×900, 390×844 y 320×800, cinco temas y ES/EN/CA. Se inspeccionaron capturas representativas de los cinco temas, incluidos lienzos y popover. Los resultados de Playwright y capturas están en `test-results/` (ignorado por Git); los logs locales de validación están en `.cache/` (también ignorado).

Durante la validación completa se reprodujeron timeouts de 5 s en los dos tests de detalle de `features/vocabulary-all/vocabulary-all.page.spec.ts`: renderizaban todo el catálogo para inspeccionar un único detalle. Sus fixtures utilizan ahora el filtro público del término seleccionado, con las mismas aserciones de lectura/romaji N5 y ausencia de romaji N4. No se cambia Vocabulary de producción, ningún timeout ni la cobertura de los tests de búsqueda. Los fallos previos de Grammar eran mocks sin `language()`; se corrigieron los mocks, no las expectativas.

## Límites y pruebas físicas pendientes

- No hay reconocimiento de escritura; las calificaciones y corrección son las existentes.
- Quince términos previstos carecen de cobertura fiable. El idioma de las glosas del diccionario instalado es el de ese diccionario; no se inventan traducciones de sus entradas.
- La consulta actúa sobre fragmentos identificados explícitamente como japonés, no sobre todo el texto traducido de la aplicación.
- La validación automatizada usa Chromium en Windows y viewports de escritorio, 390 y 320 px. Se revisan cinco temas; Grammar/RUSH se prueban en ES/EN/CA, y el contrato de traducciones comprueba todos los idiomas.
- Pendientes pruebas físicas con ratón/teclado en PC, selección táctil y scroll en Android, Safari iOS y lápiz digital en tablet. WebKit no está instalado en el entorno; los tests automatizados no equivalen a una prueba física de Safari.
- Se mantienen los cuatro avisos SCSS conocidos del build; no se han modificado esos estilos ni sus budgets.

No se modifican SQL, workflow, FSRS, progresos históricos, Daily Study, Weakness, Manga Grammar Integration, sincronización ni relojes. No se borran datos de usuario. Sin commit ni push.


## Corrección: escritura también en RUSH (Kana y Kanji)

Se añade `LearningWritingPrompt` únicamente a Kana Romaji → Kana y Kanji Significado → Kanji. Se reutilizan `KanaWritingCanvas`/`app-japanese-writing-canvas` y `JapaneseGlyphService`; no existe un segundo motor de dibujo ni OCR. Las direcciones inversas conservan su interfaz.

Según la aclaración del usuario, RUSH mantiene **Mostrar respuesta → Siguiente**. No hay opciones múltiples, calificaciones ni paso intermedio. Mostrar respuesta está disponible sin dibujar; revela el carácter y las ayudas existentes. Dibujar, deshacer, limpiar y revelar no completan tarjetas. Solo Siguiente utiliza el método original `RushSessionService.next()`.

La identidad del lienzo combina ID de sesión, tarjetas completadas y clave de unidad. Esto reinicia la tinta incluso si se repite el carácter. La carga de glifos utiliza la implementación compartida existente, conserva tinta válida y descarta resultados de preguntas anteriores. Los recursos ausentes no bloquean dibujo/revelado. Los significados Kanji mantienen el idioma activo ES/EN/CA; las instrucciones específicas de RUSH están traducidas en los tres idiomas.

Los atajos globales Enter/Espacio se conservan fuera de controles interactivos. Los botones mantienen su activación nativa y no disparan además el atajo global, evitando interferencias con Deshacer/Limpiar y transiciones duplicadas.

### Archivos de esta corrección

- `src/app/features/rush/kana-rush.page.ts` y `.html`.
- `src/app/features/rush/kanji-rush.page.ts` y `.html`.
- `src/app/shared/components/learning-writing-prompt/learning-writing-prompt.ts`: input opcional para las instrucciones; APRENDER conserva su texto predeterminado.
- `src/assets/i18n/{es,en,ca}.json` y `core.generated.ts`.
- `src/app/features/rush/rush-writing.spec.ts`: 11 regresiones con el servicio/engine/clock reales y repositorio aislado.
- `e2e/rush-writing.spec.ts`: seis casos por perfil.
- Este documento.

No se modifican servicios de RUSH, cálculos de tiempo, puntuaciones, progresión, finalización, persistencia, sincronización, FSRS ni datos históricos.

### Cobertura de comprobaciones

Los tests unitarios comprueban ambas direcciones, escritura sin completar tarjetas, revelado sin dibujo, tiempos y finalización con reloj determinista, duplicados durante guardado, repetición del mismo carácter, ausencia de recursos, idioma activo y respuestas asíncronas obsoletas. Los tests compartidos de APRENDER/canvas conservan su cobertura de calificaciones FSRS y carga tardía de Kana.

Playwright cubre ratón real, Pointer Events simulados de touch/lápiz, teclado en Deshacer/Limpiar, revelado y Siguiente, repetición en otro ciclo, direcciones inversas, recursos ausentes y finalización. Comprueba `touch-action: none` solo dentro del lienzo y ausencia de overflow en los cinco temas; usa escritorio, 390 y 320 px. El aviso inicial de medalla se cierra mediante su botón existente cuando aparece antes de seguir (sin forzar clics ni cambiar las medallas).

Las comprobaciones automatizadas no sustituyen pruebas físicas de touch/lápiz ni Safari iOS.


### Resultados finales de la corrección RUSH

| Validación | Resultado |
| --- | --- |
| Tests dirigidos RUSH, servicio, lienzo y APRENDER | 30 pasan; la regresión adicional de recursos obsoletos también pasa dentro de la suite completa |
| `npm test` (ejecución final sin validaciones concurrentes) | **166 archivos / 1657 tests pasan** |
| `npx tsc -p tsconfig.app.json --noEmit` | Correcto |
| `npx tsc -p tsconfig.spec.json --noEmit` | Correcto |
| `npm run build -- --base-href /kana-study/` | Correcto; cuatro avisos SCSS conocidos de Grammar |
| `npx playwright test e2e/rush-writing.spec.ts e2e/ux-feedback.spec.ts` | **33 pasan**, incluidos 18 de RUSH y 15 regresiones UX/APRENDER |
| `git diff --check` | Correcto |

Se inspeccionaron capturas de RUSH en escritorio, 390 y 320 px, incluyendo los temas claro, Nora y Anime. La comprobación automatizada de overflow/capturas recorre los cinco temas. Logs en `.cache/rush-*.log` y capturas en `test-results/`, ambos ignorados por Git.

Una ejecución de `npm test` simultánea con build, TypeScript y Playwright produjo un timeout del test existente de Grammar que renderiza todos los temas/lecciones. La suite había pasado antes y vuelve a pasar al ejecutarse sin esas validaciones concurrentes. No se modifica ese test, sus expectativas ni sus timeouts.

Sin commit ni push.
