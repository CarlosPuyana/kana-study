-- Grammar V2 uses its own module in completed-session summaries.
-- Replace only the module CHECK; existing rows and all other table objects remain.
begin;

alter table public.completed_sessions
  drop constraint completed_sessions_module_check;

alter table public.completed_sessions
  add constraint completed_sessions_module_check
  check (module in ('kana', 'flags', 'kanji', 'vocabulary', 'grammar'));

commit;
