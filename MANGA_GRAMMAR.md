# Manga Grammar Integration V1

The third dictionary tab is a local, read-only reference. Word and Context retain
their existing behavior. Grammar does not call Manga Assistant or any API, save
words, alter FSRS, record progress, create sessions, accrue study time or enqueue
sync work. Course data and translations ship with the reader route assets. After the reader
is loaded, even the first Grammar tab opening, search and matching require no
connection. The initial application/reader itself still needs available assets.

## Curated automatic coverage

The pure matcher accepts original selected text, surface, base form, OCR context,
selection offsets and dictionary evidence. It preserves original characters.
Empty/non-Japanese input and selections/contexts over 1200 UTF-16 units have
explicit states. It never truncates input to fabricate a match.

Verified coverage is intentionally limited to complete written utterances:

| Concept ID | Exact phrases | Evidence |
| --- | --- | --- |
| te-kudasai | 見てください / 書いてください | Known verb + request construction documented in that lesson |
| nai-de-kudasai | 食べないでください / 撮らないでください | Known verb + negative request documented in that lesson |
| polite-verb-masu-system | 食べます / 飲みます | Known inflected verb documented by the lesson's formation |

Only outer whitespace and a single terminal 。！？ are ignored for comparison.
Substrings, added words, quotations and internal line breaks are not recognized.
A complete OCR context can supply evidence only if the selected text exactly
matches its supplied start/end offsets. A verified result identifies the
documented written construction, not a translation of the manga sentence.

The additional te-form-formation reference is only *possible*: 食べて → 食べる
with v1 POS, or 読んで → 読む with v5 POS, plus an actual dictionary te reason and
matching written entry. This never identifies sequence, progressive aspect,
request or any complete construction. Base form/reason alone is insufficient.

Isolated particles, particles within words, generic conjugation suffixes, arbitrary
past/negative forms and uncurated constructions produce no automatic explanation.
This is not a Japanese parser and does not recognize the entire N5 curriculum.

## Dynamic reference and navigation

Manual search uses the actual semantic GRAMMAR_V2_CONCEPTS with valid lesson
adapters, excluding prerequisite/integration screens. It searches current-language
titles, summaries and documented formation patterns, rendering at most eight
results. Manual results are explicitly lessons to consult, not detected grammar.

The compact reference shows existing idea/formation data and two real course
examples using existing meaning keys. Original OCR is interpolated as text;
no dictionary/OCR HTML is interpreted and examples are never presented as manga
translations. Selection/location/account changes reset search and chosen lessons.

Lesson links use /grammar/n5/:topicId/:conceptId. Practice uses the existing
/grammar/n5/:topicId/practice?lesson=:conceptId only when grammarTopicRound has
exercises. Return parameters use safeReturnUrl and Grammar accepts only local
Manga reader paths, parsing the URL as an Angular UrlTree to retain page queries.
The source volume and one-based page number survive the round trip. Opening a
lesson and answering practice questions preserve the established Grammar behavior.

The popup keeps one dialog, internal scrolling, a bounded responsive sheet,
Escape dismissal, restored focus and a focus trap including the search field.
All strings have ES/EN/CA versions and styling uses semantic theme variables.

## Validation and physical devices

Unit tests cover every verified phrase positively and negatively, lexical te
evidence, unreliable offsets, ambiguous particles/conjugations, original text,
XSS, search, valid links, read-only consultation, account/selection resets,
translations and normal Grammar opening. Integration regressions cover Reader,
Grammar, Manga V3/V4 and sync. Playwright covers no dictionary, offline search,
five themes, keyboard/Escape, 320px/390px/desktop and round-trip navigation.
Physical Android selection/drag/zoom and iOS Safari long-press selection, browser
focus restoration and safe-area behavior still require manual validation.

No SQL, RPC, event schema, sync algorithm, FSRS, Weakness algorithm, Daily Study,
Anki, leaderboard, Reading Clock, Yomitan or Mokuro importer changes are needed.
