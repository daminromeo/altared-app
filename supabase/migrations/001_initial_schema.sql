-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- USERS / PROFILES
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  partner_name text,
  wedding_date date,
  wedding_location text,
  estimated_guest_count integer,
  total_budget numeric(12,2) default 0,
  avatar_url text,
  stripe_customer_id text unique,
  subscription_status text default 'free' check (subscription_status in ('free', 'pro', 'premium')),
  subscription_id text,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- VENDOR CATEGORIES
-- ============================================
create table public.vendor_categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  icon text,
  default_budget_percentage numeric(5,2),
  sort_order integer default 0
);

-- Seed default categories
insert into public.vendor_categories (name, icon, default_budget_percentage, sort_order) values
  ('Venue', 'building', 40.00, 1),
  ('Photographer', 'camera', 12.00, 2),
  ('Videographer', 'video', 8.00, 3),
  ('Catering', 'utensils', 0.00, 4),
  ('Florist', 'flower', 8.00, 5),
  ('DJ / Band', 'music', 7.00, 6),
  ('Wedding Planner', 'clipboard', 10.00, 7),
  ('Hair & Makeup', 'sparkles', 3.00, 8),
  ('Cake / Bakery', 'cake', 2.00, 9),
  ('Officiant', 'heart', 1.00, 10),
  ('Transportation', 'car', 2.00, 11),
  ('Rentals', 'tent', 3.00, 12),
  ('Stationery', 'mail', 2.00, 13),
  ('Attire', 'shirt', 5.00, 14),
  ('Other', 'plus', 0.00, 15);

-- ============================================
-- VENDORS
-- ============================================
create table public.vendors (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.vendor_categories(id),
  name text not null,
  company_name text,
  email text,
  phone text,
  website text,
  instagram text,
  source text check (source in ('manual', 'the_knot', 'wedding_wire', 'referral', 'other')),
  source_url text,
  status text default 'researching' check (status in ('researching', 'contacted', 'quoted', 'meeting_scheduled', 'negotiating', 'booked', 'declined', 'archived')),
  rating integer check (rating >= 1 and rating <= 5),
  notes text,
  quoted_price numeric(12,2),
  final_price numeric(12,2),
  deposit_amount numeric(12,2),
  deposit_due_date date,
  deposit_paid boolean default false,
  is_booked boolean default false,
  booked_date date,
  tags text[],
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- PROPOSALS (uploaded documents)
-- ============================================
create table public.proposals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  vendor_id uuid references public.vendors(id) on delete set null,
  file_url text not null,
  file_name text not null,
  file_size integer,
  scan_status text default 'pending' check (scan_status in ('pending', 'scanning', 'completed', 'failed')),
  scanned_data jsonb default '{}',
  -- Extracted fields from AI scan
  extracted_vendor_name text,
  extracted_total_price numeric(12,2),
  extracted_deposit_amount numeric(12,2),
  extracted_deposit_due_date date,
  extracted_payment_schedule jsonb,
  extracted_services text[],
  extracted_terms text,
  extracted_cancellation_policy text,
  extracted_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- BUDGET ITEMS
-- ============================================
create table public.budget_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.vendor_categories(id),
  vendor_id uuid references public.vendors(id) on delete set null,
  description text not null,
  estimated_cost numeric(12,2) default 0,
  actual_cost numeric(12,2) default 0,
  is_paid boolean default false,
  paid_date date,
  due_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- MESSAGES (unified inbox)
-- ============================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  vendor_id uuid references public.vendors(id) on delete set null,
  source text not null check (source in ('email', 'the_knot', 'wedding_wire', 'manual', 'other')),
  direction text not null check (direction in ('inbound', 'outbound')),
  subject text,
  body text,
  sender_email text,
  sender_name text,
  received_at timestamptz default now(),
  is_read boolean default false,
  is_starred boolean default false,
  thread_id text,
  external_id text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================
-- REMINDERS
-- ============================================
create table public.reminders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  vendor_id uuid references public.vendors(id) on delete set null,
  title text not null,
  description text,
  due_date timestamptz not null,
  is_completed boolean default false,
  reminder_type text check (reminder_type in ('deposit', 'meeting', 'follow_up', 'payment', 'deadline', 'custom')),
  created_at timestamptz default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_vendors_user_id on public.vendors(user_id);
create index idx_vendors_status on public.vendors(status);
create index idx_vendors_category on public.vendors(category_id);
create index idx_proposals_user_id on public.proposals(user_id);
create index idx_proposals_vendor_id on public.proposals(vendor_id);
create index idx_budget_items_user_id on public.budget_items(user_id);
create index idx_messages_user_id on public.messages(user_id);
create index idx_messages_vendor_id on public.messages(vendor_id);
create index idx_reminders_user_id on public.reminders(user_id);
create index idx_reminders_due_date on public.reminders(due_date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.proposals enable row level security;
alter table public.budget_items enable row level security;
alter table public.messages enable row level security;
alter table public.reminders enable row level security;

-- Profiles: users can only see/edit their own
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Vendors: users can only see/manage their own
create policy "Users can view own vendors" on public.vendors for select using (auth.uid() = user_id);
create policy "Users can insert own vendors" on public.vendors for insert with check (auth.uid() = user_id);
create policy "Users can update own vendors" on public.vendors for update using (auth.uid() = user_id);
create policy "Users can delete own vendors" on public.vendors for delete using (auth.uid() = user_id);

-- Proposals: users can only see/manage their own
create policy "Users can view own proposals" on public.proposals for select using (auth.uid() = user_id);
create policy "Users can insert own proposals" on public.proposals for insert with check (auth.uid() = user_id);
create policy "Users can update own proposals" on public.proposals for update using (auth.uid() = user_id);
create policy "Users can delete own proposals" on public.proposals for delete using (auth.uid() = user_id);

-- Budget items: users can only see/manage their own
create policy "Users can view own budget items" on public.budget_items for select using (auth.uid() = user_id);
create policy "Users can insert own budget items" on public.budget_items for insert with check (auth.uid() = user_id);
create policy "Users can update own budget items" on public.budget_items for update using (auth.uid() = user_id);
create policy "Users can delete own budget items" on public.budget_items for delete using (auth.uid() = user_id);

-- Messages: users can only see/manage their own
create policy "Users can view own messages" on public.messages for select using (auth.uid() = user_id);
create policy "Users can insert own messages" on public.messages for insert with check (auth.uid() = user_id);
create policy "Users can update own messages" on public.messages for update using (auth.uid() = user_id);

-- Reminders: users can only see/manage their own
create policy "Users can view own reminders" on public.reminders for select using (auth.uid() = user_id);
create policy "Users can insert own reminders" on public.reminders for insert with check (auth.uid() = user_id);
create policy "Users can update own reminders" on public.reminders for update using (auth.uid() = user_id);
create policy "Users can delete own reminders" on public.reminders for delete using (auth.uid() = user_id);

-- Vendor categories: readable by all authenticated users
create policy "Authenticated users can view categories" on public.vendor_categories for select using (auth.role() = 'authenticated');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at();
create trigger update_vendors_updated_at before update on public.vendors for each row execute function public.update_updated_at();
create trigger update_proposals_updated_at before update on public.proposals for each row execute function public.update_updated_at();
create trigger update_budget_items_updated_at before update on public.budget_items for each row execute function public.update_updated_at();

-- Auto-create budget item when vendor is booked
create or replace function public.handle_vendor_booked()
returns trigger as $$
begin
  if new.is_booked = true and (old.is_booked = false or old.is_booked is null) then
    insert into public.budget_items (user_id, category_id, vendor_id, description, estimated_cost, actual_cost)
    values (
      new.user_id,
      new.category_id,
      new.id,
      coalesce(new.company_name, new.name) || ' - ' || coalesce((select name from public.vendor_categories where id = new.category_id), 'Uncategorized'),
      coalesce(new.final_price, new.quoted_price, 0),
      coalesce(new.final_price, 0)
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_vendor_booked
  after update on public.vendors
  for each row execute function public.handle_vendor_booked();
