import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ClipboardList } from "lucide-react";

import { ManualAppointmentForm } from "@/components/appointments/manual-appointment-form";
import type {
  ManualAppointmentCustomerOption,
  ManualAppointmentOverlapOption,
  ManualAppointmentServiceOption,
} from "@/components/appointments/manual-appointment-form";
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
import { isUuid } from "@/lib/customers/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type NewAppointmentPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type CustomerRow = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
};

type ServiceRow = {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  currency: string;
};

type OverlapAppointmentRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  customer:
    | {
        full_name: string;
      }
    | null;
  service:
    | {
        name: string;
      }
    | null;
};

function relationValue<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function NewAppointmentError({ message }: { message: string }) {
  return (
    <Card className="border-[#efb3a5] bg-[#fff7f4]">
      <CardHeader>
        <CardTitle>Не успяхме да заредим формата</CardTitle>
        <CardDescription className="text-[#8f3a25]">{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewAppointmentPage({
  searchParams,
}: NewAppointmentPageProps) {
  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect("/login?next=/dashboard/appointments/new");
    }

    if (current.reason === "missing_business") {
      redirect("/onboarding");
    }

    return <NewAppointmentError message={current.message} />;
  }

  const supabase = await createClient();
  const params = await searchParams;
  const customerParam = (firstParam(params.customerId) ?? "").trim();
  const requestedCustomerId = isUuid(customerParam) ? customerParam : "";
  const overlapSince = new Date();
  overlapSince.setDate(overlapSince.getDate() - 1);

  const [customersResult, servicesResult, appointmentsResult] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone, email")
      .eq("business_id", current.business.id)
      .order("updated_at", { ascending: false })
      .limit(250),
    supabase
      .from("services")
      .select("id, name, duration_minutes, price_cents, currency")
      .eq("business_id", current.business.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("appointments")
      .select(
        "id, starts_at, ends_at, customer:customers(full_name), service:services(name)",
      )
      .eq("business_id", current.business.id)
      .in("status", ["scheduled", "confirmed"])
      .gte("starts_at", overlapSince.toISOString())
      .order("starts_at", { ascending: true })
      .limit(500),
  ]);

  const dataError =
    customersResult.error ?? servicesResult.error ?? appointmentsResult.error;

  if (dataError) {
    return <NewAppointmentError message={dataError.message} />;
  }

  const customers = ((customersResult.data ?? []) as CustomerRow[]).map(
    (customer): ManualAppointmentCustomerOption => ({
      id: customer.id,
      fullName: customer.full_name,
      phone: customer.phone,
      email: customer.email,
    }),
  );
  const services = ((servicesResult.data ?? []) as ServiceRow[]).map(
    (service): ManualAppointmentServiceOption => ({
      id: service.id,
      name: service.name,
      durationMinutes: service.duration_minutes,
      priceCents: service.price_cents,
      currency: service.currency,
    }),
  );
  const appointmentsForOverlap = ((appointmentsResult.data ?? []) as Array<
    Omit<OverlapAppointmentRow, "customer" | "service"> & {
      customer?: OverlapAppointmentRow["customer"] | OverlapAppointmentRow["customer"][];
      service?: OverlapAppointmentRow["service"] | OverlapAppointmentRow["service"][];
    }
  >).map((appointment): ManualAppointmentOverlapOption => {
    const customer = relationValue(appointment.customer);
    const service = relationValue(appointment.service);

    return {
      id: appointment.id,
      startsAt: appointment.starts_at,
      endsAt: appointment.ends_at,
      customerName: customer?.full_name ?? null,
      serviceName: service?.name ?? null,
    };
  });
  const initialCustomerId = customers.some(
    (customer) => customer.id === requestedCustomerId,
  )
    ? requestedCustomerId
    : "";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Button
            asChild
            variant="ghost"
            className="mb-3 justify-start px-0 text-[#575048] hover:bg-transparent"
          >
            <Link href="/dashboard/appointments">
              <ArrowLeft className="size-4" />
              Обратно към часовете
            </Link>
          </Button>
          <Badge className="mb-3 border-[#b9d8c5] bg-[#edf8f0] text-[#245d36] hover:bg-[#edf8f0]">
            {current.business.name}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-normal">Нов час</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69655e] sm:text-base">
            Създай час ръчно за съществуващ или нов клиент.
          </p>
        </div>
      </div>

      {services.length === 0 ? (
        <Card className="border-dashed border-[#d6cbbb] bg-[#fbfaf6]">
          <CardContent className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
            <ClipboardList className="size-10 text-[#a84b32]" />
            <h2 className="mt-4 text-xl font-semibold">
              Първо добави активна услуга.
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#69655e]">
              Всеки час трябва да бъде свързан с услуга, за да има
              продължителност и контекст за клиента.
            </p>
            <Button
              asChild
              className="mt-6 bg-[#16372f] text-white hover:bg-[#214b42]"
            >
              <Link href="/dashboard/services/new">Добави услуга</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ManualAppointmentForm
          customers={customers}
          services={services}
          appointmentsForOverlap={appointmentsForOverlap}
          initialCustomerId={initialCustomerId}
        />
      )}
    </div>
  );
}
