# Supabase setup

Kana Study remains local-first. Without this configuration, every study module continues to work as Guest and writes only to the browser.

## 1. Create the project

Create a Supabase project. Never place a `service_role`, secret key, or Admin API credential in this repository or browser application.

## 2. Run the migration

Open **SQL Editor**, paste and execute `supabase/migrations/202609300001_local_first_accounts.sql`. This creates the profile, progress, event, session, medal, deck, RUSH and preference tables, their indexes, timestamp/merge triggers, and owner-only RLS policies.

After the initial migration, execute `supabase/migrations/202610040002_profile_leaderboard.sql` to enable Profile's leaderboard. The application calls `get_leaderboard_v1()` only when Classification is opened; Refresh synchronizes local activity before reloading it. This migration must be applied separately by the project operator; it is not run automatically by the frontend.

The leaderboard shares only display name, username, synchronized study seconds and medal count with authenticated users, plus ranking position and a current-user flag. It exposes no UUIDs, emails, bios, private dates, progress or activity payloads. Its narrowly scoped `SECURITY DEFINER` function uses an empty search path and fully qualified table names; only `authenticated` can execute it. Existing owner-only RLS policies and table permissions remain unchanged.

Study time sums completed-session `durationSeconds`, rounded total deck `elapsedAnswerMs / 1000`, and RUSH `active_seconds` for finished sessions with at least one completed card. Invalid or negative JSON durations contribute zero. Profiles without activity remain in the ranking with zero time; equal times share a position, ordered by username within ties. Medal count includes normal and RUSH unlocks. No activity beyond the existing synchronized records is counted.

Before synchronizing Grammar sessions, also execute
`supabase/migrations/202610080004_completed_sessions_grammar.sql` manually in the project's SQL Editor.
It extends `completed_sessions_module_check` to accept `grammar` alongside `kana`, `flags`, `kanji`
and `vocabulary`. The replacement is transactional and validates historical rows; sessions, payloads,
durations, indexes, primary keys, timestamps, grants and RLS remain unchanged. Deploying the frontend
does not apply this migration. A missing migration causes PostgreSQL `23514`; preserve pending
operations and retry synchronization after applying it. Session IDs remain stable on retry.

## 3. Obtain the public browser values

In **Project Settings â†’ API**, copy:

- Project URL
- Publishable key (the browser-safe key; older projects may label it `anon`)

Do not use a secret or `service_role` key.

## 4. Configure the application

For local development, edit `public/supabase-config.js`:

```js
window.__KANA_STUDY_CONFIG__ = {
  supabaseUrl: 'https://PROJECT.supabase.co',
  supabasePublishableKey: 'YOUR_PUBLISHABLE_KEY',
};
```

Both values are public browser configuration. Leave them empty to run in Guest-only mode.

For GitHub Pages, create Repository Variables named `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. The deployment workflow writes them into the generated public configuration. Do not create a secret containing `service_role`.

## 5. Configure Site URL

In **Authentication â†’ URL Configuration**, set:

```text
Site URL: https://carlospuyana.github.io/kana-study/
```

## 6. Configure redirect URLs

Add all of these exact redirect patterns:

```text
https://carlospuyana.github.io/kana-study/
https://carlospuyana.github.io/kana-study/?auth=confirm
https://carlospuyana.github.io/kana-study/?auth=recovery
http://localhost:4200/
http://localhost:4200/?auth=confirm
http://localhost:4200/?auth=recovery
```

The recovery callback uses a query parameter before the hash. Angular then opens `#/auth?mode=recovery`; it does not require a server route that GitHub Pages could return as 404.

## 7. Create the first account

Open `#/auth`, choose **Create account**, and supply display name, username, email and password. When email confirmation is enabled, confirm using the received link. The database trigger creates the private profile from signup metadata.

## 8. Validate synchronization

Complete a local study action, open Profile, and select **Sync now**. Confirm that Profile reports Synced and zero pending changes. Sign out to verify Guest data, then sign in on a second browser and synchronize. Static datasets are never uploaded; cloud rows contain stable IDs and progress only.

## Operational notes

- Auth and sync are eventual and never gate local study writes.
- Realtime, PWA/service workers, image uploads and Admin APIs are intentionally absent.
- A daily round completed simultaneously on two offline devices creates two valid completed-session records after sync. Both are preserved.
- Normal FSRS event histories cannot safely reconstruct one deterministic state after concurrent devices because practice attempts are not full FSRS events. V1 unions events and chooses the progress snapshot with the newest `lastSeenAt`; `updated_at` is only a server sync cursor.


## Manga Saved Sync V1 (manual migration)

After `202609300001_local_first_accounts.sql` and `202610040002_profile_leaderboard.sql`, apply
`202610080003_manga_saved_sync.sql` manually in the correct Supabase project's SQL Editor.
GitHub Actions and the Angular deployment do **not** apply SQL. SQL pendiente de aplicar manualmente
until the project operator executes it and verifies RLS with two separate authenticated accounts and an anonymous client.

`manga_saved_items` is a private, lightweight collection keyed by `(user_id,item_id)`. It stores the
schema V1 snapshot, a deletion tombstone, server timestamps, revision, restoration revision and last
operation token. Its physical primary key is `(user_id,item_key)`, where `item_key` is a generated
SHA-256 digest of the original `item_id`; stable IDs are never truncated or replaced. This avoids
PostgreSQL B-tree key-size failures for long dictionary identities. The key indexes each user's rows,
which are sorted by the original `item_id` for pagination. RLS policies scope all four
operations to the owner. Anonymous access is revoked. Authenticated clients can SELECT their own rows;
all writes use `apply_manga_saved_change_v1`, whose narrow SECURITY DEFINER scope derives the owner
from `auth.uid()` (there is no caller-supplied user ID), locks each row and validates the payload.
Direct REST INSERT/UPDATE/DELETE is deliberately denied, so a client cannot bypass version checks or
set timestamps/revisions. No service_role key is used in the browser.

The first sync fetches every remote page before reconciling old local items. Only previously unmigrated
items absent remotely become durable bootstrap operations. Active remote records keep their confirmed
first context; tombstones suppress historical and Guest copies. An empty local collection does not
delete remote rows. Bootstrap state and local intentions live alongside saved-items in an additive
IndexedDB V1-to-V2 migration; saved-items is never rebuilt or cleared during migration.

Deletion wins against stale saves and concurrent initial saves. An explicit save can restore a
confirmed tombstone only with its exact known revision. A stale deletion cannot erase a later explicit
restoration. A stable operation token makes retries idempotent, and the first server-confirmed active
context wins duplicate saves. These rules use server row locking and versions, never device clocks.

Guest stays local. Only the existing explicit Merge and sync decision copies Guest words as initial
incorporations; Guest remains intact and remote tombstones prevail. Use my account imports nothing.
The existing Profile sync status/count includes Manga operations. Offline changes and failed outbox
enqueues remain recoverable in the local journal. Missing table/RPC, network, RLS or transaction errors
preserve local data and show an error/pending state, never a false Synced result. Retry after applying
the migration. Images, pages, dictionaries and files are never uploaded; study time/FSRS are unchanged.

Deployment order: apply SQL, verify RLS/CAS behavior, then deploy the compatible application. Validate
real PC/mobile save, delete, offline, restore and account-switch scenarios separately: automated tests
with simulated cloud devices do not establish real cross-device validation.

Optional local SQL validation (no Supabase credentials): install `@electric-sql/pglite` in a temporary
directory outside this repository, then run `node scripts/test-manga-saved-sql.mjs <absolute-path-to-pglite/dist/index.js>`.
This executes the actual migration and checks payload rejection, both save/delete orders, revision
checks, idempotency, owner isolation and anonymous/direct-write denial. PGlite has one backend;
separate-session row-lock contention must still be verified against PostgreSQL in the target project.

Local and SQL limits: IDs are bounded to 19,218 UTF-8 bytes (the worst JSON-escaped identity for two
1600-unit strings); the projected snapshot is bounded to 65,536 bytes in PostgreSQL `jsonb::text`
format, including escapes, multibyte text and structural spaces. Existing per-field caps remain.
Local validation rejects NUL and unpaired surrogates, which PostgreSQL jsonb cannot represent.
Page numbers and creation timestamps must be safe integers, matching server validation and numeric
serialization. The SQL validation script imports the same local validator and shared boundary fixtures
(requires Node 22.18+ with TypeScript stripping); it checks accepted items through the actual RPC.

## Inspect incomplete synchronization on an existing device

In the authenticated Profile, open **Synchronization diagnostics** and select **Inspect local diagnostics**
after attempting Sync now. This is an opt-in, memory-only snapshot; it is not uploaded or logged.
It reports entity type/category, age, attempts, journal association/revision match, whether a server
response was received, verified remote state and a confirmed operation awaiting outbox cleanup.
The failure identifies the phase and table/RPC plus a safe error code and redacted technical message.
Raw server messages, record IDs, user UUIDs, tokens and private payloads never appear. Unknown remote
state means unverified: a lost response cannot prove whether the server committed until an idempotent
retry. Reloading clears transient confirmation diagnostics; the durable outbox and Manga journal remain.

`pending` means new work remains and another automatic pass is scheduled, not a network failure.
`error` means a concrete phase failed; `offline` means no connection. Successfully verified writes are
removed by matching outbox revision even when another module fails; unverified/replaced operations stay.
A journal-free Manga outbox retry rechecks the durable operation through the RPC before cleanup.
No new SQL migration or browser-data reset is required for this synchronization correction.

On mobile after deployment, save on PC, sync on mobile, delete there, sync both, then verify zero Manga
journals/outbox entries and Synced when all modules succeeded. If two changes remain, inspect their
categories and failure target/code; do not assume they are Manga. Preserve the browser's stored data.
