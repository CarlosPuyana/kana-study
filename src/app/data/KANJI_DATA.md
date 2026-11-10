# Kanji data attribution

The readings, stroke counts, school grades, frequency ranks, and English reference data used to review `kanji-n5.generated.ts` come from KANJIDIC2, published by the Electronic Dictionary Research and Development Group (EDRDG), through the downloadable dataset exposed by kanjiapi.dev.

- KANJIDIC project: https://www.edrdg.org/wiki/index.php/KANJIDIC_Project
- EDRDG licence: https://www.edrdg.org/edrdg/licence.html
- kanjiapi.dev: https://kanjiapi.dev/

The application does not contact these services at runtime. Localized meanings and the compact teaching examples are curated in `scripts/generate-kanji.mjs`; generated metadata remains locally bundled with the application.

## K2 principal examples (10 November 2026)

Reviewed all 80 examples for spelling, reading, meaning and beginner usefulness.
75 are retained, including 食べる, 学校, 友達 and genuine single-kanji words such
as 水, 人 and 雨. A single character can be a complete everyday word; it does
not need an artificial compound. No examples were missing.

Five less contextual choices are replaced in both the generator and catalog:

| Kanji | Previous | Principal example | Meaning (ES / EN / CA) | Checked reference |
| --- | --- | --- | --- | --- |
| 十 | 十 | 十月・じゅうがつ | octubre / October / octubre | [JapanDict / JMdict](https://www.japandict.com/十月) |
| 千 | 千 | 千円・せんえん | mil yenes / one thousand yen / mil iens | [JapanDict / JMdict](https://www.japandict.com/千円) |
| 百 | 百 | 百円・ひゃくえん | cien yenes / one hundred yen / cent iens | [JapanDict / JMdict](https://www.japandict.com/百円) |
| 土 | 土 | 土曜日・どようび | sábado / Saturday / dissabte | [JapanDict / JMdict](https://www.japandict.com/土曜日) |
| 東 | 東京 | 東口・ひがしぐち | salida este / east exit / sortida est | [JapanDict / JMdict](https://www.japandict.com/東口) |

The first (currently only) example is the principal one. Kanji study displays
its word, kana reading and localized meaning after reveal or confirmed quiz
feedback in either direction. On/kun readings remain in a collapsed native
disclosure. Romaji and reading classification remain available in the catalog
detail. The examples and presentation load through the existing lazy Kanji
routes, reuse existing translated labels, and never become study units.
Kanji IDs, meanings used for answers, metadata and saved progress are unchanged.

Validation: 63/63 directed unit tests; 12/12 browser cases (both directions and
modes, ES/EN/CA, dark/light, 1280/390/320 px); 2819/2819 global tests; production
build passed. Initial bundle: 748126 bytes, below 750000; Kanji catalog and answer
component verified absent from initial chunks. All 80 generator examples match
the catalog. No functional K2 cases remain open; physical Safari was not tested.
