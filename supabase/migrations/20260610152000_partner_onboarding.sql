create table public.branding_settings (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  brand_name text not null,
  primary_color text not null default '#16372f',
  logo_url text,
  website_url text,
  booking_page_title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, business_id),
  check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  check (website_url is null or website_url ~* '^https?://')
);

create unique index branding_settings_partner_default_idx
on public.branding_settings(partner_id)
where business_id is null;

create index branding_settings_business_id_idx
on public.branding_settings(business_id);

create trigger branding_settings_set_updated_at
before update on public.branding_settings
for each row execute function app_private.set_updated_at();

alter table public.branding_settings enable row level security;

create policy "Branding settings are tenant scoped"
on public.branding_settings
for all
to authenticated
using (
  app_private.is_platform_admin()
  or app_private.can_access_partner(partner_id)
  or (business_id is not null and app_private.can_access_business(business_id))
)
with check (
  app_private.is_platform_admin()
  or app_private.can_access_partner(partner_id)
  or (business_id is not null and app_private.can_access_business(business_id))
);

insert into public.branding_settings (
  id,
  partner_id,
  business_id,
  brand_name,
  primary_color,
  logo_url,
  website_url,
  booking_page_title
)
select
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  '11111111-1111-4111-8111-111111111111',
  null,
  'Local Growth Studio',
  '#16372f',
  null,
  'https://localgrowth.example',
  'Book with Local Growth Studio'
where exists (
  select 1
  from public.partners
  where id = '11111111-1111-4111-8111-111111111111'
)
on conflict (id) do update set
  partner_id = excluded.partner_id,
  business_id = excluded.business_id,
  brand_name = excluded.brand_name,
  primary_color = excluded.primary_color,
  logo_url = excluded.logo_url,
  website_url = excluded.website_url,
  booking_page_title = excluded.booking_page_title;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'partner-logos',
  'partner-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can upload onboarding logos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'partner-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update onboarding logos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'partner-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'partner-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can read partner logos"
on storage.objects
for select
to authenticated, anon
using (bucket_id = 'partner-logos');

create or replace function public.create_partner_onboarding(
  agency_name text,
  brand_name text,
  primary_color text,
  website_url text default null,
  logo_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_agency_name text := nullif(trim(agency_name), '');
  normalized_brand_name text := nullif(trim(brand_name), '');
  normalized_primary_color text := lower(nullif(trim(primary_color), ''));
  normalized_website_url text := nullif(trim(website_url), '');
  normalized_logo_url text := nullif(trim(logo_url), '');
  base_slug text;
  final_slug text;
  new_partner_id uuid;
  current_email text;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if exists (
    select 1
    from public.partner_users
    where user_id = current_user_id
      and status = 'active'
  ) then
    raise exception 'You already belong to a partner workspace.';
  end if;

  if normalized_agency_name is null or length(normalized_agency_name) < 2 or length(normalized_agency_name) > 120 then
    raise exception 'Agency name must be between 2 and 120 characters.';
  end if;

  if normalized_brand_name is null or length(normalized_brand_name) < 2 or length(normalized_brand_name) > 120 then
    raise exception 'Brand name must be between 2 and 120 characters.';
  end if;

  if normalized_primary_color is null or normalized_primary_color !~ '^#[0-9a-f]{6}$' then
    raise exception 'Primary color must be a valid hex color.';
  end if;

  if normalized_website_url is not null and normalized_website_url !~* '^https?://' then
    raise exception 'Website must start with http:// or https://.';
  end if;

  select email into current_email
  from auth.users
  where id = current_user_id;

  insert into public.profiles (id, email, full_name)
  values (
    current_user_id,
    coalesce(current_email, current_user_id::text || '@localops.local'),
    null
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email);

  base_slug := lower(regexp_replace(normalized_agency_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);

  if base_slug = '' then
    base_slug := 'partner';
  end if;

  final_slug := base_slug;

  while exists (select 1 from public.partners where slug = final_slug) loop
    final_slug := base_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
  end loop;

  insert into public.partners (
    name,
    slug,
    status,
    plan,
    owner_profile_id,
    brand_name,
    brand_color,
    logo_url
  ) values (
    normalized_agency_name,
    final_slug,
    'active',
    'mvp',
    current_user_id,
    normalized_brand_name,
    normalized_primary_color,
    normalized_logo_url
  )
  returning id into new_partner_id;

  insert into public.partner_users (
    partner_id,
    user_id,
    role,
    status
  ) values (
    new_partner_id,
    current_user_id,
    'owner',
    'active'
  );

  insert into public.branding_settings (
    partner_id,
    business_id,
    brand_name,
    primary_color,
    logo_url,
    website_url,
    booking_page_title
  ) values (
    new_partner_id,
    null,
    normalized_brand_name,
    normalized_primary_color,
    normalized_logo_url,
    normalized_website_url,
    normalized_brand_name || ' booking'
  );

  insert into public.events (
    partner_id,
    actor_profile_id,
    event_type,
    entity_table,
    entity_id,
    properties
  ) values (
    new_partner_id,
    current_user_id,
    'partner.onboarded',
    'partners',
    new_partner_id,
    jsonb_build_object('agency_name', normalized_agency_name)
  );

  return new_partner_id;
end;
$$;

revoke all on function public.create_partner_onboarding(text, text, text, text, text) from public;
grant execute on function public.create_partner_onboarding(text, text, text, text, text) to authenticated;
