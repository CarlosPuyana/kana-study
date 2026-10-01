begin;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_-]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  bio text check (bio is null or char_length(bio) <= 240),
  avatar_seed text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_username_lower_key on public.profiles (lower(username));

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare normalized_username text;
begin
  normalized_username := lower(coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)));
  insert into public.profiles (id, username, display_name, avatar_seed)
  values (
    new.id,
    normalized_username,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), normalized_username),
    coalesce(new.raw_user_meta_data ->> 'avatar_seed', normalized_username)
  );
  return new;
end;
$$;
create trigger auth_user_profile after insert on auth.users for each row execute function public.create_profile_for_new_user();

create table public.study_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (module in ('kana','flags','kanji','vocabulary')),
  unit_key text not null,
  card_json jsonb not null,
  last_review_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (user_id, module, unit_key)
);
create table public.review_events (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (module in ('kana','flags','kanji','vocabulary')), unit_key text not null,
  reviewed_at timestamptz not null, rating text not null, payload jsonb not null, device_id text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.completed_sessions (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (module in ('kana','flags','kanji','vocabulary')),
  completed_at timestamptz not null, spain_day date not null, payload jsonb not null, device_id text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.medal_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade, medal_id text not null,
  module_category text not null, unlocked_at timestamptz not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (user_id, medal_id)
);
create table public.deck_card_progress (
  user_id uuid not null references auth.users(id) on delete cascade, deck_id text not null, entry_id text not null,
  card_json jsonb not null, last_review_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (user_id, deck_id, entry_id)
);
create table public.deck_review_events (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  deck_id text not null, entry_id text not null, reviewed_at timestamptz not null,
  payload jsonb not null, device_id text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.deck_daily_state (
  user_id uuid not null references auth.users(id) on delete cascade, deck_id text not null, local_day date not null,
  introduced_entry_ids text[] not null default '{}', new_limit_override integer check (new_limit_override is null or new_limit_override >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (user_id, deck_id, local_day)
);
create table public.deck_settings (
  user_id uuid not null references auth.users(id) on delete cascade, deck_id text not null, payload jsonb not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (user_id, deck_id)
);
create table public.rush_sessions (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (module in ('kana','kanji','vocabulary')), started_at timestamptz not null, ended_at timestamptz,
  active_seconds integer not null, cards_completed integer not null, unique_contents_seen integer not null,
  cycles_completed integer not null, initial_unit_count integer not null, local_day date not null, interrupted boolean not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.rush_coverage (
  user_id uuid not null references auth.users(id) on delete cascade, module text not null check (module in ('kana','kanji','vocabulary')),
  content_id text not null, first_seen_at timestamptz not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (user_id, module, content_id)
);
create table public.user_preferences (
  user_id uuid not null references auth.users(id) on delete cascade, preference_key text not null, payload jsonb not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (user_id, preference_key)
);

create or replace function public.keep_earliest_medal_unlock() returns trigger language plpgsql as $$
begin new.unlocked_at = least(old.unlocked_at, new.unlocked_at); return new; end; $$;
create trigger medal_earliest before update on public.medal_unlocks for each row execute function public.keep_earliest_medal_unlock();
create or replace function public.merge_rush_coverage() returns trigger language plpgsql as $$
begin new.first_seen_at = least(old.first_seen_at, new.first_seen_at); return new; end; $$;
create trigger coverage_union before update on public.rush_coverage for each row execute function public.merge_rush_coverage();
create or replace function public.merge_deck_introductions() returns trigger language plpgsql as $$
begin
  new.introduced_entry_ids = array(select distinct value from unnest(old.introduced_entry_ids || new.introduced_entry_ids) value);
  return new;
end; $$;
create trigger deck_introductions_union before update on public.deck_daily_state for each row execute function public.merge_deck_introductions();
create or replace function public.keep_newest_study_snapshot() returns trigger language plpgsql as $$
begin
  if old.last_review_at is not null and (new.last_review_at is null or old.last_review_at > new.last_review_at) then
    new.card_json = old.card_json; new.last_review_at = old.last_review_at;
  end if;
  return new;
end; $$;
create trigger study_snapshot_latest before update on public.study_progress for each row execute function public.keep_newest_study_snapshot();
create trigger deck_snapshot_latest before update on public.deck_card_progress for each row execute function public.keep_newest_study_snapshot();

do $$ declare table_name text; begin
  foreach table_name in array array['profiles','study_progress','review_events','completed_sessions','medal_unlocks','deck_card_progress','deck_review_events','deck_daily_state','deck_settings','rush_sessions','rush_coverage','user_preferences'] loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

create index study_progress_user_updated_idx on public.study_progress(user_id, updated_at);
create index study_progress_module_idx on public.study_progress(user_id, module);
create index review_events_user_reviewed_idx on public.review_events(user_id, reviewed_at);
create index review_events_module_idx on public.review_events(user_id, module);
create index completed_sessions_user_completed_idx on public.completed_sessions(user_id, completed_at);
create index completed_sessions_daily_idx on public.completed_sessions(user_id, module, spain_day);
create index medal_unlocks_user_updated_idx on public.medal_unlocks(user_id, updated_at);
create index deck_card_progress_user_deck_idx on public.deck_card_progress(user_id, deck_id);
create index deck_review_events_user_reviewed_idx on public.deck_review_events(user_id, reviewed_at);
create index deck_review_events_deck_idx on public.deck_review_events(user_id, deck_id);
create index deck_daily_state_user_updated_idx on public.deck_daily_state(user_id, updated_at);
create index deck_settings_user_updated_idx on public.deck_settings(user_id, updated_at);
create index rush_sessions_user_updated_idx on public.rush_sessions(user_id, updated_at);
create index rush_coverage_user_updated_idx on public.rush_coverage(user_id, updated_at);
create index user_preferences_user_updated_idx on public.user_preferences(user_id, updated_at);

alter table public.profiles enable row level security;
alter table public.study_progress enable row level security;
alter table public.review_events enable row level security;
alter table public.completed_sessions enable row level security;
alter table public.medal_unlocks enable row level security;
alter table public.deck_card_progress enable row level security;
alter table public.deck_review_events enable row level security;
alter table public.deck_daily_state enable row level security;
alter table public.deck_settings enable row level security;
alter table public.rush_sessions enable row level security;
alter table public.rush_coverage enable row level security;
alter table public.user_preferences enable row level security;

do $$ declare table_name text; owner_column text; begin
  foreach table_name in array array['profiles','study_progress','review_events','completed_sessions','medal_unlocks','deck_card_progress','deck_review_events','deck_daily_state','deck_settings','rush_sessions','rush_coverage','user_preferences'] loop
    owner_column := case when table_name = 'profiles' then 'id' else 'user_id' end;
    execute format('create policy %I_select_own on public.%I for select to authenticated using ((select auth.uid()) = %I)', table_name, table_name, owner_column);
    execute format('create policy %I_insert_own on public.%I for insert to authenticated with check ((select auth.uid()) = %I)', table_name, table_name, owner_column);
    execute format('create policy %I_update_own on public.%I for update to authenticated using ((select auth.uid()) = %I) with check ((select auth.uid()) = %I)', table_name, table_name, owner_column, owner_column);
    execute format('create policy %I_delete_own on public.%I for delete to authenticated using ((select auth.uid()) = %I)', table_name, table_name, owner_column);
  end loop;
end $$;

-- Data API privileges.
-- Guest/anon does not use cloud persistence.
grant usage on schema public to authenticated;

revoke all on table
  public.profiles,
  public.study_progress,
  public.review_events,
  public.completed_sessions,
  public.medal_unlocks,
  public.deck_card_progress,
  public.deck_review_events,
  public.deck_daily_state,
  public.deck_settings,
  public.rush_sessions,
  public.rush_coverage,
  public.user_preferences
from public, anon;

grant select, insert, update, delete on table
  public.profiles,
  public.study_progress,
  public.review_events,
  public.completed_sessions,
  public.medal_unlocks,
  public.deck_card_progress,
  public.deck_review_events,
  public.deck_daily_state,
  public.deck_settings,
  public.rush_sessions,
  public.rush_coverage,
  public.user_preferences
to authenticated;

-- Trigger invocation does not require callers to have direct EXECUTE privileges.
revoke execute on function
  public.set_updated_at(),
  public.create_profile_for_new_user(),
  public.keep_earliest_medal_unlock(),
  public.merge_rush_coverage(),
  public.merge_deck_introductions(),
  public.keep_newest_study_snapshot()
from public, anon, authenticated;

commit;
