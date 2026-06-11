import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CalendarClock,
  CalendarX2,
  CircleSlash,
  DatabaseZap,
  ListChecks,
  PieChart,
  Sparkles,
  TrendingUp,
  UserPlus,
  UsersRound,
} from "lucide-react";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  appointmentStatusLabels,
  isAppointmentStatus,
} from "@/lib/appointments/format";
import { getCurrentUserBusiness } from "@/lib/business/current";
import {
  formatSource,
  isLeadStatus,
  leadStatusBadgeClassNames,
  leadStatusLabels,
  leadStatuses,
} from "@/lib/leads/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AnalyticsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type DateRangeValue = "7d" | "30d" | "all";

type LeadAnalyticsRow = {
  id: string;
  status: string;
  source: string;
  service_id: string | null;
  created_at: string;
};

type AppointmentAnalyticsRow = {
  id: string;
  status: string;
  service_id: string | null;
  starts_at: string;
  created_at: string;
};

type ServiceAnalyticsRow = {
  id: string;
  name: string;
  is_active: boolean;
};

type EventActivityRow = {
  id: string;
  event_type: string;
  entity_table: string | null;
  entity_id: string | null;
  created_at: string;
  customer: {
    full_name: string;
  } | null;
};

type RecentLeadActivityRow = {
  id: string;
  status: string;
  source: string;
  created_at: string;
  customer: {
    full_name: string;
  } | null;
  service: {
    name: string;
  } | null;
};

type RecentAppointmentActivityRow = {
  id: string;
  status: string;
  starts_at: string;
  created_at: string;
  customer: {
    full_name: string;
  } | null;
  service: {
    name: string;
  } | null;
};

type TopServiceRow = {
  key: string;
  name: string;
  leadCount: number;
  appointmentCount: number;
  completedAppointmentCount: number;
};

const dateRangeOptions: Array<{
  value: DateRangeValue;
  label: string;
  description: string;
}> = [
  {
    value: "7d",
    label: "7 дни",
    description: "Последните 7 дни",
  },
  {
    value: "30d",
    label: "30 дни",
    description: "Последните 30 дни",
  },
  {
    value: "all",
    label: "Всичко",
    description: "Цялата история",
  },
];

const sourceOrder = [
  "instagram",
  "tiktok",
  "facebook",
  "google",
  "booking_page",
  "manual",
  "other",
];

const eventLabels: Record<string, string> = {
  business_onboarded: "Бизнесът е създаден",
  lead_created: "Ново запитване",
  "lead.created": "Ново запитване",
  appointment_created: "Създаден час",
  "appointment.scheduled": "Създаден час",
  appointment_confirmed: "Потвърден час",
  appointment_completed: "Завършен час",
  appointment_cancelled: "Отказан час",
  appointment_no_show: "Клиентът не се яви",
  customer_updated: "Обновен клиент",
  review_requested: "Поискан отзив",
  demo_data_seeded: "Добавени демо данни",
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function selectedDateRange(value: string | string[] | undefined): DateRangeValue {
  const candidate = firstParam(value);

  if (candidate === "7d" || candidate === "30d" || candidate === "all") {
    return candidate;
  }

  return "30d";
}

function rangeStartIso(range: DateRangeValue) {
  if (range === "all") {
    return null;
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (range === "7d" ? 6 : 29));

  return start.toISOString();
}

function relationValue<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function percentage(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 1000) / 10;
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("bg-BG", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatEventType(value: string) {
  return eventLabels[value] ?? value.replace(/[._]/g, " ");
}

function barWidth(count: number, maxCount: number) {
  if (count <= 0 || maxCount <= 0) {
    return "0%";
  }

  return `${Math.max((count / maxCount) * 100, 7)}%`;
}

function AnalyticsError({ message }: { message: string }) {
  return (
    <Card className="border-[#efb3a5] bg-[#fff7f4]">
      <CardHeader>
        <CardTitle>Не успяхме да заредим анализите</CardTitle>
        <CardDescription className="text-[#8f3a25]">{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function LeadStatusBadge({ status }: { status: string }) {
  const safeStatus = isLeadStatus(status) ? status : "new";

  return (
    <Badge
      variant="outline"
      className={leadStatusBadgeClassNames[safeStatus] ?? "border-[#d8d0c2]"}
    >
      {leadStatusLabels[safeStatus] ?? status}
    </Badge>
  );
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect("/login?next=/dashboard/analytics");
    }

    if (current.reason === "missing_business") {
      redirect("/onboarding");
    }

    return <AnalyticsError message={current.message} />;
  }

  const params = await searchParams;
  const dateRange = selectedDateRange(params.range);
  const rangeStart = rangeStartIso(dateRange);
  const rangeOption = dateRangeOptions.find((option) => option.value === dateRange);
  const supabase = await createClient();
  const { business } = current;

  let leadsQuery = supabase
    .from("leads")
    .select("id, status, source, service_id, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(5000);
  let appointmentsQuery = supabase
    .from("appointments")
    .select("id, status, service_id, starts_at, created_at")
    .eq("business_id", business.id)
    .order("starts_at", { ascending: false })
    .limit(5000);
  let clientsCountQuery = supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);
  let eventsQuery = supabase
    .from("events")
    .select(
      "id, event_type, entity_table, entity_id, created_at, customer:customers(full_name)",
    )
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(8);
  let recentLeadsQuery = supabase
    .from("leads")
    .select(
      "id, status, source, created_at, customer:customers(full_name), service:services(name)",
    )
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(5);
  let recentAppointmentsQuery = supabase
    .from("appointments")
    .select(
      "id, status, starts_at, created_at, customer:customers(full_name), service:services(name)",
    )
    .eq("business_id", business.id)
    .order("starts_at", { ascending: false })
    .limit(5);

  if (rangeStart) {
    leadsQuery = leadsQuery.gte("created_at", rangeStart);
    appointmentsQuery = appointmentsQuery.gte("starts_at", rangeStart);
    clientsCountQuery = clientsCountQuery.gte("created_at", rangeStart);
    eventsQuery = eventsQuery.gte("created_at", rangeStart);
    recentLeadsQuery = recentLeadsQuery.gte("created_at", rangeStart);
    recentAppointmentsQuery = recentAppointmentsQuery.gte("starts_at", rangeStart);
  }

  const [
    leadsResult,
    appointmentsResult,
    clientsCountResult,
    servicesResult,
    eventsResult,
    recentLeadsResult,
    recentAppointmentsResult,
  ] = await Promise.all([
    leadsQuery,
    appointmentsQuery,
    clientsCountQuery,
    supabase
      .from("services")
      .select("id, name, is_active")
      .eq("business_id", business.id)
      .order("name", { ascending: true }),
    eventsQuery,
    recentLeadsQuery,
    recentAppointmentsQuery,
  ]);

  const dataError = [
    leadsResult.error,
    appointmentsResult.error,
    clientsCountResult.error,
    servicesResult.error,
    recentLeadsResult.error,
    recentAppointmentsResult.error,
  ].find(Boolean);

  if (dataError) {
    return <AnalyticsError message={dataError.message} />;
  }

  const leads = (leadsResult.data ?? []) as LeadAnalyticsRow[];
  const appointments = (appointmentsResult.data ?? []) as AppointmentAnalyticsRow[];
  const services = (servicesResult.data ?? []) as ServiceAnalyticsRow[];
  const totalClients = clientsCountResult.count ?? 0;
  const activeServices = services.filter((service) => service.is_active).length;
  const totalLeads = leads.length;
  const newLeads = leads.filter((lead) => lead.status === "new").length;
  const bookedLeads = leads.filter((lead) => lead.status === "booked").length;
  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === "completed",
  ).length;
  const cancelledAppointments = appointments.filter(
    (appointment) => appointment.status === "cancelled",
  ).length;
  const noShowAppointments = appointments.filter(
    (appointment) => appointment.status === "no_show",
  ).length;
  const bookedAppointments = appointments.filter((appointment) =>
    ["scheduled", "confirmed", "completed"].includes(appointment.status),
  ).length;
  const totalAppointments = appointments.length;

  const leadToAppointmentRate = percentage(bookedAppointments, totalLeads);
  const leadToCompletedRate = percentage(completedAppointments, totalLeads);
  const noShowRate = percentage(noShowAppointments, totalAppointments);
  const cancellationRate = percentage(cancelledAppointments, totalAppointments);

  const overviewMetrics = [
    {
      label: "Общо запитвания",
      value: totalLeads,
      detail: rangeOption?.description ?? "Избран период",
      icon: ListChecks,
    },
    {
      label: "Нови запитвания",
      value: newLeads,
      detail: "чакат първи контакт",
      icon: Sparkles,
    },
    {
      label: "Записани запитвания",
      value: bookedLeads,
      detail: "lead статус booked",
      icon: CalendarClock,
    },
    {
      label: "Завършени часове",
      value: completedAppointments,
      detail: "реализирани посещения",
      icon: CalendarCheck,
    },
    {
      label: "Отказани часове",
      value: cancelledAppointments,
      detail: "маркирани cancelled",
      icon: CalendarX2,
    },
    {
      label: "Неявявания",
      value: noShowAppointments,
      detail: "маркирани no-show",
      icon: CircleSlash,
    },
    {
      label: "Общо клиенти",
      value: totalClients,
      detail: rangeOption?.description ?? "Избран период",
      icon: UsersRound,
    },
    {
      label: "Активни услуги",
      value: activeServices,
      detail: "видими в момента",
      icon: UserPlus,
    },
  ];

  const conversionMetrics = [
    {
      label: "Запитване към час",
      value: leadToAppointmentRate,
      detail: "записани часове / всички запитвания",
    },
    {
      label: "Запитване към завършен час",
      value: leadToCompletedRate,
      detail: "завършени часове / всички запитвания",
    },
    {
      label: "Неявяване",
      value: noShowRate,
      detail: "no-show часове / всички часове",
    },
    {
      label: "Отказване",
      value: cancellationRate,
      detail: "отказани часове / всички часове",
    },
  ];

  const sourceCounts = new Map<string, number>();
  leads.forEach((lead) => {
    sourceCounts.set(lead.source, (sourceCounts.get(lead.source) ?? 0) + 1);
  });
  const leadsBySource = Array.from(sourceCounts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => {
      const aIndex = sourceOrder.indexOf(a.source);
      const bIndex = sourceOrder.indexOf(b.source);
      const safeAIndex = aIndex === -1 ? sourceOrder.length : aIndex;
      const safeBIndex = bIndex === -1 ? sourceOrder.length : bIndex;

      return safeAIndex - safeBIndex || b.count - a.count;
    });
  const maxSourceCount = Math.max(...leadsBySource.map((item) => item.count), 0);

  const leadsByStatus = leadStatuses.map((status) => ({
    status,
    count: leads.filter((lead) => lead.status === status).length,
  }));
  const maxStatusCount = Math.max(...leadsByStatus.map((item) => item.count), 0);

  const serviceNames = new Map(services.map((service) => [service.id, service.name]));
  const serviceStats = new Map<string, TopServiceRow>();
  const ensureServiceStats = (serviceId: string | null) => {
    const key = serviceId ?? "__none__";
    const existing = serviceStats.get(key);

    if (existing) {
      return existing;
    }

    const created: TopServiceRow = {
      key,
      name: serviceId ? serviceNames.get(serviceId) ?? "Неизвестна услуга" : "Без услуга",
      leadCount: 0,
      appointmentCount: 0,
      completedAppointmentCount: 0,
    };
    serviceStats.set(key, created);

    return created;
  };

  leads.forEach((lead) => {
    ensureServiceStats(lead.service_id).leadCount += 1;
  });
  appointments.forEach((appointment) => {
    const service = ensureServiceStats(appointment.service_id);
    service.appointmentCount += 1;

    if (appointment.status === "completed") {
      service.completedAppointmentCount += 1;
    }
  });

  const topServices = Array.from(serviceStats.values())
    .filter(
      (service) =>
        service.leadCount > 0 ||
        service.appointmentCount > 0 ||
        service.completedAppointmentCount > 0,
    )
    .sort(
      (a, b) =>
        b.leadCount + b.appointmentCount - (a.leadCount + a.appointmentCount) ||
        b.completedAppointmentCount - a.completedAppointmentCount,
    )
    .slice(0, 8);

  const events = ((eventsResult.data ?? []) as Array<
    Omit<EventActivityRow, "customer"> & {
      customer?: EventActivityRow["customer"] | EventActivityRow["customer"][];
    }
  >).map((event) => ({
    ...event,
    customer: relationValue(event.customer),
  }));
  const recentLeads = ((recentLeadsResult.data ?? []) as Array<
    Omit<RecentLeadActivityRow, "customer" | "service"> & {
      customer?:
        | RecentLeadActivityRow["customer"]
        | RecentLeadActivityRow["customer"][];
      service?: RecentLeadActivityRow["service"] | RecentLeadActivityRow["service"][];
    }
  >).map((lead) => ({
    ...lead,
    customer: relationValue(lead.customer),
    service: relationValue(lead.service),
  }));
  const recentAppointments = ((recentAppointmentsResult.data ?? []) as Array<
    Omit<RecentAppointmentActivityRow, "customer" | "service"> & {
      customer?:
        | RecentAppointmentActivityRow["customer"]
        | RecentAppointmentActivityRow["customer"][];
      service?:
        | RecentAppointmentActivityRow["service"]
        | RecentAppointmentActivityRow["service"][];
    }
  >).map((appointment) => ({
    ...appointment,
    customer: relationValue(appointment.customer),
    service: relationValue(appointment.service),
  }));

  const fallbackActivity = [
    ...recentLeads.map((lead) => ({
      id: `lead-${lead.id}`,
      label: "Ново запитване",
      title: lead.customer?.full_name ?? "Клиент без име",
      detail: `${lead.service?.name ?? "Без услуга"} · ${formatSource(lead.source)}`,
      href: `/dashboard/leads/${lead.id}`,
      createdAt: lead.created_at,
      badge: isLeadStatus(lead.status) ? leadStatusLabels[lead.status] : lead.status,
    })),
    ...recentAppointments.map((appointment) => ({
      id: `appointment-${appointment.id}`,
      label: "Час",
      title: appointment.customer?.full_name ?? "Клиент без име",
      detail: `${appointment.service?.name ?? "Без услуга"} · ${formatActivityDate(
        appointment.starts_at,
      )}`,
      href: `/dashboard/appointments/${appointment.id}`,
      createdAt: appointment.created_at,
      badge: isAppointmentStatus(appointment.status)
        ? appointmentStatusLabels[appointment.status]
        : appointment.status,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 8);

  const hasAnyActivity =
    totalLeads > 0 || totalAppointments > 0 || totalClients > 0 || events.length > 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Badge className="mb-3 border-[#b9d8c5] bg-[#edf8f0] text-[#245d36] hover:bg-[#edf8f0]">
            {business.name}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            Анализи
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69655e] sm:text-base">
            Проследи запитванията, клиентите, часовете и реалната конверсия за
            избрания период.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {dateRangeOptions.map((option) => {
            const isActive = option.value === dateRange;

            return (
              <Button
                key={option.value}
                asChild
                variant={isActive ? "default" : "outline"}
                className={
                  isActive
                    ? "bg-[#16372f] text-white hover:bg-[#214b42]"
                    : "border-[#d8d0c2] bg-white text-[#16372f] hover:bg-[#f1ebe0]"
                }
              >
                <Link href={`/dashboard/analytics?range=${option.value}`}>
                  {option.label}
                </Link>
              </Button>
            );
          })}
        </div>
      </div>

      {!hasAnyActivity ? (
        <Card className="border-dashed border-[#d6cbbb] bg-[#fbfaf6]">
          <CardContent className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
            <BarChart3 className="size-10 text-[#a84b32]" />
            <h2 className="mt-4 text-xl font-semibold">
              Още няма достатъчно данни за анализ.
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#69655e]">
              След първите заявки и часове тук ще се появят реални метрики за
              конверсия, източници и най-търсени услуги.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Button
                asChild
                className="bg-[#16372f] text-white hover:bg-[#214b42]"
              >
                <Link href="/dashboard/services/new">Добави услуга</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-[#d8d0c2] bg-white"
              >
                <Link href="/dashboard/demo-data">
                  <DatabaseZap className="size-4" />
                  Демо данни
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map((metric) => (
          <Card key={metric.label} className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#69655e]">
                {metric.label}
              </CardTitle>
              <metric.icon className="size-4 text-[#a84b32]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{metric.value}</div>
              <p className="mt-1 text-sm text-[#69655e]">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-[#ded7c8] bg-[#fbfaf6]">
        <CardHeader className="border-b border-[#ece4d7]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5 text-[#a84b32]" />
                Конверсия
              </CardTitle>
              <CardDescription>
                Основни проценти за запитванията и часовете в избрания период.
              </CardDescription>
            </div>
            <Button
              asChild
              variant="outline"
              className="hidden border-[#d8d0c2] bg-white sm:inline-flex"
            >
              <Link href="/dashboard/leads">
                Виж запитвания
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-5 md:grid-cols-2 xl:grid-cols-4">
          {conversionMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-lg border border-[#e6ded1] bg-white p-4"
            >
              <p className="text-sm font-medium text-[#69655e]">{metric.label}</p>
              <div className="mt-3 text-3xl font-semibold">
                {formatPercent(metric.value)}%
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eee7da]">
                <div
                  className="h-full rounded-full bg-[#a84b32]"
                  style={{ width: barWidth(metric.value, 100) }}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-[#69655e]">
                {metric.detail}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-[#ded7c8] bg-[#fbfaf6]">
          <CardHeader className="border-b border-[#ece4d7]">
            <CardTitle className="flex items-center gap-2">
              <PieChart className="size-5 text-[#a84b32]" />
              Запитвания по източник
            </CardTitle>
            <CardDescription>
              Откъде идват входящите заявки за периода.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {leadsBySource.length > 0 ? (
              leadsBySource.map((item) => (
                <div key={item.source} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">
                      {formatSource(item.source)}
                    </span>
                    <span className="text-sm text-[#69655e]">{item.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#eee7da]">
                    <div
                      className="h-full rounded-full bg-[#28705d]"
                      style={{ width: barWidth(item.count, maxSourceCount) }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-[#d6cbbb] bg-white px-4 py-8 text-center text-sm text-[#69655e]">
                Няма запитвания за избрания период.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#ded7c8] bg-[#fbfaf6]">
          <CardHeader className="border-b border-[#ece4d7]">
            <CardTitle>Запитвания по статус</CardTitle>
            <CardDescription>
              Разпределение на pipeline статусите.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pt-5 sm:grid-cols-2">
            {leadsByStatus.map((item) => (
              <div
                key={item.status}
                className="rounded-lg border border-[#e6ded1] bg-white p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <LeadStatusBadge status={item.status} />
                  <span className="text-xl font-semibold">{item.count}</span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eee7da]">
                  <div
                    className="h-full rounded-full bg-[#16372f]"
                    style={{ width: barWidth(item.count, maxStatusCount) }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-[#ded7c8] bg-[#fbfaf6]">
          <CardHeader className="border-b border-[#ece4d7]">
            <CardTitle>Топ услуги</CardTitle>
            <CardDescription>
              Услугите с най-много заявки и часове.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {topServices.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#e2dbcf]">
                      <TableHead>Услуга</TableHead>
                      <TableHead className="text-right">Запитвания</TableHead>
                      <TableHead className="text-right">Часове</TableHead>
                      <TableHead className="text-right">Завършени</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topServices.map((service) => (
                      <TableRow key={service.key} className="border-[#e8e0d4]">
                        <TableCell className="min-w-48 whitespace-normal font-medium">
                          {service.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {service.leadCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {service.appointmentCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {service.completedAppointmentCount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#d6cbbb] bg-white px-4 py-10 text-center">
                <Sparkles className="mx-auto size-8 text-[#a84b32]" />
                <p className="mt-3 font-medium">
                  Няма услуги с активност за периода.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#ded7c8] bg-[#fbfaf6]">
          <CardHeader className="border-b border-[#ece4d7]">
            <CardTitle>Последна активност</CardTitle>
            <CardDescription>
              Събития от системата или последни заявки и часове.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {events.length > 0
              ? events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-lg border border-[#e6ded1] bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {formatEventType(event.event_type)}
                        </p>
                        <p className="mt-1 text-sm text-[#69655e]">
                          {event.customer?.full_name ??
                            event.entity_table ??
                            "Системно събитие"}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-[#8a8176]">
                        {formatActivityDate(event.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              : fallbackActivity.map((activity) => (
                  <Link
                    key={activity.id}
                    href={activity.href}
                    className="block rounded-lg border border-[#e6ded1] bg-white p-4 transition hover:border-[#c8bba9] hover:bg-[#fffdf8]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{activity.label}</p>
                        <p className="mt-1 text-sm text-[#69655e]">
                          {activity.title}
                        </p>
                        <p className="mt-1 text-xs text-[#8a8176]">
                          {activity.detail}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Badge
                          variant="outline"
                          className="border-[#d8d0c2] text-[#575048]"
                        >
                          {activity.badge}
                        </Badge>
                        <span className="text-xs text-[#8a8176]">
                          {formatActivityDate(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}

            {events.length === 0 && fallbackActivity.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#d6cbbb] bg-white px-4 py-10 text-center">
                <BarChart3 className="mx-auto size-8 text-[#a84b32]" />
                <p className="mt-3 font-medium">Няма скорошна активност.</p>
              </div>
            ) : null}

            {eventsResult.error ? (
              <p className="rounded-lg border border-[#dfc8a2] bg-[#fff6e6] px-3 py-2 text-xs leading-5 text-[#7a4f12]">
                Събитията не са достъпни в момента, затова показваме последни
                заявки и часове.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
