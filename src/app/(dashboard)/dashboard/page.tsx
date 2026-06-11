import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Circle,
  ClipboardList,
  DatabaseZap,
  Edit3,
  ExternalLink,
  ListChecks,
  MessageSquareHeart,
  Plus,
  Share2,
  Sparkles,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { CopyBookingLinkButton } from "@/components/dashboard/copy-booking-link-button";
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
import {
  businessVerticalLabels,
  leadPriorityLabels,
  leadStatusLabels,
} from "@/lib/business/labels";
import { getCurrentUserBusiness } from "@/lib/business/current";
import { formatCustomerSource } from "@/lib/customers/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RecentLeadRow = {
  id: string;
  status: string;
  priority: string;
  source: string;
  message: string | null;
  created_at: string;
  customer: {
    full_name: string;
    email: string | null;
    phone: string | null;
  } | null;
  service: {
    name: string;
  } | null;
};

type TodayAppointmentRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  customer: {
    full_name: string;
    phone: string | null;
  } | null;
  service: {
    name: string;
  } | null;
};

type RecentClientRow = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  source: string;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function todayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function monthBoundsIso() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
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

function DashboardError({ message }: { message: string }) {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <Card className="border-[#efb3a5] bg-[#fff7f4]">
        <CardHeader>
          <CardTitle>Не успяхме да заредим таблото</CardTitle>
          <CardDescription className="text-[#8f3a25]">{message}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default async function DashboardPage() {
  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect("/login?next=/dashboard");
    }

    if (current.reason === "missing_business") {
      redirect("/onboarding");
    }

    return <DashboardError message={current.message} />;
  }

  const supabase = await createClient();
  const { business } = current;
  const today = todayBounds();
  const month = monthBoundsIso();
  const now = new Date().toISOString();

  const [
    totalServicesResult,
    activeServicesResult,
    totalLeadsResult,
    newLeadsResult,
    bookedAppointmentsResult,
    completedAppointmentsResult,
    todayAppointmentsResult,
    upcomingAppointmentsResult,
    totalClientsResult,
    newClientsThisMonthResult,
    monthLeadsResult,
    monthBookedAppointmentsResult,
    activeAutomationTemplatesResult,
    reviewRequestsResult,
    recentLeadsResult,
    todayAppointmentsListResult,
    recentClientsResult,
  ] = await Promise.all([
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("is_active", true),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("status", "new"),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .in("status", ["scheduled", "confirmed"]),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("status", "completed"),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .in("status", ["scheduled", "confirmed"])
      .gte("starts_at", today.start)
      .lt("starts_at", today.end),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .in("status", ["scheduled", "confirmed"])
      .gte("starts_at", now),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("created_at", month.start)
      .lt("created_at", month.end),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("created_at", month.start)
      .lt("created_at", month.end),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .in("status", ["scheduled", "confirmed", "completed"])
      .gte("starts_at", month.start)
      .lt("starts_at", month.end),
    supabase
      .from("automation_templates")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("scope", "business")
      .eq("is_active", true),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
    supabase
      .from("leads")
      .select(
        "id, status, priority, source, message, created_at, customer:customers(full_name, email, phone), service:services(name)",
      )
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("appointments")
      .select(
        "id, starts_at, ends_at, status, notes, customer:customers(full_name, phone), service:services(name)",
      )
      .eq("business_id", business.id)
      .gte("starts_at", today.start)
      .lt("starts_at", today.end)
      .order("starts_at", { ascending: true })
      .limit(5),
    supabase
      .from("customers")
      .select("id, full_name, phone, email, source, created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const dataError = [
    totalServicesResult.error,
    activeServicesResult.error,
    totalLeadsResult.error,
    newLeadsResult.error,
    bookedAppointmentsResult.error,
    completedAppointmentsResult.error,
    todayAppointmentsResult.error,
    upcomingAppointmentsResult.error,
    totalClientsResult.error,
    newClientsThisMonthResult.error,
    monthLeadsResult.error,
    monthBookedAppointmentsResult.error,
    activeAutomationTemplatesResult.error,
    reviewRequestsResult.error,
    recentLeadsResult.error,
    todayAppointmentsListResult.error,
    recentClientsResult.error,
  ].find(Boolean);

  if (dataError) {
    return <DashboardError message={dataError.message} />;
  }

  const totalServices = totalServicesResult.count ?? 0;
  const activeServices = activeServicesResult.count ?? 0;
  const totalLeads = totalLeadsResult.count ?? 0;
  const newLeads = newLeadsResult.count ?? 0;
  const bookedAppointments = bookedAppointmentsResult.count ?? 0;
  const completedAppointments = completedAppointmentsResult.count ?? 0;
  const todayAppointments = todayAppointmentsResult.count ?? 0;
  const upcomingAppointments = upcomingAppointmentsResult.count ?? 0;
  const totalClients = totalClientsResult.count ?? 0;
  const newClientsThisMonth = newClientsThisMonthResult.count ?? 0;
  const monthLeads = monthLeadsResult.count ?? 0;
  const monthBookedAppointments = monthBookedAppointmentsResult.count ?? 0;
  const monthConversionRate = percentage(monthBookedAppointments, monthLeads);
  const activeAutomationTemplates = activeAutomationTemplatesResult.count ?? 0;
  const reviewRequests = reviewRequestsResult.count ?? 0;
  const recentLeads = ((recentLeadsResult.data ?? []) as Array<
    Omit<RecentLeadRow, "customer" | "service"> & {
      customer?: RecentLeadRow["customer"] | RecentLeadRow["customer"][];
      service?: RecentLeadRow["service"] | RecentLeadRow["service"][];
    }
  >).map((lead) => ({
    ...lead,
    customer: relationValue(lead.customer),
    service: relationValue(lead.service),
  }));
  const todayAppointmentsList = ((todayAppointmentsListResult.data ?? []) as Array<
    Omit<TodayAppointmentRow, "customer" | "service"> & {
      customer?: TodayAppointmentRow["customer"] | TodayAppointmentRow["customer"][];
      service?: TodayAppointmentRow["service"] | TodayAppointmentRow["service"][];
    }
  >).map((appointment) => ({
    ...appointment,
    customer: relationValue(appointment.customer),
    service: relationValue(appointment.service),
  }));
  const recentClients = (recentClientsResult.data ?? []) as RecentClientRow[];

  const bookingPath = `/b/${business.publicSlug}`;
  const checklist = [
    {
      label: "Добави първа услуга",
      done: totalServices > 0,
    },
    {
      label: "Отвори публичната booking страница",
      done: business.status === "active" && Boolean(business.publicSlug),
    },
    {
      label: "Изпрати тестова заявка",
      done: totalLeads > 0,
    },
    {
      label: "Превърни заявка в час",
      done: bookedAppointments > 0 || completedAppointments > 0,
    },
    {
      label: "Завърши час",
      done: completedAppointments > 0,
    },
    {
      label: "Поискай отзив",
      done: reviewRequests > 0,
    },
    {
      label: "Провери анализите",
      done: totalLeads > 0 || totalClients > 0 || completedAppointments > 0,
    },
  ];

  const metrics = [
    {
      label: "Общо услуги",
      value: totalServices,
      detail: "в каталога",
      icon: ClipboardList,
    },
    {
      label: "Активни услуги",
      value: activeServices,
      detail: "видими за резервации",
      icon: Sparkles,
    },
    {
      label: "Общо запитвания",
      value: totalLeads,
      detail: "от клиенти",
      icon: UsersRound,
    },
    {
      label: "Нови запитвания",
      value: newLeads,
      detail: "чакат отговор",
      icon: ListChecks,
    },
    {
      label: "Записани часове",
      value: bookedAppointments,
      detail: "планирани/потвърдени",
      icon: CalendarDays,
    },
    {
      label: "Днешни часове",
      value: todayAppointments,
      detail: "за днес",
      icon: CalendarCheck,
    },
    {
      label: "Предстоящи часове",
      value: upcomingAppointments,
      detail: "от сега нататък",
      icon: CalendarPlus,
    },
    {
      label: "Завършени часове",
      value: completedAppointments,
      detail: "приключени посещения",
      icon: CalendarCheck,
    },
    {
      label: "Общо клиенти",
      value: totalClients,
      detail: "в клиентската база",
      icon: UsersRound,
    },
    {
      label: "Нови клиенти",
      value: newClientsThisMonth,
      detail: "този месец",
      icon: UserPlus,
    },
    {
      label: "Активни шаблони",
      value: activeAutomationTemplates,
      detail: "за ръчно копиране",
      icon: BellRing,
    },
    {
      label: "Заявки за отзив",
      value: reviewRequests,
      detail: "след посещения",
      icon: MessageSquareHeart,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Badge className="mb-3 border-[#b9d8c5] bg-[#edf8f0] text-[#245d36] hover:bg-[#edf8f0]">
            {businessVerticalLabels[business.vertical]}
          </Badge>
          <h1 className="break-words text-3xl font-semibold tracking-normal sm:text-4xl">
            {business.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69655e] sm:text-base">
            Работно табло за услугите, входящите запитвания и следващите стъпки
            към първата работеща booking страница.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button asChild className="bg-[#16372f] text-white hover:bg-[#214b42]">
            <Link href="/dashboard/services/new">
              <Plus className="size-4" />
              Добави услуга
            </Link>
          </Button>
          <CopyBookingLinkButton publicSlug={business.publicSlug} />
          <Button
            asChild
            variant="outline"
            className="border-[#d8d0c2] bg-white text-[#16372f] hover:bg-[#f1ebe0]"
          >
            <Link href={`/b/${business.publicSlug}`} target="_blank">
              <ExternalLink className="size-4" />
              Виж публичната страница
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5 text-[#a84b32]" />
                Бърз анализ за месеца
              </CardTitle>
              <CardDescription>
                Запитвания, записани часове и базова конверсия за текущия месец.
              </CardDescription>
            </div>
            <Button
              asChild
              variant="outline"
              className="w-full border-[#d8d0c2] bg-white sm:w-auto"
            >
              <Link href="/dashboard/analytics">
                Виж анализите
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-5 md:grid-cols-3">
          <div className="rounded-lg border border-[#e6ded1] bg-white p-4">
            <p className="text-sm font-medium text-[#69655e]">
              Запитвания този месец
            </p>
            <div className="mt-2 text-3xl font-semibold">{monthLeads}</div>
          </div>
          <div className="rounded-lg border border-[#e6ded1] bg-white p-4">
            <p className="text-sm font-medium text-[#69655e]">
              Записани часове този месец
            </p>
            <div className="mt-2 text-3xl font-semibold">
              {monthBookedAppointments}
            </div>
          </div>
          <div className="rounded-lg border border-[#e6ded1] bg-white p-4">
            <p className="text-sm font-medium text-[#69655e]">
              Конверсия към час
            </p>
            <div className="mt-2 text-3xl font-semibold">
              {formatPercent(monthConversionRate)}%
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#ded7c8] bg-[#fbfaf6]">
        <CardHeader className="border-b border-[#ece4d7]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Днешни часове</CardTitle>
              <CardDescription>
                До 5 часа, подредени по начален час.
              </CardDescription>
            </div>
            <Button
              asChild
              variant="outline"
              className="w-full border-[#d8d0c2] bg-white sm:w-auto"
            >
              <Link href="/dashboard/appointments?date=today">
                Виж всички часове
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {todayAppointmentsList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-[#e2dbcf]">
                  <TableHead>Час</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Услуга</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действие</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayAppointmentsList.map((appointment) => (
                  <TableRow key={appointment.id} className="border-[#e8e0d4]">
                    <TableCell className="min-w-32 font-medium">
                      {formatTime(appointment.starts_at)} -{" "}
                      {formatTime(appointment.ends_at)}
                    </TableCell>
                    <TableCell className="min-w-48 whitespace-normal">
                      <div className="font-medium">
                        {appointment.customer?.full_name ?? "Клиент без име"}
                      </div>
                      <div className="text-xs text-[#69655e]">
                        {appointment.customer?.phone ?? "Няма телефон"}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-40 whitespace-normal text-[#575048]">
                      {appointment.service?.name ?? "Без услуга"}
                    </TableCell>
                    <TableCell className="text-[#575048]">
                      {isAppointmentStatus(appointment.status)
                        ? appointmentStatusLabels[appointment.status]
                        : appointment.status}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        asChild
                        variant="outline"
                        className="border-[#d8d0c2] bg-white"
                      >
                        <Link href={`/dashboard/appointments/${appointment.id}`}>
                          Детайли
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-lg border border-dashed border-[#d6cbbb] bg-white px-4 py-10 text-center">
              <CalendarDays className="mx-auto size-8 text-[#a84b32]" />
              <p className="mt-3 font-medium">Няма часове за днес.</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#69655e]">
                Когато има записани часове за днешния ден, ще ги виждаш тук.
              </p>
              <Button
                asChild
                variant="outline"
                className="mt-5 border-[#d8d0c2] bg-white"
              >
                <Link href="/dashboard/demo-data">
                  <DatabaseZap className="size-4" />
                  Добави примерни данни
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-[#ded7c8] bg-[#fbfaf6]">
        <CardHeader className="border-b border-[#ece4d7]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Последни клиенти</CardTitle>
              <CardDescription>
                До 5 най-скоро създадени клиента за този бизнес.
              </CardDescription>
            </div>
            <Button
              asChild
              variant="outline"
              className="w-full border-[#d8d0c2] bg-white sm:w-auto"
            >
              <Link href="/dashboard/clients">
                Виж всички клиенти
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {recentClients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-[#e2dbcf]">
                  <TableHead>Клиент</TableHead>
                  <TableHead>Контакт</TableHead>
                  <TableHead>Източник</TableHead>
                  <TableHead className="text-right">Създаден</TableHead>
                  <TableHead className="text-right">Действие</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentClients.map((client) => (
                  <TableRow key={client.id} className="border-[#e8e0d4]">
                    <TableCell className="min-w-48 whitespace-normal font-medium">
                      {client.full_name}
                    </TableCell>
                    <TableCell className="min-w-48 whitespace-normal text-[#575048]">
                      <div>{client.phone ?? "Няма телефон"}</div>
                      <div className="text-xs text-[#69655e]">
                        {client.email ?? "Няма имейл"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-[#d8d0c2] text-[#575048]"
                      >
                        {formatCustomerSource(client.source)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-[#69655e]">
                      {formatDate(client.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        asChild
                        variant="outline"
                        className="border-[#d8d0c2] bg-white"
                      >
                        <Link href={`/dashboard/clients/${client.id}`}>
                          Детайли
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-lg border border-dashed border-[#d6cbbb] bg-white px-4 py-10 text-center">
              <UsersRound className="mx-auto size-8 text-[#a84b32]" />
              <p className="mt-3 font-medium">Все още нямате клиенти.</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#69655e]">
                Клиентите се появяват автоматично след заявка или ръчно създаден
                час.
              </p>
              <Button
                asChild
                variant="outline"
                className="mt-5 border-[#d8d0c2] bg-white"
              >
                <Link href="/dashboard/demo-data">
                  <DatabaseZap className="size-4" />
                  Добави примерни данни
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="border-[#ded7c8] bg-[#fbfaf6]">
          <CardHeader className="border-b border-[#ece4d7]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Последни запитвания</CardTitle>
                <CardDescription>
                  Най-новите заявки, видими само за този бизнес.
                </CardDescription>
              </div>
              <Button
                asChild
                variant="outline"
                className="w-full border-[#d8d0c2] bg-white sm:w-auto"
              >
                <Link href="/dashboard/leads">
                  Виж всички
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {recentLeads.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-[#e2dbcf]">
                    <TableHead>Клиент</TableHead>
                    <TableHead>Услуга</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Приоритет</TableHead>
                    <TableHead className="text-right">Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLeads.map((lead) => (
                    <TableRow key={lead.id} className="border-[#e8e0d4]">
                      <TableCell className="min-w-48 whitespace-normal">
                        <div className="font-medium">
                          {lead.customer?.full_name ?? "Клиент без име"}
                        </div>
                        <div className="text-xs text-[#69655e]">
                          {lead.customer?.email ??
                            lead.customer?.phone ??
                            "Няма контакт"}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-36 whitespace-normal text-[#575048]">
                        {lead.service?.name ?? "Без избрана услуга"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-[#b9d8c5] text-[#245d36]"
                        >
                          {leadStatusLabels[lead.status] ?? lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#575048]">
                        {leadPriorityLabels[lead.priority] ?? lead.priority}
                      </TableCell>
                      <TableCell className="text-right text-[#69655e]">
                        {formatDate(lead.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="rounded-lg border border-dashed border-[#d6cbbb] bg-white px-4 py-10 text-center">
                <UsersRound className="mx-auto size-8 text-[#a84b32]" />
                <p className="mt-3 font-medium">Още няма входящи запитвания.</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#69655e]">
                След като booking страницата започне да приема заявки, тук ще
                се появят последните клиенти.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                <Button
                  asChild
                  variant="outline"
                  className="border-[#d8d0c2] bg-white"
                >
                  <Link href={`/b/${business.publicSlug}`} target="_blank">
                    <ExternalLink className="size-4" />
                    Отвори booking страницата
                  </Link>
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
            </div>
          )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader>
              <CardTitle>Onboarding checklist</CardTitle>
              <CardDescription>
                Най-краткият път до работеща booking страница.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklist.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[#e6ded1] bg-white px-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    {item.done ? (
                      <CheckCircle2 className="size-5 text-[#28705d]" />
                    ) : (
                      <Circle className="size-5 text-[#b48b5a]" />
                    )}
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      item.done
                        ? "border-[#b9d8c5] text-[#245d36]"
                        : "border-[#ead2a9] text-[#8a5a20]"
                    }
                  >
                    {item.done ? "Готово" : "Следва"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader>
              <CardTitle>Бързи действия</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild className="justify-start bg-[#16372f] text-white hover:bg-[#214b42]">
                <Link href="/dashboard/services/new">
                  <Plus className="size-4" />
                  Добави услуга
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start border-[#d8d0c2] bg-white">
                <Link href="/dashboard/services">
                  <ClipboardList className="size-4" />
                  Виж услугите
                </Link>
              </Button>
              <CopyBookingLinkButton publicSlug={business.publicSlug} />
              <Button asChild variant="outline" className="justify-start border-[#d8d0c2] bg-white">
                <Link href={`/b/${business.publicSlug}`} target="_blank">
                  <ExternalLink className="size-4" />
                  Виж публичната страница
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start border-[#d8d0c2] bg-white">
                <Link href="/dashboard/leads">
                  <ExternalLink className="size-4" />
                  Виж запитвания
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start border-[#d8d0c2] bg-white">
                <Link href="/dashboard/appointments">
                  <CalendarDays className="size-4" />
                  Виж всички часове
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start border-[#d8d0c2] bg-white">
                <Link href="/dashboard/clients">
                  <UsersRound className="size-4" />
                  Виж всички клиенти
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start border-[#d8d0c2] bg-white">
                <Link href="/dashboard/analytics">
                  <BarChart3 className="size-4" />
                  Виж анализите
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start border-[#d8d0c2] bg-white">
                <Link href="/dashboard/automations">
                  <BellRing className="size-4" />
                  Управлявай автоматизациите
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start border-[#d8d0c2] bg-white">
                <Link href="/dashboard/demo-data">
                  <DatabaseZap className="size-4" />
                  Добави примерни данни
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start border-[#d8d0c2] bg-white">
                <Link href="/dashboard/settings/social-links">
                  <Share2 className="size-4" />
                  Линкове за социални мрежи
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start border-[#d8d0c2] bg-white">
                <Link href="/dashboard/settings/profile">
                  <Edit3 className="size-4" />
                  Редактирай профила
                </Link>
              </Button>
              <p className="pt-2 text-xs leading-5 text-[#69655e]">
                Публичен адрес: <span className="font-medium">{bookingPath}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
