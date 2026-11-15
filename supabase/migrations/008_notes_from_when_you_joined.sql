-- My Small Town — update 008: people only receive the notes shared since they joined.
-- Run once, after 007: Supabase dashboard → SQL Editor → New query → paste → Run.
-- Safe to run more than once.
--
-- Notes from before someone joined a group stay on the server. Their phone only
-- gets what the town needs to grow: who shared on which day, and whether the
-- note was for someone outside the group. Never the words, nor who it was for.

-- When the signed-in account first joined this group: the earliest of the
-- grown-up's and their kids' current memberships.
create or replace function public.my_joined_at(gid uuid) returns timestamptz
language sql stable security definer set search_path = public as $$
  select min(m.joined_at)
  from memberships m
  join profiles p on p.id = m.user_id
  where m.group_id = gid and p.account_id = auth.uid() and m.left_at is null;
$$;

-- Signed-out visitors can call it too (it's part of the notes rule) and always get nothing.
grant execute on function public.my_joined_at(uuid) to anon, authenticated;

-- Reading the notes table directly only returns notes from since you joined.
drop policy if exists "Read your groups' notes" on public.thanks;
create policy "Read your groups' notes" on public.thanks
  for select using (public.is_member(group_id) and created_at >= public.my_joined_at(group_id));

-- Every note in a group, for growing its town. Notes from before you joined
-- come back with hidden = true and no recipient, recipient name or words.
create or replace function public.group_notes(p_group uuid)
returns table (
  id uuid, author_id uuid, recipient_id uuid, recipient_name text, body text,
  day date, created_at timestamptz, deleted_at timestamptz, outside boolean, hidden boolean
)
language sql stable security definer set search_path = public as $$
  with j as (select public.my_joined_at(p_group) as at)
  select t.id, t.author_id,
         case when t.created_at < j.at then null else t.recipient_id end,
         case when t.created_at < j.at then null else t.recipient_name end,
         case when t.created_at < j.at then null else t.body end,
         t.day, t.created_at, t.deleted_at,
         t.recipient_id is null,
         t.created_at < j.at
  from thanks t, j
  where t.group_id = p_group and public.is_member(p_group)
  order by t.created_at;
$$;

revoke execute on function public.group_notes(uuid) from public, anon;
grant execute on function public.group_notes(uuid) to authenticated;
