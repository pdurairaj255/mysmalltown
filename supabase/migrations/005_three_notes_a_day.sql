-- My Small Town — update 005: up to 3 notes of appreciation per day.
-- Run once, after 004: Supabase dashboard → SQL Editor → New query → paste → Run.
-- Safe to run more than once.
--
-- Town growth doesn't change: building pieces count how many different people
-- shared in a week, not how many notes they wrote.

-- Remove the old one-note-a-day rule.
do $$
declare
  c record;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.thanks'::regclass and contype = 'u' loop
    execute format('alter table public.thanks drop constraint %I', c.conname);
  end loop;
end;
$$;

create index if not exists thanks_author_day_idx on public.thanks (group_id, author_id, day);

-- Each person can share up to 3 notes per day in each group.
create or replace function public.limit_daily_notes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Wait for any note this person is saving right now, so two at once can't both slip through.
  perform pg_advisory_xact_lock(hashtext(new.group_id::text || new.author_id::text || new.day::text));
  if (select count(*) from thanks
      where group_id = new.group_id and author_id = new.author_id and day = new.day) >= 3 then
    raise exception 'You''ve already shared 3 notes of appreciation today in this group.';
  end if;
  return new;
end;
$$;

revoke execute on function public.limit_daily_notes() from public, anon, authenticated;

drop trigger if exists limit_daily_notes on public.thanks;
create trigger limit_daily_notes before insert on public.thanks
  for each row execute function public.limit_daily_notes();
