import { notFound, redirect } from "next/navigation";

import { ServiceForm } from "@/components/services/service-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUserBusiness } from "@/lib/business/current";
import { createClient } from "@/lib/supabase/server";

import { updateService } from "../../actions";

export const dynamic = "force-dynamic";

type EditServicePageProps = {
  params: Promise<{
    serviceId: string;
  }>;
};

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  currency: string;
  is_active: boolean;
};

function priceInputValue(priceCents: number) {
  const price = priceCents / 100;

  if (priceCents % 100 === 0) {
    return String(price);
  }

  return price.toFixed(2);
}

function EditServiceError({ message }: { message: string }) {
  return (
    <Card className="border-[#efb3a5] bg-[#fff7f4]">
      <CardHeader>
        <CardTitle>Не успяхме да заредим услугата</CardTitle>
        <CardDescription className="text-[#8f3a25]">{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function EditServicePage({ params }: EditServicePageProps) {
  const { serviceId } = await params;

  if (!/^[0-9a-f-]{36}$/i.test(serviceId)) {
    notFound();
  }

  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect(`/login?next=/dashboard/services/${serviceId}/edit`);
    }

    redirect("/onboarding");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, name, description, duration_minutes, price_cents, currency, is_active",
    )
    .eq("id", serviceId)
    .eq("business_id", current.business.id)
    .maybeSingle<ServiceRow>();

  if (error) {
    return <EditServiceError message={error.message} />;
  }

  if (!data) {
    notFound();
  }

  const service = data;
  const action = updateService.bind(null, service.id);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <Badge className="mb-3 border-[#b9d8c5] bg-[#edf8f0] text-[#245d36] hover:bg-[#edf8f0]">
          {current.business.name}
        </Badge>
        <h1 className="break-words text-3xl font-semibold tracking-normal">
          Редакция на услуга
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#69655e]">
          Обнови цената, продължителността или видимостта на услугата.
        </p>
      </div>

      <ServiceForm
        title={service.name}
        description="Промените се записват само за текущия бизнес."
        submitLabel="Запази промените"
        pendingLabel="Запазване..."
        action={action}
        initialValues={{
          name: service.name,
          description: service.description ?? "",
          durationMinutes: service.duration_minutes,
          price: priceInputValue(service.price_cents),
          currency: service.currency,
          isActive: service.is_active,
        }}
      />
    </div>
  );
}
