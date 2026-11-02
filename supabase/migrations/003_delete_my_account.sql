-- My Small Town — update 003: people can delete their own account.
-- Run once, after 002: Supabase dashboard → SQL Editor → New query → paste → Run.
-- Safe to run more than once.

-- Keep history rows when an account is deleted: drop the links that would
-- delete them along with the person.
alter table public.memberships drop constraint if exists memberships_user_id_fkey;
alter table public.thanks drop constraint if exists thanks_author_id_fkey;
alter table public.thanks drop constraint if exists thanks_recipient_id_fkey;
alter table public.visits drop constraint if exists visits_user_id_fkey;

alter table public.memberships add column if not exists left_at timestamptz;
alter table public.thanks alter column body drop not null;

-- Removing memberships or notes would rewrite a town's past.
drop policy if exists "Leave a group" on public.memberships;
drop policy if exists "Delete your own thank-you" on public.thanks;

-- Former members no longer count as being in the group.
create or replace function public.is_member(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_approved()
     and exists (select 1 from memberships where group_id = gid and user_id = auth.uid() and left_at is null);
$$;

create or replace function public.shares_group(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_approved() and exists (
    select 1 from memberships a
    join memberships b on a.group_id = b.group_id
    where a.user_id = auth.uid() and a.left_at is null and b.user_id = other
  );
$$;


drop policy if exists "Share your own thank-you" on public.thanks;
drop policy if exists "Share your own note" on public.thanks;
create policy "Share your own note" on public.thanks
  for insert with check (
    author_id = auth.uid()
    and public.is_member(group_id)
    and (recipient_id is null or exists (
      select 1 from memberships m where m.group_id = thanks.group_id and m.user_id = recipient_id and m.left_at is null
    ))
  );

-- Deletes an account without changing any town's past.
-- In one step: hands each group they started to its longest-standing
-- remaining member (or deletes the group if they were alone), erases the
-- words of their notes and their name on notes to them, marks their
-- memberships as left, and deletes their sign-in, email, name and avatar.
-- Their notes and visits stay as anonymous tallies, so every past week and
-- surprise adds up exactly as before.
create or replace function public.delete_account(me uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  g record;
  heir uuid;
begin
  if me is null then
    raise exception 'Please sign in first.';
  end if;

  for g in select id from groups where created_by = me loop
    select user_id into heir from memberships
    where group_id = g.id and user_id <> me and left_at is null
    order by joined_at, user_id
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
  where author_id = me;
  update thanks set recipient_name = 'A former member' where recipient_id = me;
  update memberships set left_at = now() where user_id = me and left_at is null;

  delete from auth.users where id = me;  -- also deletes their profile
end;
$$;

-- People delete only themselves, from the app.
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

revoke execute on function public.delete_account(uuid) from public, anon, authenticated;
revoke execute on function public.delete_account_by_email(text) from public, anon, authenticated;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
