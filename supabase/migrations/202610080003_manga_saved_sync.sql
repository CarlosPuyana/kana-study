begin;

-- Lightweight schema V1 only. Additional dictionary/catalog/blob fields are rejected.
create function public.valid_manga_saved_payload_v1(p jsonb, item_id text)
returns boolean language plpgsql immutable set search_path='' as $$
declare k text; lim integer;
begin
  if p is null or jsonb_typeof(p)<>'object' or octet_length(p::text)>65536
    or octet_length(item_id) not between 1 and 19218
    or p->'schemaVersion'<>'1'::jsonb or p->>'id' is distinct from item_id
    or jsonb_typeof(p->'expression')<>'string' or char_length(p->>'expression') not between 1 and 1600
    or jsonb_typeof(p->'kanji')<>'array' or jsonb_array_length(p->'kanji')>64
    or jsonb_typeof(p->'source')<>'object' or jsonb_typeof(p->'createdAt')<>'number'
    or jsonb_typeof(p#>'{source,volumeId}')<>'string' or char_length(p#>>'{source,volumeId}') not between 1 and 1024
    or jsonb_typeof(p#>'{source,pageNumber}')<>'number'
    or (p#>>'{source,pageNumber}')::numeric<1
    or (p#>>'{source,pageNumber}')::numeric>9007199254740991
    or trunc((p#>>'{source,pageNumber}')::numeric)<>(p#>>'{source,pageNumber}')::numeric
    or abs((p->>'createdAt')::numeric)>9007199254740991
    or trunc((p->>'createdAt')::numeric)<>(p->>'createdAt')::numeric
    then return false; end if;
  if not p ?& array['schemaVersion','id','expression','kanji','source','createdAt'] then return false; end if;
  if not (p->'source') ?& array['volumeId','pageNumber'] then return false; end if;
  if exists(select 1 from jsonb_object_keys(p) key where key<>all(array['schemaVersion','id','expression','reading','baseForm','vocabularyId','kanji','meaning','surface','context','source','createdAt']))
    or exists(select 1 from jsonb_object_keys(p->'source') key where key<>all(array['volumeId','pageNumber','volumeTitle']))
    or exists(select 1 from jsonb_array_elements(p->'kanji') v where jsonb_typeof(v)<>'string' or char_length(v#>>'{}')>64)
    then return false; end if;
  foreach k in array array['reading','baseForm','vocabularyId','meaning','surface','context'] loop
    lim:=case k when 'vocabularyId' then 256 when 'meaning' then 300 when 'surface' then 160 when 'context' then 1200 else 1600 end;
    if p ? k and (jsonb_typeof(p->k)<>'string' or char_length(p->>k)>lim) then return false; end if;
  end loop;
  if (p->'source') ? 'volumeTitle' and (jsonb_typeof(p#>'{source,volumeTitle}')<>'string' or char_length(p#>>'{source,volumeTitle}')>160) then return false; end if;
  return true;
exception when others then return false;
end;
$$;

-- Fixed UTF-8 conversion is deterministic within this database. The digest keeps
-- long, escaped dictionary IDs out of PostgreSQL's limited-size B-tree keys.
create function public.manga_saved_item_key_v1(item_id text)
returns bytea language sql immutable strict set search_path='' as $$
  select pg_catalog.sha256(pg_catalog.convert_to(item_id,'UTF8'));
$$;

create table public.manga_saved_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null check(octet_length(item_id) between 1 and 19218),
  item_key bytea generated always as (public.manga_saved_item_key_v1(item_id)) stored,
  payload jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision bigint not null default 0 check(revision>=0),
  restored_revision bigint not null default 0 check(restored_revision>=0 and restored_revision<=revision),
  last_operation text,
  primary key(user_id,item_key),
  check(deleted_at is not null or public.valid_manga_saved_payload_v1(payload,item_id))
);
-- The compound primary key indexes each user's collection; item_id remains the
-- stable logical identity and full lists are sorted by it, without a text B-tree.
alter table public.manga_saved_items enable row level security;
create policy manga_saved_select on public.manga_saved_items for select to authenticated using(user_id=(select auth.uid()));
create policy manga_saved_insert on public.manga_saved_items for insert to authenticated with check(user_id=(select auth.uid()));
create policy manga_saved_update on public.manga_saved_items for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy manga_saved_delete on public.manga_saved_items for delete to authenticated using(user_id=(select auth.uid()));
revoke all on public.manga_saved_items from public,anon,authenticated;
grant select on public.manga_saved_items to authenticated;
-- Writes must go through the owner-scoped RPC below, never an unconditional REST upsert/delete.

create function public.apply_manga_saved_change_v1(
  p_item_id text,p_expected_revision bigint,p_operation text,p_payload jsonb,p_delete boolean,p_initial boolean default false
) returns setof public.manga_saved_items
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); r public.manga_saved_items;
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_expected_revision is null or p_expected_revision<0 or p_operation is null or char_length(p_operation) not between 1 and 128
    or p_delete is null or p_initial is null or p_item_id is null or octet_length(p_item_id) not between 1 and 19218
    then raise exception 'Invalid Manga operation' using errcode='22023'; end if;
  if not p_delete and not public.valid_manga_saved_payload_v1(p_payload,p_item_id)
    then raise exception 'Invalid Manga payload' using errcode='22023'; end if;
  -- Serialize even two first writes to an absent row. The placeholder is never committed externally.
  insert into public.manga_saved_items(user_id,item_id,deleted_at)
    values(uid,p_item_id,now()) on conflict(user_id,item_key) do nothing;
  select * into r from public.manga_saved_items where user_id=uid and item_id=p_item_id for update;
  if r.last_operation=p_operation then return next r; return; end if;
  if p_delete then
    -- Deletion wins against concurrent initial saves, but not a later explicit restoration.
    if r.revision>0 and (r.deleted_at is not null or p_expected_revision<r.restored_revision or p_expected_revision>r.revision)
      then return next r; return; end if;
    update public.manga_saved_items set payload=null,deleted_at=now(),updated_at=now(),revision=r.revision+1,last_operation=p_operation
      where user_id=uid and item_id=p_item_id returning * into r;
  elsif r.revision=0 or (not p_initial and r.deleted_at is not null and p_expected_revision=r.revision) then
    update public.manga_saved_items set payload=p_payload,deleted_at=null,updated_at=now(),revision=r.revision+1,
      restored_revision=case when r.revision>0 then r.revision+1 else 0 end,last_operation=p_operation
      where user_id=uid and item_id=p_item_id returning * into r;
  end if;
  -- Active duplicates retain the first server-confirmed context. Stale saves retain the tombstone.
  return next r;
end;
$$;
revoke all on function public.valid_manga_saved_payload_v1(jsonb,text) from public,anon,authenticated;
revoke all on function public.manga_saved_item_key_v1(text) from public,anon,authenticated;
revoke all on function public.apply_manga_saved_change_v1(text,bigint,text,jsonb,boolean,boolean) from public,anon;
grant execute on function public.apply_manga_saved_change_v1(text,bigint,text,jsonb,boolean,boolean) to authenticated;
commit;
