begin;

create table public.puyi_island_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'reader')),
  verified_at timestamptz,
  revoked_at timestamptz,
  check (revoked_at is null or revoked_at >= verified_at)
);
create unique index puyi_island_single_owner on public.puyi_island_members (role)
  where role = 'owner' and verified_at is not null and revoked_at is null;

create table public.puyi_islands (
  id uuid primary key,
  owner_id uuid not null references auth.users(id),
  current_revision integer not null check (current_revision > 0),
  published_revision integer check (published_revision between 1 and current_revision)
);
create table public.puyi_island_revisions (
  island_id uuid not null references public.puyi_islands(id),
  revision integer not null check (revision > 0),
  title_ja text not null,
  title jsonb not null check (jsonb_typeof(title) = 'object'),
  description jsonb not null check (jsonb_typeof(description) = 'object'),
  saved_at timestamptz not null default now(),
  primary key (island_id, revision)
);
alter table public.puyi_islands
  add foreign key (id, current_revision) references public.puyi_island_revisions(island_id, revision) deferrable initially deferred,
  add foreign key (id, published_revision) references public.puyi_island_revisions(island_id, revision);

create table public.puyi_island_blocks (
  island_id uuid not null,
  revision integer not null,
  id uuid not null,
  position integer not null check (position > 0),
  name jsonb not null check (jsonb_typeof(name) = 'object'),
  primary key (island_id, revision, id),
  unique (island_id, revision, position),
  foreign key (island_id, revision) references public.puyi_island_revisions(island_id, revision)
);

-- A phrase and a question share the same media and localization shape.
create table public.puyi_island_audio (
  id uuid primary key,
  island_id uuid not null references public.puyi_islands(id),
  entry_id uuid not null,
  revision integer not null check (revision > 0),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  fingerprint text not null check (fingerprint ~ '^[0-9a-f]{64}$'),
  japanese text not null,
  reading text not null,
  bytes integer not null check (bytes between 1 and 2097152),
  duration_seconds numeric not null check (duration_seconds > 0 and duration_seconds <= 120),
  object_key text generated always as
    (island_id::text || '/' || id::text || '/r' || revision::text || '-' || sha256 || '.mp3') stored unique,
  unique (island_id, entry_id, revision),
  unique (island_id, entry_id, id)
);
create table public.puyi_island_entries (
  island_id uuid not null,
  revision integer not null,
  block_id uuid not null,
  id uuid not null,
  kind text not null check (kind in ('phrase', 'question')),
  position integer not null check (position > 0),
  japanese text not null,
  reading text not null,
  segments jsonb not null check (jsonb_typeof(segments) = 'array'),
  translation jsonb not null check (jsonb_typeof(translation) = 'object'),
  structural jsonb not null check (jsonb_typeof(structural) = 'object'),
  explanation jsonb not null check (jsonb_typeof(explanation) = 'object'),
  vocabulary jsonb not null check (jsonb_typeof(vocabulary) = 'array'),
  register text not null check (register in ('neutral', 'informal', 'polite')),
  text_approved boolean not null,
  audio_approved boolean not null,
  audio_id uuid,
  primary key (island_id, revision, id),
  unique (island_id, revision, id, kind),
  unique (island_id, revision, block_id, kind, position),
  foreign key (island_id, revision, block_id) references public.puyi_island_blocks(island_id, revision, id),
  foreign key (island_id, id, audio_id) references public.puyi_island_audio(island_id, entry_id, id)
);
create table public.puyi_island_answers (
  island_id uuid not null,
  revision integer not null,
  question_id uuid not null,
  phrase_id uuid not null,
  position integer not null check (position > 0),
  question_kind text generated always as ('question'::text) stored,
  phrase_kind text generated always as ('phrase'::text) stored,
  primary key (island_id, revision, question_id, phrase_id),
  unique (island_id, revision, question_id, position),
  foreign key (island_id, revision, question_id, question_kind)
    references public.puyi_island_entries(island_id, revision, id, kind),
  foreign key (island_id, revision, phrase_id, phrase_kind)
    references public.puyi_island_entries(island_id, revision, id, kind)
);
create table public.puyi_island_contexts (
  island_id uuid not null,
  revision integer not null,
  entry_id uuid not null,
  original_context text not null,
  editorial_note text not null,
  primary key (island_id, revision, entry_id),
  foreign key (island_id, revision, entry_id) references public.puyi_island_entries(island_id, revision, id)
);
create index puyi_island_entry_audio_ref on public.puyi_island_entries (audio_id, island_id, revision) where audio_id is not null;

do $$
declare table_name text;
begin
  foreach table_name in array array['puyi_island_members', 'puyi_islands', 'puyi_island_revisions', 'puyi_island_blocks',
    'puyi_island_audio', 'puyi_island_entries', 'puyi_island_answers', 'puyi_island_contexts']
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from public, anon, authenticated', table_name);
    if table_name <> 'puyi_island_members' then
      execute format('grant select on public.%I to authenticated', table_name);
    end if;
  end loop;
end $$;
revoke select on public.puyi_islands from authenticated;
grant select (id, published_revision) on public.puyi_islands to authenticated;

create function public.puyi_island_access() returns text language sql stable security definer set search_path = '' as $$
  select m.role from public.puyi_island_members m
  where m.user_id = auth.uid() and m.verified_at <= now() and m.revoked_at is null
    and coalesce(auth.jwt()->>'is_anonymous', 'false') = 'false'
$$;
create function public.puyi_island_owner(p_island uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.puyi_island_access() = 'owner' and exists (
    select 1 from public.puyi_islands i where i.id = p_island and i.owner_id = auth.uid()
  ), false)
$$;
create function public.puyi_island_read_revision(p_island uuid, p_revision integer) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.puyi_islands i where i.id = p_island and
      ((public.puyi_island_access() = 'owner' and i.owner_id = auth.uid()) or
       (public.puyi_island_access() is not null and i.published_revision = p_revision))
  )
$$;
create function public.puyi_island_media_access(p_key text, p_upload boolean) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.puyi_island_audio a join public.puyi_islands i on i.id = a.island_id
    join public.puyi_island_entries e on e.audio_id = a.id and e.island_id = i.id
    where a.object_key = p_key and (
      (p_upload and public.puyi_island_owner(i.id) and e.revision = i.current_revision) or
      (not p_upload and public.puyi_island_read_revision(i.id, e.revision))
    )
  )
$$;

create policy puyi_islands_read on public.puyi_islands for select to authenticated
  using (public.puyi_island_owner(id) or (public.puyi_island_access() is not null and published_revision is not null));
create policy puyi_island_revisions_read on public.puyi_island_revisions for select to authenticated
  using (public.puyi_island_read_revision(island_id, revision));
create policy puyi_island_blocks_read on public.puyi_island_blocks for select to authenticated
  using (public.puyi_island_read_revision(island_id, revision));
create policy puyi_island_entries_read on public.puyi_island_entries for select to authenticated
  using (public.puyi_island_read_revision(island_id, revision));
create policy puyi_island_answers_read on public.puyi_island_answers for select to authenticated
  using (public.puyi_island_read_revision(island_id, revision));
create policy puyi_island_contexts_owner on public.puyi_island_contexts for select to authenticated
  using (public.puyi_island_owner(island_id));
create policy puyi_island_audio_read on public.puyi_island_audio for select to authenticated
  using (public.puyi_island_media_access(object_key, false));

do $$
begin
  if not exists (select 1 from pg_catalog.pg_class where oid = 'storage.objects'::regclass and relrowsecurity)
    or not exists (select 1 from pg_catalog.pg_class where oid = 'storage.buckets'::regclass and relrowsecurity) then
    raise exception 'puyi_storage_rls_required';
  end if;
end $$;
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('puyi-islands-private', 'puyi-islands-private', false, 2097152, array['audio/mpeg']);
create policy puyi_island_object_read on storage.objects for select to authenticated
  using (bucket_id = 'puyi-islands-private' and public.puyi_island_media_access(name, false));
create policy puyi_island_object_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'puyi-islands-private' and public.puyi_island_media_access(name, true));
-- Restrictive policies also fence this bucket from unrelated permissive policies.
create policy puyi_island_read_guard on storage.objects as restrictive for select to public
  using (bucket_id <> 'puyi-islands-private' or public.puyi_island_media_access(name, false));
create policy puyi_island_insert_guard on storage.objects as restrictive for insert to public
  with check (bucket_id <> 'puyi-islands-private' or public.puyi_island_media_access(name, true));
create policy puyi_island_update_guard on storage.objects as restrictive for update to public
  using (bucket_id <> 'puyi-islands-private') with check (bucket_id <> 'puyi-islands-private');
create policy puyi_island_delete_guard on storage.objects as restrictive for delete to public
  using (bucket_id <> 'puyi-islands-private');
create policy puyi_island_bucket_insert_guard on storage.buckets as restrictive for insert to public
  with check (id <> 'puyi-islands-private');
create policy puyi_island_bucket_update_guard on storage.buckets as restrictive for update to public
  using (id <> 'puyi-islands-private') with check (id <> 'puyi-islands-private');
create policy puyi_island_bucket_delete_guard on storage.buckets as restrictive for delete to public
  using (id <> 'puyi-islands-private');

create function public.puyi_island_catalog() returns jsonb language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', i.id, 'revision', r.revision, 'japanese', r.title_ja, 'title', r.title, 'description', r.description
  ) order by r.title->>'es', i.id), '[]') from public.puyi_islands i
  join public.puyi_island_revisions r on r.island_id = i.id and r.revision = i.published_revision
$$;
create function public.puyi_island_detail(p_island uuid) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', i.id, 'revision', r.revision, 'japanese', r.title_ja, 'title', r.title,
    'description', r.description, 'blocks', (
      select coalesce(jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name, 'phraseCount', (
        select count(*) from public.puyi_island_entries e where e.island_id = i.id and e.revision = r.revision
          and e.block_id = b.id and e.kind = 'phrase'
      )) order by b.position), '[]')
      from public.puyi_island_blocks b where b.island_id = i.id and b.revision = r.revision
    ))
  from public.puyi_islands i join public.puyi_island_revisions r on r.island_id = i.id and r.revision = i.published_revision
  where i.id = p_island
$$;
create function public.puyi_island_block(p_island uuid, p_revision integer, p_block uuid) returns jsonb
language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id, 'kind', e.kind, 'japanese', e.japanese, 'segments', e.segments,
    'translation', e.translation, 'audioKey', a.object_key, 'audioBytes', a.bytes, 'answers', (
      select coalesce(jsonb_agg(l.phrase_id order by l.position), '[]') from public.puyi_island_answers l
      where l.island_id = p_island and l.revision = p_revision and l.question_id = e.id
    )
  ) order by e.kind, e.position), '[]')
  from public.puyi_islands i
  join public.puyi_island_entries e on e.island_id = i.id and e.revision = i.published_revision
  join public.puyi_island_audio a on a.id = e.audio_id
  where i.id = p_island and i.published_revision = p_revision and e.block_id = p_block
  having exists (select 1 from public.puyi_islands visible join public.puyi_island_blocks b
    on b.island_id = visible.id and b.revision = visible.published_revision
    where visible.id = p_island and visible.published_revision = p_revision and b.id = p_block)
$$;

-- Grant helpers needed in Storage predicates even to anon. They disclose no data without an active membership.
revoke all on function public.puyi_island_access(), public.puyi_island_owner(uuid),
  public.puyi_island_read_revision(uuid, integer), public.puyi_island_media_access(text, boolean),
  public.puyi_island_catalog(), public.puyi_island_detail(uuid), public.puyi_island_block(uuid, integer, uuid)
  from public, anon, authenticated;
grant execute on function public.puyi_island_owner(uuid), public.puyi_island_read_revision(uuid, integer),
  public.puyi_island_access(), public.puyi_island_catalog(), public.puyi_island_detail(uuid),
  public.puyi_island_block(uuid, integer, uuid) to authenticated;
grant execute on function public.puyi_island_media_access(text, boolean) to anon, authenticated;

commit;
