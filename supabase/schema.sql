-- My Small Town — database schema for Supabase.
-- Run this once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- (Set up from an earlier version? Run the files in supabase/migrations instead.)
--
-- Everything is private by default: row level security lets people see only
-- the groups they belong to, and the people in those groups. New accounts
-- can't do anything until an administrator approves them.
--
-- People vs. accounts: every person in the app has a row in profiles. A
-- grown-up's profile id is their sign-in account's id. Kids have their own
-- profile id, no email, and belong to the account (a parent) that manages
-- them, so several people can share one sign-in on a family device.

-- ---------- Tables ----------

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  -- The sign-in account that manages this person: themselves, or a parent.
  account_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  is_kid boolean not null default false,
  display_name text not null check (char_length(display_name) between 1 and 40),
  -- One of the 40 avatar ids in js/avatars.js (kid-1 … grand-10).
  avatar text not null default 'adult-1' check (avatar ~ '^[a-z]+-[0-9]{1,2}$'),
  -- New accounts wait until an administrator sets this to true. Kids follow
  -- their parent's approval.
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  town_name text not null check (char_length(town_name) between 1 and 40),
  accent text not null default '#FFD23F',
  invite_code text not null unique,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

-- user_id in memberships, thanks and visits is a profile id with no foreign
-- key on purpose: when someone's profile is deleted these rows stay,
-- anonymous, so past weeks and surprises still add up the same.
create table public.memberships (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null,
  joined_at timestamptz not null default now(),
  -- Set when the person was deleted. Their name and avatar are gone.
  left_at timestamptz,
  primary key (group_id, user_id)
);

-- Notes of appreciation: up to 3 per person per day in each group (limit_daily_notes).
-- recipient_id is set when the note is for someone in the group; recipient_name
-- is always set (the person's name at the time, or the outside person's
-- description). body is null once the author has been deleted.
create table public.thanks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  author_id uuid not null,
  recipient_id uuid,
  recipient_name text not null check (char_length(recipient_name) between 1 and 80),
  body text check (char_length(body) between 1 and 1000),
  day date not null,
  created_at timestamptz not null default now()
);

-- One row per person per day they opened the group.
create table public.visits (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null,
  day date not null,
  primary key (group_id, user_id, day)
);

create index profiles_account_idx on public.profiles (account_id);
create index thanks_group_idx on public.thanks (group_id, day);
create index thanks_author_day_idx on public.thanks (group_id, author_id, day);
create index visits_group_idx on public.visits (group_id, day);
create index memberships_user_idx on public.memberships (user_id);

-- ---------- Helpers ----------

-- True once an administrator has approved the signed-in account
-- (Table Editor → profiles → approved, or the SQL in SETUP.md).
create or replace function public.is_approved() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select approved from profiles where id = auth.uid()), false);
$$;

-- True if the signed-in account manages this person: themselves or their kid.
create or replace function public.controls(person uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = person and account_id = auth.uid());
$$;

create or replace function public.is_active_member(gid uuid, person uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where group_id = gid and user_id = person and left_at is null);
$$;

-- Every group rule goes through this: the account is approved and one of its
-- people (the grown-up or a kid) is a current member of the group.
create or replace function public.is_member(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_approved() and exists (
    select 1 from memberships m
    join profiles p on p.id = m.user_id
    where m.group_id = gid and p.account_id = auth.uid() and m.left_at is null
  );
$$;

create or replace function public.shares_group(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_approved() and exists (
    select 1 from memberships a
    join profiles p on p.id = a.user_id
    join memberships b on b.group_id = a.group_id
    where p.account_id = auth.uid() and a.left_at is null and b.user_id = other
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

-- Creates a group with a fresh invite code. Groups are started by grown-ups:
-- the signed-in account's own profile creates it and joins it.
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

-- Joins the group with this invite code, as the grown-up or one of their
-- kids (p_person). Case, spaces and dashes don't matter. Joining twice is
-- harmless.
create or replace function public.join_group(p_code text, p_person uuid default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  gid uuid;
  person uuid := coalesce(p_person, auth.uid());
begin
  if auth.uid() is null then
    raise exception 'Please sign in first.';
  end if;
  if not public.is_approved() then
    raise exception 'Your account is waiting for approval.';
  end if;
  if not public.controls(person) then
    raise exception 'You can only join as yourself or one of your kids.';
  end if;
  select id into gid from groups
  where regexp_replace(invite_code, '[^A-Z0-9]', '', 'g') = regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g');
  if gid is null then
    raise exception 'No group has that code. Check it and try again.';
  end if;
  insert into memberships (group_id, user_id) values (gid, person)
  on conflict do nothing;
  return gid;
end;
$$;

-- Adds a kid to the signed-in account, and to any of the grown-up's groups
-- listed in p_groups. Kids follow their parent's approval.
create or replace function public.add_kid(p_name text, p_avatar text, p_groups uuid[] default '{}')
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  kid uuid;
begin
  if auth.uid() is null then
    raise exception 'Please sign in first.';
  end if;
  if not public.is_approved() then
    raise exception 'Your account is waiting for approval.';
  end if;
  if (select count(*) from profiles where account_id = auth.uid() and is_kid) >= 10 then
    raise exception 'An account can manage up to 10 kids.';
  end if;
  insert into profiles (account_id, is_kid, display_name, avatar, approved)
  values (auth.uid(), true, trim(p_name), coalesce(p_avatar, 'kid-1'), true)
  returning id into kid;
  insert into memberships (group_id, user_id)
  select g, kid from unnest(coalesce(p_groups, '{}')) as g
  where public.is_active_member(g, auth.uid());
  return kid;
end;
$$;

-- Removes one person without changing any town's past: hands each group they
-- started to its longest-standing remaining member (or deletes the group if
-- they were alone), erases the words of their notes and their name on notes
-- to them, marks their memberships as left, and deletes their profile (name
-- and avatar). Their notes and visits stay as anonymous tallies.
create or replace function public.delete_person(person uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  g record;
  heir uuid;
begin
  for g in select id from groups where created_by = person loop
    select m.user_id into heir from memberships m
    left join profiles p on p.id = m.user_id
    where m.group_id = g.id and m.user_id <> person and m.left_at is null
    order by coalesce(p.is_kid, false), m.joined_at, m.user_id
    limit 1;
    if heir is null then
      delete from groups where id = g.id;
    else
      update groups set created_by = heir where id = g.id;
    end if;
  end loop;

  update thanks
  set body = null,
      recipient_name = case when recipient_id is null then 'Someone outside the group' else recipient_name end
  where author_id = person;
  update thanks set recipient_name = 'A former member' where recipient_id = person;
  update memberships set left_at = now() where user_id = person and left_at is null;
  delete from profiles where id = person;
end;
$$;

-- A parent removes one of their kids.
create or replace function public.remove_kid(p_kid uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles where id = p_kid and is_kid and account_id = auth.uid()) then
    raise exception 'That isn''t one of your kids.';
  end if;
  perform public.delete_person(p_kid);
end;
$$;

-- Deletes a whole account: each of its kids, then the grown-up, then the
-- sign-in and email. Towns stay exactly as built.
create or replace function public.delete_account(me uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  kid record;
begin
  if me is null then
    raise exception 'Please sign in first.';
  end if;
  for kid in select id from profiles where account_id = me and is_kid loop
    perform public.delete_person(kid.id);
  end loop;
  perform public.delete_person(me);
  delete from auth.users where id = me;
end;
$$;

-- People delete only their own account, from the app.
create or replace function public.delete_my_account()
returns void
language sql security definer set search_path = public as $$
  select public.delete_account(auth.uid());
$$;

-- For the administrator, in the SQL Editor:
--   select public.delete_account_by_email('their.email@example.com');
create or replace function public.delete_account_by_email(p_email text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  target uuid;
begin
  select id into target from auth.users where lower(email) = lower(trim(p_email));
  if target is null then
    raise exception 'No account uses that email.';
  end if;
  perform public.delete_account(target);
end;
$$;

revoke execute on function public.new_invite_code(text) from public, anon, authenticated;
revoke execute on function public.delete_person(uuid) from public, anon, authenticated;
revoke execute on function public.delete_account(uuid) from public, anon, authenticated;
revoke execute on function public.delete_account_by_email(text) from public, anon, authenticated;
revoke execute on function public.create_group(text, text, text) from public, anon;
revoke execute on function public.join_group(text, uuid) from public, anon;
revoke execute on function public.add_kid(text, text, uuid[]) from public, anon;
revoke execute on function public.remove_kid(uuid) from public, anon;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.create_group(text, text, text) to authenticated;
grant execute on function public.join_group(text, uuid) to authenticated;
grant execute on function public.add_kid(text, text, uuid[]) to authenticated;
grant execute on function public.remove_kid(uuid) to authenticated;
grant execute on function public.delete_my_account() to authenticated;

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

-- Deletes a group and its town for everyone: memberships, notes and visits go
-- with it. Only the account that owns the group can do this. People's accounts
-- and their other towns aren't touched.
create or replace function public.delete_group(p_group uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_approved() then
    raise exception 'Your account is waiting for approval.';
  end if;
  if not exists (select 1 from groups where id = p_group and public.controls(created_by)) then
    raise exception 'Only the person who owns this group can delete its town.';
  end if;
  delete from groups where id = p_group;
end;
$$;

revoke execute on function public.delete_group(uuid) from public, anon;
grant execute on function public.delete_group(uuid) to authenticated;

-- ---------- Row level security ----------

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.memberships enable row level security;
alter table public.thanks enable row level security;
alter table public.visits enable row level security;

drop policy if exists "See yourself and people in your groups" on public.profiles;
create policy "See yourself and people in your groups" on public.profiles
  for select using (account_id = auth.uid() or public.shares_group(id));
drop policy if exists "Create your own profile" on public.profiles;
create policy "Create your own profile" on public.profiles
  for insert with check (id = auth.uid() and account_id = auth.uid() and not is_kid);
drop policy if exists "Edit your own profile" on public.profiles;
drop policy if exists "Edit your own and your kids' profiles" on public.profiles;
create policy "Edit your own and your kids' profiles" on public.profiles
  for update using (account_id = auth.uid()) with check (account_id = auth.uid());

-- People set only names and avatars. Only an administrator (in the Supabase
-- dashboard) changes approved, and kids are added through add_kid(). id is in
-- the update grant because saving a profile is an upsert; the policy keeps
-- every row tied to your account.
revoke insert, update on public.profiles from authenticated;
grant insert (id, display_name, avatar) on public.profiles to authenticated;
grant update (id, display_name, avatar) on public.profiles to authenticated;

drop policy if exists "See your groups" on public.groups;
create policy "See your groups" on public.groups
  for select using (public.is_member(id));
drop policy if exists "Members can rename the town" on public.groups;
create policy "Members can rename the town" on public.groups
  for update using (public.is_member(id)) with check (public.is_member(id));
-- Members may change only these columns (not the invite code or creator).
revoke update on public.groups from authenticated;
grant update (name, town_name, accent) on public.groups to authenticated;

drop policy if exists "See who is in your groups" on public.memberships;
create policy "See who is in your groups" on public.memberships
  for select using (public.is_member(group_id));

drop policy if exists "Read your groups' notes" on public.thanks;
drop policy if exists "Read your groups' thank-yous" on public.thanks;
create policy "Read your groups' notes" on public.thanks
  for select using (public.is_member(group_id));
drop policy if exists "Share your own note" on public.thanks;
drop policy if exists "Share your own thank-you" on public.thanks;
create policy "Share your own note" on public.thanks
  for insert with check (
    public.controls(author_id)
    and public.is_member(group_id)
    and public.is_active_member(group_id, author_id)
    and (recipient_id is null or public.is_active_member(group_id, recipient_id))
  );

drop policy if exists "See your groups' visits" on public.visits;
create policy "See your groups' visits" on public.visits
  for select using (public.is_member(group_id));
drop policy if exists "Record your own visit" on public.visits;
create policy "Record your own visit" on public.visits
  for insert with check (
    public.controls(user_id)
    and public.is_member(group_id)
    and public.is_active_member(group_id, user_id)
  );
