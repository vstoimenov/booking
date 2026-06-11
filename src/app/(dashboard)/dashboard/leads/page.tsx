import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  CalendarPlus,
  DatabaseZap,
  Eye,
  Filter,
  Search,
  UsersRound,
} from "lucide-react";

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
  formatCreatedAt,
  formatLeadDateTime,
  formatSource,
  isLeadStatus,
  leadSourceLabels,
  leadStatusBadgeClassNames,
  leadStatusLabels,
  leadStatuses,
  relationValue,
  type LeadStatus,
} from "@/lib/leads/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LeadsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type ServiceFilterRow = {
  id: string;
  name: string;
};

type SourceRow = {
  source: string;
};

type CustomerSearchRow = {
  id: string;
};

type LeadRow = {
  id: string;
  status: LeadStatus;
  source: string;
  priority: string;
  preferred_date: string | null;
  preferred_time: string | null;
  message: string | null;
  created_at: string;
  customer: {
    full_name: string;
    email: string | null;
    phone: string | null;
  } | null;
  service: {
    id: string;
    name: string;
  } | null;
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

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function cleanSearchTerm(value: string) {
  return value.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
}

function selectClassName() {
  return "h-9 w-full rounded-lg border border-[#d8d0c2] bg-white px-3 text-sm outline-none focus-visible:border-[#16372f] focus-visible:ring-2 focus-visible:ring-[#16372f]/20";
}

function LeadsError({ message }: { message: string }) {
  return (
    <Card className="border-[#efb3a5] bg-[#fff7f4]">
      <CardHeader>
        <CardTitle>Не успяхме да заредим запитванията</CardTitle>
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

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect("/login?next=/dashboard/leads");
    }

    if (current.reason === "missing_business") {
      redirect("/onboarding");
    }

    return <LeadsError message={current.message} />;
  }

  const params = await searchParams;
  const statusParam = cleanParam(params.status);
  const serviceParam = cleanParam(params.service);
  const sourceParam = cleanParam(params.source);
  const fromParam = cleanParam(params.from);
  const toParam = cleanParam(params.to);
  const qParam = cleanParam(params.q);
  const selectedStatus = isLeadStatus(statusParam) ? statusParam : "";
  const selectedService = isUuid(serviceParam) ? serviceParam : "";
  const selectedSource = sourceParam.length <= 80 ? sourceParam : "";
  const selectedFrom = isIsoDate(fromParam) ? fromParam : "";
  const selectedTo = isIsoDate(toParam) ? toParam : "";
  const searchTerm = cleanSearchTerm(qParam);
  const supabase = await createClient();

  const [servicesResult, sourcesResult] = await Promise.all([
    supabase
      .from("services")
      .select("id, name")
      .eq("business_id", current.business.id)
      .order("name", { ascending: true }),
    supabase
      .from("leads")
      .select("source")
      .eq("business_id", current.business.id)
      .order("source", { ascending: true })
      .limit(500),
  ]);

  const setupError = servicesResult.error ?? sourcesResult.error;

  if (setupError) {
    return <LeadsError message={setupError.message} />;
  }

  const services = (servicesResult.data ?? []) as ServiceFilterRow[];
  const sourceRows = (sourcesResult.data ?? []) as SourceRow[];
  const sourceOptions = Array.from(
    new Set([
      ...sourceRows.map((row) => row.source),
      ...(selectedSource ? [selectedSource] : []),
    ]),
  ).sort((a, b) => formatSource(a).localeCompare(formatSource(b), "bg"));

  let customerIds: string[] | null = null;

  if (searchTerm) {
    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("id")
      .eq("business_id", current.business.id)
      .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      .limit(200);

    if (customersError) {
      return <LeadsError message={customersError.message} />;
    }

    customerIds = ((customers ?? []) as CustomerSearchRow[]).map(
      (customer) => customer.id,
    );
  }

  let leads: LeadRow[] = [];

  if (!customerIds || customerIds.length > 0) {
    let query = supabase
      .from("leads")
      .select(
        "id, status, source, priority, preferred_date, preferred_time, message, created_at, customer:customers(full_name, email, phone), service:services(id, name)",
      )
      .eq("business_id", current.business.id);

    if (selectedStatus) {
      query = query.eq("status", selectedStatus);
    }

    if (selectedService) {
      query = query.eq("service_id", selectedService);
    }

    if (selectedSource) {
      query = query.eq("source", selectedSource);
    }

    if (selectedFrom) {
      query = query.gte("preferred_date", selectedFrom);
    }

    if (selectedTo) {
      query = query.lte("preferred_date", selectedTo);
    }

    if (customerIds) {
      query = query.in("customer_id", customerIds);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return <LeadsError message={error.message} />;
    }

    leads = ((data ?? []) as Array<
      Omit<LeadRow, "customer" | "service"> & {
        customer?: LeadRow["customer"] | LeadRow["customer"][];
        service?: LeadRow["service"] | LeadRow["service"][];
      }
    >).map((lead) => ({
      ...lead,
      status: isLeadStatus(lead.status) ? lead.status : "new",
      customer: relationValue(lead.customer),
      service: relationValue(lead.service),
    }));
  }

  const hasFilters = Boolean(
    selectedStatus ||
      selectedService ||
      selectedSource ||
      selectedFrom ||
      selectedTo ||
      searchTerm,
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Badge className="mb-3 border-[#b9d8c5] bg-[#edf8f0] text-[#245d36] hover:bg-[#edf8f0]">
            {current.business.name}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-normal">Запитвания</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69655e] sm:text-base">
            Управлявай входящите заявки от публичната страница и ги превръщай в
            реални часове.
          </p>
        </div>
        <Button asChild className="bg-[#16372f] text-white hover:bg-[#214b42]">
          <Link href={`/b/${current.business.publicSlug}`} target="_blank">
            <CalendarClock className="size-4" />
            Виж booking страницата
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
            Търси по име или телефон и ограничи резултатите по статус, услуга,
            дата и източник.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <form
            action="/dashboard/leads"
            className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.9fr_0.9fr_0.7fr_0.7fr_auto]"
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
                {leadStatuses.map((status) => (
                  <option key={status} value={status}>
                    {leadStatusLabels[status]}
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
                    {leadSourceLabels[source] ?? formatSource(source)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from">От дата</Label>
              <Input id="from" name="from" type="date" defaultValue={selectedFrom} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to">До дата</Label>
              <Input id="to" name="to" type="date" defaultValue={selectedTo} />
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit" className="bg-[#16372f] text-white hover:bg-[#214b42]">
                Филтрирай
              </Button>
              {hasFilters ? (
                <Button
                  asChild
                  variant="outline"
                  className="border-[#d8d0c2] bg-white"
                >
                  <Link href="/dashboard/leads">Изчисти</Link>
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
              <CardTitle>Lead CRM</CardTitle>
              <CardDescription>
                {leads.length === 1
                  ? "1 запитване в текущия изглед"
                  : `${leads.length} запитвания в текущия изглед`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {leads.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#d6cbbb] bg-white px-4 py-12 text-center">
              <UsersRound className="mx-auto size-10 text-[#a84b32]" />
              <h2 className="mt-4 text-xl font-semibold">
                Няма намерени запитвания.
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#69655e]">
                Новите заявки от публичната booking страница ще се появяват тук.
                Ако си приложил филтри, пробвай да ги изчистиш.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                {hasFilters ? (
                  <Button
                    asChild
                    variant="outline"
                    className="border-[#d8d0c2] bg-white"
                  >
                    <Link href="/dashboard/leads">Изчисти филтрите</Link>
                  </Button>
                ) : null}
                <Button
                  asChild
                  className="bg-[#16372f] text-white hover:bg-[#214b42]"
                >
                  <Link href={`/b/${current.business.publicSlug}`} target="_blank">
                    <CalendarClock className="size-4" />
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
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#e2dbcf]">
                    <TableHead>Клиент</TableHead>
                    <TableHead>Услуга</TableHead>
                    <TableHead>Предпочитан час</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Източник</TableHead>
                    <TableHead>Създадено</TableHead>
                    <TableHead className="min-w-72 text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id} className="border-[#e8e0d4]">
                      <TableCell className="min-w-56 whitespace-normal">
                        <div className="font-medium">
                          {lead.customer?.full_name ?? "Клиент без име"}
                        </div>
                        <div className="text-xs leading-5 text-[#69655e]">
                          {lead.customer?.phone ?? "Няма телефон"}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-44 whitespace-normal">
                        {lead.service?.name ?? "Без избрана услуга"}
                      </TableCell>
                      <TableCell className="min-w-40 whitespace-normal text-[#575048]">
                        {formatLeadDateTime(
                          lead.preferred_date,
                          lead.preferred_time,
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell className="min-w-32 text-[#575048]">
                        {formatSource(lead.source)}
                      </TableCell>
                      <TableCell className="min-w-40 text-[#69655e]">
                        {formatCreatedAt(lead.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-72 flex-col gap-2 sm:flex-row sm:justify-end">
                          <Button
                            asChild
                            variant="outline"
                            className="border-[#d8d0c2] bg-white"
                          >
                            <Link href={`/dashboard/leads/${lead.id}`}>
                              <Eye className="size-4" />
                              Детайли
                            </Link>
                          </Button>
                          {lead.status !== "contacted" ? (
                            <LeadStatusButton
                              leadId={lead.id}
                              status="contacted"
                              label="Свързан"
                            />
                          ) : null}
                          {lead.status !== "cancelled" ? (
                            <LeadStatusButton
                              leadId={lead.id}
                              status="cancelled"
                              label="Откажи"
                              variant="destructive"
                            />
                          ) : null}
                          <Button
                            asChild
                            variant="outline"
                            className="border-[#d8d0c2] bg-white"
                          >
                            <Link href={`/dashboard/leads/${lead.id}#appointment`}>
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
    </div>
  );
}
