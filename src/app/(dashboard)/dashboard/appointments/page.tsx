import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarPlus,
  DatabaseZap,
  Eye,
  Filter,
  ListChecks,
  Search,
} from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  appointmentStatusBadgeClassNames,
  appointmentStatusLabels,
  appointmentStatuses,
  formatAppointmentDate,
  formatAppointmentTime,
  formatCreatedAt,
  isAppointmentStatus,
  relationValue,
  type AppointmentStatus,
} from "@/lib/appointments/format";
import { getCurrentUserBusiness } from "@/lib/business/current";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AppointmentsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type ServiceFilterRow = {
  id: string;
  name: string;
};

type CustomerSearchRow = {
  id: string;
};

type AppointmentRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  customer: {
    full_name: string;
    phone: string | null;
    email: string | null;
  } | null;
  service: {
    id: string;
    name: string;
  } | null;
};

const dateFilterLabels: Record<string, string> = {
  today: "Днес",
  upcoming: "Предстоящи",
  past: "Минали",
  all: "Всички",
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanParam(value: string | string[] | undefined) {
  return (firstParam(value) ?? "").trim();
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function cleanSearchTerm(value: string) {
  return value.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
}

function selectClassName() {
  return "h-9 w-full rounded-lg border border-[#d8d0c2] bg-white px-3 text-sm outline-none focus-visible:border-[#16372f] focus-visible:ring-2 focus-visible:ring-[#16372f]/20";
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

function AppointmentsError({ message }: { message: string }) {
  return (
    <Card className="border-[#efb3a5] bg-[#fff7f4]">
      <CardHeader>
        <CardTitle>Не успяхме да заредим часовете</CardTitle>
        <CardDescription className="text-[#8f3a25]">{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function AppointmentsPage({
  searchParams,
}: AppointmentsPageProps) {
  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect("/login?next=/dashboard/appointments");
    }

    if (current.reason === "missing_business") {
      redirect("/onboarding");
    }

    return <AppointmentsError message={current.message} />;
  }

  const params = await searchParams;
  const statusParam = cleanParam(params.status);
  const dateParam = cleanParam(params.date) || "upcoming";
  const serviceParam = cleanParam(params.service);
  const qParam = cleanParam(params.q);
  const selectedStatus = isAppointmentStatus(statusParam) ? statusParam : "";
  const selectedDate = ["today", "upcoming", "past", "all"].includes(dateParam)
    ? dateParam
    : "upcoming";
  const selectedService = isUuid(serviceParam) ? serviceParam : "";
  const searchTerm = cleanSearchTerm(qParam);
  const supabase = await createClient();
  const { data: servicesData, error: servicesError } = await supabase
    .from("services")
    .select("id, name")
    .eq("business_id", current.business.id)
    .order("name", { ascending: true });

  if (servicesError) {
    return <AppointmentsError message={servicesError.message} />;
  }

  const services = (servicesData ?? []) as ServiceFilterRow[];
  let customerIds: string[] | null = null;

  if (searchTerm) {
    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("id")
      .eq("business_id", current.business.id)
      .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      .limit(200);

    if (customersError) {
      return <AppointmentsError message={customersError.message} />;
    }

    customerIds = ((customers ?? []) as CustomerSearchRow[]).map(
      (customer) => customer.id,
    );
  }

  let appointments: AppointmentRow[] = [];

  if (!customerIds || customerIds.length > 0) {
    let query = supabase
      .from("appointments")
      .select(
        "id, starts_at, ends_at, status, notes, created_at, customer:customers(full_name, phone, email), service:services(id, name)",
      )
      .eq("business_id", current.business.id);

    if (selectedStatus) {
      query = query.eq("status", selectedStatus);
    }

    if (selectedService) {
      query = query.eq("service_id", selectedService);
    }

    const now = new Date().toISOString();
    const bounds = todayBounds();

    if (selectedDate === "today") {
      query = query.gte("starts_at", bounds.start).lt("starts_at", bounds.end);
    } else if (selectedDate === "upcoming") {
      query = query.gte("starts_at", now);
    } else if (selectedDate === "past") {
      query = query.lt("starts_at", now);
    }

    if (customerIds) {
      query = query.in("customer_id", customerIds);
    }

    const { data, error } = await query
      .order("starts_at", { ascending: selectedDate !== "past" })
      .limit(150);

    if (error) {
      return <AppointmentsError message={error.message} />;
    }

    appointments = ((data ?? []) as Array<
      Omit<AppointmentRow, "customer" | "service"> & {
        customer?: AppointmentRow["customer"] | AppointmentRow["customer"][];
        service?: AppointmentRow["service"] | AppointmentRow["service"][];
      }
    >).map((appointment) => ({
      ...appointment,
      status: isAppointmentStatus(appointment.status)
        ? appointment.status
        : "scheduled",
      customer: relationValue(appointment.customer),
      service: relationValue(appointment.service),
    }));
  }

  const hasFilters = Boolean(
    selectedStatus || selectedService || selectedDate !== "upcoming" || searchTerm,
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Badge className="mb-3 border-[#b9d8c5] bg-[#edf8f0] text-[#245d36] hover:bg-[#edf8f0]">
            {current.business.name}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-normal">Часове</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69655e] sm:text-base">
            Преглед и управление на всички часове, създадени от заявки
            или ръчно от екипа.
          </p>
        </div>
        <Button asChild className="bg-[#16372f] text-white hover:bg-[#214b42]">
          <Link href="/dashboard/appointments/new">
            <CalendarPlus className="size-4" />
            Нов час
          </Link>
        </Button>
      </div>

      <Card className="border-[#ded7c8] bg-[#fbfaf6]">
        <CardHeader className="border-b border-[#ece4d7]">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-[#a84b32]" />
            <CardTitle>Филтри</CardTitle>
          </div>
          <CardDescription>
            Ограничете изгледа по статус, период, услуга или клиент.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <form
            action="/dashboard/appointments"
            className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr_auto]"
          >
            <div className="space-y-2">
              <Label htmlFor="q">Търсене</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a8176]" />
                <Input
                  id="q"
                  name="q"
                  defaultValue={searchTerm}
                  placeholder="Име или телефон"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <select
                id="status"
                name="status"
                defaultValue={selectedStatus}
                className={selectClassName()}
              >
                <option value="">Всички</option>
                {appointmentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {appointmentStatusLabels[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Период</Label>
              <select
                id="date"
                name="date"
                defaultValue={selectedDate}
                className={selectClassName()}
              >
                {Object.entries(dateFilterLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Услуга</Label>
              <select
                id="service"
                name="service"
                defaultValue={selectedService}
                className={selectClassName()}
              >
                <option value="">Всички</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit" className="bg-[#16372f] text-white hover:bg-[#214b42]">
                Филтрирай
              </Button>
              {hasFilters ? (
                <Button asChild variant="outline" className="border-[#d8d0c2] bg-white">
                  <Link href="/dashboard/appointments">Изчисти</Link>
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-[#ded7c8] bg-[#fbfaf6]">
        <CardHeader className="border-b border-[#ece4d7]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Списък с часове</CardTitle>
              <CardDescription>
                {appointments.length === 1
                  ? "1 час в текущия изглед"
                  : `${appointments.length} часа в текущия изглед`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {appointments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#d6cbbb] bg-white px-4 py-12 text-center">
              <ListChecks className="mx-auto size-10 text-[#a84b32]" />
              <h2 className="mt-4 text-xl font-semibold">
                Все още нямате създадени часове.
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#69655e]">
                Конвертирай заявка в час или създай ръчен час за клиент.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                <Button asChild className="bg-[#16372f] text-white hover:bg-[#214b42]">
                  <Link href="/dashboard/leads">Виж заявките</Link>
                </Button>
                <Button asChild variant="outline" className="border-[#d8d0c2] bg-white">
                  <Link href="/dashboard/appointments/new">Нов час</Link>
                </Button>
                <Button asChild variant="outline" className="border-[#d8d0c2] bg-white">
                  <Link href="/dashboard/demo-data">
                    <DatabaseZap className="size-4" />
                    Демо данни
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#e2dbcf]">
                    <TableHead>Клиент</TableHead>
                    <TableHead>Услуга</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Начало</TableHead>
                    <TableHead>Край</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Бележка</TableHead>
                    <TableHead>Създадено</TableHead>
                    <TableHead className="min-w-80 text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id} className="border-[#e8e0d4]">
                      <TableCell className="min-w-52 whitespace-normal">
                        <div className="font-medium">
                          {appointment.customer?.full_name ?? "Клиент без име"}
                        </div>
                        <div className="text-xs leading-5 text-[#69655e]">
                          {appointment.customer?.phone ?? "Няма телефон"}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-44 whitespace-normal">
                        {appointment.service?.name ?? "Без услуга"}
                      </TableCell>
                      <TableCell className="min-w-32 text-[#575048]">
                        {formatAppointmentDate(appointment.starts_at)}
                      </TableCell>
                      <TableCell className="text-[#575048]">
                        {formatAppointmentTime(appointment.starts_at)}
                      </TableCell>
                      <TableCell className="text-[#575048]">
                        {formatAppointmentTime(appointment.ends_at)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={appointment.status} />
                      </TableCell>
                      <TableCell className="max-w-56 whitespace-normal text-[#575048]">
                        {appointment.notes
                          ? appointment.notes.length > 80
                            ? `${appointment.notes.slice(0, 80)}...`
                            : appointment.notes
                          : "Няма бележка"}
                      </TableCell>
                      <TableCell className="min-w-40 text-[#69655e]">
                        {formatCreatedAt(appointment.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-80 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                          <Button
                            asChild
                            variant="outline"
                            className="border-[#d8d0c2] bg-white"
                          >
                            <Link href={`/dashboard/appointments/${appointment.id}`}>
                              <Eye className="size-4" />
                              Детайли
                            </Link>
                          </Button>
                          {appointment.status !== "confirmed" ? (
                            <AppointmentStatusButton
                              appointmentId={appointment.id}
                              status="confirmed"
                              label="Потвърди"
                            />
                          ) : null}
                          {appointment.status !== "completed" ? (
                            <AppointmentStatusButton
                              appointmentId={appointment.id}
                              status="completed"
                              label="Завърши"
                            />
                          ) : null}
                          {appointment.status !== "cancelled" ? (
                            <AppointmentStatusButton
                              appointmentId={appointment.id}
                              status="cancelled"
                              label="Откажи"
                              variant="destructive"
                            />
                          ) : null}
                          {appointment.status !== "no_show" ? (
                            <AppointmentStatusButton
                              appointmentId={appointment.id}
                              status="no_show"
                              label="Не се яви"
                              variant="destructive"
                            />
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
