-- My Small Town — database schema for Supabase.
-- Run this once in the Supabase dashboard: SQL Editor → New query → paste → Run.
--
-- Everything is private by default: row level security lets people see only
-- the groups they belong to, and the people in those groups.

-- ---------- Tables ----------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  color text not null default '#3DD49A',
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

create table public.memberships (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- One thank-you per person per day in each group.
-- recipient_id is set when thanking someone in the group; recipient_name is
-- always set (the person's name at the time, or the outside person's description).
create table public.thanks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid references public.profiles (id) on delete set null,
  recipient_name text not null check (char_length(recipient_name) between 1 and 80),
  body text not null check (char_length(body) between 1 and 1000),
  day date not null,
  created_at timestamptz not null default now(),
  unique (group_id, author_id, day)
);

-- One row per person per day they opened the group.
create table public.visits (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  primary key (group_id, user_id, day)
);

create index thanks_group_idx on public.thanks (group_id, day);
create index visits_group_idx on public.visits (group_id, day);
create index memberships_user_idx on public.memberships (user_id);

-- ---------- Helpers ----------

create function public.is_member(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where group_id = gid and user_id = auth.uid());
$$;

create function public.shares_group(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships a
    join memberships b on a.group_id = b.group_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

-- Creates a group with a fresh invite code and adds the creator to it.
create function public.create_group(p_name text, p_town text, p_accent text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  gid uuid;
  code text;
  prefix text;
begin
  if auth.uid() is null then
    raise exception 'Please sign in first.';
  end if;
  prefix := upper(left(regexp_replace(regexp_replace(coalesce(p_name, ''), '^\s*the\s+', '', 'i'), '[^A-Za-z]', '', 'g'), 5));
  if prefix = '' then prefix := 'TOWN'; end if;
  loop
    code := prefix || '-' || lpad(floor(random() * 10000)::int::text, 4, '0');
    exit when not exists (select 1 from groups where invite_code = code);
  end loop;
  insert into groups (name, town_name, accent, invite_code, created_by)
  values (trim(p_name), trim(p_town), coalesce(p_accent, '#FFD23F'), code, auth.uid())
  returning id into gid;
  insert into memberships (group_id, user_id) values (gid, auth.uid());
  return gid;
end;
$$;

-- Joins the group with this invite code. Joining twice is harmless.
create function public.join_group(p_code text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  gid uuid;
begin
  if auth.uid() is null then
    raise exception 'Please sign in first.';
  end if;
  select id into gid from groups where invite_code = upper(trim(p_code));
  if gid is null then
    raise exception 'No group has that code. Check it and try again.';
  end if;
  insert into memberships (group_id, user_id) values (gid, auth.uid())
  on conflict do nothing;
  return gid;
end;
$$;

revoke execute on function public.create_group(text, text, text) from public, anon;
revoke execute on function public.join_group(text) from public, anon;
grant execute on function public.create_group(text, text, text) to authenticated;
grant execute on function public.join_group(text) to authenticated;

-- ---------- Row level security ----------

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.memberships enable row level security;
alter table public.thanks enable row level security;
alter table public.visits enable row level security;

create policy "See yourself and people in your groups" on public.profiles
  for select using (id = auth.uid() or public.shares_group(id));
create policy "Create your own profile" on public.profiles
  for insert with check (id = auth.uid());
create policy "Edit your own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "See your groups" on public.groups
  for select using (public.is_member(id));
create policy "Members can rename the town" on public.groups
  for update using (public.is_member(id)) with check (public.is_member(id));
-- Members may change only these columns (not the invite code or creator).
revoke update on public.groups from authenticated;
grant update (name, town_name, accent) on public.groups to authenticated;

create policy "See who is in your groups" on public.memberships
  for select using (public.is_member(group_id));
create policy "Leave a group" on public.memberships
  for delete using (user_id = auth.uid());

create policy "Read your groups' thank-yous" on public.thanks
  for select using (public.is_member(group_id));
create policy "Share your own thank-you" on public.thanks
  for insert with check (
    author_id = auth.uid()
    and public.is_member(group_id)
    and (recipient_id is null or exists (
      select 1 from memberships m where m.group_id = thanks.group_id and m.user_id = recipient_id
    ))
  );
create policy "Delete your own thank-you" on public.thanks
  for delete using (author_id = auth.uid());

create policy "See your groups' visits" on public.visits
  for select using (public.is_member(group_id));
create policy "Record your own visit" on public.visits
  for insert with check (user_id = auth.uid() and public.is_member(group_id));
