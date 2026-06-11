import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export type BusinessVertical =
  | "beauty_wellness"
  | "dental_esthetic"
  | "cleaning_field_service"
  | "other";

export type CurrentBusiness = {
  id: string;
  partnerId: string;
  name: string;
  slug: string;
  publicSlug: string;
  vertical: BusinessVertical;
  status: string;
  timezone: string;
  contactEmail: string | null;
  phone: string | null;
  addressLine: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string;
  createdAt: string;
  updatedAt: string;
};

export type CurrentBusinessMembership = {
  id: string;
  businessId: string;
  role: "owner" | "admin" | "staff";
};

export type CurrentUserBusiness =
  | {
      ok: true;
      user: User;
      business: CurrentBusiness;
      membership: CurrentBusinessMembership;
      reason: null;
      message: null;
    }
  | {
      ok: false;
      user: User | null;
      business: null;
      membership: null;
      reason: "unauthenticated" | "missing_business" | "query_error";
      message: string;
    };

type BusinessUserRow = {
  id: string;
  business_id: string;
  role: "owner" | "admin" | "staff";
};

type BusinessRow = {
  id: string;
  partner_id: string;
  name: string;
  slug: string;
  public_slug: string;
  vertical: BusinessVertical;
  status: string;
  timezone: string;
  contact_email: string | null;
  phone: string | null;
  address_line: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string;
  created_at: string;
  updated_at: string;
};

function mapBusiness(row: BusinessRow): CurrentBusiness {
  return {
    id: row.id,
    partnerId: row.partner_id,
    name: row.name,
    slug: row.slug,
    publicSlug: row.public_slug,
    vertical: row.vertical,
    status: row.status,
    timezone: row.timezone,
    contactEmail: row.contact_email,
    phone: row.phone,
    addressLine: row.address_line,
    city: row.city,
    region: row.region,
    postalCode: row.postal_code,
    country: row.country,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCurrentUserBusiness(): Promise<CurrentUserBusiness> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      user: null,
      business: null,
      membership: null,
      reason: "unauthenticated",
      message: "Нужен е вход в акаунта.",
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("business_users")
    .select("id, business_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<BusinessUserRow>();

  if (membershipError) {
    return {
      ok: false,
      user,
      business: null,
      membership: null,
      reason: "query_error",
      message: membershipError.message,
    };
  }

  if (!membership) {
    return {
      ok: false,
      user,
      business: null,
      membership: null,
      reason: "missing_business",
      message: "Няма активен бизнес към този акаунт.",
    };
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select(
      "id, partner_id, name, slug, public_slug, vertical, status, timezone, contact_email, phone, address_line, city, region, postal_code, country, created_at, updated_at",
    )
    .eq("id", membership.business_id)
    .maybeSingle<BusinessRow>();

  if (businessError) {
    return {
      ok: false,
      user,
      business: null,
      membership: null,
      reason: "query_error",
      message: businessError.message,
    };
  }

  if (!business) {
    return {
      ok: false,
      user,
      business: null,
      membership: null,
      reason: "missing_business",
      message: "Бизнесът не беше намерен или нямаш достъп до него.",
    };
  }

  return {
    ok: true,
    user,
    business: mapBusiness(business),
    membership: {
      id: membership.id,
      businessId: membership.business_id,
      role: membership.role,
    },
    reason: null,
    message: null,
  };
}
