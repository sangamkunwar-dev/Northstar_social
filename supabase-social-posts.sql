-- Run this in the Supabase SQL editor.
-- It creates the table expected by Northstar Social and secures rows per signed-in user.

create extension if not exists pgcrypto;

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  caption text not null,
  hashtags text not null default '',
  call_to_action text not null default '',
  platforms text[] not null default '{}',
  status text not null default 'published' check (status in ('draft', 'scheduled', 'published')),
  scheduled_for timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.social_posts enable row level security;

drop policy if exists "social_posts_select_own" on public.social_posts;
drop policy if exists "social_posts_insert_own" on public.social_posts;
drop policy if exists "social_posts_update_own" on public.social_posts;
drop policy if exists "social_posts_delete_own" on public.social_posts;

create policy "social_posts_select_own" on public.social_posts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "social_posts_insert_own" on public.social_posts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "social_posts_update_own" on public.social_posts
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "social_posts_delete_own" on public.social_posts
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.social_posts to authenticated;

create index if not exists social_posts_user_created_idx
  on public.social_posts (user_id, created_at desc);

-- Optional: verify the table definition after running this script.
select column_name, is_nullable, column_default, is_identity
from information_schema.columns
where table_schema = 'public' and table_name = 'social_posts'
order by ordinal_position;
