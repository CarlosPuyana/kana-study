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

| Warning | Before | After | Limit |
| --- | ---: | ---: | ---: |
| Initial bundle | 1126.15 kB | 1055.68 kB | 750 kB |
| Grammar roadmap SCSS | 11.20 kB | 11.20 kB | 8 kB |
| Grammar practice SCSS | 8.60 kB | 8.60 kB | 8 kB |
| Grammar lesson SCSS | 9.02 kB | 9.02 kB | 8 kB |
| Grammar page SCSS | 11.00 kB | 11.00 kB | 8 kB |

Settings, Learn, Cards, Selection, Medals and More now load lazily. The repeated
module-home CSS is emitted once rather than in three component styles. Budgets
are unchanged. Production stats attribute ~653 kB of the remaining initial shared
chunk to the three eager translation dictionaries (including Grammar content).
Moving those dictionaries to async feature/language loading would change the current
synchronous translation contract and is deferred. Grammar warnings come from its
existing roadmap, practice and lesson presentation, not audio or duplicated module
homes; splitting/restructuring that specialized styling is outside this consolidation.

## Vocabulary audio

606 production MP3 assets total 7,261,704 bytes (~7.26 MB). Angular copies these
static files; production build stats contain zero MP3 JavaScript inputs. The manifest
contains paths only. JapaneseAudioService creates Audio only in `play(id)` and assigns
only that requested URL; availability/resolve calls never preload the catalog.
Unit and browser tests verify this. No audio code or assets were changed.
