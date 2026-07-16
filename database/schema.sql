-- TaskFlow Database Schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New Query)

-- Create an enum type for task priority
create type task_priority as enum ('low', 'medium', 'high');

-- Create the tasks table
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  priority task_priority not null default 'medium',
  due_date date,
  completed boolean not null default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index to speed up fetching a user's tasks
create index tasks_user_id_idx on tasks(user_id);

-- Enable Row Level Security so users can only access their own tasks
alter table tasks enable row level security;

-- Policy: users can view their own tasks
create policy "Users can view their own tasks"
  on tasks for select
  using (auth.uid() = user_id);

-- Policy: users can insert their own tasks
create policy "Users can insert their own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

-- Policy: users can update their own tasks
create policy "Users can update their own tasks"
  on tasks for update
  using (auth.uid() = user_id);

-- Policy: users can delete their own tasks
create policy "Users can delete their own tasks"
  on tasks for delete
  using (auth.uid() = user_id);

-- Function + trigger to auto-update the updated_at column on edit
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_tasks_updated_at
  before update on tasks
  for each row
  execute function update_updated_at_column();
