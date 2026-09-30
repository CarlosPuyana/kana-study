# Vocabulary data attribution

`vocab-n5-v1` contains 662 approximate JLPT N5 entries. Level membership and English seed meanings come from OpenJLPT commit `c42fd9fa3777bfc1775446f7c418d549dfd6e4cf`, derived from Jonathan Waller's lists. Forms and parts of speech were matched against JMdict Simplified 3.6.2 (dictionary date 2026-09-28). OpenJLPT and the derived dataset are CC BY-SA 4.0; JMdict is used under the EDRDG licence.

Spanish and Catalan quiz meanings were generated offline and packaged locally. They should receive continuing editorial review. Example arrays are intentionally empty in v1 because OpenJLPT examples lack the complete localized readings required by this application. No source is contacted at runtime.

## Furigana generation

Furigana is generated ahead of runtime from each primary written form and primary reading. Literal kana runs act as alignment anchors; only the intervening kanji groups receive readings. All-kanji compounds and irregular readings stay grouped instead of being divided character by character. Kana-only entries receive no redundant annotation. If a mixed form cannot be aligned safely, the generator uses one conservative full-form ruby segment.

Four source rows that combined alternative spellings were normalized editorially while preserving their original stable IDs: `丸い/円い`, `見る 観る`, `初め/始め`, and `伯母さん/叔母さん`. Their first spelling is now the primary form and the alternatives remain in `writtenForms`. The generated v1 distribution is 163 kana-only entries, 202 partial segmentations, 297 grouped readings, and 0 conservative fallbacks.
