-- Supabase Schema for Family Chat (دردشة العائلة)
-- Private, lightweight family messaging with zero-barrier entry

-- 1. Family Rooms Table
create table if not exists public.family_rooms (
  id text primary key,
  name text not null default 'بيت العائلة',
  pinned_notice text default null,
  pinned_by text default null,
  pinned_at timestamptz default null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Default global family room
insert into public.family_rooms (id, name)
values ('bayt-al-aela', 'بيت العائلة')
on conflict (id) do nothing;

-- 2. Family Members Table (Presence & Active Participants)
create table if not exists public.family_members (
  id text primary key,
  room_id text not null default 'bayt-al-aela',
  display_name text not null,
  nickname text default null,
  avatar_color text not null default '#415F45',
  avatar_url text default null,
  password_hash text default null,
  last_seen_at timestamptz default timezone('utc'::text, now()) not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. Family Messages Table (Chat Messages with Reply & Audio Support)
create table if not exists public.family_messages (
  id text primary key,
  room_id text not null default 'bayt-al-aela',
  sender_id text not null,
  sender_name text not null,
  sender_nickname text default null,
  sender_color text not null default '#415F45',
  sender_avatar_url text default null,
  content text default '',
  image_url text default null,
  audio_url text default null,
  reply_to_id text default null,
  reply_to_text text default null,
  reply_to_sender text default null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. Family Reactions Table (Quick Reactions: ❤️, 👍, 😂, 🤲)
create table if not exists public.family_reactions (
  id text primary key,
  room_id text not null default 'bayt-al-aela',
  message_id text not null references public.family_messages(id) on delete cascade,
  sender_id text not null,
  sender_name text not null,
  emoji text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  constraint unique_family_message_user_emoji unique (message_id, sender_id, emoji)
);

-- Indexes for fast query performance
create index if not exists idx_family_messages_room_created on public.family_messages(room_id, created_at asc);
create index if not exists idx_family_reactions_message on public.family_reactions(message_id);
create index if not exists idx_family_members_room_lastseen on public.family_members(room_id, last_seen_at desc);

-- Enable Row Level Security (RLS)
alter table public.family_rooms enable row level security;
alter table public.family_members enable row level security;
alter table public.family_messages enable row level security;
alter table public.family_reactions enable row level security;

-- Frictionless Public Policies
create policy "Allow read family_rooms" on public.family_rooms for select using (true);
create policy "Allow insert family_rooms" on public.family_rooms for insert with check (true);
create policy "Allow update family_rooms" on public.family_rooms for update using (true);

create policy "Allow read family_members" on public.family_members for select using (true);
create policy "Allow insert family_members" on public.family_members for insert with check (true);
create policy "Allow update family_members" on public.family_members for update using (true);
create policy "Allow delete family_members" on public.family_members for delete using (true);

create policy "Allow read family_messages" on public.family_messages for select using (true);
create policy "Allow insert family_messages" on public.family_messages for insert with check (true);
create policy "Allow delete family_messages" on public.family_messages for delete using (true);

create policy "Allow read family_reactions" on public.family_reactions for select using (true);
create policy "Allow insert family_reactions" on public.family_reactions for insert with check (true);
create policy "Allow delete family_reactions" on public.family_reactions for delete using (true);

-- Enable Realtime publication for tables
alter publication supabase_realtime add table public.family_rooms;
alter publication supabase_realtime add table public.family_members;
alter publication supabase_realtime add table public.family_messages;
alter publication supabase_realtime add table public.family_reactions;

-- Storage Bucket for Family Photos (Public)
insert into storage.buckets (id, name, public)
values ('family-photos', 'family-photos', true)
on conflict (id) do nothing;

create policy "Allow public read on family photos"
on storage.objects for select
using (bucket_id = 'family-photos');

create policy "Allow public upload on family photos"
on storage.objects for insert
with check (bucket_id = 'family-photos');
