import { redirect } from "next/navigation";

import { BrandingSettingsForm } from "@/components/settings/branding-settings-form";
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

type BrandingSettingsRow = {
  brand_name: string;
  primary_color: string;
  logo_url: string | null;
};

function BrandingSettingsError({ message }: { message: string }) {
  return (
    <Card className="border-[#efb3a5] bg-[#fff7f4]">
      <CardHeader>
        <CardTitle>Не успяхме да заредим брандинга</CardTitle>
        <CardDescription className="text-[#8f3a25]">{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function BrandingSettingsPage() {
  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect("/login?next=/dashboard/settings/branding");
    }

    if (current.reason === "missing_business") {
      redirect("/onboarding");
    }

    return <BrandingSettingsError message={current.message} />;
  }

  const supabase = await createClient();
  const { data: branding, error } = await supabase
    .from("branding_settings")
    .select("brand_name, primary_color, logo_url")
    .eq("business_id", current.business.id)
    .limit(1)
    .maybeSingle<BrandingSettingsRow>();

  if (error) {
    return <BrandingSettingsError message={error.message} />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <Badge className="mb-3 border-[#b9d8c5] bg-[#edf8f0] text-[#245d36] hover:bg-[#edf8f0]">
          {current.business.name}
        </Badge>
        <h1 className="text-3xl font-semibold tracking-normal">Брандинг</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69655e] sm:text-base">
          Промени визуалната идентичност на публичната страница за заявки.
        </p>
      </div>

      <BrandingSettingsForm
        initialValues={{
          businessName: current.business.name,
          brandName: branding?.brand_name ?? current.business.name,
          primaryColor: branding?.primary_color ?? "#16372f",
          logoUrl: branding?.logo_url ?? null,
        }}
      />
    </div>
  );
}
