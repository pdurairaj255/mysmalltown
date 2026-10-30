-- My Small Town — update for databases set up before October 29, 2026.
-- Adds administrator approval and longer invite codes.
-- Run once: Supabase dashboard → SQL Editor → New query → paste → Run.
-- Safe to run more than once.

alter table public.profiles add column if not exists avatar text not null default 'adult-1'
  check (avatar ~ '^[a-z]+-[0-9]{1,2}$');
alter table public.profiles add column if not exists approved boolean not null default false;

-- People set only their own name and avatar; only an administrator changes approved.
revoke insert, update on public.profiles from authenticated;
grant insert (id, display_name, avatar) on public.profiles to authenticated;
grant update (id, display_name, avatar) on public.profiles to authenticated;

-- True once an administrator has approved the signed-in person
-- (Table Editor → profiles → approved, or the SQL in SETUP.md).
create or replace function public.is_approved() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select approved from profiles where id = auth.uid()), false);
$$;

-- Every group rule goes through this, so people who aren't approved
-- (or have been un-approved) can't see or change anything in a group.
create or replace function public.is_member(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_approved()
     and exists (select 1 from memberships where group_id = gid and user_id = auth.uid());
$$;

create or replace function public.shares_group(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_approved() and exists (
    select 1 from memberships a
    join memberships b on a.group_id = b.group_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

-- Invite codes look like REYES-7KQ3-XM9P: up to 5 letters from the group
-- name, then 8 random characters (31^8, about 850 billion possibilities).
-- The alphabet leaves out 0/O, 1/I/L so codes are easy to read aloud.
create or replace function public.new_invite_code(p_name text) returns text
language plpgsql volatile set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  -- Bytes of a random UUID, skipping the two that hold version/variant bits.
  picks constant int[] := array[0, 1, 2, 3, 4, 5, 10, 11];
  prefix text;
  code text;
  bytes bytea;
begin
  prefix := upper(left(regexp_replace(regexp_replace(coalesce(p_name, ''), '^\s*the\s+', '', 'i'), '[^A-Za-z]', '', 'g'), 5));
  if prefix = '' then prefix := 'TOWN'; end if;
  loop
    bytes := uuid_send(gen_random_uuid());
    code := prefix || '-';
    for i in 1..8 loop
      code := code || substr(alphabet, get_byte(bytes, picks[i]) % 31 + 1, 1);
      if i = 4 then code := code || '-'; end if;
    end loop;
    exit when not exists (select 1 from groups where invite_code = code);
  end loop;
  return code;
end;
$$;

-- Creates a group with a fresh invite code and adds the creator to it.
create or replace function public.create_group(p_name text, p_town text, p_accent text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  gid uuid;
begin
  if auth.uid() is null then
    raise exception 'Please sign in first.';
  end if;
  if not public.is_approved() then
    raise exception 'Your account is waiting for approval.';
  end if;
  insert into groups (name, town_name, accent, invite_code, created_by)
  values (trim(p_name), trim(p_town), coalesce(p_accent, '#FFD23F'), public.new_invite_code(p_name), auth.uid())
  returning id into gid;
  insert into memberships (group_id, user_id) values (gid, auth.uid());
  return gid;
end;
$$;

-- Joins the group with this invite code. Case, spaces and dashes don't
-- matter. Joining twice is harmless.
create or replace function public.join_group(p_code text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  gid uuid;
begin
  if auth.uid() is null then
    raise exception 'Please sign in first.';
  end if;
  if not public.is_approved() then
    raise exception 'Your account is waiting for approval.';
  end if;
  select id into gid from groups
  where regexp_replace(invite_code, '[^A-Z0-9]', '', 'g') = regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g');
  if gid is null then
    raise exception 'No group has that code. Check it and try again.';
  end if;
  insert into memberships (group_id, user_id) values (gid, auth.uid())
  on conflict do nothing;
  return gid;
end;
$$;

revoke execute on function public.new_invite_code(text) from public, anon, authenticated;
revoke execute on function public.create_group(text, text, text) from public, anon;
revoke execute on function public.join_group(text) from public, anon;
grant execute on function public.create_group(text, text, text) to authenticated;
grant execute on function public.join_group(text) to authenticated;

-- Give any existing groups a new, longer invite code.
update public.groups set invite_code = public.new_invite_code(name)
where invite_code !~ '^[A-Z]+-[A-Z0-9]{4}-[A-Z0-9]{4}$';
