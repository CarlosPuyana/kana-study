# Manga Study V4: scheduled recall

`/manga/study/fsrs` is opt-in, off by default, per workspace. The preference
`kana-study.manga-fsrs-settings.v1` uses the existing user_preferences transport.
Disabling it retains cards and reviews. Merge Guest unions review/session IDs and
copies the preference only if the account has no choice; Use my account leaves
Guest data separate. Anki has independent review IDs, storage and card state.

There is one derived card per savedItemId. New cards do not inherit V3 attempts.
The free V3 route stays available and its selection ignores FSRS reviews.
Only words with validated meaning or reading evidence qualify. Original context
and inflected surfaces are displayed as text, never interpreted as HTML.

## Scheduler and immutable event contract

The V1 contract uses ts-fsrs 5.4.2, FSRS-6.0, retention 0.90, maximum interval
36500 days, short-term scheduling enabled, learning steps 1m/10m, relearning
10m, fuzz disabled. The 21 FSRS-6 weights are frozen in manga-fsrs-scheduler.ts.
No intervals are invented or overridden; Anki's special initial one-day
graduation is not used. Future algorithm/parameter changes need a new event
version and a compatible replay implementation.

After revealing, the only choices are Again (Rating.Again = 1) and Good
(Rating.Good = 3), using Anki's two-choice rating type and shared card
serialization. Hard/Easy are neither accepted nor offered for Manga.

New events extend the existing Manga payload with reviewKind='fsrs',
fsrsVersion=1 and fsrsGrade=1|3. They retain logical id, savedItemId, sessionId,
UTC reviewedAt, key, rating='again'|'good', correct, repetition=false and
answerMode='self-assessment'. No historical payload is rewritten. Invalid or
unknown-version events are retained in history but not scheduled by V1.

Replay deduplicates IDs and sorts by parsed UTC time, then ordinal ID. This
order is independent of arrival order, browser locale and current time.
Equal-time concurrent reviews both count. Clock skew is handled by the same
stable chronological order; timestamps are not rewritten or clamped to the
current wall clock, so future-dated reviews can postpone due dates. Offline
reviews can arrive earlier than the merged schedule would have allowed;
they are still retained and replayed. Device clocks should be accurate.
Local dates are used only to present the resulting due date.
Replay is pure: no storage writes, queue operations, timers, sync calls or
saved-item mutation. Deleted words disappear from the queue, not history;
only an explicit restore of the saved word brings back its previous schedule.

## Sessions, durability and synchronization

Sessions select up to 10 overdue words, followed by 5 New words. A word occurs
once per session; there is no V3 fixed-error repetition and no early insertion.
Remaining words that are removed or become ineligible/not due are skipped.

Reveal commits at most 10 seconds for that appearance and pauses StudyClock.
Rating and results never accrue time. Completion records one module=manga
summary with mangaSessionKind='fsrs'; rating events add no study seconds.
Abandonment saves completed ratings but does not create a completed session.

Each event is stored before advancing. A failed write/enqueue retains the same
pending ID/payload for retry; repeated clicks are guarded. Completion retry
retains its session ID and timestamp. Workspace changes cancel the active flow.
Guest reviews are durable offline. Account reviews use the unchanged Manga
review_events channel, qualified transport IDs and immutable ID union on pull.
Recovery still compares local IDs with the existing full pull after ACK cleanup;
it never recreates confirmed history. Outbox revision/ACK protection is unchanged.

No migration is needed beyond the existing 202610080005_manga_study_v3.sql.
The existing manga module CHECKs and jsonb payloads admit these fields; owner
RLS, session timestamps, leaderboard time, Saved tombstones and RPCs are unchanged.

Tests cover two simulated browser caches, offline union, skew/equal-date replay,
ten idle sync cycles, capped time, failures, account/Guest import, both allowed
grades, and Playwright desktop/390px/320px with all five themes. These simulations
do not establish validation on physical iOS Safari or Android devices.
