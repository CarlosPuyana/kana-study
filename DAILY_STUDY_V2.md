# Daily Study V2

Daily Study is a read-only projection of existing local data, not a new source of
progress. `/daily` is lazy-loaded and Home keeps its original Kana learning button.
The page offers 5/15/30-minute budgets, respectively at most 1/3/4 activities.
These are product activity budgets, not predicted durations, learning efficacy
scores or recorded study time. Existing sessions keep their own stop/continue controls.

## Sources and planning

`DailyStudyPlannerService` reads validated service state into an explicit snapshot
containing workspace, actual instant, Madrid study day and module-specific facts.
`planDailyStudy` is pure: it constructs candidates, orders them, and separates the
recommendations, other available activities, blocked/future content and actual
activity evidence. It never initializes a session or changes selections.

Priority: due FSRS work; resolvable active-content weaknesses; pending Grammar
lessons/active difficulties; eligible normal learning; new deck/Manga content and
voluntary practice. Counts are explanatory, not cross-module scores. Within a
priority, take one activity per module before repeating a module. Stable order:
Kana, Kanji, Vocabulary, Anki, Manga, Grammar; then stable activity identifiers.
There is no randomness, parallel FSRS calendar or invented Grammar/Weakness due date.

- Kana/Kanji/Vocabulary: active units and their actual FSRS due instants or absence
  of stored progress, exactly as the existing round builders distinguish due/new.
  `DailyLearningService.isCompletedToday` retains the normal daily lock. Future-only
  selections have no start action. A completed normal session may still leave work
  pending; voluntary writing and applicable weakness practice remain accessible.
- Grammar: actual V2 concepts with existing lesson adapters, solved-answer-based
  completion, active difficulties, and `GrammarProgressService.continuePath`.
  Completed concepts with active difficulties lead to existing Grammar review;
  integration continuation takes priority over pending optional bridge lessons.
  No opening/visit is
  counted as completion or as an answer, including Manga Grammar consultation.
- Weakness: service records resolved against active units, exact question direction,
  item ID and module/activity. Listening additionally requires existing audio;
  Grammar additionally requires compatible existing exercises. Grouped buttons keep
  individual identities in their evidence. Learn links to the original Weakness
  page; writing/listening/Grammar use their existing practice routes. Their original
  practice selection rules remain unchanged. Resolved records can still show today's
  last attempt, without being recommended as active weaknesses. Weakness is local-only.
- Anki: `DeckStudyService.snapshot` with the existing real index, due Learning/
  Relearning/Review cards, effective new limit, daily completion and deck settings.
  Reads also use actual review events. No `completeSession`, rating, daily-state
  write or new-limit adjustment is called by planning. Existing deck study owns its
  internal queue priority; Daily does not reorder cards.
- Manga: existing opt-in and eligible replayed FSRS cards, actual due timestamps,
  genuinely new cards and validated FSRS events. Free V3 reviews are excluded from
  FSRS completion evidence. Existing session summaries plus matching FSRS session
  IDs identify completed sessions; isolated events show practice, not completion.

## Evidence and navigation

Normal/session evidence is deduplicated by module and `sessionId`, excludes future
or zero-exercise summaries, and uses Europe/Madrid. Grammar answer/completion
records and Anki daily state/events remain distinct evidence types. Performed
records are not a summed answer/time metric: they can describe the same learning
work from a session and its module records. Weakness exposes today's last recorded
attempt, not an invented session or an inferred count of today's historical attempts.
No percentages of mastery or a fake checklist completion are shown. Clicking a
recommendation, returning to Daily or visiting Grammar does not finish a task.

Kana/Kanji/Vocabulary open their original start panels inside Daily, including
sync-before-initialization and module eligibility checks. Session pages are never
opened without initialization. Existing links serve Grammar, Anki, Manga FSRS and
weakness practices. Daily can be reached again through Home; it does not change
the existing modules' exit/return flow. A modal focus boundary adds Tab/Escape and
focus restoration without changing the panels' session logic.

## Lifecycle and isolation

The reader is page-scoped. Data signals, local/remote revisions, completed sessions,
Grammar answers, weaknesses, settings, saved Manga items and opt-in changes update
the projection. Deck reads refresh on entry, focus, visibility recovery, relevant
revisions and successful sync. Each async batch carries workspace and generation;
old Guest/A/B results cannot overwrite a newer batch. An account change immediately
returns a neutral snapshot before reading the new account and closes start panels.

Time is a reactive signal. One timeout targets the earliest actual future card due
instant or the next Madrid day boundary. The boundary is computed from the timezone,
including 23/25-hour DST days, not by adding 24 hours. There is no new periodic
IndexedDB polling. Focus/visibility handles sleep, clock changes and returning to
the tab. Offline uses local data and explicitly does not claim remote freshness.
IndexedDB errors show a retry and leave usable module data available.

There is no new table, RPC, event, outbox, cache, persisted duration or planner
history. Existing FSRS, sync recovery, Grammar, Weakness, Manga and learning engines
are unchanged. Schema creation by an existing IndexedDB reader is not progress.

## Validation and remaining manual checks

Tests cover pure determinism, priorities/balance/budgets, duplicates, empty/disabled
selections, future cards, daily locks, voluntary practice, exact weakness identity,
real Anki reads, Manga opt-in, evidence states, Grammar consultation, remote updates,
Guest/A/B async races, focus/offline, Madrid boundaries/DST, page translations and
sync-before-start. A regression executes ten unchanged actual SyncService cycles
with the planner instantiated and asserts no derived writes or enqueues.
Playwright covers Home access, read-only consultation, 5/15/30, offline, all languages
and themes at desktop/390/320, original panels, keyboard, real Kana completion and
reload. Existing module regressions are run separately and in the full suite.

Physical Android and iOS Safari still need checking for keyboard/scroll/focus,
background resume across midnight and switching accounts while offline. On PC,
check keyboard-only navigation, sleep/resume, account changes during a slow pull,
and returning from real deck/Manga sessions. Recommendations may differ by device
when local-only weaknesses or unsynced data differ. Large modules do not yield exact
session duration estimates, and the plan does not promise that a chosen session fits
the selected budget. Available module activities can be reordered as real work changes;
there is no persisted daily checklist to freeze outdated recommendations.
