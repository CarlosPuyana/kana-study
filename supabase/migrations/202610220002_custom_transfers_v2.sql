-- H4B-D1. Additive, inactive protocol. Apply only in authorized ephemeral tests.
begin;
create table public.custom_transfers_v2 (
 user_id uuid not null references auth.users(id) on delete cascade,
 transfer_id text not null check(octet_length(transfer_id) between 1 and 128),
 kind text not null check(kind in ('guest-import','branch-archive')),
 manifest jsonb not null check(octet_length(manifest::text)<=524288),
 state text not null default 'staging' check(state in ('staging','ready-to-publish','published','complete','blocked','cancelled')),
 revision bigint not null default 1 check(revision>0), reason text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 primary key(user_id,transfer_id)
);
create table public.custom_transfer_chunks_v2 (
 user_id uuid not null, transfer_id text not null, chunk_index integer not null check(chunk_index between 0 and 127),
 body text not null check(octet_length(body)<=524288), digest text not null check(digest ~ '^[a-f0-9]{64}$'),
 primary key(user_id,transfer_id,chunk_index),
 foreign key(user_id,transfer_id) references public.custom_transfers_v2(user_id,transfer_id)
);
create table public.custom_transfer_receipts_v2 (
 user_id uuid not null references auth.users(id) on delete cascade, operation_id text not null check(octet_length(operation_id) between 1 and 128),
 request_hash text not null, result jsonb not null, created_at timestamptz not null default now(),
 primary key(user_id,operation_id)
);
-- Serialized by the existing owner clock, shared with V1 writers. No caller-writable quota.
create table public.custom_transfer_usage_v2 (
 user_id uuid primary key references auth.users(id) on delete cascade,
 bytes bigint not null default 0 check(bytes between 0 and 67108864),
 transfers integer not null default 0 check(transfers between 0 and 32),
 receipts integer not null default 0 check(receipts between 0 and 8192)
);
do $$ declare t text;begin
 foreach t in array array['custom_transfers_v2','custom_transfer_chunks_v2','custom_transfer_receipts_v2','custom_transfer_usage_v2'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy owner_read on public.%I for select to authenticated using(user_id=(select auth.uid()))',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
 end loop;
end $$;

create function public.cd_transfer_hash_v2(body text) returns text language sql immutable set search_path='' as $$
 select encode(sha256(convert_to(body,'UTF8')),'hex')
$$;

-- Syntax validation for archived requests; never apply a rejected branch to test its validity.
create function public.cd_transfer_operation_v2(op jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare c jsonb;begin
 if not public.cd_keys_v1(op,array['schemaVersion','operationId','action','changes'],array['expectedHead','before','intent','resolvesOperationId']) or
 op->'schemaVersion' is distinct from '1'::jsonb or not public.cd_text_v1(op->'operationId',256) or octet_length(op::text)>524288 or
 jsonb_typeof(op->'action') is distinct from 'string' or op->>'action' not in ('stage','publish','edit','review','undo','import-history','daily','archive','delete','restore','revoke') or
 jsonb_typeof(op->'changes') is distinct from 'array' or jsonb_array_length(op->'changes') not between 1 and 64 then return false;end if;
 if op ? 'expectedHead' and op->'expectedHead'<>'null' and not public.cd_text_v1(op->'expectedHead',256) or
 op ? 'before' and op->'before'<>'null' and not public.cd_snapshot_v1(op->'before') or
 op ? 'resolvesOperationId' and not public.cd_text_v1(op->'resolvesOperationId',256) then return false;end if;
 if op ? 'intent' and (not public.cd_keys_v1(op->'intent',array['schemaVersion','deck','card','expectedContentVersion','confirmation']) or
 op#>'{intent,schemaVersion}' is distinct from '1'::jsonb or
 not public.cd_payload_v1('deck',op#>>'{intent,deck,id}',op#>'{intent,deck}') or
 not public.cd_payload_v1('card',op#>>'{intent,card,id}',op#>'{intent,card}') or
 not public.cd_payload_v1('confirmation',op#>>'{intent,confirmation,id}',op#>'{intent,confirmation}')) then return false;end if;
 for c in select value from jsonb_array_elements(op->'changes') loop
  if not public.cd_keys_v1(c,array['kind','id','baseRevision','payload'],array['parentHead','voidedBy']) or not public.cd_text_v1(c->'id',256) or
   jsonb_typeof(c->'baseRevision') is distinct from 'string' or c->>'baseRevision'!~'^(0|[1-9][0-9]{0,18})$' or (c->>'baseRevision')::numeric>9223372036854775807 or
   not public.cd_payload_v1(c->>'kind',c->>'id',c->'payload') then return false;end if;
  if (c ? 'parentHead' or c ? 'voidedBy') and (c->>'kind'<>'review-event' or op->>'action'<>'import-history') then return false;end if;
  if c ? 'parentHead' and c->'parentHead'<>'null' and not public.cd_text_v1(c->'parentHead',256) or
   c ? 'voidedBy' and c->'voidedBy'<>'null' and not public.cd_text_v1(c->'voidedBy',256) then return false;end if;
 end loop;
 return not exists(select 1 from jsonb_array_elements(op->'changes') group by value->>'kind',value->>'id' having count(*)>1);
 exception when others then return false;
end $$;

-- All immutable chunks are rehashed at validation/publication. Ordered exact JSON text avoids
-- cross-runtime float reserialization as a hashing contract. No JSON-to-FSRS replay.
create function public.cd_transfer_records_v2(uid uuid,tid text,m jsonb) returns jsonb language plpgsql set search_path='' as $$
declare d jsonb; c public.custom_transfer_chunks_v2; records jsonb:='[]'; item jsonb; changes integer;begin
 for d in select value from jsonb_array_elements(m->'chunks') loop
  select * into c from public.custom_transfer_chunks_v2 where user_id=uid and transfer_id=tid and chunk_index=(d->>'index')::integer;
  if not found then raise exception 'incomplete-chunks' using errcode='22023';end if;
  if public.cd_transfer_hash_v2(c.body)<>d->>'sha256' or octet_length(c.body)<>(d->>'bytes')::integer then raise exception 'chunk-integrity' using errcode='22023';end if;
  if jsonb_typeof(c.body::jsonb) is distinct from 'array' or jsonb_array_length(c.body::jsonb) not between 1 and 64 then raise exception 'chunk-record-limit' using errcode='22023';end if;
  changes:=0;
  for item in select value from jsonb_array_elements(c.body::jsonb) loop
   if not public.cd_keys_v1(item,array['type','value']) or item->>'type' not in ('operation','ancestor') then raise exception 'invalid-record' using errcode='22023';end if;
   if item->>'type'='operation' then
    if not public.cd_transfer_operation_v2(item->'value') then raise exception 'invalid-original-operation' using errcode='22023';end if;
    changes:=changes+jsonb_array_length(item#>'{value,changes}');
   else
    if not public.cd_keys_v1(item->'value',array['kind','id','baseRevision','payload','parentHead','voidedBy']) or item#>>'{value,kind}'<>'review-event' or
     not public.cd_payload_v1('review-event',item#>>'{value,id}',item#>'{value,payload}') then raise exception 'invalid-ancestor' using errcode='22023';end if;
    changes:=changes+1;
   end if;
  end loop;
  if changes>64 then raise exception 'chunk-change-limit' using errcode='22023';end if;
  records:=records||c.body::jsonb;
 end loop;
 return records;
end $$;

-- This helper runs within the final transaction (and within a rolled-back validation probe).
-- It reuses all V1 validation/CAS/identity/lineage rules without weakening or replacing V1 RPCs.
create function public.cd_publish_transfer_v2(uid uuid,tid text,m jsonb) returns void language plpgsql set search_path='' as $$
declare records jsonb; item jsonb; op jsonb; result jsonb; declared jsonb; card jsonb; r public.custom_sync_entities_v1; seen jsonb:='[]'; changed jsonb:='[]'; key jsonb;begin
 if coalesce((select revision::text from public.custom_sync_clock_v1 where user_id=uid),'0')<>m->>'baseServerRevision' then raise exception 'destination-revision-conflict' using errcode='22023';end if;
 records:=public.cd_transfer_records_v2(uid,tid,m);
 for item in select value from jsonb_array_elements(records) loop
  op:=item->'value';
  if item->>'type'<>'operation' or op->>'action' not in ('stage','publish','import-history','review','undo') then raise exception 'invalid-import-action' using errcode='22023';end if;
  if exists(select 1 from public.custom_sync_receipts_v1 where user_id=uid and operation_id=op->>'operationId') or seen ? (op->>'operationId') then raise exception 'import-operation-already-used' using errcode='22023';end if;
  seen:=seen||jsonb_build_array(op->>'operationId');
  for key in select jsonb_build_object('kind',value->>'kind','id',value->>'id') from jsonb_array_elements(op->'changes') loop
   if not changed @> jsonb_build_array(key) then changed:=changed||jsonb_build_array(key);end if;
  end loop;
  result:=public.apply_custom_deck_operation_v1(op);
  if result->>'status'<>'accepted' then raise exception 'import-cas-or-tombstone-conflict' using errcode='22023';end if;
 end loop;
 if jsonb_array_length(changed)<>jsonb_array_length(m->'entities') or not changed @> (m->'entities') or not (m->'entities') @> changed then raise exception 'closed-inventory-mismatch' using errcode='22023';end if;
 if (select count(*) from jsonb_array_elements(changed) where value->>'kind'='card')<>jsonb_array_length(m->'cards') then raise exception 'closed-card-inventory-mismatch' using errcode='22023';end if;
 for card in select value from jsonb_array_elements(m->'cards') loop
  select * into r from public.custom_sync_entities_v1 where user_id=uid and kind='card' and entity_id=card->>'id';
  if not found or r.deleted_at is not null or r.deck_id<>card->>'deckId' or r.payload#>>'{lexicalIdentity,key}'<>card->>'identityKey' or
   r.payload->'contentVersion' is distinct from card->'contentVersion' or r.payload#>>'{glosses,0,source,sourceId}'<>card->>'confirmationId' or
   not exists(select 1 from public.custom_sync_entities_v1 e where e.user_id=uid and e.kind='identity' and e.entity_id=r.identity_id and e.payload->>'registryNamespace'=m->>'namespace') or
   not exists(select 1 from public.custom_sync_entities_v1 e where e.user_id=uid and e.kind='confirmation' and e.entity_id=card->>'confirmationId' and e.payload->>'workspace'='guest') then raise exception 'guest-provenance-mismatch' using errcode='22023';end if;
  if public.get_custom_deck_bundle_v1(card->>'deckId') is null then raise exception 'unpublished-content' using errcode='22023';end if;
  select * into r from public.custom_sync_entities_v1 where user_id=uid and kind='progress' and entity_id=card->>'id';
  if card->>'history'='new' then
   if found or exists(select 1 from public.custom_sync_entities_v1 e where e.user_id=uid and e.kind='review-event' and e.card_id=card->>'id') or card->'snapshot'<>'null' or card->'head'<>'null' or card->'eventIds'<>'[]' then raise exception 'false-new-card' using errcode='22023';end if;
  else
   if not found or r.payload is distinct from card->'snapshot' or to_jsonb(r.head) is distinct from nullif(card->'head','null'::jsonb) then raise exception 'missing-or-different-history' using errcode='22023';end if;
   select coalesce(jsonb_agg(entity_id order by entity_id),'[]') into declared from public.custom_sync_entities_v1 where user_id=uid and kind='review-event' and card_id=card->>'id';
   if declared is distinct from (select coalesce(jsonb_agg(value order by value),'[]') from jsonb_array_elements(card->'eventIds')) then raise exception 'incomplete-events' using errcode='22023';end if;
  end if;
 end loop;
 -- Every imported study entity must belong to a declared card/deck; no hidden extra history.
 if exists(select 1 from jsonb_array_elements(changed) x join public.custom_sync_entities_v1 e on e.user_id=uid and e.kind=x->>'kind' and e.entity_id=x->>'id'
  where (e.kind in ('progress','review-event') and not exists(select 1 from jsonb_array_elements(m->'cards') c where c->>'id'=e.card_id)) or
   (e.kind in ('daily','manifest','deck') and not exists(select 1 from jsonb_array_elements(m->'cards') c where c->>'deckId'=coalesce(e.deck_id,e.entity_id)))) then raise exception 'undeclared-study-dependency' using errcode='22023';end if;
end $$;

create function public.cd_verify_branch_v2(uid uuid,tid text,m jsonb) returns void language plpgsql set search_path='' as $$
declare records jsonb; item jsonb; op jsonb; c jsonb; evidence jsonb; ids jsonb:='[]'; ancestors jsonb:='[]'; events jsonb:='[]'; parent text; r public.custom_sync_entities_v1;
 effective_head jsonb:=m->'baseHead'; previous_snapshot jsonb; progress jsonb; first_operation boolean:=true;begin
 select * into r from public.custom_sync_entities_v1 where user_id=uid and kind='card' and entity_id=m->>'cardId';
 if not found or r.payload#>>'{lexicalIdentity,key}'<>m->>'identityKey' then raise exception 'branch-identity-mismatch' using errcode='22023';end if;
 select e.evidence into evidence from public.custom_sync_conflicts_v1 e where e.user_id=uid and e.operation_id=m->>'conflictOperationId';
 if evidence is null then raise exception 'missing-conflict-anchor' using errcode='22023';end if;
 records:=public.cd_transfer_records_v2(uid,tid,m);
 for item in select value from jsonb_array_elements(records) loop
  if item->>'type'='ancestor' then
   c:=item->'value';ancestors:=ancestors||jsonb_build_array(c->>'id');
   select * into r from public.custom_sync_entities_v1 where user_id=uid and kind='review-event' and entity_id=c->>'id';
   if not found or r.payload is distinct from c->'payload' or to_jsonb(r.head) is distinct from nullif(c->'parentHead','null'::jsonb) or to_jsonb(r.voided_by) is distinct from nullif(c->'voidedBy','null'::jsonb) then raise exception 'ancestor-proof-mismatch' using errcode='22023';end if;
   events:=events||jsonb_build_array(c);
  else
   op:=item->'value';ids:=ids||jsonb_build_array(op->>'operationId');
   if op->>'action' not in ('review','undo','import-history') or not(op ?& array['expectedHead','before']) then raise exception 'invalid-branch-action' using errcode='22023';end if;
   if op->>'action'<>'import-history' and op->'expectedHead' is distinct from effective_head or
    not first_operation and op->'before' is distinct from previous_snapshot then raise exception 'branch-sequence-mismatch' using errcode='22023';end if;
   if first_operation and op->>'operationId'<>m->>'conflictOperationId' then raise exception 'branch-anchor-must-be-first' using errcode='22023';end if;
   if op->>'operationId'=m->>'conflictOperationId' and op is distinct from evidence then raise exception 'conflict-proof-mismatch' using errcode='22023';end if;
   for c in select value from jsonb_array_elements(op->'changes') loop
    if c->>'kind' not in ('progress','review-event','daily') or c#>>'{payload,deckId}'<>(select payload->>'deckId' from public.custom_sync_entities_v1 where user_id=uid and kind='card' and entity_id=m->>'cardId') or
     (c->>'kind'='progress' and c->>'id'<>m->>'cardId') or (c->>'kind'='review-event' and c#>>'{payload,entryId}'<>m->>'cardId') then raise exception 'foreign-branch-entity' using errcode='22023';end if;
    if c->>'kind'='review-event' then
     if c->>'id'=any(array(select value->>'id' from jsonb_array_elements(events))) and op->>'action'<>'undo' then raise exception 'duplicate-branch-event' using errcode='22023';end if;
     if op->>'action'<>'undo' then events:=events||jsonb_build_array(case when op->>'action'='import-history' then c else c||jsonb_build_object('parentHead',op->'expectedHead') end);end if;
    end if;
   end loop;
   select value into progress from jsonb_array_elements(op->'changes') where value->>'kind'='progress';
   if progress is null or (select count(*) from jsonb_array_elements(op->'changes') where value->>'kind'='progress')<>1 then raise exception 'branch-snapshot-missing' using errcode='22023';end if;
   previous_snapshot:=coalesce(progress#>'{payload,card}','null');
   if op->>'action'='review' then
    select value->'id' into effective_head from jsonb_array_elements(op->'changes') where value->>'kind'='review-event';
   elsif op->>'action'='import-history' then effective_head:=op->'expectedHead';
   else
    select coalesce(value->'parentHead','null') into effective_head from jsonb_array_elements(events) where value->'id'=op->'expectedHead';
   end if;
   first_operation:=false;
  end if;
 end loop;
 if ids is distinct from m->'operationIds' or ancestors is distinct from m->'ancestorIds' or not ids ? (m->>'conflictOperationId') or
  (select count(*)<>count(distinct value) from jsonb_array_elements(ids)) or
  (select count(*)<>count(distinct value) from jsonb_array_elements(ancestors)) or effective_head is distinct from m->'head' then raise exception 'branch-closed-inventory-mismatch' using errcode='22023';end if;
 -- Closed, topologically ordered evidence. No absent ancestors silently invented.
 ids:='[]';
 for c in select value from jsonb_array_elements(events) loop
  parent:=c->>'parentHead';
  if c#>>'{payload,entryId}'<>m->>'cardId' or parent is not null and not ids ? parent then raise exception 'missing-branch-ancestor' using errcode='22023';end if;
  ids:=ids||jsonb_build_array(c->>'id');
 end loop;
 if m->'baseHead'<>'null' and not ids ? (m->>'baseHead') or m->'head'<>'null' and not ids ? (m->>'head') then raise exception 'missing-branch-head' using errcode='22023';end if;
 for item in select value from jsonb_array_elements(m->'resolutionIds') loop
  if not exists(select 1 from public.custom_sync_receipts_v1 e where e.user_id=uid and e.operation_id=item#>>'{}' and e.result->>'status'='accepted' and e.request->>'resolvesOperationId'=m->>'conflictOperationId') then raise exception 'unproven-resolution' using errcode='22023';end if;
 end loop;
end $$;

create function public.apply_custom_transfer_v2(op jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); tid text:=op->>'transferId'; token text:=op->>'operationId'; action text:=op->>'action'; m jsonb; d jsonb; card jsonb;
 t public.custom_transfers_v2; old public.custom_transfer_receipts_v2; result jsonb; h text; charge bigint:=0; planned_bytes bigint; i integer; why text;begin
 if uid is null then raise exception 'Authentication required' using errcode='42501';end if;
 if not public.cd_keys_v1(op,array['schemaVersion','operationId','transferId','action','expectedRevision'],array['kind','manifest','index','body']) or op->'schemaVersion' is distinct from '2'::jsonb or
 not public.cd_text_v1(op->'operationId',128) or not public.cd_text_v1(op->'transferId',128) or octet_length(op::text)>524288 or jsonb_typeof(op->'action') is distinct from 'string' or action not in ('begin','chunk','validate','publish','complete','cancel') or
 jsonb_typeof(op->'expectedRevision') is distinct from 'string' or op->>'expectedRevision'!~'^(0|[1-9][0-9]{0,18})$' or (op->>'expectedRevision')::numeric>9223372036854775807 then raise exception 'Invalid transfer request' using errcode='22023';end if;
 if action='begin' and not public.cd_keys_v1(op,array['schemaVersion','operationId','transferId','action','expectedRevision','kind','manifest']) or
 action='chunk' and not public.cd_keys_v1(op,array['schemaVersion','operationId','transferId','action','expectedRevision','index','body']) or
 action not in ('begin','chunk') and not public.cd_keys_v1(op,array['schemaVersion','operationId','transferId','action','expectedRevision']) then raise exception 'Unexpected transfer fields' using errcode='22023';end if;
 insert into public.custom_sync_clock_v1(user_id) values(uid) on conflict do nothing;
 perform 1 from public.custom_sync_clock_v1 where user_id=uid for update;
 h:=public.cd_transfer_hash_v2(op::text);
 select * into old from public.custom_transfer_receipts_v2 where user_id=uid and operation_id=token;
 if found then if old.request_hash<>h then raise exception 'operationId reused' using errcode='22023';end if;return old.result;end if;
 insert into public.custom_transfer_usage_v2(user_id) values(uid) on conflict do nothing;
 if (select receipts>=8192 from public.custom_transfer_usage_v2 where user_id=uid) then raise exception 'owner-receipt-quota' using errcode='54000';end if;
 select * into t from public.custom_transfers_v2 where user_id=uid and transfer_id=tid;
 if coalesce(t.revision,0)::text<>op->>'expectedRevision' then raise exception 'transfer-revision-conflict' using errcode='40001';end if;
 if action='begin' then
  m:=op->'manifest';
  if jsonb_typeof(op->'kind') is distinct from 'string' or op->>'kind' not in ('guest-import','branch-archive') or not public.cd_keys_v1(m,array['schemaVersion','chunks'],case when op->>'kind'='guest-import' then array['namespace','source','baseServerRevision','cards','entities'] else array['cardId','identityKey','baseHead','head','conflictOperationId','operationIds','ancestorIds','resolutionIds'] end) or
   m->'schemaVersion' is distinct from '2'::jsonb or jsonb_typeof(m->'chunks') is distinct from 'array' or jsonb_array_length(m->'chunks') not between 1 and 128 then raise exception 'Invalid closed manifest' using errcode='22023';end if;
  i:=0;planned_bytes:=0;
  for d in select value from jsonb_array_elements(m->'chunks') loop
   if not public.cd_keys_v1(d,array['index','sha256','bytes']) or d->'index' is distinct from to_jsonb(i) or not public.cd_text_v1(d->'sha256',64) or d->>'sha256'!~'^[a-f0-9]{64}$' or
    not public.cd_int_v1(d->'bytes',524288) or (d->>'bytes')::integer<2 then raise exception 'Invalid chunk descriptor' using errcode='22023';end if;
   i:=i+1;planned_bytes:=planned_bytes+(d->>'bytes')::integer;
  end loop;
  if planned_bytes>8388608 then raise exception 'transfer-byte-quota' using errcode='54000';end if;
  if op->>'kind'='guest-import' then
   if not m ?& array['namespace','source','baseServerRevision','cards','entities'] or m->'source' is distinct from '"guest"'::jsonb or jsonb_typeof(m->'namespace') is distinct from 'string' or m->>'namespace'!~'^[a-f0-9-]{36}$' or jsonb_typeof(m->'baseServerRevision') is distinct from 'string' or m->>'baseServerRevision'!~'^(0|[1-9][0-9]{0,18})$' or
    jsonb_typeof(m->'cards') is distinct from 'array' or jsonb_array_length(m->'cards') not between 1 and 1000 or jsonb_typeof(m->'entities') is distinct from 'array' or jsonb_array_length(m->'entities') not between 1 and 8192 then raise exception 'Invalid Guest inventory' using errcode='22023';end if;
   for card in select value from jsonb_array_elements(m->'cards') loop
    if not public.cd_keys_v1(card,array['id','deckId','identityKey','contentVersion','confirmationId','history','snapshot','head','eventIds']) or
     not public.cd_text_v1(card->'id',256) or not public.cd_text_v1(card->'deckId',256) or not public.cd_text_v1(card->'identityKey',256) or
     not public.cd_int_v1(card->'contentVersion') or not public.cd_text_v1(card->'confirmationId',256) or jsonb_typeof(card->'history') is distinct from 'string' or card->>'history' not in ('new','history') or
     jsonb_typeof(card->'eventIds') is distinct from 'array' or jsonb_array_length(card->'eventIds')>8192 or
     (card->'head'<>'null' and not public.cd_text_v1(card->'head',256)) or (card->'snapshot'<>'null' and not public.cd_payload_v1('progress',card->>'id',card->'snapshot')) then raise exception 'Invalid card declaration' using errcode='22023';end if;
   end loop;
   if (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(m->'cards')) or (select count(*)<>count(distinct value) from jsonb_array_elements(m->'entities')) then raise exception 'Duplicate inventory' using errcode='22023';end if;
   for d in select value from jsonb_array_elements(m->'entities') loop
    if not public.cd_keys_v1(d,array['kind','id']) or not public.cd_text_v1(d->'id',256) or d->>'kind' not in ('deck','card','identity','volume-link','confirmation','manifest','progress','review-event','daily','equivalence') then raise exception 'Invalid entity declaration' using errcode='22023';end if;
   end loop;
  else
   if not m ?& array['cardId','identityKey','baseHead','head','conflictOperationId','operationIds','ancestorIds','resolutionIds'] or
    not public.cd_text_v1(m->'cardId',256) or not public.cd_text_v1(m->'identityKey',256) or not public.cd_text_v1(m->'conflictOperationId',256) or
    jsonb_typeof(m->'operationIds') is distinct from 'array' or jsonb_array_length(m->'operationIds') not between 1 and 8192 or
    jsonb_typeof(m->'ancestorIds') is distinct from 'array' or jsonb_array_length(m->'ancestorIds')>8192 or
    jsonb_typeof(m->'resolutionIds') is distinct from 'array' or jsonb_array_length(m->'resolutionIds')>100 or
    (m->'baseHead'<>'null' and not public.cd_text_v1(m->'baseHead',256)) or (m->'head'<>'null' and not public.cd_text_v1(m->'head',256)) then raise exception 'Invalid branch manifest' using errcode='22023';end if;
   for d in select value from jsonb_array_elements(m->'operationIds') union all select value from jsonb_array_elements(m->'ancestorIds') union all select value from jsonb_array_elements(m->'resolutionIds') loop
    if not public.cd_text_v1(d,256) then raise exception 'Invalid branch ID' using errcode='22023';end if;
   end loop;
  end if;
  if (select transfers>=32 from public.custom_transfer_usage_v2 where user_id=uid) then raise exception 'owner-transfer-quota' using errcode='54000';end if;
  insert into public.custom_transfers_v2(user_id,transfer_id,kind,manifest) values(uid,tid,op->>'kind',m);
  update public.custom_transfer_usage_v2 set transfers=transfers+1 where user_id=uid;charge:=octet_length(m::text);
 elsif t.state in ('published','complete','cancelled') then raise exception 'Terminal transfer' using errcode='22023';
 elsif action='chunk' then
  if not(t.state='staging' or t.state='blocked' and t.reason='incomplete-chunks') or not public.cd_int_v1(op->'index',127) or jsonb_typeof(op->'body') is distinct from 'string' then raise exception 'Invalid chunk state' using errcode='22023';end if;
  d:=t.manifest->'chunks'->(op->>'index')::integer;
  if d is null or public.cd_transfer_hash_v2(op->>'body')<>d->>'sha256' or octet_length(op->>'body')<>(d->>'bytes')::integer then raise exception 'Chunk mismatch' using errcode='22023';end if;
  if exists(select 1 from public.custom_transfer_chunks_v2 where user_id=uid and transfer_id=tid and chunk_index=(op->>'index')::integer) then raise exception 'Chunk immutable; use original receipt' using errcode='22023';end if;
  insert into public.custom_transfer_chunks_v2 values(uid,tid,(op->>'index')::integer,op->>'body',d->>'sha256');charge:=octet_length(op->>'body');
  update public.custom_transfers_v2 set state='staging',reason=null,revision=revision+1 where user_id=uid and transfer_id=tid;
 elsif action='cancel' then
  update public.custom_transfers_v2 set state='cancelled',reason='explicit-cancellation',revision=revision+1 where user_id=uid and transfer_id=tid;
 else
  if action='publish' and (t.kind<>'guest-import' or t.state<>'ready-to-publish') or action='complete' and t.kind<>'branch-archive' then raise exception 'Invalid transition' using errcode='22023';end if;
  if t.kind='guest-import' then
   begin
    perform public.cd_publish_transfer_v2(uid,tid,t.manifest);
    if action='validate' then raise exception 'validation-probe-rollback' using errcode='ZV002';end if;
    update public.custom_transfers_v2 set state='published',reason=null,revision=revision+1 where user_id=uid and transfer_id=tid;
   exception
    when sqlstate 'ZV002' then update public.custom_transfers_v2 set state='ready-to-publish',reason=null,revision=revision+1 where user_id=uid and transfer_id=tid;
    when check_violation or foreign_key_violation or unique_violation or invalid_parameter_value then
     -- Subtransaction rolls back ALL canonical rows, V1 receipts and clock changes.
     get stacked diagnostics why=message_text;
     update public.custom_transfers_v2 set state='blocked',reason=case when why in ('incomplete-chunks','destination-revision-conflict','false-new-card','missing-or-different-history','incomplete-events','import-cas-or-tombstone-conflict','import-operation-already-used','closed-inventory-mismatch','guest-provenance-mismatch') then why else 'invalid-generation' end,revision=revision+1 where user_id=uid and transfer_id=tid;
   end;
  else
   perform public.cd_verify_branch_v2(uid,tid,t.manifest);
   update public.custom_transfers_v2 set state='complete',reason=null,revision=revision+1 where user_id=uid and transfer_id=tid;
  end if;
 end if;
 update public.custom_transfers_v2 set updated_at=now() where user_id=uid and transfer_id=tid;
 select jsonb_build_object('schemaVersion',2,'transferId',transfer_id,'operationId',token,'kind',kind,'state',state,'revision',revision::text,'reason',reason) into result from public.custom_transfers_v2 where user_id=uid and transfer_id=tid;
 -- Conservative reserved overhead includes hash/receipt/index metadata. No request/body duplication.
 charge:=charge+2048;
 update public.custom_transfer_usage_v2 set bytes=bytes+charge,receipts=receipts+1 where user_id=uid;
 insert into public.custom_transfer_receipts_v2(user_id,operation_id,request_hash,result) values(uid,token,h,result);
 return result;
end $$;

create function public.get_custom_transfer_v2(transfer_id text,after_index integer default -1) returns jsonb
language plpgsql stable security invoker set search_path='' as $$ declare result jsonb;begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501';end if;
 if after_index is null or after_index not between -1 and 127 then raise exception 'Invalid cursor' using errcode='22023';end if;
 select jsonb_build_object('schemaVersion',2,'transferId',t.transfer_id,'kind',t.kind,'state',t.state,'revision',t.revision::text,'reason',t.reason,'manifest',t.manifest,
  'chunk',(select jsonb_build_object('index',c.chunk_index,'body',c.body,'sha256',c.digest) from public.custom_transfer_chunks_v2 c where c.user_id=auth.uid() and c.transfer_id=t.transfer_id and c.chunk_index>after_index order by c.chunk_index limit 1)) into result
 from public.custom_transfers_v2 t where t.user_id=auth.uid() and t.transfer_id=$1;
 return result;
end $$;
do $$ declare f record;begin
 for f in select oid::regprocedure signature from pg_proc where pronamespace='public'::regnamespace and (proname like 'cd_%_v2' or proname in ('apply_custom_transfer_v2','get_custom_transfer_v2')) loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 end loop;
end $$;
grant execute on function public.apply_custom_transfer_v2(jsonb) to authenticated;
grant execute on function public.get_custom_transfer_v2(text,integer) to authenticated;
commit;
