# Persistence and workspace architecture

## Browser inventory

Guest uses the historical keys unchanged. Authenticated workspaces prefix the same key with `kana-study.workspace.<user-id>.`.

`localStorage` stores app settings and Kana selection (`kana-study.settings.v1`); normal progress and review events for Kana, Flags, Kanji and Vocabulary; completed sessions; normal/RUSH medal unlocks; module selection settings; RUSH settings; and deck settings. `kana-study.device-id.v1`, active workspace, import decisions and migration markers are installation metadata and are not study data.

IndexedDB database `kana-study-decks` contains `card-progress`, `review-events` and `daily-state`. Database `kana-study-rush` contains `sessions` and `coverage`. Guest keeps those names. A user workspace uses `<database>--<user-id>`. Database `kana-study-sync` contains `outbox`, `sync-meta` and `workspace-meta`.

## Legacy migration

Existing unscoped keys and the two original databases are mapped atomically to Guest. No original data is deleted or renamed. The migration marker is idempotent. Choosing **Merge and sync** copies Guest data to previously empty user keys/databases, keeps Guest untouched, then queues cloud synchronization. Choosing **Use my account** leaves Guest untouched and activates the isolated user workspace.

## Merge rules

- Review events, completed sessions and completed RUSH sessions: union by stable ID.
- Medals, RUSH coverage and introduced deck entries: set union; earliest timestamp wins where applicable.
- Preferences, profile, selection and deck settings: server `updated_at` last-write-wins.
- Normal and deck FSRS state: snapshot with the newest pedagogical review timestamp. Event logs remain a union. No speculative FSRS replay is performed.
- Static Kana, Kanji, Vocabulary, Flags and deck datasets are never synchronized.

Every study change commits locally before an outbox operation is created. Failed or unavailable cloud requests leave the local action valid and retryable.
