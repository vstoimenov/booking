revoke all privileges on table public.businesses from anon;
revoke all privileges on table public.services from anon;
revoke all privileges on table public.branding_settings from anon;
revoke all privileges on table public.customers from anon;
revoke all privileges on table public.leads from anon;
revoke all privileges on table public.events from anon;

grant select (
  id,
  name,
  public_slug,
  vertical,
  status,
  contact_email,
  phone,
  address_line,
  city,
  region,
  country
) on public.businesses to anon;

grant select (
  id,
  business_id,
  name,
  description,
  duration_minutes,
  price_cents,
  currency,
  is_active,
  sort_order
) on public.services to anon;

grant select (
  business_id,
  brand_name,
  primary_color,
  logo_url,
  website_url,
  booking_page_title
) on public.branding_settings to anon;

drop policy if exists "Public can read active booking businesses" on public.businesses;
create policy "Public can read active booking businesses"
on public.businesses
for select
to anon
using (status = 'active');

drop policy if exists "Public can read active booking services" on public.services;
create policy "Public can read active booking services"
on public.services
for select
to anon
using (
  is_active = true
  and exists (
    select 1
    from public.businesses
    where businesses.id = services.business_id
      and businesses.status = 'active'
  )
);

drop policy if exists "Public can read active booking branding" on public.branding_settings;
create policy "Public can read active booking branding"
on public.branding_settings
for select
to anon
using (
  business_id is not null
  and exists (
    select 1
    from public.businesses
    where businesses.id = branding_settings.business_id
      and businesses.status = 'active'
  )
);

create or replace function public.submit_public_booking_request(
  business_slug text,
  service_id uuid,
  customer_full_name text,
  customer_phone text,
  preferred_date date,
  customer_email text default null,
  preferred_time text default null,
  customer_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_business public.businesses%rowtype;
  v_customer_id uuid;
  v_lead_id uuid;
  v_service_name text;
  v_slug text := lower(trim(coalesce(business_slug, '')));
  v_full_name text := trim(coalesce(customer_full_name, ''));
  v_phone text := trim(coalesce(customer_phone, ''));
  v_email text := nullif(lower(trim(coalesce(customer_email, ''))), '');
  v_time text := nullif(trim(coalesce(preferred_time, '')), '');
  v_note text := nullif(trim(coalesce(customer_message, '')), '');
  v_phone_key text;
  v_lead_message text;
begin
  if length(v_slug) < 2 or length(v_slug) > 140 then
    raise exception 'Invalid booking page.';
  end if;

  if length(v_full_name) < 2 or length(v_full_name) > 120 then
    raise exception 'Full name is required.';
  end if;

  if length(v_phone) < 5 or length(v_phone) > 40 then
    raise exception 'Phone is required.';
  end if;

  if v_email is not null and (
    length(v_email) > 160
    or v_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  ) then
    raise exception 'Invalid email.';
  end if;

  if preferred_date is null then
    raise exception 'Preferred date is required.';
  end if;

  if preferred_date < current_date then
    raise exception 'Preferred date cannot be in the past.';
  end if;

  if preferred_date > current_date + interval '1 year' then
    raise exception 'Preferred date is too far in the future.';
  end if;

  if v_time is not null and length(v_time) > 20 then
    raise exception 'Preferred time is invalid.';
  end if;

  if v_note is not null and length(v_note) > 1000 then
    raise exception 'Message is too long.';
  end if;

  select *
  into v_business
  from public.businesses
  where public_slug = v_slug
    and status = 'active'
  limit 1;

  if not found then
    raise exception 'Booking page not found.';
  end if;

  select name
  into v_service_name
  from public.services
  where id = service_id
    and business_id = v_business.id
    and is_active = true
  limit 1;

  if not found then
    raise exception 'Selected service is not available.';
  end if;

  v_phone_key := regexp_replace(v_phone, '\s+', '', 'g');

  select id
  into v_customer_id
  from public.customers
  where business_id = v_business.id
    and (
      regexp_replace(coalesce(phone, ''), '\s+', '', 'g') = v_phone_key
      or (v_email is not null and lower(coalesce(email, '')) = v_email)
    )
  order by updated_at desc
  limit 1;

  if v_customer_id is null then
    insert into public.customers (
      business_id,
      full_name,
      email,
      phone,
      source
    )
    values (
      v_business.id,
      v_full_name,
      v_email,
      v_phone,
      'booking_page'
    )
    returning id into v_customer_id;
  else
    update public.customers
    set
      full_name = v_full_name,
      email = coalesce(v_email, email),
      phone = v_phone,
      source = 'booking_page'
    where id = v_customer_id;
  end if;

  v_lead_message := concat_ws(
    E'\n',
    'Предпочитана дата: ' || preferred_date::text,
    case when v_time is not null then 'Предпочитан час: ' || v_time end,
    case when v_note is not null then 'Съобщение: ' || v_note end
  );

  insert into public.leads (
    business_id,
    customer_id,
    service_id,
    source,
    status,
    priority,
    message
  )
  values (
    v_business.id,
    v_customer_id,
    service_id,
    'booking_page',
    'new',
    'normal',
    v_lead_message
  )
  returning id into v_lead_id;

  insert into public.events (
    partner_id,
    business_id,
    customer_id,
    event_type,
    entity_table,
    entity_id,
    properties
  )
  values (
    v_business.partner_id,
    v_business.id,
    v_customer_id,
    'lead_created',
    'leads',
    v_lead_id,
    jsonb_strip_nulls(
      jsonb_build_object(
        'source', 'booking_page',
        'service_id', service_id,
        'service_name', v_service_name,
        'preferred_date', preferred_date::text,
        'preferred_time', v_time
      )
    )
  );

  return v_lead_id;
end;
$$;

revoke all on function public.submit_public_booking_request(
  text,
  uuid,
  text,
  text,
  date,
  text,
  text,
  text
) from public;

grant execute on function public.submit_public_booking_request(
  text,
  uuid,
  text,
  text,
  date,
  text,
  text,
  text
) to anon, authenticated;
