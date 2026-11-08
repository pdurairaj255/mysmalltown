-- My Small Town — update 007: delete your own notes, and choose emails about new notes.
-- Run once, after 006: Supabase dashboard → SQL Editor → New query → paste → Run.
-- Safe to run more than once.

-- A deleted note keeps its place in the town's tallies; only its words go.
alter table public.thanks add column if not exists deleted_at timestamptz;
create index if not exists thanks_created_idx on public.thanks (group_id, created_at);

-- How each person wants to hear about new notes in their groups.
alter table public.profiles add column if not exists notify text not null default 'off';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_notify_check') then
    alter table public.profiles add constraint profiles_notify_check
      check (notify in ('instant', 'daily', 'weekly', 'off'));
  end if;
end;
$$;
grant update (id, display_name, avatar, notify) on public.profiles to authenticated;

-- Deletes a note's words for everyone. The note still counts toward the town
-- (and toward that day's limit), so deleting never shrinks a town or frees up
-- a note. Only the account that wrote it (themselves or their kid) can do this.
create or replace function public.delete_note(p_note uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_approved() then
    raise exception 'Your account is waiting for approval.';
  end if;
  if not exists (select 1 from thanks where id = p_note and public.controls(author_id)) then
    raise exception 'You can only delete your own notes.';
  end if;
  update thanks
  set body = null,
      deleted_at = now(),
      recipient_name = case when recipient_id is null then 'Someone outside the group' else recipient_name end
  where id = p_note and deleted_at is null;
end;
$$;

revoke execute on function public.delete_note(uuid) from public, anon;
grant execute on function public.delete_note(uuid) to authenticated;
