-- My Small Town — update 006: the person who owns a group can delete its town.
-- Run once, after 005: Supabase dashboard → SQL Editor → New query → paste → Run.
-- Safe to run more than once.

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
