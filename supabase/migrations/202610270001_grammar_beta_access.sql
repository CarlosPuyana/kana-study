-- No initial grants. Only a trusted administrator may authorize accounts.
begin;
create table public.grammar_beta_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.grammar_beta_access enable row level security;
revoke all on table public.grammar_beta_access from public, anon, authenticated;
grant select (user_id, enabled, created_at, updated_at) on public.grammar_beta_access to authenticated;
create policy grammar_beta_read_own on public.grammar_beta_access for select to authenticated
  using ((select auth.uid()) = user_id);
commit;
