create or replace function app_private.can_manage_business_membership(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app_private.is_platform_admin()
    or exists (
      select 1
      from public.businesses
      join public.partner_users
        on partner_users.partner_id = businesses.partner_id
      where businesses.id = target_business_id
        and partner_users.user_id = (select auth.uid())
        and partner_users.status = 'active'
    );
$$;

grant execute on function app_private.can_manage_business_membership(uuid) to authenticated;

drop policy if exists "Partner users can manage business memberships" on public.business_users;

create policy "Partner users can manage business memberships"
on public.business_users
for all
to authenticated
using (app_private.can_manage_business_membership(business_id))
with check (app_private.can_manage_business_membership(business_id));
