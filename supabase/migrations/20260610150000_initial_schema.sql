create extension if not exists pgcrypto;

create schema if not exists app_private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  role text not null default 'business_member'
    check (role in ('platform_admin', 'partner_admin', 'partner_member', 'business_admin', 'business_member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active'
    check (status in ('active', 'trialing', 'suspended', 'archived')),
  plan text not null default 'mvp'
    check (plan in ('mvp', 'starter', 'growth', 'enterprise')),
  owner_profile_id uuid references public.profiles(id) on delete set null,
  brand_name text,
  brand_color text not null default '#16372f',
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partner_users (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'member')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, user_id)
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  name text not null,
  slug text not null,
  public_slug text not null unique,
  vertical text not null default 'other'
    check (vertical in ('beauty_wellness', 'dental_esthetic', 'cleaning_field_service', 'other')),
  status text not null default 'active'
    check (status in ('active', 'draft', 'paused', 'archived')),
  timezone text not null default 'America/New_York',
  contact_email text,
  phone text,
  address_line text,
  city text,
  region text,
  postal_code text,
  country text not null default 'US',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, slug)
);

create table public.business_users (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'staff'
    check (role in ('owner', 'admin', 'staff')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes <= 720),
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'USD',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  notes text,
  source text not null default 'booking_page',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  assigned_profile_id uuid references public.profiles(id) on delete set null,
  source text not null default 'booking_page',
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'booked', 'lost')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high')),
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  assigned_profile_id uuid references public.profiles(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.automation_templates (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  scope text not null default 'business'
    check (scope in ('partner', 'business')),
  type text not null
    check (type in ('lead_follow_up', 'appointment_reminder', 'review_request')),
  channel text not null default 'email'
    check (channel in ('email', 'sms')),
  name text not null,
  subject text,
  body text not null,
  delay_minutes integer not null default 0 check (delay_minutes >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (scope = 'partner' and partner_id is not null and business_id is null) or
    (scope = 'business' and business_id is not null)
  )
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  automation_template_id uuid references public.automation_templates(id) on delete set null,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  direction text not null default 'outbound'
    check (direction in ('inbound', 'outbound', 'internal')),
  channel text not null
    check (channel in ('email', 'sms', 'phone', 'internal')),
  status text not null default 'queued'
    check (status in ('draft', 'queued', 'sent', 'delivered', 'failed')),
  subject text,
  body text not null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  status text not null default 'requested'
    check (status in ('requested', 'opened', 'submitted', 'published', 'declined')),
  rating integer check (rating between 1 and 5),
  review_url text,
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  event_type text not null,
  entity_table text,
  entity_id uuid,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (partner_id is not null or business_id is not null)
);

create index profiles_role_idx on public.profiles(role);
create index partners_owner_profile_id_idx on public.partners(owner_profile_id);
create index partner_users_user_id_idx on public.partner_users(user_id);
create index partner_users_partner_id_status_idx on public.partner_users(partner_id, status);
create index businesses_partner_id_idx on public.businesses(partner_id);
create index businesses_public_slug_idx on public.businesses(public_slug);
create index business_users_user_id_idx on public.business_users(user_id);
create index business_users_business_id_status_idx on public.business_users(business_id, status);
create index services_business_id_active_idx on public.services(business_id, is_active);
create index customers_business_id_created_at_idx on public.customers(business_id, created_at desc);
create index customers_business_id_email_idx on public.customers(business_id, email);
create index customers_business_id_phone_idx on public.customers(business_id, phone);
create index leads_business_id_status_idx on public.leads(business_id, status);
create index leads_customer_id_idx on public.leads(customer_id);
create index leads_created_at_idx on public.leads(created_at desc);
create index appointments_business_id_starts_at_idx on public.appointments(business_id, starts_at);
create index appointments_customer_id_idx on public.appointments(customer_id);
create index automation_templates_partner_id_idx on public.automation_templates(partner_id);
create index automation_templates_business_id_idx on public.automation_templates(business_id);
create index messages_business_id_created_at_idx on public.messages(business_id, created_at desc);
create index messages_customer_id_idx on public.messages(customer_id);
create index reviews_business_id_status_idx on public.reviews(business_id, status);
create index reviews_customer_id_idx on public.reviews(customer_id);
create index events_partner_id_created_at_idx on public.events(partner_id, created_at desc);
create index events_business_id_created_at_idx on public.events(business_id, created_at desc);
create index events_properties_gin_idx on public.events using gin (properties);

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, new.id::text || '@localops.local'),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function app_private.handle_new_user();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function app_private.set_updated_at();

create trigger partners_set_updated_at
before update on public.partners
for each row execute function app_private.set_updated_at();

create trigger partner_users_set_updated_at
before update on public.partner_users
for each row execute function app_private.set_updated_at();

create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function app_private.set_updated_at();

create trigger business_users_set_updated_at
before update on public.business_users
for each row execute function app_private.set_updated_at();

create trigger services_set_updated_at
before update on public.services
for each row execute function app_private.set_updated_at();

create trigger customers_set_updated_at
before update on public.customers
for each row execute function app_private.set_updated_at();

create trigger leads_set_updated_at
before update on public.leads
for each row execute function app_private.set_updated_at();

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function app_private.set_updated_at();

create trigger automation_templates_set_updated_at
before update on public.automation_templates
for each row execute function app_private.set_updated_at();

create trigger messages_set_updated_at
before update on public.messages
for each row execute function app_private.set_updated_at();

create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function app_private.set_updated_at();

create trigger events_set_updated_at
before update on public.events
for each row execute function app_private.set_updated_at();

create or replace function app_private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'platform_admin'
  );
$$;

create or replace function app_private.current_partner_ids()
returns uuid[]
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(array_agg(distinct partner_id), '{}'::uuid[])
  from public.partner_users
  where user_id = auth.uid()
    and status = 'active';
$$;

create or replace function app_private.current_business_ids()
returns uuid[]
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(array_agg(distinct business_id), '{}'::uuid[])
  from public.business_users
  where user_id = auth.uid()
    and status = 'active';
$$;

create or replace function app_private.can_access_partner(target_partner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app_private.is_platform_admin()
    or target_partner_id = any(app_private.current_partner_ids());
$$;

create or replace function app_private.can_read_partner(target_partner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app_private.can_access_partner(target_partner_id)
    or exists (
      select 1
      from public.business_users bu
      join public.businesses b on b.id = bu.business_id
      where bu.user_id = auth.uid()
        and bu.status = 'active'
        and b.partner_id = target_partner_id
    );
$$;

create or replace function app_private.can_access_business(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app_private.is_platform_admin()
    or target_business_id = any(app_private.current_business_ids())
    or exists (
      select 1
      from public.businesses
      where id = target_business_id
        and partner_id = any(app_private.current_partner_ids())
    );
$$;

grant usage on schema app_private to authenticated;
grant execute on all functions in schema app_private to authenticated;

alter table public.profiles enable row level security;
alter table public.partners enable row level security;
alter table public.partner_users enable row level security;
alter table public.businesses enable row level security;
alter table public.business_users enable row level security;
alter table public.services enable row level security;
alter table public.customers enable row level security;
alter table public.leads enable row level security;
alter table public.appointments enable row level security;
alter table public.automation_templates enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.events enable row level security;

create policy "Platform admins can manage profiles"
on public.profiles
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Partner and business users can read related profiles"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.partner_users current_membership
    join public.partner_users target_membership
      on target_membership.partner_id = current_membership.partner_id
    where current_membership.user_id = auth.uid()
      and current_membership.status = 'active'
      and target_membership.user_id = profiles.id
      and target_membership.status = 'active'
  )
  or exists (
    select 1
    from public.business_users current_membership
    join public.business_users target_membership
      on target_membership.business_id = current_membership.business_id
    where current_membership.user_id = auth.uid()
      and current_membership.status = 'active'
      and target_membership.user_id = profiles.id
      and target_membership.status = 'active'
  )
);

create policy "Platform admins can manage partners"
on public.partners
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy "Partner users can manage their partner"
on public.partners
for all
to authenticated
using (app_private.can_access_partner(id))
with check (app_private.can_access_partner(id));

create policy "Business users can read their parent partner"
on public.partners
for select
to authenticated
using (app_private.can_read_partner(id));

create policy "Platform admins can manage partner users"
on public.partner_users
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy "Partner users can access partner memberships"
on public.partner_users
for all
to authenticated
using (app_private.can_access_partner(partner_id))
with check (app_private.can_access_partner(partner_id));

create policy "Users can read their own partner membership"
on public.partner_users
for select
to authenticated
using (user_id = auth.uid());

create policy "Platform admins can manage businesses"
on public.businesses
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy "Partner users can manage partner businesses"
on public.businesses
for all
to authenticated
using (app_private.can_access_partner(partner_id))
with check (app_private.can_access_partner(partner_id));

create policy "Business users can access assigned businesses"
on public.businesses
for all
to authenticated
using (app_private.can_access_business(id))
with check (app_private.can_access_business(id));

create policy "Platform admins can manage business users"
on public.business_users
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy "Partner users can manage business memberships"
on public.business_users
for all
to authenticated
using (
  exists (
    select 1
    from public.businesses
    where businesses.id = business_users.business_id
      and app_private.can_access_partner(businesses.partner_id)
  )
)
with check (
  exists (
    select 1
    from public.businesses
    where businesses.id = business_users.business_id
      and app_private.can_access_partner(businesses.partner_id)
  )
);

create policy "Business users can read assigned business memberships"
on public.business_users
for select
to authenticated
using (app_private.can_access_business(business_id));

create policy "Services are tenant scoped"
on public.services
for all
to authenticated
using (app_private.can_access_business(business_id))
with check (app_private.can_access_business(business_id));

create policy "Customers are tenant scoped"
on public.customers
for all
to authenticated
using (app_private.can_access_business(business_id))
with check (app_private.can_access_business(business_id));

create policy "Leads are tenant scoped"
on public.leads
for all
to authenticated
using (app_private.can_access_business(business_id))
with check (app_private.can_access_business(business_id));

create policy "Appointments are tenant scoped"
on public.appointments
for all
to authenticated
using (app_private.can_access_business(business_id))
with check (app_private.can_access_business(business_id));

create policy "Automation templates are tenant scoped"
on public.automation_templates
for all
to authenticated
using (
  app_private.is_platform_admin()
  or (partner_id is not null and app_private.can_access_partner(partner_id))
  or (business_id is not null and app_private.can_access_business(business_id))
)
with check (
  app_private.is_platform_admin()
  or (partner_id is not null and app_private.can_access_partner(partner_id))
  or (business_id is not null and app_private.can_access_business(business_id))
);

create policy "Messages are tenant scoped"
on public.messages
for all
to authenticated
using (app_private.can_access_business(business_id))
with check (app_private.can_access_business(business_id));

create policy "Reviews are tenant scoped"
on public.reviews
for all
to authenticated
using (app_private.can_access_business(business_id))
with check (app_private.can_access_business(business_id));

create policy "Events are tenant scoped"
on public.events
for all
to authenticated
using (
  app_private.is_platform_admin()
  or (partner_id is not null and app_private.can_access_partner(partner_id))
  or (business_id is not null and app_private.can_access_business(business_id))
)
with check (
  app_private.is_platform_admin()
  or (partner_id is not null and app_private.can_access_partner(partner_id))
  or (business_id is not null and app_private.can_access_business(business_id))
);
