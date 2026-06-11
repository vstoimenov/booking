import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarPlus,
  DatabaseZap,
  Eye,
  Filter,
  Search,
  UserRound,
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
import { getCurrentUserBusiness } from "@/lib/business/current";
import {
  formatCustomerDate,
  formatCustomerDateTime,
  formatCustomerSource,
} from "@/lib/customers/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ClientsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type CustomerRow = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  source: string;
  created_at: string;
};

type SourceRow = {
  source: string;
};

type LeadCountRow = {
  customer_id: string | null;
};

type AppointmentCountRow = {
  customer_id: string;
  starts_at: string;
};

type ClientViewRow = CustomerRow & {
  totalLeads: number;
  totalAppointments: number;
  lastAppointmentDate: string | null;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanParam(value: string | string[] | undefined) {
  return (firstParam(value) ?? "").trim();
}

function cleanSearchTerm(value: string) {
  return value.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
}

function monthStartIso() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function selectClassName() {
  return "h-9 w-full rounded-lg border border-[#d8d0c2] bg-white px-3 text-sm outline-none focus-visible:border-[#16372f] focus-visible:ring-2 focus-visible:ring-[#16372f]/20";
}

function ClientsError({ message }: { message: string }) {
  return (
    <Card className="border-[#efb3a5] bg-[#fff7f4]">
      <CardHeader>
        <CardTitle>Не успяхме да заредим клиентите</CardTitle>
        <CardDescription className="text-[#8f3a25]">{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect("/login?next=/dashboard/clients");
    }

    if (current.reason === "missing_business") {
      redirect("/onboarding");
    }

    return <ClientsError message={current.message} />;
  }

  const params = await searchParams;
  const qParam = cleanParam(params.q);
  const sourceParam = cleanParam(params.source);
  const appointmentsParam = cleanParam(params.appointments);
  const createdParam = cleanParam(params.created);
  const searchTerm = cleanSearchTerm(qParam);
  const selectedSource = sourceParam.length <= 80 ? sourceParam : "";
  const appointmentFilter =
    appointmentsParam === "with" || appointmentsParam === "without"
      ? appointmentsParam
      : "";
  const recentOnly = createdParam === "recent";
  const supabase = await createClient();

  const { data: sourcesData, error: sourcesError } = await supabase
    .from("customers")
    .select("source")
    .eq("business_id", current.business.id)
    .order("source", { ascending: true })
    .limit(500);

  if (sourcesError) {
    return <ClientsError message={sourcesError.message} />;
  }

  let customersQuery = supabase
    .from("customers")
    .select("id, full_name, phone, email, source, created_at")
    .eq("business_id", current.business.id)
    .order("created_at", { ascending: false })
    .limit(500);

  if (searchTerm) {
    customersQuery = customersQuery.or(
      `full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`,
    );
  }

  if (selectedSource) {
    customersQuery = customersQuery.eq("source", selectedSource);
  }

  if (recentOnly) {
    customersQuery = customersQuery.gte("created_at", monthStartIso());
  }

  const { data: customersData, error: customersError } = await customersQuery;

  if (customersError) {
    return <ClientsError message={customersError.message} />;
  }

  const customers = (customersData ?? []) as CustomerRow[];
  const customerIds = customers.map((customer) => customer.id);
  const [leadsResult, appointmentsResult] =
    customerIds.length > 0
      ? await Promise.all([
          supabase
            .from("leads")
            .select("customer_id")
            .eq("business_id", current.business.id)
            .in("customer_id", customerIds)
            .limit(5000),
          supabase
            .from("appointments")
            .select("customer_id, starts_at")
            .eq("business_id", current.business.id)
            .in("customer_id", customerIds)
            .order("starts_at", { ascending: false })
            .limit(5000),
        ])
      : [
          { data: [], error: null },
          { data: [], error: null },
        ];

  const relatedError = leadsResult.error ?? appointmentsResult.error;

  if (relatedError) {
    return <ClientsError message={relatedError.message} />;
  }

  const leadCounts = new Map<string, number>();
  ((leadsResult.data ?? []) as LeadCountRow[]).forEach((lead) => {
    if (!lead.customer_id) {
      return;
    }

    leadCounts.set(lead.customer_id, (leadCounts.get(lead.customer_id) ?? 0) + 1);
  });

  const appointmentCounts = new Map<string, number>();
  const lastAppointmentDates = new Map<string, string>();
  ((appointmentsResult.data ?? []) as AppointmentCountRow[]).forEach(
    (appointment) => {
      appointmentCounts.set(
        appointment.customer_id,
        (appointmentCounts.get(appointment.customer_id) ?? 0) + 1,
      );

      const existingDate = lastAppointmentDates.get(appointment.customer_id);

      if (
        !existingDate ||
        new Date(appointment.starts_at).getTime() >
          new Date(existingDate).getTime()
      ) {
        lastAppointmentDates.set(appointment.customer_id, appointment.starts_at);
      }
    },
  );

  const clients = customers
    .map((customer): ClientViewRow => ({
      ...customer,
      totalLeads: leadCounts.get(customer.id) ?? 0,
      totalAppointments: appointmentCounts.get(customer.id) ?? 0,
      lastAppointmentDate: lastAppointmentDates.get(customer.id) ?? null,
    }))
    .filter((customer) => {
      if (appointmentFilter === "with") {
        return customer.totalAppointments > 0;
      }

      if (appointmentFilter === "without") {
        return customer.totalAppointments === 0;
      }

      return true;
    });

  const sourceRows = (sourcesData ?? []) as SourceRow[];
  const sourceOptions = Array.from(
    new Set([
      ...sourceRows.map((row) => row.source),
      ...(selectedSource ? [selectedSource] : []),
    ]),
  ).sort((a, b) =>
    formatCustomerSource(a).localeCompare(formatCustomerSource(b), "bg"),
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge className="mb-3 border-[#b9d8c5] bg-[#edf8f0] text-[#245d36] hover:bg-[#edf8f0]">
            {current.business.name}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-normal">Клиенти</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69655e] sm:text-base">
            Всички контакти, създадени от заявки и ръчни часове за този бизнес.
          </p>
        </div>
        <Button asChild className="bg-[#16372f] text-white hover:bg-[#214b42]">
          <Link href="/dashboard/appointments/new">
            <CalendarPlus className="size-4" />
            Създай час
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
            Търси по име, телефон или имейл и ограничи списъка по източник.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <form
            action="/dashboard/clients"
            className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto]"
          >
            <div className="space-y-2">
              <Label htmlFor="q">Търсене</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a8176]" />
                <Input
                  id="q"
                  name="q"
                  defaultValue={searchTerm}
                  placeholder="Име, телефон или имейл"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Източник</Label>
              <select
                id="source"
                name="source"
                defaultValue={selectedSource}
                className={selectClassName()}
              >
                <option value="">Всички</option>
                {sourceOptions.map((source) => (
                  <option key={source} value={source}>
                    {formatCustomerSource(source)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointments">Часове</Label>
              <select
                id="appointments"
                name="appointments"
                defaultValue={appointmentFilter}
                className={selectClassName()}
              >
                <option value="">Всички</option>
                <option value="with">Имат часове</option>
                <option value="without">Без часове</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="created">Създадени</Label>
              <select
                id="created"
                name="created"
                defaultValue={recentOnly ? "recent" : ""}
                className={selectClassName()}
              >
                <option value="">Всички</option>
                <option value="recent">Този месец</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit" className="bg-[#16372f] text-white hover:bg-[#214b42]">
                Филтрирай
              </Button>
              <Button asChild variant="outline" className="border-[#d8d0c2] bg-white">
                <Link href="/dashboard/clients">Изчисти</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-[#ded7c8] bg-[#fbfaf6]">
        <CardHeader className="border-b border-[#ece4d7]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Списък с клиенти</CardTitle>
              <CardDescription>
                {clients.length === 1
                  ? "1 клиент в текущия изглед"
                  : `${clients.length} клиента в текущия изглед`}
              </CardDescription>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-[#d8d0c2] bg-white"
            >
              <Link href="/dashboard/leads">Виж заявките</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {clients.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#d6cbbb] bg-white px-4 py-12 text-center">
              <UsersRound className="mx-auto size-10 text-[#a84b32]" />
              <h2 className="mt-4 text-xl font-semibold">
                Все още нямате клиенти.
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#69655e]">
                Клиентите ще се появят тук след първите заявки или ръчно
                създадени часове.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                <Button
                  asChild
                  className="bg-[#16372f] text-white hover:bg-[#214b42]"
                >
                  <Link href="/dashboard/leads">Виж заявките</Link>
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
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#e2dbcf]">
                    <TableHead>Клиент</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Имейл</TableHead>
                    <TableHead>Източник</TableHead>
                    <TableHead>Запитвания</TableHead>
                    <TableHead>Часове</TableHead>
                    <TableHead>Последен час</TableHead>
                    <TableHead>Създаден</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id} className="border-[#e8e0d4]">
                      <TableCell className="min-w-48 whitespace-normal">
                        <div className="flex items-center gap-2">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e8efe9] text-xs font-semibold text-[#16372f]">
                            {client.full_name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="font-medium">{client.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-36 text-[#575048]">
                        {client.phone ?? "Няма телефон"}
                      </TableCell>
                      <TableCell className="min-w-44 break-all text-[#575048]">
                        {client.email ?? "Няма имейл"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-[#d8d0c2]">
                          {formatCustomerSource(client.source)}
                        </Badge>
                      </TableCell>
                      <TableCell>{client.totalLeads}</TableCell>
                      <TableCell>{client.totalAppointments}</TableCell>
                      <TableCell className="min-w-36 text-[#575048]">
                        {client.lastAppointmentDate
                          ? formatCustomerDate(client.lastAppointmentDate)
                          : "Няма"}
                      </TableCell>
                      <TableCell className="min-w-36 text-[#575048]">
                        {formatCustomerDateTime(client.created_at)}
                      </TableCell>
                      <TableCell className="min-w-56 text-right">
                        <div className="flex flex-col justify-end gap-2 sm:flex-row">
                          <Button
                            asChild
                            variant="outline"
                            className="border-[#d8d0c2] bg-white"
                          >
                            <Link href={`/dashboard/clients/${client.id}`}>
                              <Eye className="size-4" />
                              Детайли
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            className="border-[#d8d0c2] bg-white"
                          >
                            <Link
                              href={`/dashboard/appointments/new?customerId=${client.id}`}
                            >
                              <CalendarPlus className="size-4" />
                              Час
                            </Link>
                          </Button>
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[#ded7c8] bg-white">
          <CardContent className="flex items-center gap-3 p-4">
            <UserRound className="size-8 text-[#a84b32]" />
            <div>
              <p className="text-2xl font-semibold">{clients.length}</p>
              <p className="text-sm text-[#69655e]">клиента в изгледа</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
