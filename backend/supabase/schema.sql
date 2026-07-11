-- TaxGenie Database Schema
-- Run this in your Supabase project → SQL Editor

-- ─── PROFILES ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text,
  pan         text,
  gstin       text,
  phone       text,
  city        text,
  state       text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── FILINGS ─────────────────────────────────────────────────────────────────
create table if not exists public.filings (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade,
  type            text not null,            -- 'ITR-1', 'GSTR-3B', 'TDS-26Q', etc.
  assessment_year text,                     -- e.g. '2025-26'
  period          text,                     -- e.g. 'June 2026'
  status          text default 'draft',     -- draft | submitted | filed
  data            jsonb,                    -- all form data as JSON
  ai_advice       text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.filings enable row level security;
create policy "Users see own filings" on public.filings for all using (auth.uid() = user_id);


-- ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
create table if not exists public.transactions (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade,
  date            date not null,
  description     text not null,
  amount          numeric(14,2) not null,
  type            text not null,            -- 'income' | 'expense'
  category        text,
  gst_rate        numeric(5,2) default 0,
  gst_amount      numeric(14,2) default 0,
  invoice_no      text,
  party_name      text,
  party_gstin     text,
  created_at      timestamptz default now()
);

alter table public.transactions enable row level security;
create policy "Users see own transactions" on public.transactions for all using (auth.uid() = user_id);


-- ─── EMPLOYEES (for payroll) ──────────────────────────────────────────────────
create table if not exists public.employees (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade,
  name            text not null,
  pan             text,
  uan             text,      -- EPF UAN
  basic           numeric(12,2) default 0,
  hra             numeric(12,2) default 0,
  special_allowance numeric(12,2) default 0,
  pf_percent      numeric(5,2) default 12,
  status          text default 'active',
  joined_date     date,
  created_at      timestamptz default now()
);

alter table public.employees enable row level security;
create policy "Users see own employees" on public.employees for all using (auth.uid() = user_id);


-- ─── DOCUMENTS ────────────────────────────────────────────────────────────────
create table if not exists public.documents (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade,
  name            text not null,
  type            text,      -- 'form16', 'bank_statement', 'invoice', '26as', etc.
  storage_path    text,      -- Supabase Storage path
  parsed_data     jsonb,     -- OCR/AI extracted data
  status          text default 'uploaded',
  created_at      timestamptz default now()
);

alter table public.documents enable row level security;
create policy "Users see own documents" on public.documents for all using (auth.uid() = user_id);


-- ─── COMPLIANCE CALENDAR ──────────────────────────────────────────────────────
create table if not exists public.deadlines (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade,
  title           text not null,
  form            text,
  due_date        date not null,
  status          text default 'pending',   -- pending | filed | missed
  notes           text,
  created_at      timestamptz default now()
);

alter table public.deadlines enable row level security;
create policy "Users see own deadlines" on public.deadlines for all using (auth.uid() = user_id);
