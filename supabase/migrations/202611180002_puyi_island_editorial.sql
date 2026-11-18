begin;

create function public.puyi_island_editor_state(p_island uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if public.puyi_island_access() is distinct from 'owner' then
    raise exception 'puyi_forbidden' using errcode = '42501';
  end if;
  return (select jsonb_build_object('current', i.current_revision, 'published', i.published_revision)
    from public.puyi_islands i where i.id = p_island and i.owner_id = auth.uid());
end $$;

create function public.puyi_island_save(p_island uuid, p_expected integer, p_document jsonb) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  existing public.puyi_islands%rowtype;
  next_revision integer;
begin
  if public.puyi_island_access() is distinct from 'owner' then
    raise exception 'puyi_forbidden' using errcode = '42501';
  end if;
  -- Serialize grants/revocation with this write and competing revisions with the island row.
  perform 1 from public.puyi_island_members m where m.user_id = actor and m.role = 'owner'
    and m.verified_at <= now() and m.revoked_at is null for share;
  if not found then raise exception 'puyi_forbidden' using errcode = '42501'; end if;
  if p_island is null or p_expected is null or p_expected < 0 or octet_length(p_document::text) > 2097152
    or jsonb_typeof(p_document) is distinct from 'object'
    or p_document->>'schemaVersion' is distinct from '1'
    or jsonb_typeof(p_document->'blocks') is distinct from 'array'
    or jsonb_typeof(p_document->'entries') is distinct from 'array'
    or jsonb_typeof(p_document->'answers') is distinct from 'array'
    or jsonb_typeof(p_document->'assets') is distinct from 'array' then
    raise exception 'puyi_payload' using errcode = '22023';
  end if;
  if p_expected = 0 then
    insert into public.puyi_islands (id, owner_id, current_revision)
      values (p_island, actor, 1) on conflict do nothing;
    if not found then raise exception 'puyi_conflict' using errcode = '40001'; end if;
  else
    select * into existing from public.puyi_islands where id = p_island and owner_id = actor for update;
    if existing.current_revision is distinct from p_expected then
      raise exception 'puyi_conflict' using errcode = '40001';
    end if;
  end if;
  next_revision := p_expected + 1;
  insert into public.puyi_island_revisions (island_id, revision, title_ja, title, description)
    values (p_island, next_revision, p_document->>'title_ja', p_document->'title', p_document->'description');
  insert into public.puyi_island_blocks (island_id, revision, id, position, name)
    select p_island, next_revision, b.id, b.position, b.name
    from jsonb_to_recordset(p_document->'blocks') as b(id uuid, position integer, name jsonb);

  insert into public.puyi_island_audio (id, island_id, entry_id, revision, sha256, fingerprint, japanese, reading, bytes, duration_seconds)
    select a.id, p_island, a.entry_id, a.revision, a.sha256, a.fingerprint, a.japanese, a.reading, a.bytes, a.duration_seconds
    from jsonb_to_recordset(p_document->'assets') as a(id uuid, entry_id uuid, revision integer,
      sha256 text, fingerprint text, japanese text, reading text, bytes integer, duration_seconds numeric)
    on conflict (id) do nothing;
  if exists (
    select 1 from jsonb_to_recordset(p_document->'assets') as a(id uuid, entry_id uuid, revision integer,
      sha256 text, fingerprint text, japanese text, reading text, bytes integer, duration_seconds numeric)
    left join public.puyi_island_audio old on old.id = a.id
    where (old.island_id, old.entry_id, old.revision, old.sha256, old.fingerprint, old.japanese, old.reading, old.bytes, old.duration_seconds)
      is distinct from (p_island, a.entry_id, a.revision, a.sha256, a.fingerprint, a.japanese, a.reading, a.bytes, a.duration_seconds)
  ) then raise exception 'puyi_audio_conflict' using errcode = '40001'; end if;

  insert into public.puyi_island_entries (island_id, revision, block_id, id, kind, position, japanese, reading,
      segments, translation, structural, explanation, vocabulary, register, text_approved, audio_approved, audio_id)
    select p_island, next_revision, e.block_id, e.id, e.kind, e.position, e.japanese, e.reading,
      e.segments, e.translation, e.structural, e.explanation, e.vocabulary, e.register, e.text_approved, e.audio_approved, e.audio_id
    from jsonb_to_recordset(p_document->'entries') as e(block_id uuid, id uuid, kind text, position integer, japanese text,
      reading text, segments jsonb, translation jsonb, structural jsonb, explanation jsonb, vocabulary jsonb,
      register text, text_approved boolean, audio_approved boolean, audio_id uuid);
  if exists (
    select 1 from public.puyi_island_entries e join public.puyi_island_entries old
      on old.island_id = e.island_id and old.id = e.id and old.revision < next_revision
    where e.island_id = p_island and e.revision = next_revision and old.kind <> e.kind
  ) then raise exception 'puyi_entry_kind' using errcode = '22023'; end if;

  insert into public.puyi_island_answers (island_id, revision, question_id, phrase_id, position)
    select p_island, next_revision, a.question_id, a.phrase_id, a.position
    from jsonb_to_recordset(p_document->'answers') as a(question_id uuid, phrase_id uuid, position integer);
  insert into public.puyi_island_contexts (island_id, revision, entry_id, original_context, editorial_note)
    select p_island, next_revision, e.id, coalesce(e.original_context, ''), coalesce(e.editorial_note, '')
    from jsonb_to_recordset(p_document->'entries') as e(id uuid, original_context text, editorial_note text)
    where coalesce(e.original_context, '') <> '' or coalesce(e.editorial_note, '') <> '';
  update public.puyi_islands set current_revision = next_revision where id = p_island;
  return next_revision;
end $$;

create function public.puyi_island_publish(p_island uuid, p_expected integer, p_expected_published integer, p_revision integer)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  existing public.puyi_islands%rowtype;
begin
  if public.puyi_island_access() is distinct from 'owner' then
    raise exception 'puyi_forbidden' using errcode = '42501';
  end if;
  perform 1 from public.puyi_island_members m where m.user_id = actor and m.role = 'owner'
    and m.verified_at <= now() and m.revoked_at is null for share;
  if not found then raise exception 'puyi_forbidden' using errcode = '42501'; end if;
  select * into existing from public.puyi_islands where id = p_island and owner_id = actor for update;
  if not found or existing.current_revision is distinct from p_expected
    or existing.published_revision is distinct from p_expected_published then
    raise exception 'puyi_conflict' using errcode = '40001';
  end if;
  if p_revision is not null and (
    not exists (select 1 from public.puyi_island_revisions r where r.island_id = p_island and r.revision = p_revision
      and jsonb_typeof(r.title->'es') = 'string' and btrim(r.title->>'es') <> '' and btrim(r.title_ja) <> '')
    or not exists (select 1 from public.puyi_island_blocks b where b.island_id = p_island and b.revision = p_revision)
    or exists (select 1 from public.puyi_island_blocks b where b.island_id = p_island and b.revision = p_revision
      and (nullif(btrim(b.name->>'es'), '') is null or not exists (
        select 1 from public.puyi_island_entries e where e.island_id = p_island and e.revision = p_revision
          and e.block_id = b.id and e.kind = 'phrase'
      )))
    or exists (
      select 1 from public.puyi_island_entries e
      left join public.puyi_island_audio a on a.id = e.audio_id
      left join storage.objects o on o.bucket_id = 'puyi-islands-private' and o.name = a.object_key
      where e.island_id = p_island and e.revision = p_revision and (
        not e.text_approved or not e.audio_approved
        or nullif(btrim(e.japanese), '') is null or nullif(btrim(e.reading), '') is null
        or nullif(btrim(e.translation->>'es'), '') is null
        or e.japanese is distinct from (select string_agg(s.value->>'text', '' order by s.n)
          from jsonb_array_elements(e.segments) with ordinality s(value, n))
        or e.reading is distinct from (select string_agg(coalesce(s.value->>'reading', s.value->>'text'), '' order by s.n)
          from jsonb_array_elements(e.segments) with ordinality s(value, n))
        or a.id is null or a.japanese <> e.japanese or a.reading <> e.reading or o.id is null
        or o.metadata->>'mimetype' is distinct from 'audio/mpeg' or o.metadata->>'size' is distinct from a.bytes::text
      )
    )
  ) then raise exception 'puyi_not_ready' using errcode = '22023'; end if;
  update public.puyi_islands set published_revision = p_revision where id = p_island;
end $$;

revoke all on function public.puyi_island_editor_state(uuid), public.puyi_island_save(uuid, integer, jsonb),
  public.puyi_island_publish(uuid, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.puyi_island_editor_state(uuid), public.puyi_island_save(uuid, integer, jsonb),
  public.puyi_island_publish(uuid, integer, integer, integer) to authenticated;
commit;
