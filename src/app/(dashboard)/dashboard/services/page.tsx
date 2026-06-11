import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, DatabaseZap, Pencil, Plus, Sparkles } from "lucide-react";

import { ServiceDeactivateButton } from "@/components/services/service-deactivate-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUserBusiness } from "@/lib/business/current";
import { formatDuration, formatPrice } from "@/lib/services/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  currency: string;
  is_active: boolean;
  created_at: string;
};

function ServicesError({ message }: { message: string }) {
  return (
    <Card className="border-[#efb3a5] bg-[#fff7f4]">
      <CardHeader>
        <CardTitle>Не успяхме да заредим услугите</CardTitle>
        <CardDescription className="text-[#8f3a25]">{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function ServicesPage() {
  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect("/login?next=/dashboard/services");
    }

    if (current.reason === "missing_business") {
      redirect("/onboarding");
    }

    return <ServicesError message={current.message} />;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, name, description, duration_minutes, price_cents, currency, is_active, created_at",
    )
    .eq("business_id", current.business.id)
    .order("is_active", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return <ServicesError message={error.message} />;
  }

  const services = (data ?? []) as ServiceRow[];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge className="mb-3 border-[#b9d8c5] bg-[#edf8f0] text-[#245d36] hover:bg-[#edf8f0]">
            {current.business.name}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-normal">Услуги</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69655e] sm:text-base">
            Управлявай услугите, които клиентите ще виждат на booking страницата.
          </p>
        </div>
        <Button asChild className="bg-[#16372f] text-white hover:bg-[#214b42]">
          <Link href="/dashboard/services/new">
            <Plus className="size-4" />
            Добави услуга
          </Link>
        </Button>
      </div>

      {services.length === 0 ? (
        <Card className="border-dashed border-[#d6cbbb] bg-[#fbfaf6]">
          <CardContent className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
            <Sparkles className="size-10 text-[#a84b32]" />
            <h2 className="mt-4 text-xl font-semibold">
              Все още нямате добавени услуги.
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#69655e]">
              Започни с основната услуга, която клиентите най-често резервират.
            </p>
            <Button
              asChild
              className="mt-6 bg-[#16372f] text-white hover:bg-[#214b42]"
            >
              <Link href="/dashboard/services/new">
                <Plus className="size-4" />
                Добави първа услуга
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="mt-2 border-[#d8d0c2] bg-white"
            >
              <Link href="/dashboard/demo-data">
                <DatabaseZap className="size-4" />
                Добави примерни данни
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {services.map((service) => (
            <Card key={service.id} className="border-[#ded7c8] bg-[#fbfaf6]">
              <CardHeader className="border-b border-[#ece4d7]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <CardTitle className="break-words text-xl">
                      {service.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {formatDuration(service.duration_minutes)} ·{" "}
                      {formatPrice(service.price_cents, service.currency)}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      service.is_active
                        ? "border-[#b9d8c5] text-[#245d36]"
                        : "border-[#d8d0c2] text-[#69655e]"
                    }
                  >
                    {service.is_active ? "Активна" : "Неактивна"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                {service.description ? (
                  <p className="text-sm leading-6 text-[#575048]">
                    {service.description}
                  </p>
                ) : (
                  <p className="text-sm leading-6 text-[#8a8176]">
                    Няма добавено описание.
                  </p>
                )}

                <div className="grid gap-3 rounded-lg border border-[#e6ded1] bg-white p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-[#8a8176]">
                      Продължителност
                    </p>
                    <p className="mt-1 flex items-center gap-2 font-medium">
                      <Clock3 className="size-4 text-[#a84b32]" />
                      {formatDuration(service.duration_minutes)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-[#8a8176]">Цена</p>
                    <p className="mt-1 font-medium">
                      {formatPrice(service.price_cents, service.currency)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    asChild
                    variant="outline"
                    className="justify-start border-[#d8d0c2] bg-white"
                  >
                    <Link href={`/dashboard/services/${service.id}/edit`}>
                      <Pencil className="size-4" />
                      Редактирай
                    </Link>
                  </Button>
                  {service.is_active ? (
                    <ServiceDeactivateButton serviceId={service.id} />
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
