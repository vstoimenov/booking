import { createClient } from "@/lib/supabase/server";

export async function getActivePartnerMembership(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("partner_users")
    .select("id, partner_id, role")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getActiveBusinessMembership(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("business_users")
    .select("id, business_id, role")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getActiveWorkspaceMembership(userId: string) {
  const [partnerMembership, businessMembership] = await Promise.all([
    getActivePartnerMembership(userId),
    getActiveBusinessMembership(userId),
  ]);

  return {
    partnerMembership,
    businessMembership,
  };
}
