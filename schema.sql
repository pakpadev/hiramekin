-- Supabase schema definition.
-- Not applied in v1; kept for the future device sync implementation.

create table memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  content text not null,
  is_pinned boolean default false,
  is_archived boolean default false,
  notify_at timestamptz default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index memos_user_id_idx on memos(user_id);
create index memos_updated_at_idx on memos(updated_at desc);
