import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Clock3,
  Mail,
  MessageSquareText,
  Phone,
  Sparkles,
  UserRound,
} from "lucide-react";

import { ContextualMessageCard } from "@/components/automations/contextual-message-card";
import { CreateAppointmentForm } from "@/components/leads/create-appointment-form";
import { LeadStatusButton } from "@/components/leads/lead-status-button";
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
import { buildContextualAutomationMessages } from "@/lib/automations/contextual";
import {
  formatCreatedAt,
  formatLeadDateTime,
  formatSource,
  isLeadStatus,
  leadStatusBadgeClassNames,
  leadStatusLabels,
  leadStatuses,
  relationValue,
  type LeadStatus,
} from "@/lib/leads/format";
import { formatDuration, formatPrice } from "@/lib/services/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LeadDetailsPageProps = {
  params: Promise<{ leadId: string }>;
};

type JsonObject = Record<string, unknown>;

type LeadDetailsRow = {
  id: string;
  customer_id: string | null;
  service_id: string | null;
  status: string;
  source: string;
  priority: string;
  preferred_date: string | null;
  preferred_time: string | null;
  message: string | null;
  created_at: string;
  updated_at: string;
  customer:
    | {
        id: string;
        full_name: string;
        email: string | null;
        phone: string | null;
        notes: string | null;
      }
    | null;
  service:
    | {
        id: string;
        name: string;
        description: string | null;
        duration_minutes: number;
        price_cents: number;
        currency: string;
      }
    | null;
};

type AppointmentRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  created_at: string;
};

type AutomationTemplateRow = {
  id: string;
  type: string;
  name: string;
  body: string;
  is_active: boolean;
};

type EventRow = {
  id: string;
  customer_id: string | null;
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
  lead_created: "Създадено запитване",
  "lead.created": "Създадено запитване",
  lead_status_changed: "Променен статус",
  appointment_created: "Създаден час",
  "appointment.scheduled": "Създаден час",
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function statusFromString(value: string): LeadStatus {
  return isLeadStatus(value) ? value : "new";
}

function propString(properties: JsonObject, key: string) {
  const value = properties[key];

  return typeof value === "string" ? value : null;
}

function appointmentRange(appointment: AppointmentRow) {
  const startsAt = new Date(appointment.starts_at);
  const endsAt = new Date(appointment.ends_at);
  const date = new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(startsAt);
  const startTime = new Intl.DateTimeFormat("bg-BG", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(startsAt);
  const endTime = new Intl.DateTimeFormat("bg-BG", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(endsAt);

  return `${date} · ${startTime} - ${endTime}`;
}

function eventDescription(event: EventRow) {
  if (event.event_type === "lead_status_changed") {
    const fromStatus = propString(event.properties, "from_status");
    const toStatus = propString(event.properties, "to_status");

    if (fromStatus && toStatus && isLeadStatus(toStatus)) {
      const fromLabel = isLeadStatus(fromStatus)
        ? leadStatusLabels[fromStatus]
        : fromStatus;

      return `${fromLabel} → ${leadStatusLabels[toStatus]}`;
    }
  }

  if (event.event_type === "lead_created" || event.event_type === "lead.created") {
    return `Източник: ${formatSource(propString(event.properties, "source") ?? "booking_page")}`;
  }

  if (
    event.event_type === "appointment_created" ||
    event.event_type === "appointment.scheduled"
  ) {
    const duration = propString(event.properties, "duration_minutes");

    return duration ? `Продължителност: ${duration} мин.` : "Запитването е конвертирано в час.";
  }

  return "Системно събитие към това запитване.";
}

function LeadDetailsError({ message }: { message: string }) {
  return (
    <Card className="border-[#efb3a5] bg-[#fff7f4]">
      <CardHeader>
        <CardTitle>Не успяхме да заредим запитването</CardTitle>
        <CardDescription className="text-[#8f3a25]">{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge
      variant="outline"
      className={leadStatusBadgeClassNames[status] ?? "border-[#d8d0c2]"}
    >
      {leadStatusLabels[status]}
    </Badge>
  );
}

export default async function LeadDetailsPage({ params }: LeadDetailsPageProps) {
  const { leadId } = await params;

  if (!isUuid(leadId)) {
    notFound();
  }

  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect(`/login?next=/dashboard/leads/${leadId}`);
    }

    if (current.reason === "missing_business") {
      redirect("/onboarding");
    }

    return <LeadDetailsError message={current.message} />;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, customer_id, service_id, status, source, priority, preferred_date, preferred_time, message, created_at, updated_at, customer:customers(id, full_name, email, phone, notes), service:services(id, name, description, duration_minutes, price_cents, currency)",
    )
    .eq("id", leadId)
    .eq("business_id", current.business.id)
    .maybeSingle<
      Omit<LeadDetailsRow, "customer" | "service"> & {
        customer?: LeadDetailsRow["customer"] | LeadDetailsRow["customer"][];
        service?: LeadDetailsRow["service"] | LeadDetailsRow["service"][];
      }
    >();

  if (error) {
    return <LeadDetailsError message={error.message} />;
  }

  if (!data) {
    notFound();
  }

  const lead: LeadDetailsRow = {
    ...data,
    status: statusFromString(data.status),
    customer: relationValue(data.customer),
    service: relationValue(data.service),
  };
  const leadStatus = statusFromString(lead.status);

  const [appointmentsResult, eventsResult, templatesResult] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, starts_at, ends_at, status, notes, created_at")
      .eq("business_id", current.business.id)
      .eq("lead_id", lead.id)
      .order("starts_at", { ascending: false }),
    lead.customer_id
      ? supabase
          .from("events")
          .select(
            "id, customer_id, event_type, entity_table, entity_id, properties, created_at, actor:profiles(full_name, email)",
          )
          .eq("business_id", current.business.id)
          .or(`entity_id.eq.${lead.id},customer_id.eq.${lead.customer_id}`)
          .order("created_at", { ascending: false })
          .limit(30)
      : supabase
          .from("events")
          .select(
            "id, customer_id, event_type, entity_table, entity_id, properties, created_at, actor:profiles(full_name, email)",
          )
          .eq("business_id", current.business.id)
          .eq("entity_id", lead.id)
          .order("created_at", { ascending: false })
          .limit(30),
    supabase
      .from("automation_templates")
      .select("id, type, name, body, is_active")
      .eq("business_id", current.business.id)
      .eq("scope", "business")
      .eq("type", "new_lead_confirmation")
      .limit(5),
  ]);

  const relatedError =
    appointmentsResult.error ?? eventsResult.error ?? templatesResult.error;

  if (relatedError) {
    return <LeadDetailsError message={relatedError.message} />;
  }

  const appointments = (appointmentsResult.data ?? []) as AppointmentRow[];
  const templates = (templatesResult.data ?? []) as AutomationTemplateRow[];
  const rawEvents = ((eventsResult.data ?? []) as Array<
    Omit<EventRow, "actor"> & {
      actor?: EventRow["actor"] | EventRow["actor"][];
    }
  >).map((event) => ({
    ...event,
    actor: relationValue(event.actor),
  }));
  const events = rawEvents.filter((event) => {
    const eventLeadId = propString(event.properties, "lead_id");

    return (
      (event.entity_table === "leads" && event.entity_id === lead.id) ||
      eventLeadId === lead.id
    );
  });
  const appointmentDisabledReason = !lead.customer
    ? "Не може да се създаде час без свързан клиент."
    : appointments.length > 0
      ? "Това запитване вече има създаден час."
      : undefined;
  const automationMessages = buildContextualAutomationMessages(
    templates,
    ["new_lead_confirmation"],
    {
      customer_name: lead.customer?.full_name,
      business_name: current.business.name,
      service_name: lead.service?.name,
      appointment_date: lead.preferred_date
        ? formatLeadDateTime(lead.preferred_date, null)
        : null,
      appointment_time: lead.preferred_time,
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
            <Link href="/dashboard/leads">
              <ArrowLeft className="size-4" />
              Обратно към запитванията
            </Link>
          </Button>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={leadStatus} />
            <Badge variant="outline" className="border-[#d8d0c2] text-[#575048]">
              {formatSource(lead.source)}
            </Badge>
          </div>
          <h1 className="break-words text-3xl font-semibold tracking-normal">
            {lead.customer?.full_name ?? "Запитване без име"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69655e] sm:text-base">
            Детайли, история и конвертиране към час за това запитване.
          </p>
        </div>
        <Button asChild className="bg-[#16372f] text-white hover:bg-[#214b42]">
          <Link href="#appointment">
            <CalendarClock className="size-4" />
            Създай час
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <Card className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader className="border-b border-[#ece4d7]">
              <CardTitle>Клиент</CardTitle>
              <CardDescription>Контактна информация от заявката.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 size-5 text-[#a84b32]" />
                <div>
                  <p className="font-medium">
                    {lead.customer?.full_name ?? "Клиент без име"}
                  </p>
                  <p className="text-sm text-[#69655e]">
                    Създадено: {formatCreatedAt(lead.created_at)}
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
                    {lead.customer?.phone ?? "Не е посочен"}
                  </p>
                </div>
                <div className="rounded-lg border border-[#e6ded1] bg-white p-3">
                  <p className="flex items-center gap-2 text-xs uppercase text-[#8a8176]">
                    <Mail className="size-3.5" />
                    Имейл
                  </p>
                  <p className="mt-1 break-words font-medium">
                    {lead.customer?.email ?? "Не е посочен"}
                  </p>
                </div>
              </div>
              {lead.customer?.notes ? (
                <div className="rounded-lg border border-[#e6ded1] bg-white p-3 text-sm leading-6 text-[#575048]">
                  {lead.customer.notes}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader className="border-b border-[#ece4d7]">
              <CardTitle>Услуга</CardTitle>
              <CardDescription>Избраната услуга от публичната форма.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {lead.service ? (
                <>
                  <div>
                    <p className="flex items-center gap-2 text-lg font-semibold">
                      <Sparkles className="size-5 text-[#a84b32]" />
                      {lead.service.name}
                    </p>
                    <p className="mt-1 text-sm text-[#69655e]">
                      {formatDuration(lead.service.duration_minutes)} ·{" "}
                      {formatPrice(lead.service.price_cents, lead.service.currency)}
                    </p>
                  </div>
                  {lead.service.description ? (
                    <p className="text-sm leading-6 text-[#575048]">
                      {lead.service.description}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-[#69655e]">Няма свързана услуга.</p>
              )}
            </CardContent>
          </Card>

          <ContextualMessageCard
            title="Съобщение към клиента"
            description="Потвърждение за нова заявка, готово за ръчно копиране."
            messages={automationMessages}
            emptyText="Няма активен шаблон за потвърждение на нова заявка."
          />
        </div>

        <div className="space-y-4">
          <Card className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader className="border-b border-[#ece4d7]">
              <CardTitle>Заявка</CardTitle>
              <CardDescription>Предпочитано време, статус и съобщение.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#e6ded1] bg-white p-3">
                  <p className="flex items-center gap-2 text-xs uppercase text-[#8a8176]">
                    <Clock3 className="size-3.5" />
                    Предпочитан час
                  </p>
                  <p className="mt-1 font-medium">
                    {formatLeadDateTime(lead.preferred_date, lead.preferred_time)}
                  </p>
                </div>
                <div className="rounded-lg border border-[#e6ded1] bg-white p-3">
                  <p className="text-xs uppercase text-[#8a8176]">Текущ статус</p>
                  <div className="mt-2">
                    <StatusBadge status={leadStatus} />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#e6ded1] bg-white p-4">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquareText className="size-4 text-[#a84b32]" />
                  Съобщение
                </p>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#575048]">
                  {lead.message || "Няма допълнително съобщение."}
                </p>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium">Промени статус</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {leadStatuses
                    .filter((status) => status !== leadStatus)
                    .map((status) => (
                      <LeadStatusButton
                        key={status}
                        leadId={lead.id}
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
              <CardTitle>Timeline</CardTitle>
              <CardDescription>Събития към това запитване.</CardDescription>
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
                  <p className="font-medium">Все още няма timeline събития.</p>
                  <p className="mt-2 text-sm text-[#69655e]">
                    Смени статус или създай час, за да се появи история тук.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {appointments.length > 0 ? (
        <Card className="border-[#ded7c8] bg-[#fbfaf6]">
          <CardHeader className="border-b border-[#ece4d7]">
            <CardTitle>Създаден час</CardTitle>
            <CardDescription>Час, свързан с това запитване.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pt-5 md:grid-cols-2">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-lg border border-[#e6ded1] bg-white p-4"
              >
                <p className="font-medium">{appointmentRange(appointment)}</p>
                <p className="mt-1 text-sm text-[#69655e]">
                  Статус: {appointment.status}
                </p>
                {appointment.notes ? (
                  <p className="mt-3 text-sm leading-6 text-[#575048]">
                    {appointment.notes}
                  </p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div id="appointment">
        <CreateAppointmentForm
          leadId={lead.id}
          defaultDate={lead.preferred_date}
          defaultTime={lead.preferred_time}
          defaultDurationMinutes={lead.service?.duration_minutes ?? 60}
          disabledReason={appointmentDisabledReason}
        />
      </div>
    </div>
  );
}
