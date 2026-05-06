create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text null,
  nickname text not null default '',
  city text not null default '',
  gender text not null default 'female' check (gender in ('female', 'male')),
  avatar_url text not null default '',
  couple_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists username text null;
alter table public.profiles add column if not exists avatar_url text not null default '';
alter table public.profiles add column if not exists gender text not null default 'female';

alter table public.profiles drop constraint if exists profiles_gender_check;
alter table public.profiles
add constraint profiles_gender_check
check (gender in ('female', 'male'));

create unique index if not exists profiles_username_unique
on public.profiles (lower(username))
where username is not null and username <> '';

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  love_start_date date null,
  home_background_url text not null default '',
  created_at timestamptz not null default now()
);

alter table public.couples add column if not exists home_background_url text not null default '';

create table if not exists public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

create table if not exists public.anniversaries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  date date not null,
  repeat_type text not null default 'none' check (repeat_type in ('none', 'monthly', 'yearly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.anniversaries
add column if not exists repeat_type text not null default 'none';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'anniversaries_repeat_type_check'
      and conrelid = 'public.anniversaries'::regclass
  ) then
    alter table public.anniversaries
    add constraint anniversaries_repeat_type_check
    check (repeat_type in ('none', 'monthly', 'yearly'));
  end if;
end $$;

create table if not exists public.diaries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  diary_date date not null,
  mood text not null constraint diaries_mood_check check (
    mood in ('开心', '平静', '疲惫', '难过', '想你', '甜蜜', '生气', '焦虑', '感动', '期待')
  ),
  content text not null,
  image_url text not null default '',
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (author_id, diary_date)
);

alter table public.diaries
add column if not exists image_urls text[] not null default '{}';

alter table public.diaries
drop constraint if exists diaries_mood_check;

alter table public.diaries
add constraint diaries_mood_check
check (mood in ('开心', '平静', '疲惫', '难过', '想你', '甜蜜', '生气', '焦虑', '感动', '期待'));

create table if not exists public.diary_replies (
  id uuid primary key default gen_random_uuid(),
  diary_id uuid not null references public.diaries(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.diary_replies
drop constraint if exists diary_replies_diary_id_author_id_key;

drop index if exists public.diary_replies_diary_id_author_id_key;

create table if not exists public.album_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  album_date date not null,
  image_url text not null,
  note text not null default '',
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, album_date)
);

insert into storage.buckets (id, name, public)
values ('needu-images', 'needu-images', true)
on conflict (id) do update set public = excluded.public;
