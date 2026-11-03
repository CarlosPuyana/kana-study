-- Additive. Shared editorial content only; existing private review tables/RLS remain intact.
begin;
create table public.puyi_administrator (
  singleton boolean primary key default true check(singleton),
  user_id uuid not null unique references auth.users(id) on delete cascade
);
alter table public.puyi_administrator enable row level security;
revoke all on public.puyi_administrator from public, anon, authenticated;
-- Exactly one stable verified account; provision only through trusted SQL administration.
create function public.is_puyi_admin() returns boolean language sql stable security definer
set search_path = '' as $$
 select coalesce(auth.role() = 'authenticated' and exists(
   select 1 from public.puyi_administrator where user_id=auth.uid()),false)
$$;
revoke all on function public.is_puyi_admin() from public;
grant execute on function public.is_puyi_admin() to anon, authenticated;

create table public.puyi_media (
  path text primary key check(path ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$'),
  state text not null default 'pending' check(state in ('pending','attached','retired')),
  created_at timestamptz not null default now(),
  author_id uuid not null references auth.users(id)
);
alter table public.puyi_media enable row level security;
revoke all on public.puyi_media from public, anon, authenticated;

create table public.puyi_cards (
  id uuid primary key,
  deck_id text not null default 'mazo-puyi' check(deck_id='mazo-puyi'),
  position bigint generated always as identity unique,
  word text not null check(char_length(btrim(word)) between 1 and 200),
  kana text not null check(char_length(btrim(kana)) between 1 and 200),
  meaning text not null check(char_length(btrim(meaning)) between 1 and 1000),
  "exampleSentence" text not null check(char_length(btrim("exampleSentence")) between 1 and 2000),
  "exampleTranslation" text not null check(char_length(btrim("exampleTranslation")) between 1 and 2000),
  image_path text unique references public.puyi_media(path),
  version integer not null default 1 check(version>0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  author_id uuid not null references auth.users(id), deleted_at timestamptz
);
create index puyi_cards_active on public.puyi_cards(position,id) where deleted_at is null;
alter table public.puyi_cards enable row level security;
revoke all on public.puyi_cards from public, anon, authenticated;
grant select on public.puyi_cards to anon, authenticated;
create policy puyi_public_read on public.puyi_cards for select to anon, authenticated using(deleted_at is null);

-- Dedicated public bucket: public GET, writes still require Storage RLS.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('puyi-images','puyi-images',true,2097152,array['image/jpeg','image/png','image/webp']);

create function public.puyi_image_access(p_path text,p_state text) returns boolean
language sql stable security definer set search_path='' as $$
 select public.is_puyi_admin() and exists(select 1 from public.puyi_media
 where path=p_path and state=p_state and (p_state='retired' or author_id=auth.uid()))
$$;
revoke all on function public.puyi_image_access(text,text) from public;
grant execute on function public.puyi_image_access(text,text) to anon,authenticated;
create policy puyi_image_insert on storage.objects for insert to authenticated
with check(bucket_id='puyi-images' and public.puyi_image_access(name,'pending'));
create policy puyi_image_select on storage.objects for select to authenticated
using(bucket_id='puyi-images' and public.is_puyi_admin());
create policy puyi_image_delete on storage.objects for delete to authenticated
using(bucket_id='puyi-images' and public.puyi_image_access(name,'retired'));
-- No UPDATE policy: immutable UUID paths, no overwriting referenced media.
-- Restrictive guards prevent an unrelated broad permissive Storage policy from bypassing this bucket.
create policy puyi_storage_insert_guard on storage.objects as restrictive for insert to public
with check(bucket_id<>'puyi-images' or public.puyi_image_access(name,'pending'));
create policy puyi_storage_update_guard on storage.objects as restrictive for update to public
using(bucket_id<>'puyi-images') with check(bucket_id<>'puyi-images');
create policy puyi_storage_delete_guard on storage.objects as restrictive for delete to public
using(bucket_id<>'puyi-images' or public.puyi_image_access(name,'retired'));
create policy puyi_storage_select_guard on storage.objects as restrictive for select to public
using(bucket_id<>'puyi-images' or public.is_puyi_admin());

create function public.puyi_reserve_image(p_path text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_puyi_admin() then raise insufficient_privilege; end if;
 insert into public.puyi_media(path,author_id) values(p_path,auth.uid());
end $$;

create function public.puyi_save_card(p_id uuid,p_expected_version integer,p_content jsonb,
 p_image_path text default null,p_delete boolean default false,p_allow_duplicate boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare old public.puyi_cards; saved public.puyi_cards; k text; lim integer; v text; media public.puyi_media;
begin
 if not public.is_puyi_admin() then raise insufficient_privilege; end if;
 -- Serializes editorial changes including duplicate checks. Review tables are never locked.
 perform pg_advisory_xact_lock(731103001);
 select * into old from public.puyi_cards where id=p_id for update;
 if p_delete then
   if old.id is null then raise no_data_found; end if;
   if old.deleted_at is not null then return to_jsonb(old); end if;
 else
   if p_content is null or jsonb_typeof(p_content)<>'object' or pg_column_size(p_content)>30000 then raise check_violation; end if;
   for k,lim in select * from (values ('word',200),('kana',200),('meaning',1000),('exampleSentence',2000),('exampleTranslation',2000)) t(key,maxlen) loop
     v:=p_content->>k;
     if jsonb_typeof(p_content->k) is distinct from 'string' or v is null or char_length(btrim(v,E' \t\n\r')) not between 1 and lim or v ~ '[[:cntrl:]]' then raise check_violation; end if;
   end loop;
   if btrim(p_content->>'kana') !~ '^[ぁ-ゖゝゞァ-ヺヽヾー・ 　]+$' then raise check_violation; end if;
   -- Lost-response retry with the same UUID/content is idempotent.
   if old.deleted_at is null and old.id is not null and old.word=p_content->>'word' and old.kana=p_content->>'kana'
      and old.meaning=p_content->>'meaning' and old."exampleSentence"=p_content->>'exampleSentence'
      and old."exampleTranslation"=p_content->>'exampleTranslation' and old.image_path is not distinct from p_image_path then return to_jsonb(old); end if;
   if old.deleted_at is not null then raise check_violation; end if;
   if not p_allow_duplicate and exists(select 1 from public.puyi_cards where deleted_at is null and id<>p_id
      and lower(btrim(word))=lower(btrim(p_content->>'word')) and btrim(kana)=btrim(p_content->>'kana')) then
     raise unique_violation using message='puyi_duplicate';
   end if;
 end if;
 if (old.id is null and p_expected_version<>0) or (old.id is not null and old.version<>p_expected_version) or p_expected_version is null then raise serialization_failure using message='puyi_conflict'; end if;
 if not p_delete and p_image_path is not null then
   select * into media from public.puyi_media where path=p_image_path for update;
   if media.path is null or media.state='retired' or (media.state='attached' and old.image_path is distinct from p_image_path) then raise check_violation; end if;
   if not exists(select 1 from storage.objects where bucket_id='puyi-images' and name=p_image_path
     and metadata->>'mimetype' in ('image/jpeg','image/png','image/webp')
     and (metadata->>'size')::bigint between 1 and 2097152) then raise check_violation; end if;
 end if;
 if old.id is null then
   if (select count(*) from public.puyi_cards where deleted_at is null)>=10000 then raise program_limit_exceeded; end if;
   insert into public.puyi_cards(id,word,kana,meaning,"exampleSentence","exampleTranslation",image_path,author_id)
   values(p_id,btrim(p_content->>'word'),btrim(p_content->>'kana'),btrim(p_content->>'meaning'),btrim(p_content->>'exampleSentence'),btrim(p_content->>'exampleTranslation'),p_image_path,auth.uid()) returning * into saved;
 else
   update public.puyi_cards set word=case when p_delete then word else btrim(p_content->>'word') end,
     kana=case when p_delete then kana else btrim(p_content->>'kana') end,
     meaning=case when p_delete then meaning else btrim(p_content->>'meaning') end,
     "exampleSentence"=case when p_delete then "exampleSentence" else btrim(p_content->>'exampleSentence') end,
     "exampleTranslation"=case when p_delete then "exampleTranslation" else btrim(p_content->>'exampleTranslation') end,
     image_path=case when p_delete then null else p_image_path end, version=version+1,updated_at=now(),deleted_at=case when p_delete then now() else null end
   where id=p_id returning * into saved;
 end if;
 if old.image_path is not null and old.image_path is distinct from saved.image_path then update public.puyi_media set state='retired' where path=old.image_path; end if;
 if saved.image_path is not null then update public.puyi_media set state='attached' where path=saved.image_path; end if;
 return to_jsonb(saved);
end $$;

create function public.puyi_discard_image(p_path text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_puyi_admin() then raise insufficient_privilege; end if;
 perform 1 from public.puyi_media where path=p_path for update;
 if exists(select 1 from public.puyi_cards where image_path=p_path) then raise check_violation; end if;
 update public.puyi_media set state='retired' where path=p_path;
end $$;
create function public.puyi_image_cleanup() returns setof text language plpgsql security definer set search_path='' as $$
begin
 if not public.is_puyi_admin() then raise insufficient_privilege; end if;
 -- Durable cleanup queue also recovers interrupted uploads on the next admin visit.
 update public.puyi_media set state='retired' where state='pending' and created_at<now()-interval '1 hour';
 return query select path from public.puyi_media where state='retired' order by path limit 100;
end $$;
create function public.puyi_image_cleanup_ack(p_path text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_puyi_admin() then raise insufficient_privilege; end if;
 delete from public.puyi_media where path=p_path and state='retired';
end $$;
revoke all on function public.puyi_reserve_image(text),public.puyi_save_card(uuid,integer,jsonb,text,boolean,boolean),public.puyi_discard_image(text),public.puyi_image_cleanup(),public.puyi_image_cleanup_ack(text) from public;
grant execute on function public.puyi_reserve_image(text),public.puyi_save_card(uuid,integer,jsonb,text,boolean,boolean),public.puyi_discard_image(text),public.puyi_image_cleanup(),public.puyi_image_cleanup_ack(text) to authenticated;
commit;
