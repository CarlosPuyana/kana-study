# Kanji data attribution

The readings, stroke counts, school grades, frequency ranks, and English reference data used to review `kanji-n5.generated.ts` come from KANJIDIC2, published by the Electronic Dictionary Research and Development Group (EDRDG), through the downloadable dataset exposed by kanjiapi.dev.

- KANJIDIC project: https://www.edrdg.org/wiki/index.php/KANJIDIC_Project
- EDRDG licence: https://www.edrdg.org/edrdg/licence.html
- kanjiapi.dev: https://kanjiapi.dev/

The application does not contact these services at runtime. Localized meanings and the compact teaching examples are curated in `scripts/generate-kanji.mjs`; generated metadata remains locally bundled with the application.
