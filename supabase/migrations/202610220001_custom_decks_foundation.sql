-- H4A only. No legacy writes, transport activation, or automatic production deployment.
begin;

create function public.cd_keys_v1(p jsonb, required text[], optional text[] default '{}') returns boolean
language sql immutable set search_path='' as $$
 select coalesce(jsonb_typeof(p)='object' and p ?& required and not exists
 (select 1 from jsonb_object_keys(p) k where not(k=any(required||optional))),false)
$$;
create function public.cd_text_v1(p jsonb, bytes integer, chars integer default 2147483647) returns boolean
language sql immutable set search_path='' as $$
 select coalesce(jsonb_typeof(p)='string' and length(btrim(p#>>'{}'))>0 and
 octet_length(p#>>'{}')<=bytes and length(p#>>'{}')<=chars and (p#>>'{}')!~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]',false)
$$;
create function public.cd_int_v1(p jsonb, maximum numeric default 9007199254740991) returns boolean
language plpgsql immutable set search_path='' as $$ begin
 return coalesce(jsonb_typeof(p)='number' and (p::text)::numeric between 0 and maximum and trunc((p::text)::numeric)=(p::text)::numeric,false);
 exception when others then return false; end $$;
-- H1 canonical JSON for hashes of string-only anchors/arrays, never of floating-point FSRS.
create function public.cd_canonical_v1(p jsonb) returns text language plpgsql immutable set search_path='' as $$
declare result text; begin
 if jsonb_typeof(p)='object' then select '{'||coalesce(string_agg(to_jsonb(key)::text||':'||public.cd_canonical_v1(value),',' order by key collate "C"),'')||'}' into result from jsonb_each(p);
 elsif jsonb_typeof(p)='array' then select '['||coalesce(string_agg(public.cd_canonical_v1(value),',' order by ordinal),'')||']' into result from jsonb_array_elements(p) with ordinality a(value,ordinal);
 else result:=p::text; end if; return result; end $$;
create function public.cd_hash_v1(prefix text,p jsonb) returns text language sql immutable set search_path='' as $$
 select prefix||encode(sha256(convert_to(public.cd_canonical_v1(p),'UTF8')),'hex')
$$;
create function public.cd_utf16_slice_v1(t text,a integer,b integer) returns text language plpgsql immutable set search_path='' as $$
declare i integer; pos integer:=0; ch text; out_text text:=''; begin
 if a<0 or b<=a then return null;end if;
 for i in 1..length(t) loop ch:=substr(t,i,1);
  if pos<a and pos+(case when ascii(ch)>65535 then 2 else 1 end)>a then return null;end if;
  if pos>=a and pos<b then out_text:=out_text||ch;end if;
  pos:=pos+case when ascii(ch)>65535 then 2 else 1 end;
  if pos=b then return out_text;end if;if pos>b then return null;end if;
 end loop;return null;end $$;
create function public.cd_snapshot_v1(p jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare k text; begin
 if not public.cd_keys_v1(p,array['due','stability','difficulty','elapsedDays','scheduledDays','learningSteps','reps','lapses','state','lastReview']) then return false; end if;
 foreach k in array array['due','learningSteps','reps','lapses'] loop if not public.cd_int_v1(p->k) then return false; end if; end loop;
 foreach k in array array['stability','difficulty','elapsedDays','scheduledDays'] loop
  if jsonb_typeof(p->k)<>'number' or (p->>k)::numeric<0 then return false; end if;
 end loop;
 return (p->>'difficulty')::numeric<=10 and public.cd_int_v1(p->'state',3) and
 (p->'lastReview'='null'::jsonb or public.cd_int_v1(p->'lastReview'));
 exception when others then return false; end $$;
create function public.cd_identity_v1(p jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare i jsonb; a jsonb; begin
 if not public.cd_keys_v1(p,array['schemaVersion','id','identity','word','reading','origin','expertCertified','originReference','registryNamespace','branch']) or
 p->'schemaVersion'<>'1' or p->>'origin'<>'explicit-user-confirmation' or p->'expertCertified'<>'false' or
 not public.cd_text_v1(p->'word',1024,256) or not public.cd_text_v1(p->'reading',1024,256) or
 not public.cd_text_v1(p->'branch',128) or p->>'originReference'!~'^ocr-[a-f0-9]{64}$' or
 p->>'registryNamespace'!~'^[a-f0-9-]{36}$' then return false; end if;
 i:=p->'identity';a:=i->'anchor';
 return public.cd_keys_v1(i,array['schemaVersion','key','anchor','spellings','evidenceVersion']) and i->'schemaVersion'='1' and
 public.cd_keys_v1(a,array['authority','entryId','canonicalReading','homographGroup']) and
 a->>'authority'='kana-study-curated' and a->>'entryId'=p->>'id' and a->>'canonicalReading'=p->>'reading' and
 a->>'homographGroup'='manga-user-entity-v1' and i->>'evidenceVersion'='manga-user-entity-v1' and i->'spellings'=jsonb_build_array(p->>'word') and
 i->>'key'=public.cd_hash_v1('lex1-',a) and p->>'id'=public.cd_hash_v1('mce-',jsonb_build_object(
 'registryNamespace',p->>'registryNamespace','originReference',p->>'originReference','word',p->>'word','reading',p->>'reading','branch',p->>'branch','policy','manga-user-entity-v1'));
 exception when others then return false; end $$;
create function public.cd_payload_impl_v1(kind text,id text,p jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare k text; g jsonb; s jsonb; limit_bytes integer; begin
 limit_bytes:=case kind when 'card' then 32768 when 'confirmation' then 262144 when 'manifest' then 1048576 else 32768 end;
 if p is null then return kind='progress'; end if;
 if octet_length(p::text)>limit_bytes then return false; end if;
 if kind='progress' and p='null'::jsonb then return true; end if;
 if jsonb_typeof(p)<>'object' then return false; end if;
 if exists(select 1 from jsonb_each(p) e where value='null'::jsonb and not
  (kind='confirmation' and key='selectedProposal' or kind='review-event' and key in ('cardBefore','retrievabilityBefore') or kind='daily' and key in ('completedAt','newLimitOverride'))) then return false;end if;
 foreach k in array array['id','deckId','entryId','word','reading','createdAt','updatedAt'] loop
  if p ? k and jsonb_typeof(p->k)<>'string' then return false;end if;
 end loop;
 if kind in ('deck','card','identity','volume-link','confirmation','equivalence','manifest') and p->'schemaVersion' is distinct from '1'::jsonb then return false; end if;
 case kind
 when 'identity' then return p->>'id'=id and public.cd_identity_v1(p);
 when 'deck' then
  s:=p->'settings';return public.cd_keys_v1(p,array['schemaVersion','id','title','contentType','settings','status','createdAt','updatedAt']) and p->>'id'=id and id like 'md-%' and
  public.cd_text_v1(p->'title',640,160) and p->>'contentType'='japanese-word' and p->>'status' in ('active','archived') and
  public.cd_keys_v1(s,array['desiredRetention','newCardsPerDay','newCardOrder']) and (s->>'desiredRetention')::numeric>0 and (s->>'desiredRetention')::numeric<1 and
  public.cd_int_v1(s->'newCardsPerDay',10000) and s->>'newCardOrder' in ('mixed','before-reviews','after-reviews') and
  (p->>'createdAt')::timestamptz is not null and (p->>'updatedAt')::timestamptz is not null;
 when 'card' then
  if not public.cd_keys_v1(p,array['schemaVersion','id','deckId','lexicalIdentity','direction','word','reading','glosses','order','contentVersion','createdAt','updatedAt'],array['context']) or
   p->>'id'<>id or not public.cd_text_v1(p->'deckId',256) or p->>'direction'<>'japanese-to-meaning' or
   not public.cd_text_v1(p->'word',1024,256) or not public.cd_text_v1(p->'reading',1024,256) or
   not public.cd_int_v1(p->'order') or not public.cd_int_v1(p->'contentVersion') or (p->>'contentVersion')::numeric<1 or
   jsonb_typeof(p->'glosses')<>'array' or jsonb_array_length(p->'glosses') not between 1 and 3 then return false; end if;
  for g in select * from jsonb_array_elements(p->'glosses') loop
  if not public.cd_keys_v1(g,array['text','language','source']) or not public.cd_text_v1(g->'text',8000,2000) or coalesce(g->>'language','') not in ('es','en','ca') or
    not public.cd_keys_v1(g->'source',array['kind','sourceId','revision']) or g#>>'{source,kind}' is distinct from 'user' or not public.cd_text_v1(g#>'{source,sourceId}',256) or g#>>'{source,revision}' is distinct from 'receipt-v1' then return false; end if;
  end loop;
  if p ? 'context' then
   s:=p->'context';if not public.cd_keys_v1(s,array['text'],array['sourceTitle','pageNumber']) or not public.cd_text_v1(s->'text',4800,1200) or
    (s ? 'sourceTitle' and not public.cd_text_v1(s->'sourceTitle',640)) or (s ? 'pageNumber' and (not public.cd_int_v1(s->'pageNumber') or (s->>'pageNumber')::numeric<1)) then return false; end if;
  end if;
  return id=public.cd_hash_v1('mc-',jsonb_build_array(p->>'deckId',p#>>'{lexicalIdentity,key}','japanese-to-meaning')) and (p->>'createdAt')::timestamptz is not null and (p->>'updatedAt')::timestamptz is not null;
 when 'volume-link' then return public.cd_keys_v1(p,array['schemaVersion','volumeId','deckId']) and p->>'deckId'=id and public.cd_text_v1(p->'volumeId',4096) and
  id=public.cd_hash_v1('md-',jsonb_build_array('manga-assisted-v1',p->>'volumeId'));
 when 'confirmation' then
  if not public.cd_keys_v1(p,array['schemaVersion','id','workspace','actor','confirmedAt','source','entity','selectedProposal','alternatives','totalAlternatives','confirmedMeaning','meaningLanguage','reusedEntity','expertCertified']) or
   p->>'id'<>id or p->'expertCertified'<>'false' or not coalesce(public.cd_identity_v1(p->'entity'),false) or
   not public.cd_text_v1(p->'confirmedMeaning',8000,2000) or p->>'meaningLanguage' not in ('es','en','ca') or jsonb_typeof(p->'reusedEntity')<>'boolean' or
   not public.cd_keys_v1(p->'actor',array['kind','workspace']) or p#>>'{actor,kind}' is distinct from 'local-workspace-user' or p#>>'{actor,workspace}'<>p->>'workspace' or
   not(p->>'workspace'='guest' or p->>'workspace' like 'user:%') or (p->>'confirmedAt')::timestamptz is null or
   jsonb_typeof(p->'alternatives')<>'array' or jsonb_array_length(p->'alternatives')>16 or not public.cd_int_v1(p->'totalAlternatives') or
   (p->>'totalAlternatives')::numeric<jsonb_array_length(p->'alternatives') then return false; end if;
  s:=p->'source';if not public.cd_keys_v1(s,array['volumeId','volumeTitle','pageNumber','blockIndex','lineIndex','range','fragment','surface'],array['savedItemId']) or
   not public.cd_text_v1(s->'volumeId',4096) or not public.cd_text_v1(s->'volumeTitle',640) or not public.cd_text_v1(s->'fragment',4800,1200) or not public.cd_text_v1(s->'surface',1024) or
   not public.cd_int_v1(s->'pageNumber') or (s->>'pageNumber')::numeric<1 or not public.cd_int_v1(s->'blockIndex') or not public.cd_int_v1(s->'lineIndex') or
   jsonb_typeof(s->'range')<>'array' or jsonb_array_length(s->'range')<>2 or not public.cd_int_v1(s#>'{range,0}') or not public.cd_int_v1(s#>'{range,1}') or
   (s#>>'{range,1}')::numeric<=(s#>>'{range,0}')::numeric or (s ? 'savedItemId' and not public.cd_text_v1(s->'savedItemId',20000)) then return false; end if;
  if s->>'surface' is distinct from public.cd_utf16_slice_v1(s->>'fragment',(s#>>'{range,0}')::integer,(s#>>'{range,1}')::integer) or
   not public.cd_text_v1(p#>'{actor,workspace}',4096) or p#>'{actor,workspace}' is distinct from p->'workspace' then return false;end if;
  if p->'reusedEntity'='false' and p#>>'{entity,originReference}' is distinct from public.cd_hash_v1('ocr-',jsonb_build_object('volumeId',s->>'volumeId','page',s->'pageNumber','block',s->'blockIndex','line',s->'lineIndex','range',s->'range','fragment',s->>'fragment','surface',s->>'surface')) then return false;end if;
  for g in select value from jsonb_array_elements(p->'alternatives') union all select p->'selectedProposal' where p->'selectedProposal'<>'null' loop
   if not public.cd_keys_v1(g,array['localId','dictionaryId','expression','reading','sequence','glosses','glossLanguage','totalGlosses']) or
    not public.cd_text_v1(g->'localId',4096) or not public.cd_text_v1(g->'dictionaryId',256) or not public.cd_text_v1(g->'expression',1024) or
    not public.cd_text_v1(g->'reading',1024) or jsonb_typeof(g->'sequence')<>'number' or abs((g->>'sequence')::numeric)>9007199254740991 or trunc((g->>'sequence')::numeric)<>(g->>'sequence')::numeric or
    g->>'glossLanguage' is distinct from 'es' or jsonb_typeof(g->'glosses')<>'array' or jsonb_array_length(g->'glosses')>4 or not public.cd_int_v1(g->'totalGlosses') or
    (g->>'totalGlosses')::numeric<jsonb_array_length(g->'glosses') or exists(select 1 from jsonb_array_elements(g->'glosses') v where not public.cd_text_v1(v,8000,2000)) then return false; end if;
  end loop;return true;
 when 'equivalence' then return public.cd_keys_v1(p,array['schemaVersion','id','left','right','scope','evidence','revoked','expertCertified']) and
  p->>'id'=id and p->>'left'<>p->>'right' and public.cd_text_v1(p->'left',256) and public.cd_text_v1(p->'right',256) and
  p->>'left' ~ '^lex1-[a-f0-9]{64}$' and p->>'right' ~ '^lex1-[a-f0-9]{64}$' and
  p->>'scope'='owner-local' and p->'expertCertified'='false' and public.cd_text_v1(p->'evidence',8192) and jsonb_typeof(p->'revoked')='boolean';
 when 'progress' then return public.cd_keys_v1(p,array['deckId','entryId','due','state','card']) and p->>'entryId'=id and public.cd_text_v1(p->'deckId',256) and
  public.cd_snapshot_v1(p->'card') and p->'due'=p#>'{card,due}' and p->'state'=p#>'{card,state}';
 when 'review-event' then
  if not public.cd_keys_v1(p,array['id','deckId','entryId','reviewedAt','rating','fsrsRating','stateBefore','stateAfter','dueBefore','dueAfter','stabilityBefore','stabilityAfter','difficultyBefore','difficultyAfter','retrievabilityBefore','desiredRetention','elapsedAnswerMs','fsrsLog','cardBefore']) or
   p->>'id'<>id or not public.cd_text_v1(p->'entryId',256) or not public.cd_text_v1(p->'deckId',256) or p->>'rating' not in ('again','good') or
   p->>'fsrsRating'<>(case p->>'rating' when 'again' then '1' else '3' end) or
   not public.cd_int_v1(p->'reviewedAt') or not public.cd_int_v1(p->'stateBefore',3) or not public.cd_int_v1(p->'stateAfter',3) or
   (p->'cardBefore'<>'null' and not public.cd_snapshot_v1(p->'cardBefore')) then return false; end if;
  foreach k in array array['dueBefore','dueAfter','stabilityBefore','stabilityAfter','difficultyBefore','difficultyAfter','elapsedAnswerMs','desiredRetention'] loop
   if jsonb_typeof(p->k)<>'number' or (p->>k)::numeric<0 then return false; end if;
  end loop;
  s:=p->'fsrsLog';return (p->>'elapsedAnswerMs')::numeric<=10000 and (p->>'desiredRetention')::numeric>0 and (p->>'desiredRetention')::numeric<1 and
   public.cd_keys_v1(s,array['rating','state','due','stability','difficulty','elapsedDays','lastElapsedDays','scheduledDays','learningSteps','review']) and
   not exists(select 1 from jsonb_each(s) e where jsonb_typeof(value)<>'number' or (value::text)::numeric<0) and s->'rating'=p->'fsrsRating' and (s->>'review')::numeric<=(p->>'reviewedAt')::numeric and
   (p->'retrievabilityBefore'='null' or (jsonb_typeof(p->'retrievabilityBefore')='number' and (p->>'retrievabilityBefore')::numeric between 0 and 1));
 when 'daily' then return public.cd_keys_v1(p,array['deckId','localDate','introducedEntryIds','newLimitOverride'],array['completedAt']) and public.cd_text_v1(p->'deckId',256) and
  p->>'localDate' ~ '^\d{4}-\d{2}-\d{2}$' and (p->>'localDate')::date is not null and jsonb_typeof(p->'introducedEntryIds')='array' and jsonb_array_length(p->'introducedEntryIds')<=1000 and
  not exists(select 1 from jsonb_array_elements(p->'introducedEntryIds') v where not public.cd_text_v1(v,256)) and
  (p->'newLimitOverride'='null' or public.cd_int_v1(p->'newLimitOverride')) and (not(p ? 'completedAt') or p->'completedAt'='null' or public.cd_int_v1(p->'completedAt')) and
  id=public.cd_hash_v1('day-',jsonb_build_array(p->>'deckId',p->>'localDate'));
 when 'manifest' then return public.cd_keys_v1(p,array['schemaVersion','deckId','cardIds'],array['references']) and p->>'deckId'=id and jsonb_typeof(p->'cardIds')='array' and
  jsonb_array_length(p->'cardIds')<=1000 and not exists(select 1 from jsonb_array_elements(p->'cardIds') v where not public.cd_text_v1(v,256)) and
  (select count(*)=count(distinct value) from jsonb_array_elements(p->'cardIds'));
 else return false; end case;
 exception when others then return false; end $$;
create function public.cd_payload_v1(kind text,id text,p jsonb) returns boolean language sql immutable set search_path='' as $$
 select coalesce(public.cd_payload_impl_v1(kind,id,p),false)
$$;

create table public.custom_sync_clock_v1(user_id uuid primary key references auth.users(id) on delete cascade, revision bigint not null default 0 check(revision>=0));
create table public.custom_sync_entities_v1(
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('deck','card','identity','volume-link','confirmation','equivalence','progress','review-event','daily','manifest')),
 entity_id text not null check(octet_length(entity_id) between 1 and 256), payload jsonb,
 revision bigint not null check(revision>0), deleted_at timestamptz, archived boolean not null default false,
 deck_id text, identity_id text, card_id text, head text, voided_by text,
 deck_kind text generated always as ('deck'::text) stored,
 identity_kind text generated always as ('identity'::text) stored,
 card_kind text generated always as ('card'::text) stored,
 event_kind text generated always as ('review-event'::text) stored,
 primary key(user_id,kind,entity_id),
 foreign key(user_id,deck_kind,deck_id) references public.custom_sync_entities_v1(user_id,kind,entity_id) deferrable initially deferred,
 foreign key(user_id,identity_kind,identity_id) references public.custom_sync_entities_v1(user_id,kind,entity_id) deferrable initially deferred,
 foreign key(user_id,card_kind,card_id) references public.custom_sync_entities_v1(user_id,kind,entity_id) deferrable initially deferred,
 foreign key(user_id,event_kind,head) references public.custom_sync_entities_v1(user_id,kind,entity_id) deferrable initially deferred,
 check(deleted_at is not null or kind not in ('card','volume-link','confirmation','progress','review-event','daily','manifest') or deck_id is not null),
 check(deleted_at is not null or kind not in ('card','confirmation') or identity_id is not null),
 check(deleted_at is not null or kind not in ('confirmation','progress','review-event') or card_id is not null),
 check(deleted_at is not null or public.cd_payload_v1(kind,entity_id,payload))
);
create index custom_sync_deck_v1 on public.custom_sync_entities_v1(user_id,deck_id,kind);
create index custom_sync_revision_v1 on public.custom_sync_entities_v1(user_id,revision);
create unique index custom_sync_card_identity_v1 on public.custom_sync_entities_v1(user_id,deck_id,identity_id)
 where kind='card' and deleted_at is null;
create table public.custom_sync_receipts_v1(
 user_id uuid not null references auth.users(id) on delete cascade,
 operation_id text not null check(octet_length(operation_id) between 1 and 256),
 request jsonb not null check(octet_length(request::text)<=524288), result jsonb not null check(octet_length(result::text)<=2097152),
 created_at timestamptz not null default now(), primary key(user_id,operation_id)
);
create table public.custom_sync_conflicts_v1(
 user_id uuid not null, operation_id text not null, reason text not null, evidence jsonb not null,
 primary key(user_id,operation_id),foreign key(user_id,operation_id) references public.custom_sync_receipts_v1(user_id,operation_id) on delete cascade
);
do $$ declare t text; begin
 foreach t in array array['custom_sync_clock_v1','custom_sync_entities_v1','custom_sync_receipts_v1','custom_sync_conflicts_v1'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy owner_read on public.%I for select to authenticated using(user_id=(select auth.uid()))',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
 end loop;end $$;

create function public.apply_custom_deck_operation_v1(op jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); action text:=op->>'action'; token text:=op->>'operationId'; c jsonb; r public.custom_sync_entities_v1;
 old_receipt public.custom_sync_receipts_v1; reason text; clock bigint; rows_out jsonb:='[]'; result jsonb; p jsonb;
 pk text; ek text; deck text; ident text; card text; prev_head text; progress_change jsonb; event_change jsonb; event_row public.custom_sync_entities_v1;
 counter integer; refs jsonb; manifest_changes jsonb; start_clock bigint; auto_deck text; begin
 if uid is null then raise exception 'Authentication required' using errcode='42501';end if;
 if not public.cd_keys_v1(op,array['schemaVersion','operationId','action','changes'],array['expectedHead','before','intent','resolvesOperationId']) or
 op->'schemaVersion' is distinct from '1'::jsonb or not public.cd_text_v1(op->'operationId',256) or octet_length(op::text)>524288 or
 action is null or action not in ('stage','publish','edit','daily','review','undo','import-history','archive','delete','restore','revoke') or
 jsonb_typeof(op->'changes')<>'array' or jsonb_array_length(op->'changes') not between 1 and 64 then raise exception 'Invalid custom operation' using errcode='22023';end if;
 if op ? 'resolvesOperationId' and not public.cd_text_v1(op->'resolvesOperationId',256) or
  op ? 'expectedHead' and op->'expectedHead'<>'null' and not public.cd_text_v1(op->'expectedHead',256) or
  op ? 'before' and op->'before'<>'null' and not public.cd_snapshot_v1(op->'before') then raise exception 'Invalid operation metadata' using errcode='22023';end if;
 if op ? 'intent' and (not public.cd_keys_v1(op->'intent',array['schemaVersion','deck','card','expectedContentVersion','confirmation']) or op#>'{intent,schemaVersion}' is distinct from '1'::jsonb or
  not(op#>'{intent,expectedContentVersion}'='null' or public.cd_int_v1(op#>'{intent,expectedContentVersion}')) or
  not public.cd_payload_v1('deck',op#>>'{intent,deck,id}',op#>'{intent,deck}') or not public.cd_payload_v1('card',op#>>'{intent,card,id}',op#>'{intent,card}') or
  not public.cd_payload_v1('confirmation',op#>>'{intent,confirmation,id}',op#>'{intent,confirmation}')) then raise exception 'Invalid original intent' using errcode='22023';end if;
 insert into public.custom_sync_clock_v1(user_id) values(uid) on conflict do nothing;
 select revision into clock from public.custom_sync_clock_v1 where user_id=uid for update;
 start_clock:=clock;
 select * into old_receipt from public.custom_sync_receipts_v1 where user_id=uid and operation_id=token;
 if found then if old_receipt.request is distinct from op then raise exception 'operationId reused for different request' using errcode='22023';end if;return old_receipt.result;end if;
 if (select count(*)<>count(distinct jsonb_build_array(value->>'kind',value->>'id')) from jsonb_array_elements(op->'changes')) then raise exception 'Duplicate entity changes' using errcode='22023';end if;
 for c in select * from jsonb_array_elements(op->'changes') loop
  pk:=c->>'kind';ek:=c->>'id';
  if not public.cd_keys_v1(c,array['kind','id','baseRevision','payload'],array['parentHead','voidedBy']) or not public.cd_text_v1(c->'id',256) or
   pk is null or pk not in ('deck','card','identity','volume-link','confirmation','equivalence','progress','review-event','daily','manifest') or
   jsonb_typeof(c->'baseRevision')<>'string' or c->>'baseRevision'!~'^(0|[1-9][0-9]{0,18})$' or (c->>'baseRevision')::numeric>9223372036854775807 then raise exception 'Invalid change' using errcode='22023';end if;
  if action not in ('delete','archive','revoke') and not public.cd_payload_v1(pk,ek,c->'payload') then raise exception 'Invalid custom payload: %',pk using errcode='22023';end if;
  if action in ('stage','publish','edit') and pk in ('progress','review-event','daily') then raise exception 'Study requires review/import RPC action' using errcode='22023';end if;
  if action='stage' and pk='manifest' then raise exception 'Staging cannot publish' using errcode='22023';end if;
  if (c ? 'parentHead' or c ? 'voidedBy') and (action<>'import-history' or pk<>'review-event') then raise exception 'Import metadata only' using errcode='22023';end if;
  if c ? 'parentHead' and c->'parentHead'<>'null' and not public.cd_text_v1(c->'parentHead',256) or c ? 'voidedBy' and c->'voidedBy'<>'null' and not public.cd_text_v1(c->'voidedBy',256) then raise exception 'Invalid import metadata' using errcode='22023';end if;
  if action='daily' and (pk<>'daily' or jsonb_array_length(op->'changes')<>1) then raise exception 'Invalid daily action' using errcode='22023';end if;
  if action in ('review','undo','import-history') and pk not in ('progress','review-event','daily') then raise exception 'Invalid study change' using errcode='22023';end if;
  if action in ('archive','delete','revoke') and (jsonb_array_length(op->'changes')<>1 or pk not in ('deck','card','equivalence')) then raise exception 'Invalid lifecycle action' using errcode='22023';end if;
  if action='restore' and pk in ('progress','review-event','daily') then raise exception 'Restore cannot replace study history' using errcode='22023';end if;
  if action in ('archive','delete','revoke') and c->'payload' is distinct from 'null'::jsonb then raise exception 'Lifecycle payload must be null' using errcode='22023';end if;
  if action='archive' and pk<>'deck' or action='revoke' and pk<>'equivalence' then raise exception 'Invalid lifecycle kind' using errcode='22023';end if;
  select * into r from public.custom_sync_entities_v1 where user_id=uid and kind=pk and entity_id=ek;
  if action in ('archive','delete') or action='restore' and r.deleted_at is not null then auto_deck:=case when pk='deck' then ek else coalesce(r.deck_id,c#>>'{payload,deckId}') end;end if;
  if coalesce(r.revision,0)<>(c->>'baseRevision')::bigint then reason:='revision-conflict';exit;end if;
  if action='import-history' and pk='review-event' and exists(select 1 from public.custom_sync_entities_v1 existing where existing.user_id=uid and existing.kind='progress' and existing.entity_id=c#>>'{payload,entryId}') then reason:='import-existing-progress';exit;end if;
  if r.deleted_at is not null and action<>'restore' then reason:='tombstoned';exit;end if;
  if action<>'delete' and exists(select 1 from public.custom_sync_entities_v1 d where d.user_id=uid and d.kind='deck' and d.entity_id=coalesce(r.deck_id,c#>>'{payload,deckId}') and d.deleted_at is not null) then reason:='parent-deleted';exit;end if;
  if action not in ('delete','restore') and pk in ('progress','review-event','confirmation') and exists(select 1 from public.custom_sync_entities_v1 x where x.user_id=uid and x.kind='card' and x.entity_id=case when pk='progress' then ek else coalesce(r.card_id,c#>>'{payload,entryId}') end and x.deleted_at is not null) then reason:='parent-deleted';exit;end if;
  if action='restore' and r.deleted_at is null and r.revision is not null and r.payload is distinct from c->'payload' then reason:='restore-auxiliary-conflict';exit;end if;
  if pk='daily' and coalesce(r.payload->'completedAt','null')<>'null' and
   (action='review' or r.payload->'completedAt' is distinct from c#>'{payload,completedAt}') then reason:='completed-day-conflict';exit;end if;
  if pk='daily' and action='daily' and coalesce(r.payload->'introducedEntryIds','[]') is distinct from c#>'{payload,introducedEntryIds}' then raise exception 'Introductions require review/import' using errcode='22023';end if;
  if pk='daily' and action in ('review','undo') then
   select value->>'id' into card from jsonb_array_elements(op->'changes') where value->>'kind'='progress';
   select coalesce(jsonb_agg(value order by value),'[]') into refs from (
    select value from jsonb_array_elements(coalesce(r.payload->'introducedEntryIds','[]')) where not(action='undo' and value=to_jsonb(card) and exists
     (select 1 from public.custom_sync_entities_v1 e where e.user_id=uid and e.kind='review-event' and e.entity_id=op->>'expectedHead' and e.payload->'cardBefore'='null'))
    union select to_jsonb(card) where action='review' and op->'before'='null') introduced;
   if refs is distinct from (select coalesce(jsonb_agg(value order by value),'[]') from jsonb_array_elements(c#>'{payload,introducedEntryIds}')) then raise exception 'Daily introduction mismatch' using errcode='22023';end if;
  end if;
  if r.revision is not null and pk in ('identity','confirmation','volume-link') and r.payload is distinct from c->'payload' then reason:='immutable-evidence';exit;end if;
  if action in ('stage','edit') and exists(select 1 from public.custom_sync_entities_v1 m where m.user_id=uid and m.kind='manifest' and m.entity_id=coalesce(r.deck_id,case when pk='deck' then ek else c#>>'{payload,deckId}' end) and m.deleted_at is null) then reason:='published-content-requires-manifest';exit;end if;
 end loop;
 if reason is null and action='restore' and (select count(*) from jsonb_array_elements(op->'changes') x join public.custom_sync_entities_v1 e on e.user_id=uid and e.kind=x->>'kind' and e.entity_id=x->>'id' where e.deleted_at is not null)<>1 then reason:='restore-target-conflict';end if;
 if reason is null and action in ('review','undo','import-history') and (action<>'import-history' or exists(select 1 from jsonb_array_elements(op->'changes') where value->>'kind'='progress')) then
  select value into progress_change from jsonb_array_elements(op->'changes') where value->>'kind'='progress';
  if progress_change is null or (select count(*) from jsonb_array_elements(op->'changes') where value->>'kind'='progress')<>1 or
   not(op ?& array['expectedHead','before']) then raise exception 'Missing progress base' using errcode='22023';end if;
  if action in ('review','undo') and (jsonb_array_length(op->'changes')<>3 or (select count(*) from jsonb_array_elements(op->'changes') where value->>'kind'='daily')<>1) then raise exception 'Study requires atomic progress/event/day' using errcode='22023';end if;
  card:=progress_change->>'id';
  select * into r from public.custom_sync_entities_v1 where user_id=uid and kind='progress' and entity_id=card;
  if action<>'import-history' and (to_jsonb(r.head) is distinct from nullif(op->'expectedHead','null'::jsonb) or coalesce(r.payload->'card','null') is distinct from op->'before') then reason:='history-head-conflict';end if;
  if action='import-history' and r.revision is not null then reason:='import-existing-progress';end if;
  if action='undo' then
   select * into event_row from public.custom_sync_entities_v1 where user_id=uid and kind='review-event' and entity_id=r.head;
   select value into event_change from jsonb_array_elements(op->'changes') where value->>'kind'='review-event';
   if event_row.entity_id is null or event_row.voided_by is not null or event_change->>'id' is distinct from event_row.entity_id or event_change->'payload' is distinct from event_row.payload then reason:='stale-undo';
   elsif progress_change->'payload' is distinct from (case when event_row.payload->'cardBefore'='null' then 'null'::jsonb else jsonb_build_object('deckId',event_row.deck_id,'entryId',card,'due',event_row.payload#>'{cardBefore,due}','state',event_row.payload#>'{cardBefore,state}','card',event_row.payload->'cardBefore') end) then raise exception 'Undo result mismatch' using errcode='22023';end if;
  else
   select value into event_change from jsonb_array_elements(op->'changes') where value->>'kind'='review-event' and value->>'id'=case when action='import-history' then op->>'expectedHead' else value->>'id' end limit 1;
   if event_change is null or (action='review' and (select count(*) from jsonb_array_elements(op->'changes') where value->>'kind'='review-event')<>1) then raise exception 'Invalid review event' using errcode='22023';end if;
   p:=progress_change->'payload';c:=event_change->'payload';
   if p='null' or c->>'entryId'<>card or c->'deckId'<>p->'deckId' or c->'stateAfter'<>p->'state' or c->'dueAfter'<>p->'due' or c->'stabilityAfter'<>p#>'{card,stability}' or c->'difficultyAfter'<>p#>'{card,difficulty}' or
    c#>'{fsrsLog,review}'<>p#>'{card,lastReview}' or (action='review' and (c->'cardBefore' is distinct from op->'before' or (p#>>'{card,reps}')::numeric<>coalesce((op#>>'{before,reps}')::numeric,0)+1)) then raise exception 'Review result mismatch' using errcode='22023';end if;
  end if;
  if action in ('review','undo') and exists(select 1 from jsonb_array_elements(op->'changes') d where d->>'kind'='daily' and
   (d#>>'{payload,deckId}' is distinct from event_change#>>'{payload,deckId}' or d#>>'{payload,localDate}' is distinct from
    to_char(to_timestamp((event_change#>>'{payload,reviewedAt}')::double precision/1000) at time zone 'Europe/Madrid','YYYY-MM-DD'))) then raise exception 'Review day mismatch' using errcode='22023';end if;
 end if;
 if reason is null then
  -- Everything below is one transaction. Constraint/validation errors roll back entities AND receipt.
  for c in select * from jsonb_array_elements(op->'changes') loop
   pk:=c->>'kind';ek:=c->>'id';p:=c->'payload';
   select * into r from public.custom_sync_entities_v1 where user_id=uid and kind=pk and entity_id=ek;
   if action in ('archive','delete','revoke') then p:=r.payload;end if;
   if action='restore' and r.deleted_at is null and r.revision is not null and r.payload=p then continue;end if;
   if pk in ('identity','confirmation','volume-link') and r.revision is not null and r.payload=p then continue;end if;
   if action in ('archive','revoke') and r.revision is null then raise exception 'Missing lifecycle target' using errcode='22023';end if;
   if pk='card' and r.payload is not null and (r.payload->'lexicalIdentity' is distinct from p->'lexicalIdentity' or r.payload->'deckId' is distinct from p->'deckId') then raise exception 'Card identity is immutable' using errcode='22023';end if;
   if pk='review-event' and r.revision is not null and action<>'undo' then raise exception 'Event immutable' using errcode='22023';end if;
   if pk='card' then
    if r.revision is null or r.payload is null then select coalesce(max((payload->>'order')::bigint),0)+1 into counter from public.custom_sync_entities_v1 where user_id=uid and kind='card' and deck_id=p->>'deckId';
    else counter:=(r.payload->>'order')::integer;end if;
    p:=jsonb_set(p,'{order}',to_jsonb(counter));
   end if;
   if action='revoke' then p:=jsonb_set(p,'{revoked}','true');end if;
   if action='archive' then p:=jsonb_set(p,'{status}','"archived"');end if;
   deck:=case when pk in ('card','volume-link','confirmation','progress','review-event','daily','manifest') then coalesce(p->>'deckId',r.deck_id) else null end;
   ident:=case when pk='card' then p#>>'{lexicalIdentity,anchor,entryId}' when pk='confirmation' then p#>>'{entity,id}' else null end;
   if pk='confirmation' then deck:=coalesce((select value->>'id' from jsonb_array_elements(op->'changes') where value->>'kind'='card' and value#>>'{payload,glosses,0,source,sourceId}'=ek),r.card_id);
    card:=deck;select coalesce(value#>>'{payload,deckId}',(select e.deck_id from public.custom_sync_entities_v1 e where e.user_id=uid and e.kind='card' and e.entity_id=card)) into deck from (select 1) dummy left join lateral
     (select value from jsonb_array_elements(op->'changes') where value->>'kind'='card' and value->>'id'=card) q on true;
   else card:=case when pk='progress' then ek when pk='review-event' then p->>'entryId' else null end;end if;
   if pk='progress' and p='null' then deck:=r.deck_id;end if;
   prev_head:=case when pk='progress' then case when action='undo' then event_row.head when action='import-history' then op->>'expectedHead' else event_change->>'id' end
    when pk='review-event' then case when action='undo' then r.head when action='import-history' then c->>'parentHead' else op->>'expectedHead' end else null end;
   clock:=clock+1;
   insert into public.custom_sync_entities_v1(user_id,kind,entity_id,payload,revision,deck_id,identity_id,card_id,head,deleted_at,archived,voided_by)
   values(uid,pk,ek,p,clock,deck,ident,card,prev_head,case when action='delete' then now() else null end,
    case when pk='deck' then coalesce(p->>'status'='archived',false) else false end,
    case when action='undo' and pk='review-event' then token when action='import-history' and pk='review-event' then c->>'voidedBy' else r.voided_by end)
   on conflict(user_id,kind,entity_id) do update set payload=excluded.payload,revision=excluded.revision,deck_id=excluded.deck_id,identity_id=excluded.identity_id,
    card_id=excluded.card_id,head=excluded.head,deleted_at=excluded.deleted_at,archived=excluded.archived,voided_by=excluded.voided_by;
  end loop;
  -- Referential semantics, in addition to deferred owner-scoped foreign keys.
  for c in select * from jsonb_array_elements(op->'changes') loop
   select * into r from public.custom_sync_entities_v1 where user_id=uid and kind=c->>'kind' and entity_id=c->>'id';
   if r.deleted_at is not null then continue;end if;
   if r.deck_id is not null and not exists(select 1 from public.custom_sync_entities_v1 d where d.user_id=uid and d.kind='deck' and d.entity_id=r.deck_id and d.deleted_at is null) then raise exception 'Missing live parent deck' using errcode='23503';end if;
   if r.kind='card' and not exists(select 1 from public.custom_sync_entities_v1 i where i.user_id=uid and i.kind='identity' and i.entity_id=r.identity_id and i.deleted_at is null and i.payload->'identity'=r.payload->'lexicalIdentity' and i.payload->>'word'=r.payload->>'word' and i.payload->>'reading'=r.payload->>'reading') then raise exception 'Identity mismatch' using errcode='23503';end if;
   if r.card_id is not null and not exists(select 1 from public.custom_sync_entities_v1 x where x.user_id=uid and x.kind='card' and x.entity_id=r.card_id and x.deck_id=r.deck_id and x.deleted_at is null) then raise exception 'Missing live parent card' using errcode='23503';end if;
   if r.head is not null and not exists(select 1 from public.custom_sync_entities_v1 e where e.user_id=uid and e.kind='review-event' and e.entity_id=r.head and e.card_id=r.card_id and
    (r.kind<>'progress' or e.voided_by is null) and (r.kind<>'review-event' or
    (e.payload#>>'{fsrsLog,review}')::numeric<=(r.payload#>>'{fsrsLog,review}')::numeric and coalesce((e.payload#>>'{cardBefore,reps}')::numeric,0)+1=(r.payload#>>'{cardBefore,reps}')::numeric and
    e.payload#>'{fsrsLog,review}'=r.payload#>'{cardBefore,lastReview}' and e.payload->'stateAfter'=r.payload#>'{cardBefore,state}' and e.payload->'stabilityAfter'=r.payload#>'{cardBefore,stability}' and e.payload->'difficultyAfter'=r.payload#>'{cardBefore,difficulty}' and e.payload->'dueAfter'=r.payload#>'{cardBefore,due}')) then raise exception 'Invalid history lineage' using errcode='23503';end if;
   if r.kind='review-event' and (r.payload->'cardBefore'='null' and r.payload->'stateBefore'<>'0' or r.payload->'cardBefore'<>'null' and
    (r.payload->'stateBefore' is distinct from r.payload#>'{cardBefore,state}' or r.payload->'dueBefore' is distinct from r.payload#>'{cardBefore,due}' or
     r.payload->'stabilityBefore' is distinct from r.payload#>'{cardBefore,stability}' or r.payload->'difficultyBefore' is distinct from r.payload#>'{cardBefore,difficulty}')) then raise exception 'Inconsistent before snapshot' using errcode='22023';end if;
   if r.kind='daily' and exists(select 1 from jsonb_array_elements_text(r.payload->'introducedEntryIds') id where not exists(select 1 from public.custom_sync_entities_v1 x where x.user_id=uid and x.kind='card' and x.entity_id=id and x.deck_id=r.deck_id)) then raise exception 'Unknown daily card' using errcode='23503';end if;
   if r.kind='equivalence' and (select count(*) from public.custom_sync_entities_v1 i where i.user_id=uid and i.kind='identity' and i.payload#>>'{identity,key}' in (r.payload->>'left',r.payload->>'right') and i.deleted_at is null)<>2 then raise exception 'Missing equivalence identity' using errcode='23503';end if;
   if r.kind='confirmation' and not exists(select 1 from public.custom_sync_entities_v1 i where i.user_id=uid and i.kind='identity' and i.entity_id=r.identity_id and i.payload=r.payload->'entity') then raise exception 'Confirmation identity mismatch' using errcode='23503';end if;
  end loop;
  if action='publish' and (select count(*) from jsonb_array_elements(op->'changes') where value->>'kind'='manifest')<>1 then raise exception 'Publish requires one complete manifest' using errcode='22023';end if;
  select coalesce(jsonb_agg(value),'[]') into manifest_changes from jsonb_array_elements(op->'changes') where value->>'kind'='manifest';
  -- Lifecycle changes update the publication atomically; archiving must not hide valid knowledge.
  if auto_deck is not null and exists(select 1 from public.custom_sync_entities_v1 d where d.user_id=uid and d.kind='deck' and d.entity_id=auto_deck and d.deleted_at is null) and
   exists(select 1 from public.custom_sync_entities_v1 m where m.user_id=uid and m.kind='manifest' and m.entity_id=auto_deck) and
   not exists(select 1 from jsonb_array_elements(manifest_changes) m where m->>'id'=auto_deck) then
   select jsonb_build_object('schemaVersion',1,'deckId',auto_deck,'cardIds',coalesce(jsonb_agg(entity_id order by entity_id),'[]')) into p
    from public.custom_sync_entities_v1 where user_id=uid and kind='card' and deck_id=auto_deck and deleted_at is null;
   clock:=clock+1;update public.custom_sync_entities_v1 set payload=p,revision=clock where user_id=uid and kind='manifest' and entity_id=auto_deck;
   manifest_changes:=manifest_changes||jsonb_build_array(jsonb_build_object('id',auto_deck,'payload',p));
  end if;
  for c in select * from jsonb_array_elements(manifest_changes) loop
   deck:=c->>'id';
   if (select coalesce(jsonb_agg(entity_id order by entity_id),'[]') from public.custom_sync_entities_v1 where user_id=uid and kind='card' and deck_id=deck and deleted_at is null) is distinct from
    (select coalesce(jsonb_agg(value order by value),'[]') from jsonb_array_elements(c#>'{payload,cardIds}')) then raise exception 'Incomplete publication' using errcode='22023';end if;
   if exists(select 1 from public.custom_sync_entities_v1 x where x.user_id=uid and x.kind='card' and x.deck_id=deck and x.deleted_at is null and
    not exists(select 1 from public.custom_sync_entities_v1 q where q.user_id=uid and q.kind='confirmation' and q.entity_id=x.payload#>>'{glosses,0,source,sourceId}' and q.card_id=x.entity_id and q.deleted_at is null and
     q.payload->>'confirmedMeaning'=x.payload#>>'{glosses,0,text}' and q.payload->>'meaningLanguage'=x.payload#>>'{glosses,0,language}' and
     x.payload->'context'=jsonb_build_object('text',q.payload#>>'{source,fragment}','sourceTitle',q.payload#>>'{source,volumeTitle}','pageNumber',q.payload#>'{source,pageNumber}'))) then raise exception 'Missing confirmation' using errcode='23503';end if;
   select coalesce(jsonb_agg(jsonb_build_object('kind',kind,'id',entity_id,'revision',revision::text) order by kind,entity_id),'[]') into refs
    from public.custom_sync_entities_v1 where user_id=uid and deleted_at is null and (entity_id=deck and kind='deck' or deck_id=deck and kind in ('card','volume-link') or kind='confirmation' and entity_id in
    (select payload#>>'{glosses,0,source,sourceId}' from public.custom_sync_entities_v1 where user_id=uid and kind='card' and deck_id=deck and deleted_at is null) or kind='identity' and entity_id in
    (select identity_id from public.custom_sync_entities_v1 where user_id=uid and kind='card' and deck_id=deck and deleted_at is null));
   update public.custom_sync_entities_v1 set payload=jsonb_set(payload,'{references}',refs) where user_id=uid and kind='manifest' and entity_id=deck;
  end loop;
  select coalesce(jsonb_agg(jsonb_build_object('kind',e.kind,'id',e.entity_id,'revision',e.revision::text,'payload',e.payload,'deleted',e.deleted_at is not null,'archived',e.archived,'head',e.head,'voidedBy',e.voided_by) order by e.revision),'[]') into rows_out
   from public.custom_sync_entities_v1 e where e.user_id=uid and (e.revision>start_clock or exists(select 1 from jsonb_array_elements(op->'changes') x where x->>'kind'=e.kind and x->>'id'=e.entity_id));
  update public.custom_sync_clock_v1 set revision=clock where user_id=uid;
 end if;
 result:=jsonb_build_object('schemaVersion',1,'operationId',token,'status',case when reason is null then 'accepted' else 'conflict' end,'serverRevision',clock::text,'reason',reason,'entities',rows_out);
 insert into public.custom_sync_receipts_v1(user_id,operation_id,request,result) values(uid,token,op,result);
 if reason is not null then insert into public.custom_sync_conflicts_v1 values(uid,token,reason,op);end if;
 return result;
end $$;

-- One statement/MVCC snapshot. Raw staged rows are owner-readable, but never a ready bundle.
create function public.get_custom_deck_bundle_v1(deck text) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('schemaVersion',1,'status',case when (select coalesce(sum(octet_length(e.payload::text)),0) from public.custom_sync_entities_v1 e where e.user_id=auth.uid() and exists
  (select 1 from jsonb_array_elements(m.payload->'references') ref where ref->>'kind'=e.kind and ref->>'id'=e.entity_id))>4194304 then 'paged-required' else 'complete' end,
 'manifest',jsonb_build_object('kind',m.kind,'id',m.entity_id,'revision',m.revision::text,'payload',m.payload,'deleted',false,'archived',false,'head',null,'voidedBy',null),'entities',
 case when (select coalesce(sum(octet_length(e.payload::text)),0) from public.custom_sync_entities_v1 e where e.user_id=auth.uid() and exists
  (select 1 from jsonb_array_elements(m.payload->'references') ref where ref->>'kind'=e.kind and ref->>'id'=e.entity_id))>4194304 then '[]'::jsonb else
  (select coalesce(jsonb_agg(jsonb_build_object('kind',e.kind,'id',e.entity_id,'revision',e.revision::text,'payload',e.payload,'deleted',e.deleted_at is not null,'archived',e.archived,'head',e.head,'voidedBy',e.voided_by)),'[]') from public.custom_sync_entities_v1 e where e.user_id=auth.uid() and e.kind<>'manifest' and
   exists(select 1 from jsonb_array_elements(m.payload->'references') ref where ref->>'kind'=e.kind and ref->>'id'=e.entity_id)) end)
 from public.custom_sync_entities_v1 m where m.user_id=auth.uid() and m.kind='manifest' and m.entity_id=deck and m.deleted_at is null and
 not exists(select 1 from jsonb_array_elements(m.payload->'references') ref where not exists(select 1 from public.custom_sync_entities_v1 e where e.user_id=auth.uid() and e.kind=ref->>'kind' and e.entity_id=ref->>'id' and e.revision::text=ref->>'revision' and e.deleted_at is null)) and
 exists(select 1 from public.custom_sync_entities_v1 d where d.user_id=auth.uid() and d.kind='deck' and d.entity_id=deck and d.deleted_at is null)
$$;
create function public.get_custom_deck_changes_v1(after_revision bigint,page_size integer default 100) returns jsonb
 language plpgsql stable security invoker set search_path='' as $$ declare result jsonb;begin
 if after_revision is null or after_revision<0 or page_size is null or page_size not between 1 and 200 then raise exception 'Invalid cursor' using errcode='22023';end if;
 select jsonb_build_object('schemaVersion',1,'serverRevision',coalesce((select revision::text from public.custom_sync_clock_v1 where user_id=auth.uid()),'0'),
 'entities',coalesce(jsonb_agg(jsonb_build_object('kind',e.kind,'id',e.entity_id,'revision',e.revision::text,'payload',e.payload,'deleted',e.deleted_at is not null,'archived',e.archived,'head',e.head,'voidedBy',e.voided_by) order by e.revision),'[]')) into result
 from (select * from public.custom_sync_entities_v1 where user_id=auth.uid() and revision>after_revision order by revision limit page_size) e;
 return result;end $$;
do $$ declare f record; begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and (p.proname like 'cd_%_v1' or p.proname in ('apply_custom_deck_operation_v1','get_custom_deck_bundle_v1','get_custom_deck_changes_v1')) loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 end loop;
end $$;
grant execute on function public.apply_custom_deck_operation_v1(jsonb) to authenticated;
grant execute on function public.get_custom_deck_bundle_v1(text) to authenticated;
grant execute on function public.get_custom_deck_changes_v1(bigint,integer) to authenticated;
commit;
