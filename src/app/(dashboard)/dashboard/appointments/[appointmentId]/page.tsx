import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Clock3,
  FileText,
  Mail,
  Phone,
  Sparkles,
  UserRound,
} from "lucide-react";

import { ContextualMessageCard } from "@/components/automations/contextual-message-card";
import { AppointmentStatusButton } from "@/components/appointments/appointment-status-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildContextualAutomationMessages,
  type AutomationTemplateForRender,
} from "@/lib/automations/contextual";
import type { AutomationTemplateType } from "@/lib/automations/templates";
import {
  appointmentStatusBadgeClassNames,
  appointmentStatusLabels,
  appointmentStatuses,
  formatAppointmentDate,
  formatAppointmentRange,
  formatAppointmentTime,
  formatCreatedAt,
  isAppointmentStatus,
  relationValue,
  type AppointmentStatus,
} from "@/lib/appointments/format";
import { getCurrentUserBusiness } from "@/lib/business/current";
import { isLeadStatus, leadStatusLabels } from "@/lib/leads/format";
import { formatDuration, formatPrice } from "@/lib/services/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AppointmentDetailsPageProps = {
  params: Promise<{ appointmentId: string }>;
};

type JsonObject = Record<string, unknown>;

type AppointmentDetailsRow = {
  id: string;
  lead_id: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer: {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    notes: string | null;
  } | null;
  service: {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    price_cents: number;
    currency: string;
  } | null;
  lead: {
    id: string;
    status: string;
    source: string;
    message: string | null;
  } | null;
};

type EventRow = {
  id: string;
  event_type: string;
  entity_table: string | null;
  entity_id: string | null;
  properties: JsonObject;
  created_at: string;
  actor:
    | {
        full_name: string | null;
        email: string | null;
      }
    | null;
};

const eventTypeLabels: Record<string, string> = {
  appointment_created: "Създаден час",
  appointment_scheduled: "Планиран час",
  appointment_confirmed: "Потвърден час",
  appointment_completed: "Завършен час",
  appointment_cancelled: "Отказан час",
  appointment_no_show: "Неявяване",
  "appointment.scheduled": "Създаден час",
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function statusFromString(value: string): AppointmentStatus {
  return isAppointmentStatus(value) ? value : "scheduled";
}

function propString(properties: JsonObject, key: string) {
  const value = properties[key];

  return typeof value === "string" ? value : null;
}

function eventDescription(event: EventRow) {
  const fromStatus = propString(event.properties, "from_status");
  const toStatus = propString(event.properties, "to_status");

  if (fromStatus && toStatus) {
    const fromLabel = isAppointmentStatus(fromStatus)
      ? appointmentStatusLabels[fromStatus]
      : fromStatus;
    const toLabel = isAppointmentStatus(toStatus)
      ? appointmentStatusLabels[toStatus]
      : toStatus;

    return `${fromLabel} → ${toLabel}`;
  }

  const duration = event.properties.duration_minutes;

  if (typeof duration === "number") {
    return `Продължителност: ${duration} мин.`;
  }

  return "Системно събитие към този час.";
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <Badge
      variant="outline"
      className={appointmentStatusBadgeClassNames[status] ?? "border-[#d8d0c2]"}
    >
      {appointmentStatusLabels[status]}
    </Badge>
  );
}

function AppointmentDetailsError({ message }: { message: string }) {
  return (
    <Card className="border-[#efb3a5] bg-[#fff7f4]">
      <CardHeader>
        <CardTitle>Не успяхме да заредим часа</CardTitle>
        <CardDescription className="text-[#8f3a25]">{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function AppointmentDetailsPage({
  params,
}: AppointmentDetailsPageProps) {
  const { appointmentId } = await params;

  if (!isUuid(appointmentId)) {
    notFound();
  }

  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect(`/login?next=/dashboard/appointments/${appointmentId}`);
    }

    if (current.reason === "missing_business") {
      redirect("/onboarding");
    }

    return <AppointmentDetailsError message={current.message} />;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, lead_id, starts_at, ends_at, status, notes, created_at, updated_at, customer:customers(id, full_name, phone, email, notes), service:services(id, name, description, duration_minutes, price_cents, currency), lead:leads(id, status, source, message)",
    )
    .eq("id", appointmentId)
    .eq("business_id", current.business.id)
    .maybeSingle<
      Omit<AppointmentDetailsRow, "customer" | "service" | "lead"> & {
        customer?:
          | AppointmentDetailsRow["customer"]
          | AppointmentDetailsRow["customer"][];
        service?:
          | AppointmentDetailsRow["service"]
          | AppointmentDetailsRow["service"][];
        lead?: AppointmentDetailsRow["lead"] | AppointmentDetailsRow["lead"][];
      }
    >();

  if (error) {
    return <AppointmentDetailsError message={error.message} />;
  }

  if (!data) {
    notFound();
  }

  const appointment: AppointmentDetailsRow = {
    ...data,
    status: statusFromString(data.status),
    customer: relationValue(data.customer),
    service: relationValue(data.service),
    lead: relationValue(data.lead),
  };
  const appointmentStatus = statusFromString(appointment.status);
  const contextualTemplateTypes: AutomationTemplateType[] = [
    "appointment_confirmation",
    "appointment_reminder",
    "follow_up_after_visit",
    ...(appointmentStatus === "completed" ? (["review_request"] as const) : []),
  ];
  const [eventsResult, templatesResult] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, event_type, entity_table, entity_id, properties, created_at, actor:profiles(full_name, email)",
      )
      .eq("business_id", current.business.id)
      .eq("entity_table", "appointments")
      .eq("entity_id", appointment.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("automation_templates")
      .select("id, type, name, body, is_active")
      .eq("business_id", current.business.id)
      .eq("scope", "business")
      .in("type", contextualTemplateTypes)
      .limit(20),
  ]);

  const relatedError = eventsResult.error ?? templatesResult.error;

  if (relatedError) {
    return <AppointmentDetailsError message={relatedError.message} />;
  }

  const events = ((eventsResult.data ?? []) as Array<
    Omit<EventRow, "actor"> & {
      actor?: EventRow["actor"] | EventRow["actor"][];
    }
  >).map((event) => ({
    ...event,
    actor: relationValue(event.actor),
  }));
  const templates = (templatesResult.data ?? []) as AutomationTemplateForRender[];
  const automationMessages = buildContextualAutomationMessages(
    templates,
    contextualTemplateTypes,
    {
      customer_name: appointment.customer?.full_name,
      business_name: current.business.name,
      service_name: appointment.service?.name,
      appointment_date: formatAppointmentDate(appointment.starts_at),
      appointment_time: formatAppointmentTime(appointment.starts_at),
      google_review_url: "Добавете Google review линк",
    },
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
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
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={appointmentStatus} />
            {appointment.lead ? (
              <Badge variant="outline" className="border-[#d8d0c2] text-[#575048]">
                Lead:{" "}
                {isLeadStatus(appointment.lead.status)
                  ? leadStatusLabels[appointment.lead.status]
                  : appointment.lead.status}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-[#d8d0c2] text-[#575048]">
                Ръчно създаден
              </Badge>
            )}
          </div>
          <h1 className="break-words text-3xl font-semibold tracking-normal">
            {appointment.customer?.full_name ?? "Час без клиент"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69655e] sm:text-base">
            {formatAppointmentRange(appointment.starts_at, appointment.ends_at)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {appointment.lead_id ? (
            <Button asChild variant="outline" className="border-[#d8d0c2] bg-white">
              <Link href={`/dashboard/leads/${appointment.lead_id}`}>
                <FileText className="size-4" />
                Към заявката
              </Link>
            </Button>
          ) : null}
          <Button asChild className="bg-[#16372f] text-white hover:bg-[#214b42]">
            <Link href="/dashboard/appointments/new">
              <CalendarClock className="size-4" />
              Нов час
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <Card className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader className="border-b border-[#ece4d7]">
              <CardTitle>Клиент</CardTitle>
              <CardDescription>Контактна информация за часа.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 size-5 text-[#a84b32]" />
                <div>
                  <p className="font-medium">
                    {appointment.customer?.full_name ?? "Клиент без име"}
                  </p>
                  <p className="text-sm text-[#69655e]">
                    Часът е създаден: {formatCreatedAt(appointment.created_at)}
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#e6ded1] bg-white p-3">
                  <p className="flex items-center gap-2 text-xs uppercase text-[#8a8176]">
                    <Phone className="size-3.5" />
                    Телефон
                  </p>
                  <p className="mt-1 font-medium">
                    {appointment.customer?.phone ?? "Не е посочен"}
                  </p>
                </div>
                <div className="rounded-lg border border-[#e6ded1] bg-white p-3">
                  <p className="flex items-center gap-2 text-xs uppercase text-[#8a8176]">
                    <Mail className="size-3.5" />
                    Имейл
                  </p>
                  <p className="mt-1 break-words font-medium">
                    {appointment.customer?.email ?? "Не е посочен"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <ContextualMessageCard
            title="Съобщения за часа"
            description="Копирай confirmation, reminder, follow-up или review request според статуса."
            messages={automationMessages}
            emptyText="Няма активни шаблони за този час."
          />

          <Card className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader className="border-b border-[#ece4d7]">
              <CardTitle>Услуга</CardTitle>
              <CardDescription>Услугата, свързана с часа.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {appointment.service ? (
                <>
                  <div>
                    <p className="flex items-center gap-2 text-lg font-semibold">
                      <Sparkles className="size-5 text-[#a84b32]" />
                      {appointment.service.name}
                    </p>
                    <p className="mt-1 text-sm text-[#69655e]">
                      {formatDuration(appointment.service.duration_minutes)} ·{" "}
                      {formatPrice(
                        appointment.service.price_cents,
                        appointment.service.currency,
                      )}
                    </p>
                  </div>
                  {appointment.service.description ? (
                    <p className="text-sm leading-6 text-[#575048]">
                      {appointment.service.description}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-[#69655e]">Няма свързана услуга.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader className="border-b border-[#ece4d7]">
              <CardTitle>Детайли за часа</CardTitle>
              <CardDescription>Дата, час, статус и вътрешни бележки.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-[#e6ded1] bg-white p-3">
                  <p className="text-xs uppercase text-[#8a8176]">Дата</p>
                  <p className="mt-1 font-medium">
                    {formatAppointmentDate(appointment.starts_at)}
                  </p>
                </div>
                <div className="rounded-lg border border-[#e6ded1] bg-white p-3">
                  <p className="flex items-center gap-2 text-xs uppercase text-[#8a8176]">
                    <Clock3 className="size-3.5" />
                    Начало
                  </p>
                  <p className="mt-1 font-medium">
                    {formatAppointmentTime(appointment.starts_at)}
                  </p>
                </div>
                <div className="rounded-lg border border-[#e6ded1] bg-white p-3">
                  <p className="text-xs uppercase text-[#8a8176]">Край</p>
                  <p className="mt-1 font-medium">
                    {formatAppointmentTime(appointment.ends_at)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-[#e6ded1] bg-white p-4">
                <p className="text-sm font-medium">Бележки</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#575048]">
                  {appointment.notes || "Няма добавени бележки."}
                </p>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium">Промени статус</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {appointmentStatuses
                    .filter((status) => status !== appointmentStatus)
                    .map((status) => (
                      <AppointmentStatusButton
                        key={status}
                        appointmentId={appointment.id}
                        status={status}
                        variant={
                          status === "cancelled" || status === "no_show"
                            ? "destructive"
                            : "outline"
                        }
                      />
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader className="border-b border-[#ece4d7]">
              <CardTitle>История</CardTitle>
              <CardDescription>Събития, свързани с този час.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              {events.length > 0 ? (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg border border-[#e6ded1] bg-white p-3"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-medium">
                          {eventTypeLabels[event.event_type] ?? event.event_type}
                        </p>
                        <p className="text-xs text-[#69655e]">
                          {formatCreatedAt(event.created_at)}
                        </p>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-[#575048]">
                        {eventDescription(event)}
                      </p>
                      {event.actor?.full_name || event.actor?.email ? (
                        <p className="mt-1 text-xs text-[#8a8176]">
                          От: {event.actor.full_name ?? event.actor.email}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[#d6cbbb] bg-white px-4 py-8 text-center">
                  <p className="font-medium">Все още няма история.</p>
                  <p className="mt-2 text-sm text-[#69655e]">
                    Смени статус, за да се появи събитие тук.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
