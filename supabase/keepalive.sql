-- Keepalive for the Supabase Free plan.
-- Free projects are paused after ~7 days without database activity, which
-- silently broke Stay Check (Jun–Oct 2026). The daily GitHub Action
-- .github/workflows/supabase-keepalive.yml calls keepalive_ping(), which does a
-- real WRITE (counts as activity), using only the public anon key.
--
-- Run once in Supabase Dashboard → SQL Editor.

create table if not exists public.keepalive (
  id int primary key default 1 check (id = 1),
  pinged_at timestamptz not null default now()
);

-- RLS on with no policies: nobody can touch the table directly, only via the function below.
alter table public.keepalive enable row level security;

insert into public.keepalive (id) values (1) on conflict (id) do nothing;

create or replace function public.keepalive_ping()
returns timestamptz
language sql
security definer
set search_path = public
as $$
  update public.keepalive set pinged_at = now() where id = 1 returning pinged_at;
$$;

revoke all on function public.keepalive_ping() from public;
grant execute on function public.keepalive_ping() to anon;
