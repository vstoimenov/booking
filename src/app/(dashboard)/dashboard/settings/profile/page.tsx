import { redirect } from "next/navigation";

import { BusinessProfileForm } from "@/components/settings/business-profile-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUserBusiness } from "@/lib/business/current";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BrandingProfileRow = {
  website_url: string | null;
  booking_page_title: string | null;
};

function ProfileSettingsError({ message }: { message: string }) {
  return (
    <Card className="border-[#efb3a5] bg-[#fff7f4]">
      <CardHeader>
        <CardTitle>Не успяхме да заредим профила</CardTitle>
        <CardDescription className="text-[#8f3a25]">{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function BusinessProfileSettingsPage() {
  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect("/login?next=/dashboard/settings/profile");
    }

    if (current.reason === "missing_business") {
      redirect("/onboarding");
    }

    return <ProfileSettingsError message={current.message} />;
  }

  const supabase = await createClient();
  const { data: branding, error } = await supabase
    .from("branding_settings")
    .select("website_url, booking_page_title")
    .eq("business_id", current.business.id)
    .limit(1)
    .maybeSingle<BrandingProfileRow>();

  if (error) {
    return <ProfileSettingsError message={error.message} />;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <Badge className="mb-3 border-[#b9d8c5] bg-[#edf8f0] text-[#245d36] hover:bg-[#edf8f0]">
          {current.business.name}
        </Badge>
        <h1 className="text-3xl font-semibold tracking-normal">
          Бизнес профил
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69655e] sm:text-base">
          Настрой информацията, която клиентите виждат преди да изпратят
          заявка.
        </p>
      </div>

      <BusinessProfileForm
        initialValues={{
          name: current.business.name,
          slug: current.business.publicSlug,
          vertical: current.business.vertical,
          description: branding?.booking_page_title ?? "",
          phone: current.business.phone ?? "",
          email: current.business.contactEmail ?? "",
          website: branding?.website_url ?? "",
          address: current.business.addressLine ?? "",
          city: current.business.city ?? "",
          isActive: current.business.status === "active",
        }}
      />
    </div>
  );
}
