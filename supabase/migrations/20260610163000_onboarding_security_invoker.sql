create unique index if not exists partner_users_one_active_partner_per_user_idx
on public.partner_users(user_id)
where status = 'active';

create policy "Users can insert their own onboarding profile"
on public.profiles
for insert
to authenticated
with check (
  id = (select auth.uid())
  and role = 'business_member'
);

create policy "Users can create their first partner"
on public.partners
for insert
to authenticated
with check (
  owner_profile_id = (select auth.uid())
  and not exists (
    select 1
    from public.partner_users
    where user_id = (select auth.uid())
      and status = 'active'
  )
);

create policy "Users can read their owned partner during onboarding"
on public.partners
for select
to authenticated
using (
  owner_profile_id = (select auth.uid())
  and not exists (
    select 1
    from public.partner_users
    where user_id = (select auth.uid())
      and status = 'active'
  )
);

create policy "Users can create their own owner membership"
on public.partner_users
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'owner'
  and status = 'active'
  and not exists (
    select 1
    from public.partner_users
    where user_id = (select auth.uid())
      and status = 'active'
  )
  and exists (
    select 1
    from public.partners
    where partners.id = partner_users.partner_id
      and partners.owner_profile_id = (select auth.uid())
  )
);

create or replace function public.create_partner_onboarding(
  agency_name text,
  brand_name text,
  primary_color text,
  website_url text default null,
  logo_url text default null
)
returns uuid
language plpgsql
security invoker
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

  insert into public.profiles (id, email, full_name, role)
  values (
    current_user_id,
    current_user_id::text || '@localops.local',
    null,
    'business_member'
  )
  on conflict (id) do nothing;

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
revoke all on function public.create_partner_onboarding(text, text, text, text, text) from anon;
grant execute on function public.create_partner_onboarding(text, text, text, text, text) to authenticated;
