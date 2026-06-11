alter table public.leads
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists leads_metadata_gin_idx
  on public.leads using gin (metadata);

drop function if exists public.submit_public_booking_request(
  text,
  uuid,
  text,
  text,
  date,
  text,
  text,
  text
);

create or replace function public.submit_public_booking_request(
  business_slug text,
  service_id uuid,
  customer_full_name text,
  customer_phone text,
  preferred_date date,
  customer_email text default null,
  preferred_time text default null,
  customer_message text default null,
  lead_source text default null,
  utm_medium text default null,
  utm_campaign text default null
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
  v_source text := lower(trim(coalesce(lead_source, '')));
  v_utm_medium text := nullif(left(trim(coalesce(utm_medium, '')), 80), '');
  v_utm_campaign text := nullif(left(trim(coalesce(utm_campaign, '')), 120), '');
  v_phone_key text;
  v_lead_message text;
  v_metadata jsonb;
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

  if v_source = '' then
    v_source := 'booking_page';
  elsif v_source not in ('instagram', 'tiktok', 'facebook', 'google', 'booking_page') then
    v_source := 'other';
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
      v_source
    )
    returning id into v_customer_id;
  else
    update public.customers
    set
      full_name = v_full_name,
      email = coalesce(v_email, email),
      phone = v_phone,
      source = v_source
    where id = v_customer_id;
  end if;

  v_lead_message := concat_ws(
    E'\n',
    'Предпочитана дата: ' || preferred_date::text,
    case when v_time is not null then 'Предпочитан час: ' || v_time end,
    case when v_note is not null then 'Съобщение: ' || v_note end
  );

  v_metadata := jsonb_strip_nulls(
    jsonb_build_object(
      'utm_source', v_source,
      'utm_medium', v_utm_medium,
      'utm_campaign', v_utm_campaign
    )
  );

  insert into public.leads (
    business_id,
    customer_id,
    service_id,
    source,
    status,
    priority,
    preferred_date,
    preferred_time,
    message,
    metadata
  )
  values (
    v_business.id,
    v_customer_id,
    service_id,
    v_source,
    'new',
    'normal',
    preferred_date,
    v_time,
    v_lead_message,
    v_metadata
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
        'source', v_source,
        'utm_medium', v_utm_medium,
        'utm_campaign', v_utm_campaign,
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
  text,
  text,
  text,
  text
) from public;

revoke execute on function public.submit_public_booking_request(
  text,
  uuid,
  text,
  text,
  date,
  text,
  text,
  text,
  text,
  text,
  text
) from authenticated;

grant execute on function public.submit_public_booking_request(
  text,
  uuid,
  text,
  text,
  date,
  text,
  text,
  text,
  text,
  text,
  text
) to anon;
