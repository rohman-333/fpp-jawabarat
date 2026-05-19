-- 042_notifications_final.sql
-- Idempotent migration: add missing columns to notifications and push_subscriptions

-- notifications table: new columns
alter table public.notifications add column if not exists title text;
alter table public.notifications add column if not exists body text;
alter table public.notifications add column if not exists href text;
alter table public.notifications add column if not exists is_read boolean default false;
alter table public.notifications add column if not exists actor_id uuid references public.profiles(id) on delete set null;

-- push_subscriptions table (create if not exists)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text,
  auth text,
  user_agent text,
  created_at timestamptz default now(),
  unique (user_id, endpoint)
);

-- RLS for push_subscriptions
alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can manage own push subscriptions" on public.push_subscriptions;
create policy "Users can manage own push subscriptions"
  on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow service role full access
drop policy if exists "Service role full access push_subscriptions" on public.push_subscriptions;
create policy "Service role full access push_subscriptions"
  on public.push_subscriptions
  for all
  to service_role
  using (true)
  with check (true);

-- notifications RLS (ensure users can only see their own)
alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications
  for update
  using (auth.uid() = user_id);

drop policy if exists "Service role full access notifications" on public.notifications;
create policy "Service role full access notifications"
  on public.notifications
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Authenticated can insert notifications" on public.notifications;
create policy "Authenticated can insert notifications"
  on public.notifications
  for insert
  to authenticated
  with check (true);
