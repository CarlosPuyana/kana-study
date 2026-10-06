# Author-owned manga catalog

The existing Reader accepts imported ZIP/CBZ + Mokuro volumes from workspace
IndexedDB. Author-owned manga now use the same Reader through
`MangaSourceService`: IDs prefixed with `catalog:` resolve static assets, while
all existing IDs continue to resolve through `MangaRepository`.

## Files and discovery

Assets belong in `public/manga/`. Angular already copies `public/` for both local
development and GitHub Pages. All requests resolve against `document.baseURI`;
there is no hardcoded deployment prefix. The catalog currently contains no
stories, pages, covers or sample art.

Browsers cannot enumerate server directories. Add each metadata path to
`public/manga/index.json`:

```json
{"schemaVersion":1,"mangas":["hajimete-no-irai/metadata.json"]}
```

Adding another directory requires only another index entry, never Reader code.
Paths are relative and confined to the catalog: no absolute paths, traversal,
external URLs, query strings or encoded paths. Metadata IDs must be unique
stable ASCII slugs. Imported UUIDs and `catalog:` IDs cannot collide.

## Metadata contract

The following is a **schema example**, not published content. Replace the page
list with the actual 20 finished pages before publishing the first manga:

```json
{
  "schemaVersion": 1,
  "id": "hajimete-no-irai",
  "titles": {"ja":"はじめての依頼","es":"El primer encargo"},
  "reading": "はじめてのいらい",
  "originalLanguage": "ja",
  "availableLanguages": ["ja","es"],
  "readingDirection": "rtl",
  "status": "published",
  "cover": "cover/cover.webp",
  "pages": [
    {"id":"p01","width":1200,"height":1800,
     "images":{"ja":"pages/jp/p01.webp","es":"pages/es/p01.webp"}}
  ],
  "mokuro": {"ja":"ja.mokuro"},
  "dialogue": "data/dialogue.json"
}
```

Dimensions above are illustrative: use the actual image dimensions. Page count
is derived from `pages.length`; no duplicate count can become inconsistent.
Every advertised language requires an image for every page. Japanese is always
original. `titles.es` is required when Spanish is available. Optional
`description` contains localized ES/EN/CA text. `cover`, `reading`, `description`,
`mokuro` and `dialogue` may be omitted. Draft entries are validated but hidden.

Page IDs and array order identify the same narrative page across versions.
Export Japanese and Spanish lettering over the same master art, using the same
dimensions. Source master files may remain outside the deployed `public/`
directory to avoid shipping unused production files.

## Mokuro and official transcription

Existing Mokuro parsing, OCR overlays, dictionary lookup/deinflection and Manga
Study integration are reused unchanged. For this static contract each Mokuro
document must have the same number and order of pages, dimensions, and
`img_path` values as the corresponding metadata image paths. Keeping
`ja.mokuro` alongside `metadata.json` makes these paths straightforward.

Mokuro is optional: without it the manga can be read, but has no selectable OCR
text. Dictionary lookup is available only on Japanese pages; Spanish lettering
does not trigger Japanese lookup even if a Spanish Mokuro document is supplied.

`data/dialogue.json` is a separate ground-truth array:

```json
[
  {"pageId":"p07","bubbleId":"p07_b01","speaker":"mira",
   "jp":"見て。","reading":"みて。","es":"Mira.","studyTargets":["見る"]}
]
```

This illustrates the supplied bubble format only; it is not story content.
Bubble IDs must be unique
across the manga and refer to existing page IDs. The service exposes and
validates this transcript for future OCR QA. It never generates OCR coordinates
or replaces Mokuro with unpositioned dialogue. OCR benchmarking and transcript
editing UI are outside this phase.

## Reader, progress and compatibility

The library lists published author-owned manga alongside the imported library,
without exposing deletion actions for bundled assets. The language selector
loads the same page index from the other edition and clears incompatible image
cache entries and dictionary state. RTL reverses spatial arrows, side clicks
and swipe direction; next/previous buttons, Space and PageDown retain logical
page order. Existing imported volumes retain their previous navigation.

Reading progress continues to use the existing workspace `reading-progress`
store with a namespaced volume ID. No database version, import records, FSRS,
Weakness, Daily Learning or study history are changed. Reopening defaults to
Japanese and restores the saved page. Reading clock behavior remains unchanged.
Only adjacent pages are prefetched, as before; an entire manga is not loaded.

Metadata, language, page, network and OCR mismatches fail explicitly. A catalog
failure does not prevent opening imported manga; retry is available in the
library. Static files require the app server and are not intended for `file://`.

## Production handoff

For はじめての依頼, add the final cover, 20 Japanese images, 20 Spanish images,
metadata, validated Japanese Mokuro and official dialogue; then register the
metadata path in the index. Keep manga/page/bubble IDs stable after publication.
Adding a second manga follows exactly the same contract and index registration.
Versioning/replacing an existing story's pages should preserve page identity and
order to keep saved reading positions meaningful. Keep the final art and lettering credits with the production metadata/documentation.

Tests use isolated fictional fixture metadata and mocked page resources only;
they do not publish a demo manga or generate any actual story/art.
