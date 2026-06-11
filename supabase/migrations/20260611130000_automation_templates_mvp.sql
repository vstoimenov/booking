update public.automation_templates
set type = 'new_lead_confirmation'
where type = 'lead_follow_up';

alter table public.automation_templates
  drop constraint if exists automation_templates_type_check;

alter table public.automation_templates
  add constraint automation_templates_type_check
  check (
    type in (
      'new_lead_confirmation',
      'appointment_confirmation',
      'appointment_reminder',
      'follow_up_after_visit',
      'review_request',
      'client_reactivation'
    )
  );

alter table public.automation_templates
  drop constraint if exists automation_templates_channel_check;

alter table public.automation_templates
  alter column channel set default 'manual';

alter table public.automation_templates
  add constraint automation_templates_channel_check
  check (channel in ('manual', 'email', 'sms', 'viber', 'whatsapp'));

create index if not exists automation_templates_business_type_idx
  on public.automation_templates(business_id, type)
  where business_id is not null;

create index if not exists automation_templates_business_active_idx
  on public.automation_templates(business_id, is_active)
  where business_id is not null;
