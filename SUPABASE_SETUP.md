# Supabase setup

Kana Study remains local-first. Without this configuration, every study module continues to work as Guest and writes only to the browser.

## 1. Create the project

Create a Supabase project. Never place a `service_role`, secret key, or Admin API credential in this repository or browser application.

## 2. Run the migration

Open **SQL Editor**, paste and execute `supabase/migrations/202609300001_local_first_accounts.sql`. This creates the profile, progress, event, session, medal, deck, RUSH and preference tables, their indexes, timestamp/merge triggers, and owner-only RLS policies.

After the initial migration, execute `supabase/migrations/202610040002_profile_leaderboard.sql` to enable Profile's leaderboard. The application calls `get_leaderboard_v1()` only when Classification is opened; Refresh synchronizes local activity before reloading it. This migration must be applied separately by the project operator; it is not run automatically by the frontend.

The leaderboard shares only display name, username, synchronized study seconds and medal count with authenticated users, plus ranking position and a current-user flag. It exposes no UUIDs, emails, bios, private dates, progress or activity payloads. Its narrowly scoped `SECURITY DEFINER` function uses an empty search path and fully qualified table names; only `authenticated` can execute it. Existing owner-only RLS policies and table permissions remain unchanged.

Study time sums completed-session `durationSeconds`, rounded total deck `elapsedAnswerMs / 1000`, and RUSH `active_seconds` for finished sessions with at least one completed card. Invalid or negative JSON durations contribute zero. Profiles without activity remain in the ranking with zero time; equal times share a position, ordered by username within ties. Medal count includes normal and RUSH unlocks. No activity beyond the existing synchronized records is counted.

## 3. Obtain the public browser values

In **Project Settings → API**, copy:

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

In **Authentication → URL Configuration**, set:

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
