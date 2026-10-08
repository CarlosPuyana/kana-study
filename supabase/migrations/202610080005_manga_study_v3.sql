-- Apply after 202610080004_completed_sessions_grammar.sql.
-- Only extend module CHECKs. Saved-word RPCs, RLS and historical data are unchanged.
begin;
alter table public.completed_sessions drop constraint completed_sessions_module_check;
alter table public.completed_sessions add constraint completed_sessions_module_check
  check (module in ('kana', 'flags', 'kanji', 'vocabulary', 'grammar', 'manga'));
alter table public.review_events drop constraint review_events_module_check;
alter table public.review_events add constraint review_events_module_check
  check (module in ('kana', 'flags', 'kanji', 'vocabulary', 'manga'));
commit;
