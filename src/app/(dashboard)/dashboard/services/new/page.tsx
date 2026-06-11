import { redirect } from "next/navigation";

import { ServiceForm } from "@/components/services/service-form";
import { Badge } from "@/components/ui/badge";
import { getCurrentUserBusiness } from "@/lib/business/current";

import { createService } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewServicePage() {
  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect("/login?next=/dashboard/services/new");
    }

    redirect("/onboarding");
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <Badge className="mb-3 border-[#b9d8c5] bg-[#edf8f0] text-[#245d36] hover:bg-[#edf8f0]">
          {current.business.name}
        </Badge>
        <h1 className="text-3xl font-semibold tracking-normal">
          Нова услуга
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#69655e]">
          Добави услуга с ясна продължителност и цена за бъдещата booking страница.
        </p>
      </div>

      <ServiceForm
        title="Детайли за услугата"
        description="Тези данни ще се използват при резервация и в CRM запитванията."
        submitLabel="Добави услуга"
        pendingLabel="Добавяне..."
        action={createService}
      />
    </div>
  );
}
