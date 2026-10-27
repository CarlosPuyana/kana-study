# Manga Study Integration V1 / V2

`MangaStudyIntegrationService` consumes the existing `DictionaryLookup`. It does
not perform lookup, deinflection, network requests, or persistence. Its result
contains an optional enabled Vocabulary entry, ordered unique enabled Kanji,
and availability flags for the existing audio and writing actions.

Vocabulary matching checks the supplied base form, principal expression and
lookup forms against primary forms and documented `writtenForms`. A unique written
primary match takes priority over an alternative spelling; multiple written candidates require agreement with a
documented reading. Multiple candidates are never resolved by catalog order. Reading fallback requires a kana spelling
that equals the reading and exactly one catalog candidate; an unknown Kanji
spelling is never treated as a homophone alias.

Examples: `食べなかった → 食べる`, `學校 → 学校`, `ここ`, `きれい`.
`ありがとう` is absent from the current catalog. A dictionary word without a
Vocabulary match can still offer known Kanji actions. Extraction uses the
written base when available, otherwise the principal expression; repeated
characters retain only their first occurrence.

The secondary Word-tab section uses existing routes:

- `/vocabulary/all?entry=ID` opens its existing detail dialog.
- `/vocabulary/writing?entry=ID` opens existing individual practice.
- `/kanji/all?selected=CHARACTER` opens its existing detail dialog.
- `/kanji/writing?entry=ID` opens existing individual practice.

These links carry the existing safe `return` parameter to the Reader. Its
existing saved page and reading clock lifecycle remain unchanged. Default
navigation outside Manga is preserved.

Listening calls `JapaneseAudioService.play(ID)` only on an explicit click and
only for IDs in the production manifest. Playback errors remain accessible;
owned playback stops when the result changes or the popup is destroyed. No
audio is preloaded by matching. Queries, detail views and listening do not
record answers or change Weakness, FSRS, Daily Learning or session history.

Writing uses the shared glyph provider and canvas. Compound alternative forms
containing separators are excluded from this action. The asset regression test
checks local stroke coverage for all enabled single Japanese primary forms.
No vocabulary data or audio assets are changed.

Validation includes deterministic matching and side-effect tests, popup and
contextual-return tests, local writing/audio asset checks, and a Playwright
fixture using local IndexedDB records and a generated SVG page. The fixture
exercises real deinflection, all four navigation actions, saved-page return,
no audio preloading, five themes, and desktop/390px/320px layouts. Existing
Reader clock, lookup, writing and lazy translation regressions also run.

V1 scope limits (saved words are added below in V2): current catalogs only; no Grammar detection,
automatic cards, learning history or recognition. Browser smoke coverage uses
Chromium; Safari is not available in the configured test projects.


## V2 — Guardar para estudiar

La colección se abre desde Manga → Palabras guardadas (`/manga/study`). Guardar es una decisión manual, no un intento ni una sesión. No modifica FSRS, Daily, Weakness, accuracy, medallas, rachas, historial ni Anki.

`MangaStudySavedItem` (schemaVersion 1) guarda expresión canónica, lectura, base opcional, Vocabulary ID opcional, IDs de Kanji, un significado breve, surface/contexto acotados, título snapshot, volumeId, página (1-based) y fecha. No guarda páginas, blobs ni entradas JMdict completas. Los significados actuales de Vocabulary se resuelven según idioma; el snapshot del diccionario conserva el texto original de su fuente sin atribuirle falsamente el idioma de UI.

Persistencia: IndexedDB `kana-study-manga-study`, store `saved-items`; `WorkspaceService.databaseName` separa guest y cuentas. `MangaStudySavedRepository` ofrece list/get/save/remove/exists/clear y señales reactivas sin polling. Guardar hace get/add en una única transacción serializada; mantiene el primer contexto/origen al guardar desde otra página. La colección ordena primero las entradas recientes. Los errores se muestran y permiten reintentar; no se simula éxito antes de confirmar la escritura.

Deduplicación: `vocabulary:<entryId>` para match conocido; de lo contrario `dictionary:` + par JSON de expresión canónica y lectura normalizadas NFC/trim. No se deduplica por lectura sola (橋 y 箸 se mantienen separados). `食べなかった` conserva surface/contexto y guarda 食べる. Los términos externos siguen disponibles sin enlaces ficticios a Vocabulary/audio/Writing.

La colección reutiliza `MangaStudyIntegrationService` para matching, extracción de Kanji y disponibilidad real de audio/escritura. El nivel se muestra desde el entry actual, no está fijado a N5. Los enlaces de detalle y escritura retornan a la colección. El retorno al Reader incluye `?page=N`, validado contra el volumen; usa `go()` existente. Si el volumen desaparece, se conserva la palabra y snapshot, ocultando el retorno. Borrar Manga nunca toca esta base.

Quitar requiere confirmación ligera en la misma tarjeta/popup, con cancelar. Los controles tienen targets de 44 px y focus visible, usando tokens de todos los temas. No incluye buscador, export/import, sync cloud, sesiones de guardadas ni incorporación automática a catálogos. Podrán añadirse después con un diseño explícito.
