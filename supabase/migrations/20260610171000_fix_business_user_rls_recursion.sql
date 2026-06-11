create or replace function app_private.business_owned_by_current_user(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.businesses
    join public.partners on partners.id = businesses.partner_id
    where businesses.id = target_business_id
      and partners.owner_profile_id = (select auth.uid())
  );
$$;

grant execute on function app_private.business_owned_by_current_user(uuid) to authenticated;

create unique index if not exists business_users_one_active_business_per_user_idx
on public.business_users(user_id)
where status = 'active';

drop policy if exists "Business users can read assigned business memberships" on public.business_users;
drop policy if exists "Users can read their own business membership" on public.business_users;

create policy "Users can read their own business membership"
on public.business_users
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can create their own business owner membership" on public.business_users;

create policy "Users can create their own business owner membership"
on public.business_users
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'owner'
  and status = 'active'
  and app_private.business_owned_by_current_user(business_id)
);
