import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarPlus,
  CircleSlash,
  Edit3,
  Mail,
  Phone,
  UserRound,
  UsersRound,
} from "lucide-react";

import { ContextualMessageCard } from "@/components/automations/contextual-message-card";
import { ClientEditForm } from "@/components/clients/client-edit-form";
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
  appointmentStatusBadgeClassNames,
  appointmentStatusLabels,
  formatAppointmentRange,
  isAppointmentStatus,
} from "@/lib/appointments/format";
import {
  buildContextualAutomationMessages,
  type AutomationTemplateForRender,
} from "@/lib/automations/contextual";
import { leadStatusLabels } from "@/lib/business/labels";
import { getCurrentUserBusiness } from "@/lib/business/current";
import {
  formatCustomerDateTime,
  formatCustomerSource,
  isUuid,
  relationValue,
} from "@/lib/customers/format";
import {
  formatLeadDateTime,
  isLeadStatus,
  leadStatusBadgeClassNames,
} from "@/lib/leads/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ClientDetailsPageProps = {
  params: Promise<{ clientId: string }>;
};

type CustomerDetailsRow = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  source: string;
  created_at: string;
};

type LeadHistoryRow = {
  id: string;
  status: string;
  preferred_date: string | null;
  preferred_time: string | null;
  created_at: string;
  service: {
    name: string;
  } | null;
};

type AppointmentHistoryRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  created_at: string;
  service: {
    name: string;
  } | null;
};

function ClientDetailsError({ message }: { message: string }) {
  return (
    <Card className="border-[#efb3a5] bg-[#fff7f4]">
      <CardHeader>
        <CardTitle>Не успяхме да заредим клиента</CardTitle>
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

function AppointmentStatusBadge({ status }: { status: string }) {
  const safeStatus = isAppointmentStatus(status) ? status : "scheduled";

  return (
    <Badge
      variant="outline"
      className={
        appointmentStatusBadgeClassNames[safeStatus] ?? "border-[#d8d0c2]"
      }
    >
      {appointmentStatusLabels[safeStatus] ?? status}
    </Badge>
  );
}

export default async function ClientDetailsPage({
  params,
}: ClientDetailsPageProps) {
  const { clientId } = await params;

  if (!isUuid(clientId)) {
    notFound();
  }

  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect(`/login?next=/dashboard/clients/${clientId}`);
    }

    if (current.reason === "missing_business") {
      redirect("/onboarding");
    }

    return <ClientDetailsError message={current.message} />;
  }

  const supabase = await createClient();
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, full_name, phone, email, notes, source, created_at")
    .eq("id", clientId)
    .eq("business_id", current.business.id)
    .maybeSingle<CustomerDetailsRow>();

  if (customerError) {
    return <ClientDetailsError message={customerError.message} />;
  }

  if (!customer) {
    notFound();
  }

  const [leadsResult, appointmentsResult, templatesResult] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, status, preferred_date, preferred_time, created_at, service:services(name)",
      )
      .eq("business_id", current.business.id)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("appointments")
      .select(
        "id, starts_at, ends_at, status, notes, created_at, service:services(name)",
      )
      .eq("business_id", current.business.id)
      .eq("customer_id", customer.id)
      .order("starts_at", { ascending: false })
      .limit(100),
    supabase
      .from("automation_templates")
      .select("id, type, name, body, is_active")
      .eq("business_id", current.business.id)
      .eq("scope", "business")
      .eq("type", "client_reactivation")
      .limit(5),
  ]);

  const relatedError =
    leadsResult.error ?? appointmentsResult.error ?? templatesResult.error;

  if (relatedError) {
    return <ClientDetailsError message={relatedError.message} />;
  }

  const leads = ((leadsResult.data ?? []) as Array<
    Omit<LeadHistoryRow, "service"> & {
      service?: LeadHistoryRow["service"] | LeadHistoryRow["service"][];
    }
  >).map((lead) => ({
    ...lead,
    service: relationValue(lead.service),
  }));
  const appointments = ((appointmentsResult.data ?? []) as Array<
    Omit<AppointmentHistoryRow, "service"> & {
      service?:
        | AppointmentHistoryRow["service"]
        | AppointmentHistoryRow["service"][];
    }
  >).map((appointment) => ({
    ...appointment,
    service: relationValue(appointment.service),
  }));
  const templates = (templatesResult.data ?? []) as AutomationTemplateForRender[];
  const lastServiceName =
    appointments.find((appointment) => appointment.service?.name)?.service?.name ??
    leads.find((lead) => lead.service?.name)?.service?.name ??
    "услугата";
  const automationMessages = buildContextualAutomationMessages(
    templates,
    ["client_reactivation"],
    {
      customer_name: customer.full_name,
      business_name: current.business.name,
      service_name: lastServiceName,
      google_review_url: "Добавете Google review линк",
    },
  );

  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === "completed",
  ).length;
  const cancelledOrNoShowAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "cancelled" || appointment.status === "no_show",
  ).length;
  const metrics = [
    {
      label: "Запитвания",
      value: leads.length,
      icon: UsersRound,
    },
    {
      label: "Всички часове",
      value: appointments.length,
      icon: CalendarPlus,
    },
    {
      label: "Завършени",
      value: completedAppointments,
      icon: CalendarCheck,
    },
    {
      label: "Отказани / неявени",
      value: cancelledOrNoShowAppointments,
      icon: CircleSlash,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Button
            asChild
            variant="ghost"
            className="mb-3 justify-start px-0 text-[#575048] hover:bg-transparent"
          >
            <Link href="/dashboard/clients">
              <ArrowLeft className="size-4" />
              Обратно към клиентите
            </Link>
          </Button>
          <Badge className="mb-3 border-[#b9d8c5] bg-[#edf8f0] text-[#245d36] hover:bg-[#edf8f0]">
            {formatCustomerSource(customer.source)}
          </Badge>
          <h1 className="break-words text-3xl font-semibold tracking-normal sm:text-4xl">
            {customer.full_name}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#69655e]">
            Създаден: {formatCustomerDateTime(customer.created_at)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            asChild
            variant="outline"
            className="justify-start border-[#d8d0c2] bg-white"
          >
            <Link href="#edit">
              <Edit3 className="size-4" />
              Редактирай
            </Link>
          </Button>
          <Button asChild className="justify-start bg-[#16372f] text-white hover:bg-[#214b42]">
            <Link href={`/dashboard/appointments/new?customerId=${customer.id}`}>
              <CalendarPlus className="size-4" />
              Създай час
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <Card className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader className="border-b border-[#ece4d7]">
              <CardTitle>Контакти</CardTitle>
              <CardDescription>Основна информация за клиента.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="flex items-start gap-3 rounded-lg border border-[#e6ded1] bg-white p-4">
                <UserRound className="mt-0.5 size-5 text-[#a84b32]" />
                <div>
                  <p className="text-xs uppercase text-[#8a8176]">Име</p>
                  <p className="mt-1 font-medium">{customer.full_name}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-lg border border-[#e6ded1] bg-white p-4">
                  <Phone className="size-5 text-[#a84b32]" />
                  <p className="mt-3 text-xs uppercase text-[#8a8176]">
                    Телефон
                  </p>
                  <p className="mt-1 break-all font-medium">
                    {customer.phone ?? "Не е посочен"}
                  </p>
                </div>
                <div className="rounded-lg border border-[#e6ded1] bg-white p-4">
                  <Mail className="size-5 text-[#a84b32]" />
                  <p className="mt-3 text-xs uppercase text-[#8a8176]">Имейл</p>
                  <p className="mt-1 break-all font-medium">
                    {customer.email ?? "Не е посочен"}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-[#e6ded1] bg-white p-4">
                <p className="text-xs uppercase text-[#8a8176]">Бележки</p>
                <p className="mt-2 text-sm leading-6 text-[#575048]">
                  {customer.notes || "Няма добавени бележки."}
                </p>
              </div>
            </CardContent>
          </Card>

          <ClientEditForm
            clientId={customer.id}
            initialValues={{
              fullName: customer.full_name,
              phone: customer.phone ?? "",
              email: customer.email ?? "",
              notes: customer.notes ?? "",
              source: customer.source,
            }}
          />

          <ContextualMessageCard
            title="Реактивация"
            description="Съобщение за клиент, който не е идвал скоро."
            messages={automationMessages}
            emptyText="Няма активен шаблон за реактивация на клиент."
          />
        </div>

        <div className="space-y-6">
          <Card className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader className="border-b border-[#ece4d7]">
              <CardTitle>История на запитванията</CardTitle>
              <CardDescription>
                Всички заявки, свързани с този клиент.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {leads.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#e2dbcf]">
                        <TableHead>Услуга</TableHead>
                        <TableHead>Желан час</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Създадено</TableHead>
                        <TableHead className="text-right">Действие</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id} className="border-[#e8e0d4]">
                          <TableCell className="min-w-40 whitespace-normal">
                            {lead.service?.name ?? "Без услуга"}
                          </TableCell>
                          <TableCell className="min-w-40 text-[#575048]">
                            {formatLeadDateTime(
                              lead.preferred_date,
                              lead.preferred_time,
                            )}
                          </TableCell>
                          <TableCell>
                            <LeadStatusBadge status={lead.status} />
                          </TableCell>
                          <TableCell className="min-w-36 text-[#575048]">
                            {formatCustomerDateTime(lead.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              asChild
                              variant="outline"
                              className="border-[#d8d0c2] bg-white"
                            >
                              <Link href={`/dashboard/leads/${lead.id}`}>
                                Детайли
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[#d6cbbb] bg-white px-4 py-10 text-center">
                  <UsersRound className="mx-auto size-8 text-[#a84b32]" />
                  <p className="mt-3 font-medium">Няма запитвания.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader className="border-b border-[#ece4d7]">
              <CardTitle>История на часовете</CardTitle>
              <CardDescription>
                Посещения и бъдещи часове за този клиент.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {appointments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#e2dbcf]">
                        <TableHead>Дата и час</TableHead>
                        <TableHead>Услуга</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Бележки</TableHead>
                        <TableHead className="text-right">Действие</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((appointment) => (
                        <TableRow
                          key={appointment.id}
                          className="border-[#e8e0d4]"
                        >
                          <TableCell className="min-w-48 font-medium">
                            {formatAppointmentRange(
                              appointment.starts_at,
                              appointment.ends_at,
                            )}
                          </TableCell>
                          <TableCell className="min-w-40 whitespace-normal text-[#575048]">
                            {appointment.service?.name ?? "Без услуга"}
                          </TableCell>
                          <TableCell>
                            <AppointmentStatusBadge status={appointment.status} />
                          </TableCell>
                          <TableCell className="min-w-48 whitespace-normal text-[#575048]">
                            {appointment.notes
                              ? appointment.notes.length > 80
                                ? `${appointment.notes.slice(0, 80)}...`
                                : appointment.notes
                              : "Няма"}
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
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[#d6cbbb] bg-white px-4 py-10 text-center">
                  <CalendarPlus className="mx-auto size-8 text-[#a84b32]" />
                  <p className="mt-3 font-medium">Няма създадени часове.</p>
                  <Button
                    asChild
                    className="mt-5 bg-[#16372f] text-white hover:bg-[#214b42]"
                  >
                    <Link href={`/dashboard/appointments/new?customerId=${customer.id}`}>
                      Създай час
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
