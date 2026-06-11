drop policy if exists "Users can create their first business" on public.businesses;
create policy "Users can create their first business"
on public.businesses
for insert
to authenticated
with check (
  not exists (
    select 1
    from public.business_users
    where user_id = (select auth.uid())
      and status = 'active'
  )
  and exists (
    select 1
    from public.partners
    where partners.id = businesses.partner_id
      and partners.owner_profile_id = (select auth.uid())
  )
);

drop policy if exists "Users can read their onboarding business" on public.businesses;
create policy "Users can read their onboarding business"
on public.businesses
for select
to authenticated
using (
  not exists (
    select 1
    from public.business_users
    where user_id = (select auth.uid())
      and status = 'active'
  )
  and exists (
    select 1
    from public.partners
    where partners.id = businesses.partner_id
      and partners.owner_profile_id = (select auth.uid())
  )
);

drop policy if exists "Users can create their own business owner membership" on public.business_users;
create policy "Users can create their own business owner membership"
on public.business_users
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'owner'
  and status = 'active'
  and not exists (
    select 1
    from public.business_users
    where user_id = (select auth.uid())
      and status = 'active'
  )
  and exists (
    select 1
    from public.businesses
    join public.partners on partners.id = businesses.partner_id
    where businesses.id = business_users.business_id
      and partners.owner_profile_id = (select auth.uid())
  )
);

create or replace function public.create_business_onboarding(
  business_name text,
  business_type text default 'beauty_wellness',
  primary_color text default '#16372f',
  website_url text default null,
  phone_number text default null,
  logo_url text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_business_name text := nullif(trim(business_name), '');
  normalized_business_type text := nullif(trim(business_type), '');
  normalized_primary_color text := lower(nullif(trim(primary_color), ''));
  normalized_website_url text := nullif(trim(website_url), '');
  normalized_phone_number text := nullif(trim(phone_number), '');
  normalized_logo_url text := nullif(trim(logo_url), '');
  base_slug text;
  partner_slug text;
  business_slug text;
  public_slug text;
  new_partner_id uuid;
  new_business_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if exists (
    select 1
    from public.partner_users
    where user_id = current_user_id
      and status = 'active'
  ) or exists (
    select 1
    from public.business_users
    where user_id = current_user_id
      and status = 'active'
  ) then
    raise exception 'User already has an active workspace.';
  end if;

  if normalized_business_name is null or length(normalized_business_name) < 2 or length(normalized_business_name) > 120 then
    raise exception 'Business name must be between 2 and 120 characters.';
  end if;

  if normalized_business_type is null or normalized_business_type not in ('beauty_wellness', 'dental_esthetic', 'cleaning_field_service', 'other') then
    raise exception 'Business type is invalid.';
  end if;

  if normalized_primary_color is null or normalized_primary_color !~ '^#[0-9a-f]{6}$' then
    raise exception 'Primary color must be a valid hex color.';
  end if;

  if normalized_website_url is not null and normalized_website_url !~* '^https?://' then
    raise exception 'Website must start with http:// or https://.';
  end if;

  if normalized_phone_number is not null and length(normalized_phone_number) > 40 then
    raise exception 'Phone number is too long.';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    current_user_id,
    current_user_id::text || '@localops.local',
    null,
    'business_member'
  )
  on conflict (id) do nothing;

  base_slug := lower(regexp_replace(normalized_business_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);

  if base_slug = '' then
    base_slug := 'business';
  end if;

  partner_slug := base_slug || '-workspace';

  loop
    begin
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
        normalized_business_name || ' Workspace',
        partner_slug,
        'active',
        'mvp',
        current_user_id,
        normalized_business_name,
        normalized_primary_color,
        normalized_logo_url
      )
      returning id into new_partner_id;

      exit;
    exception
      when unique_violation then
        partner_slug := base_slug || '-workspace-' || substr(gen_random_uuid()::text, 1, 8);
    end;
  end loop;

  business_slug := base_slug;
  public_slug := base_slug;

  loop
    begin
      insert into public.businesses (
        partner_id,
        name,
        slug,
        public_slug,
        vertical,
        status,
        timezone,
        phone,
        country
      ) values (
        new_partner_id,
        normalized_business_name,
        business_slug,
        public_slug,
        normalized_business_type,
        'active',
        'Europe/Sofia',
        normalized_phone_number,
        'BG'
      )
      returning id into new_business_id;

      exit;
    exception
      when unique_violation then
        business_slug := base_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
        public_slug := business_slug;
    end;
  end loop;

  insert into public.business_users (
    business_id,
    user_id,
    role,
    status
  ) values (
    new_business_id,
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
    new_business_id,
    normalized_business_name,
    normalized_primary_color,
    normalized_logo_url,
    normalized_website_url,
    'Запази час в ' || normalized_business_name
  );

  insert into public.events (
    partner_id,
    business_id,
    actor_profile_id,
    event_type,
    entity_table,
    entity_id,
    properties
  ) values (
    new_partner_id,
    new_business_id,
    current_user_id,
    'business.onboarded',
    'businesses',
    new_business_id,
    jsonb_build_object('vertical', normalized_business_type)
  );

  return new_business_id;
end;
$$;

revoke all on function public.create_business_onboarding(text, text, text, text, text, text) from public;
revoke all on function public.create_business_onboarding(text, text, text, text, text, text) from anon;
grant execute on function public.create_business_onboarding(text, text, text, text, text, text) to authenticated;
