create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop policy if exists "Users can read partner logos" on storage.objects;

revoke all on function public.create_partner_onboarding(text, text, text, text, text) from public;
revoke all on function public.create_partner_onboarding(text, text, text, text, text) from anon;
grant execute on function public.create_partner_onboarding(text, text, text, text, text) to authenticated;

create index if not exists leads_service_id_idx on public.leads(service_id);
create index if not exists leads_assigned_profile_id_idx on public.leads(assigned_profile_id);
create index if not exists appointments_service_id_idx on public.appointments(service_id);
create index if not exists appointments_lead_id_idx on public.appointments(lead_id);
create index if not exists appointments_assigned_profile_id_idx on public.appointments(assigned_profile_id);
create index if not exists messages_lead_id_idx on public.messages(lead_id);
create index if not exists messages_appointment_id_idx on public.messages(appointment_id);
create index if not exists messages_automation_template_id_idx on public.messages(automation_template_id);
create index if not exists messages_created_by_profile_id_idx on public.messages(created_by_profile_id);
create index if not exists reviews_appointment_id_idx on public.reviews(appointment_id);
create index if not exists reviews_message_id_idx on public.reviews(message_id);
create index if not exists events_actor_profile_id_idx on public.events(actor_profile_id);
create index if not exists events_customer_id_idx on public.events(customer_id);

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

drop policy if exists "Partner and business users can read related profiles" on public.profiles;
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
    where current_membership.user_id = (select auth.uid())
      and current_membership.status = 'active'
      and target_membership.user_id = profiles.id
      and target_membership.status = 'active'
  )
  or exists (
    select 1
    from public.business_users current_membership
    join public.business_users target_membership
      on target_membership.business_id = current_membership.business_id
    where current_membership.user_id = (select auth.uid())
      and current_membership.status = 'active'
      and target_membership.user_id = profiles.id
      and target_membership.status = 'active'
  )
);

drop policy if exists "Users can read their own partner membership" on public.partner_users;
create policy "Users can read their own partner membership"
on public.partner_users
for select
to authenticated
using (user_id = (select auth.uid()));
