insert into public.partners (
  id,
  name,
  slug,
  status,
  plan,
  brand_name,
  brand_color
) values (
  '11111111-1111-4111-8111-111111111111',
  'Demo Local Growth Agency',
  'demo-local-growth-agency',
  'active',
  'mvp',
  'Local Growth Studio',
  '#16372f'
) on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  status = excluded.status,
  plan = excluded.plan,
  brand_name = excluded.brand_name,
  brand_color = excluded.brand_color;

insert into public.businesses (
  id,
  partner_id,
  name,
  slug,
  public_slug,
  vertical,
  status,
  timezone,
  contact_email,
  phone,
  city,
  region
) values
  (
    '22222222-2222-4222-8222-222222222221',
    '11111111-1111-4111-8111-111111111111',
    'Glow Studio',
    'glow-studio',
    'glow-studio-demo',
    'beauty_wellness',
    'active',
    'America/New_York',
    'hello@glowstudio.example',
    '+1 555 0101',
    'Brooklyn',
    'NY'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    'Bright Dental Clinic',
    'bright-dental-clinic',
    'bright-dental-demo',
    'dental_esthetic',
    'active',
    'America/Chicago',
    'frontdesk@brightdental.example',
    '+1 555 0102',
    'Austin',
    'TX'
  ),
  (
    '22222222-2222-4222-8222-222222222223',
    '11111111-1111-4111-8111-111111111111',
    'FreshNest Cleaning',
    'freshnest-cleaning',
    'freshnest-cleaning-demo',
    'cleaning_field_service',
    'active',
    'America/Los_Angeles',
    'bookings@freshnest.example',
    '+1 555 0103',
    'Portland',
    'OR'
  )
on conflict (id) do update set
  partner_id = excluded.partner_id,
  name = excluded.name,
  slug = excluded.slug,
  public_slug = excluded.public_slug,
  vertical = excluded.vertical,
  status = excluded.status,
  timezone = excluded.timezone,
  contact_email = excluded.contact_email,
  phone = excluded.phone,
  city = excluded.city,
  region = excluded.region;

insert into public.services (
  id,
  business_id,
  name,
  description,
  duration_minutes,
  price_cents,
  currency,
  sort_order
) values
  (
    '33333333-3333-4333-8333-333333333331',
    '22222222-2222-4222-8222-222222222221',
    'Signature Facial',
    'Personalized facial treatment for glow and hydration.',
    60,
    9500,
    'USD',
    10
  ),
  (
    '33333333-3333-4333-8333-333333333332',
    '22222222-2222-4222-8222-222222222221',
    'Laser Consultation',
    'Intro consultation for laser hair removal clients.',
    30,
    0,
    'USD',
    20
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    '22222222-2222-4222-8222-222222222222',
    'New Patient Exam',
    'Exam, X-rays and treatment planning.',
    75,
    18500,
    'USD',
    10
  ),
  (
    '33333333-3333-4333-8333-333333333334',
    '22222222-2222-4222-8222-222222222222',
    'Whitening Consultation',
    'Cosmetic whitening consultation.',
    30,
    5000,
    'USD',
    20
  ),
  (
    '33333333-3333-4333-8333-333333333335',
    '22222222-2222-4222-8222-222222222223',
    'Deep Clean Estimate',
    'Walkthrough and quote for deep cleaning.',
    45,
    0,
    'USD',
    10
  ),
  (
    '33333333-3333-4333-8333-333333333336',
    '22222222-2222-4222-8222-222222222223',
    'Recurring Home Cleaning',
    'Standard recurring cleaning appointment.',
    120,
    16000,
    'USD',
    20
  )
on conflict (id) do update set
  business_id = excluded.business_id,
  name = excluded.name,
  description = excluded.description,
  duration_minutes = excluded.duration_minutes,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  sort_order = excluded.sort_order;

insert into public.customers (
  id,
  business_id,
  full_name,
  email,
  phone,
  notes,
  source
) values
  (
    '44444444-4444-4444-8444-444444444441',
    '22222222-2222-4222-8222-222222222221',
    'Mia Carter',
    'mia.carter@example.com',
    '+1 555 1101',
    'Interested in monthly facials.',
    'booking_page'
  ),
  (
    '44444444-4444-4444-8444-444444444442',
    '22222222-2222-4222-8222-222222222222',
    'Noah Patel',
    'noah.patel@example.com',
    '+1 555 1102',
    'Asked about whitening before a wedding.',
    'website'
  ),
  (
    '44444444-4444-4444-8444-444444444443',
    '22222222-2222-4222-8222-222222222223',
    'Olivia Grant',
    'olivia.grant@example.com',
    '+1 555 1103',
    'Needs recurring cleaning for a two-bedroom condo.',
    'booking_page'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    '22222222-2222-4222-8222-222222222221',
    'Ava Morgan',
    'ava.morgan@example.com',
    '+1 555 1104',
    'Returning client. Prefers afternoon appointments.',
    'manual'
  )
on conflict (id) do update set
  business_id = excluded.business_id,
  full_name = excluded.full_name,
  email = excluded.email,
  phone = excluded.phone,
  notes = excluded.notes,
  source = excluded.source;

insert into public.leads (
  id,
  business_id,
  customer_id,
  service_id,
  source,
  status,
  priority,
  message
) values
  (
    '55555555-5555-4555-8555-555555555551',
    '22222222-2222-4222-8222-222222222221',
    '44444444-4444-4444-8444-444444444441',
    '33333333-3333-4333-8333-333333333331',
    'booking_page',
    'new',
    'normal',
    'Can I book a facial this Friday afternoon?'
  ),
  (
    '55555555-5555-4555-8555-555555555552',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444442',
    '33333333-3333-4333-8333-333333333334',
    'website',
    'contacted',
    'high',
    'Looking for whitening options before July.'
  ),
  (
    '55555555-5555-4555-8555-555555555553',
    '22222222-2222-4222-8222-222222222223',
    '44444444-4444-4444-8444-444444444443',
    '33333333-3333-4333-8333-333333333335',
    'booking_page',
    'qualified',
    'normal',
    'Please send a quote for recurring cleaning.'
  ),
  (
    '55555555-5555-4555-8555-555555555554',
    '22222222-2222-4222-8222-222222222221',
    '44444444-4444-4444-8444-444444444444',
    '33333333-3333-4333-8333-333333333332',
    'manual',
    'booked',
    'low',
    'Booked from phone call.'
  )
on conflict (id) do update set
  business_id = excluded.business_id,
  customer_id = excluded.customer_id,
  service_id = excluded.service_id,
  source = excluded.source,
  status = excluded.status,
  priority = excluded.priority,
  message = excluded.message;

insert into public.appointments (
  id,
  business_id,
  customer_id,
  service_id,
  lead_id,
  starts_at,
  ends_at,
  status,
  notes
) values
  (
    '66666666-6666-4666-8666-666666666661',
    '22222222-2222-4222-8222-222222222221',
    '44444444-4444-4444-8444-444444444444',
    '33333333-3333-4333-8333-333333333332',
    '55555555-5555-4555-8555-555555555554',
    now() + interval '1 day',
    now() + interval '1 day 30 minutes',
    'confirmed',
    'Demo consultation appointment.'
  ),
  (
    '66666666-6666-4666-8666-666666666662',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444442',
    '33333333-3333-4333-8333-333333333334',
    '55555555-5555-4555-8555-555555555552',
    now() + interval '2 days',
    now() + interval '2 days 30 minutes',
    'scheduled',
    'Whitening consultation follow-up.'
  ),
  (
    '66666666-6666-4666-8666-666666666663',
    '22222222-2222-4222-8222-222222222223',
    '44444444-4444-4444-8444-444444444443',
    '33333333-3333-4333-8333-333333333335',
    '55555555-5555-4555-8555-555555555553',
    now() + interval '3 days',
    now() + interval '3 days 45 minutes',
    'scheduled',
    'Estimate for recurring cleaning.'
  )
on conflict (id) do update set
  business_id = excluded.business_id,
  customer_id = excluded.customer_id,
  service_id = excluded.service_id,
  lead_id = excluded.lead_id,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  status = excluded.status,
  notes = excluded.notes;

insert into public.automation_templates (
  id,
  partner_id,
  business_id,
  scope,
  type,
  channel,
  name,
  subject,
  body,
  delay_minutes,
  is_active
) values
  (
    '77777777-7777-4777-8777-777777777771',
    '11111111-1111-4111-8111-111111111111',
    null,
    'partner',
    'lead_follow_up',
    'email',
    'New lead follow-up',
    'Thanks for reaching out',
    'Hi {{customer_name}}, thanks for contacting {{business_name}}. We will help you find the right appointment time.',
    5,
    true
  ),
  (
    '77777777-7777-4777-8777-777777777772',
    '11111111-1111-4111-8111-111111111111',
    null,
    'partner',
    'appointment_reminder',
    'sms',
    'Appointment reminder',
    null,
    'Reminder: your appointment with {{business_name}} is tomorrow at {{appointment_time}}.',
    1440,
    true
  ),
  (
    '77777777-7777-4777-8777-777777777773',
    '11111111-1111-4111-8111-111111111111',
    null,
    'partner',
    'review_request',
    'email',
    'Review request',
    'How was your visit?',
    'Hi {{customer_name}}, thanks for choosing {{business_name}}. Would you leave us a quick review?',
    120,
    true
  )
on conflict (id) do update set
  partner_id = excluded.partner_id,
  business_id = excluded.business_id,
  scope = excluded.scope,
  type = excluded.type,
  channel = excluded.channel,
  name = excluded.name,
  subject = excluded.subject,
  body = excluded.body,
  delay_minutes = excluded.delay_minutes,
  is_active = excluded.is_active;

insert into public.messages (
  id,
  business_id,
  customer_id,
  lead_id,
  appointment_id,
  automation_template_id,
  direction,
  channel,
  status,
  subject,
  body,
  sent_at
) values
  (
    '88888888-8888-4888-8888-888888888881',
    '22222222-2222-4222-8222-222222222221',
    '44444444-4444-4444-8444-444444444441',
    '55555555-5555-4555-8555-555555555551',
    null,
    '77777777-7777-4777-8777-777777777771',
    'outbound',
    'email',
    'sent',
    'Thanks for reaching out',
    'Hi Mia, thanks for contacting Glow Studio. We can help you book a facial this week.',
    now() - interval '2 hours'
  ),
  (
    '88888888-8888-4888-8888-888888888882',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444442',
    '55555555-5555-4555-8555-555555555552',
    '66666666-6666-4666-8666-666666666662',
    '77777777-7777-4777-8777-777777777772',
    'outbound',
    'sms',
    'queued',
    null,
    'Reminder: your Bright Dental Clinic appointment is coming up.',
    null
  )
on conflict (id) do update set
  business_id = excluded.business_id,
  customer_id = excluded.customer_id,
  lead_id = excluded.lead_id,
  appointment_id = excluded.appointment_id,
  automation_template_id = excluded.automation_template_id,
  direction = excluded.direction,
  channel = excluded.channel,
  status = excluded.status,
  subject = excluded.subject,
  body = excluded.body,
  sent_at = excluded.sent_at;

insert into public.reviews (
  id,
  business_id,
  customer_id,
  appointment_id,
  message_id,
  status,
  rating,
  review_url,
  requested_at,
  responded_at
) values
  (
    '99999999-9999-4999-8999-999999999991',
    '22222222-2222-4222-8222-222222222221',
    '44444444-4444-4444-8444-444444444444',
    '66666666-6666-4666-8666-666666666661',
    null,
    'submitted',
    5,
    'https://reviews.example/glow-studio/ava-morgan',
    now() - interval '3 days',
    now() - interval '2 days'
  ),
  (
    '99999999-9999-4999-8999-999999999992',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444442',
    '66666666-6666-4666-8666-666666666662',
    null,
    'requested',
    null,
    null,
    now(),
    null
  )
on conflict (id) do update set
  business_id = excluded.business_id,
  customer_id = excluded.customer_id,
  appointment_id = excluded.appointment_id,
  message_id = excluded.message_id,
  status = excluded.status,
  rating = excluded.rating,
  review_url = excluded.review_url,
  requested_at = excluded.requested_at,
  responded_at = excluded.responded_at;

insert into public.events (
  id,
  partner_id,
  business_id,
  customer_id,
  event_type,
  entity_table,
  entity_id,
  properties
) values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222221',
    '44444444-4444-4444-8444-444444444441',
    'lead.created',
    'leads',
    '55555555-5555-4555-8555-555555555551',
    '{"source":"booking_page","vertical":"beauty_wellness"}'::jsonb
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444442',
    'appointment.scheduled',
    'appointments',
    '66666666-6666-4666-8666-666666666662',
    '{"source":"pipeline","vertical":"dental_esthetic"}'::jsonb
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222223',
    '44444444-4444-4444-8444-444444444443',
    'lead.qualified',
    'leads',
    '55555555-5555-4555-8555-555555555553',
    '{"source":"booking_page","vertical":"cleaning_field_service"}'::jsonb
  )
on conflict (id) do update set
  partner_id = excluded.partner_id,
  business_id = excluded.business_id,
  customer_id = excluded.customer_id,
  event_type = excluded.event_type,
  entity_table = excluded.entity_table,
  entity_id = excluded.entity_id,
  properties = excluded.properties;
