alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.anniversaries enable row level security;
alter table public.diaries enable row level security;
alter table public.diary_replies enable row level security;
alter table public.album_entries enable row level security;

create or replace function public.is_couple_member(target_couple_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = target_couple_id
      and cm.user_id = auth.uid()
  );
$$;

create or replace function public.can_view_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_user_id = auth.uid()
    or exists (
      select 1
      from public.couple_members mine
      join public.couple_members target on target.couple_id = mine.couple_id
      where mine.user_id = auth.uid()
        and target.user_id = target_user_id
    );
$$;

create or replace function public.is_username_available(target_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.profiles p
    where lower(p.username) = lower(trim(target_username))
  );
$$;

create or replace function public.can_reply_to_diary(target_diary_id uuid, target_author_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_author_id = auth.uid()
    and exists (
      select 1
      from public.diaries d
      join public.couple_members cm on cm.couple_id = d.couple_id
      where d.id = target_diary_id
        and cm.user_id = auth.uid()
    );
$$;

grant execute on function public.is_couple_member(uuid) to authenticated;
grant execute on function public.can_view_profile(uuid) to authenticated;
grant execute on function public.is_username_available(text) to anon, authenticated;
grant execute on function public.can_reply_to_diary(uuid, uuid) to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_select_self_or_partner" on public.profiles;

drop policy if exists "couples_select_member" on public.couples;
drop policy if exists "couples_insert_creator" on public.couples;
drop policy if exists "couples_update_member" on public.couples;
drop policy if exists "couples_select_authenticated" on public.couples;

drop policy if exists "couple_members_select_member" on public.couple_members;
drop policy if exists "couple_members_insert_self" on public.couple_members;
drop policy if exists "couple_members_select_same_couple" on public.couple_members;
drop policy if exists "couple_members_select_authenticated" on public.couple_members;

drop policy if exists "anniversaries_select_member" on public.anniversaries;
drop policy if exists "anniversaries_insert_member" on public.anniversaries;
drop policy if exists "anniversaries_update_member" on public.anniversaries;
drop policy if exists "anniversaries_delete_member" on public.anniversaries;

drop policy if exists "diaries_select_member" on public.diaries;
drop policy if exists "diaries_insert_author_member" on public.diaries;
drop policy if exists "diaries_update_author" on public.diaries;
drop policy if exists "diaries_delete_author" on public.diaries;

drop policy if exists "diary_replies_select_member" on public.diary_replies;
drop policy if exists "diary_replies_insert_author" on public.diary_replies;
drop policy if exists "diary_replies_update_author" on public.diary_replies;
drop policy if exists "diary_replies_delete_author" on public.diary_replies;

drop policy if exists "album_entries_select_member" on public.album_entries;
drop policy if exists "album_entries_insert_member" on public.album_entries;
drop policy if exists "album_entries_update_member" on public.album_entries;
drop policy if exists "album_entries_delete_member" on public.album_entries;

drop policy if exists "needu_images_select_public" on storage.objects;
drop policy if exists "needu_images_insert_member" on storage.objects;
drop policy if exists "needu_images_update_member" on storage.objects;
drop policy if exists "needu_images_delete_member" on storage.objects;

create policy "profiles_select_self_or_partner" on public.profiles
for select
to authenticated
using (public.can_view_profile(id));

create policy "profiles_insert_own" on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "couples_select_authenticated" on public.couples
for select
to authenticated
using (true);

create policy "couples_insert_creator" on public.couples
for insert
to authenticated
with check (created_by = auth.uid());

create policy "couples_update_member" on public.couples
for update
to authenticated
using (public.is_couple_member(id))
with check (public.is_couple_member(id));

create policy "couple_members_select_authenticated" on public.couple_members
for select
to authenticated
using (true);

create policy "couple_members_insert_self" on public.couple_members
for insert
to authenticated
with check (user_id = auth.uid());

create policy "anniversaries_select_member" on public.anniversaries
for select
to authenticated
using (public.is_couple_member(couple_id));

create policy "anniversaries_insert_member" on public.anniversaries
for insert
to authenticated
with check (public.is_couple_member(couple_id));

create policy "anniversaries_update_member" on public.anniversaries
for update
to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

create policy "anniversaries_delete_member" on public.anniversaries
for delete
to authenticated
using (public.is_couple_member(couple_id));

create policy "diaries_select_member" on public.diaries
for select
to authenticated
using (public.is_couple_member(couple_id));

create policy "diaries_insert_author_member" on public.diaries
for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.is_couple_member(couple_id)
);

create policy "diaries_update_author" on public.diaries
for update
to authenticated
using (author_id = auth.uid())
with check (
  author_id = auth.uid()
  and public.is_couple_member(couple_id)
);

create policy "diaries_delete_author" on public.diaries
for delete
to authenticated
using (author_id = auth.uid());

create policy "diary_replies_select_member" on public.diary_replies
for select
to authenticated
using (
  exists (
    select 1
    from public.diaries d
    where d.id = diary_replies.diary_id
      and public.is_couple_member(d.couple_id)
  )
);

create policy "diary_replies_insert_author" on public.diary_replies
for insert
to authenticated
with check (public.can_reply_to_diary(diary_id, author_id));

create policy "diary_replies_update_author" on public.diary_replies
for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy "diary_replies_delete_author" on public.diary_replies
for delete
to authenticated
using (author_id = auth.uid());

create policy "album_entries_select_member" on public.album_entries
for select
to authenticated
using (public.is_couple_member(couple_id));

create policy "album_entries_insert_member" on public.album_entries
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and public.is_couple_member(couple_id)
);

create policy "album_entries_update_member" on public.album_entries
for update
to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

create policy "album_entries_delete_member" on public.album_entries
for delete
to authenticated
using (public.is_couple_member(couple_id));

create policy "needu_images_select_public" on storage.objects
for select
to public
using (bucket_id = 'needu-images');

create policy "needu_images_insert_member" on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'needu-images'
  and public.is_couple_member(((storage.foldername(name))[1])::uuid)
);

create policy "needu_images_update_member" on storage.objects
for update
to authenticated
using (
  bucket_id = 'needu-images'
  and public.is_couple_member(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'needu-images'
  and public.is_couple_member(((storage.foldername(name))[1])::uuid)
);

create policy "needu_images_delete_member" on storage.objects
for delete
to authenticated
using (
  bucket_id = 'needu-images'
  and public.is_couple_member(((storage.foldername(name))[1])::uuid)
);
