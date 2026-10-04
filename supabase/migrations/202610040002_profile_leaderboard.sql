begin;

-- Minimal authenticated ranking projection. Owner-only table policies remain intact.
-- SECURITY DEFINER is needed to aggregate other users without granting table SELECT.
create or replace function public.get_leaderboard_v1()
returns table (
  "position" bigint,
  username text,
  display_name text,
  study_seconds bigint,
  medal_count bigint,
  is_current_user boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with session_time as (
    select
      s.user_id,
      sum(
        case
          when length(s.payload ->> 'durationSeconds') <= 32
            and (s.payload ->> 'durationSeconds') ~ '^[+-]?[0-9]+([.][0-9]+)?$'
          then greatest(
            0::numeric,
            (s.payload ->> 'durationSeconds')::numeric
          )
          else 0::numeric
        end
      ) as seconds
    from public.completed_sessions s
    group by s.user_id
  ),

  deck_time as (
    select
      d.user_id,
      round(
        sum(
          case
            when length(d.payload ->> 'elapsedAnswerMs') <= 32
              and (d.payload ->> 'elapsedAnswerMs') ~ '^[+-]?[0-9]+([.][0-9]+)?$'
            then greatest(
              0::numeric,
              (d.payload ->> 'elapsedAnswerMs')::numeric
            )
            else 0::numeric
          end
        ) / 1000
      ) as seconds
    from public.deck_review_events d
    group by d.user_id
  ),

  rush_time as (
    select
      r.user_id,
      sum(greatest(0::bigint, r.active_seconds::bigint)) as seconds
    from public.rush_sessions r
    where r.ended_at is not null
      and r.cards_completed > 0
    group by r.user_id
  ),

  medals as (
    select
      m.user_id,
      count(*) as count
    from public.medal_unlocks m
    group by m.user_id
  ),

  totals as (
    select
      p.id,
      p.username,
      p.display_name,
      least(
        9223372036854775807::numeric,
        greatest(
          0::numeric,
          coalesce(s.seconds, 0)
          + coalesce(d.seconds, 0)
          + coalesce(r.seconds, 0)
        )
      )::bigint as seconds,
      coalesce(m.count, 0)::bigint as medals
    from public.profiles p
    left join session_time s on s.user_id = p.id
    left join deck_time d on d.user_id = p.id
    left join rush_time r on r.user_id = p.id
    left join medals m on m.user_id = p.id
    where auth.uid() is not null
  )

  select
    dense_rank() over (order by t.seconds desc),
    t.username,
    t.display_name,
    t.seconds,
    t.medals,
    t.id = auth.uid()
  from totals t
  order by t.seconds desc, t.username asc;
$$;

revoke all on function public.get_leaderboard_v1() from public, anon;

grant execute
on function public.get_leaderboard_v1()
to authenticated;

comment on function public.get_leaderboard_v1() is
  'Authenticated-only ranking: public names, synchronized study time and medal count; no private identifiers or activity payloads.';

commit;