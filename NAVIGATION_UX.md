# Navigation and visual consolidation

## Shared presentation

`PageHeader` owns a localized heading, an explicit back link, AccountControl and
projected module controls. Home retains its brand header and reuses AccountControl.
Grammar and Manga Reader retain their specialized navigation. No learning rules change.
`shared/styles/_module-home.scss` is emitted once globally under `.module-home`;
Flags, Kanji and Vocabulary retain separate page logic and controls.
Stats modules use 1/2/4 columns (mobile/tablet/desktop >=1200px); skills stay at
1/2 columns to avoid narrow cards. Weaknesses uses 1/2 columns (>=800px).
All new styles use existing tokens, focus indicators and 44px header targets.

## Routes and titles

`navigation-audit.ts` documents the entry points of all 49 public routed screens.
Its test loads child route definitions without loading page components and compares
all non-redirect screens against the registry. New screens require a reviewed entry
point, including programmatic session actions. Redirect aliases/wildcards are exempt.
Dynamic paths require an existing topic, deck or volume; Auth and remote upload also
accept external callbacks/deep-links. This explicit registry is not a template parser.
`LocalizedTitleStrategy` uses lightweight route `titleKey` metadata and updates the
current title on language changes: `<existing translated screen label> · Kana Study`.
Existing safe `return` handling and fixed module back links remain unchanged.

## Verification and Playwright

`npm run test:e2e` launches an isolated dev server on 127.0.0.1:4400 and runs Chromium
at 1280/390/320px. It covers Kana selection/Writing/RUSH, Vocabulary Writing/Listening,
Kanji catalog, Grammar roadmap/topic/lesson/practice, More tools/Settings, Manga guide
and Auth access without a backend. It checks titles, overflow and all five themes.
Install the local browser with `npx playwright install chromium` if needed.
Traces and reports are ignored. No backend, manga import or model inference is used.
Configuration follows https://playwright.dev/docs/test-webserver and
https://playwright.dev/docs/test-projects. This is a smoke suite, not pixel snapshots
or a full WCAG/browser compatibility audit; Safari is not exercised by this suite.

## Build budgets (production, decimal kB)

| Warning | Before final correction | After | Limit |
| --- | ---: | ---: | ---: |
| Initial bundle | 1055.68 kB | 627.91 kB | 750 kB |
| Grammar roadmap SCSS | 11.20 kB | 10.93 kB | 8 kB |
| Grammar practice SCSS | 8.60 kB | 8.36 kB | 8 kB |
| Grammar lesson SCSS | 9.02 kB | 8.62 kB | 8 kB |
| Grammar page SCSS | 11.00 kB | 11.00 kB | 8 kB |

Initial estimated transfer drops from 217.67 to 154.22 kB. Core UI translations
remain synchronous; the full translated Grammar catalog is a separate lazy chunk
(1.14 MB raw / 146.58 kB estimated transfer) loaded by Grammar, Weaknesses and Stats
route resolvers. All three feature languages load together, so later language
switches need no network. Production stats confirm this catalog is absent from the
initial import graph. No budgets were raised; only the four specialized Grammar
SCSS warnings remain. Further restructuring is deferred to preserve presentation.

## Vocabulary audio

606 production MP3 assets total 7,261,704 bytes (~7.26 MB). Angular copies these
static files; production build stats contain zero MP3 JavaScript inputs. The manifest
contains paths only. JapaneseAudioService creates Audio only in `play(id)` and assigns
only that requested URL; availability/resolve calls never preload the catalog.
Unit and browser tests verify this. No audio code or assets were changed.


## Final audit corrections (October 2026)

Recovery validates and submits `newPassword`, retains the error on failure and shows
success after returning to login. Chromium exercises this with a simulated backend;
no real accounts or password requests are used in tests.

Kana, Vocabulary and Kanji validate persisted progress and review events before
consumption. Null, arrays, invalid identities/types, malformed FSRS state and dates
are ignored in memory; valid records remain available. Legacy `learningSteps` is
normalized to zero. Reading never overwrites the original storage or removes
unrelated data. This does not change scheduling or FSRS calculations.

Flags selection/countries/medals use `/flags` when a fresh deep link has no previous
Angular navigation. Vocabulary start and Kanji detail share a small native focus
boundary with initial focus, Tab wrapping, Escape and opener focus restoration.
Settings accepts a validated local `return` URL; More preserves its `from` context.

More prioritizes Weaknesses and Statistics, lists available modules next and puts
Settings in a separate final section. Extras remains defined but is hidden.
The Anki description refers to studying available decks rather than creating decks.

Listening skips isolated unusable audio without recording weakness penalties,
but pauses after three consecutive failures. It retains the current question for
retry and offers configuration and exit. Successful playback resets the failure
streak. A zero-answer exhausted pool shows recovery rather than a misleading
completion. Missing Manga volumes show the existing error and library link without
a page toolbar or `1 / 0` controls.

Failed user storage writes/removals show one dismissible, translated status notice.
Read fallbacks and initial settings normalization stay silent. No saved content is
cleared to handle these errors. The notice does not claim that a failed save worked.

Grammar copy is translated in EN/CA across all pedagogical namespaces. The i18n
build gate checks keys, HTML, placeholders, Japanese examples, copied Spanish prose
and known Spanish markers. Shared linguistic labels, romaji and genuinely identical
Catalan wording have an explicit language-specific reviewed allowlist in
`scripts/grammar-i18n-shared.json`. This is a regression guard, not a claim that a
heuristic can prove every future translation linguistically perfect. The generator
preserves authored EN/CA translations when regenerating the Spanish course.

Grammar SCSS replaces 31 solid-color gradients with the same surface token and
makes lesson/practice return controls 44 px. Existing specialized layout remains.
No build budget is increased. The final measurements below supersede the earlier
consolidation baseline. Vocabulary audio remains untouched and on demand.

The correction suite runs behavioral recovery/progress/Flags/modal/audio/Manga tests
on Chromium desktop once. More layout runs at 320, 390 and 1280 px. Existing viewport,
all-five-theme and navigation smoke tests remain in place. Safari is not executed;
no full accessibility audit or real Supabase recovery test is claimed.


### Final validation results

- 1,029 Angular tests in 115 files pass (52 additional tests).
- 60 Node tests pass, including translation structure/residual guards and audio assets.
- TypeScript app/spec pass; production build passes with the four SCSS warnings above.
- Route audit covers all 48 public screens with localized titles and no orphan routes.
- Playwright Chromium: 35 passed, 16 deliberately skipped duplicate viewport cases;
  320/390/1280 px, all five themes and targeted correction flows pass.
- Reviewed untranslated Spanish copies: EN 3,599 → 0; CA 3,502 → 0. This excludes
  the explicit reviewed shared terminology/romaji/genuinely identical Catalan wording.
- Regenerating the Grammar course changes zero ES/EN/CA values; 542 exercises,
  131 concepts and 72 pedagogical sessions are retained.

Two pre-existing source gloss inconsistencies were noticed during translation and
retained because this task does not rewrite pedagogy: `grammar.expansion.02.2-exp-2.prompt`
includes an unused かばん gloss in its quiet-room exercise, and
`grammar.expansion.02.3-exp-2.prompt` explains しずか although the prompt uses きれい.
Their Japanese and exercise behavior were not changed.
