-- Rode no Supabase: SQL Editor > New query > Run
create table if not exists public.app_state (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_state enable row level security;
-- Só usuários logados (Supabase Auth) leem e gravam. Visitantes anônimos: nada.
drop policy if exists "auth_all" on public.app_state;
create policy "auth_all" on public.app_state
  for all to authenticated using (true) with check (true);
