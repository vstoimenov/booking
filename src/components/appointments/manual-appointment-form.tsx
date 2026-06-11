"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";

import {
  createManualAppointment,
  type ManualAppointmentFormState,
} from "@/app/(dashboard)/dashboard/appointments/actions";
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
  formatAppointmentRange,
  formatAppointmentTime,
} from "@/lib/appointments/format";
import { formatDuration, formatPrice } from "@/lib/services/format";
import { cn } from "@/lib/utils";

export type ManualAppointmentCustomerOption = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
};

export type ManualAppointmentServiceOption = {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
};

export type ManualAppointmentOverlapOption = {
  id: string;
  startsAt: string;
  endsAt: string;
  customerName: string | null;
  serviceName: string | null;
};

type ManualAppointmentFormProps = {
  customers: ManualAppointmentCustomerOption[];
  services: ManualAppointmentServiceOption[];
  appointmentsForOverlap: ManualAppointmentOverlapOption[];
  initialCustomerId?: string;
};

const initialState: ManualAppointmentFormState = {
  status: "idle",
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-[#a33b26]">{message}</p>;
}

function selectClassName() {
  return "h-9 w-full rounded-lg border border-[#d8d0c2] bg-white px-3 text-sm outline-none focus-visible:border-[#16372f] focus-visible:ring-2 focus-visible:ring-[#16372f]/20 disabled:cursor-not-allowed disabled:opacity-50";
}

function buildLocalDate(date: string, time: string) {
  const parsed = new Date(`${date}T${time}:00`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function ManualAppointmentForm({
  customers,
  services,
  appointmentsForOverlap,
  initialCustomerId = "",
}: ManualAppointmentFormProps) {
  const [state, formAction, isPending] = useActionState(
    createManualAppointment,
    initialState,
  );
  const firstService = services[0] ?? null;
  const initialCustomerExists = customers.some(
    (customer) => customer.id === initialCustomerId,
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    initialCustomerExists ? initialCustomerId : "",
  );
  const [selectedServiceId, setSelectedServiceId] = useState(firstService?.id ?? "");
  const [date, setDate] = useState(todayIsoDate());
  const [startTime, setStartTime] = useState("09:00");
  const [durationMinutes, setDurationMinutes] = useState(
    firstService?.durationMinutes ?? 60,
  );
  const selectedService = services.find((service) => service.id === selectedServiceId);
  const hasExistingCustomer = Boolean(selectedCustomerId);

  const overlappingAppointments = useMemo(() => {
    const startsAt = buildLocalDate(date, startTime);

    if (!startsAt || !Number.isInteger(durationMinutes) || durationMinutes <= 0) {
      return [];
    }

    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

    return appointmentsForOverlap.filter((appointment) => {
      const existingStartsAt = new Date(appointment.startsAt);
      const existingEndsAt = new Date(appointment.endsAt);

      return startsAt < existingEndsAt && endsAt > existingStartsAt;
    });
  }, [appointmentsForOverlap, date, durationMinutes, startTime]);

  return (
    <Card className="border-[#ded7c8] bg-[#fbfaf6]">
      <CardHeader className="border-b border-[#ece4d7]">
        <CardTitle className="text-2xl">Нов час</CardTitle>
        <CardDescription>
          Създай час ръчно, без да е задължително да има запитване.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {state.message ? (
          <div className="mb-5 rounded-lg border border-[#efb3a5] bg-[#fff1ed] px-3 py-3 text-sm text-[#9d321d]">
            {state.message}
          </div>
        ) : null}

        {overlappingAppointments.length > 0 ? (
          <div className="mb-5 rounded-lg border border-[#dfc8a2] bg-[#fff6e6] p-4 text-sm text-[#7a4f12]">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">Има застъпване с друг час.</p>
                <p className="mt-1 leading-6">
                  Можеш да продължиш, но провери дали е умишлено.
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {overlappingAppointments.slice(0, 3).map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-md border border-[#e6d0a8] bg-white px-3 py-2"
                >
                  <p className="font-medium">
                    {formatAppointmentRange(appointment.startsAt, appointment.endsAt)}
                  </p>
                  <p className="mt-1 text-xs">
                    {appointment.customerName ?? "Клиент"} ·{" "}
                    {appointment.serviceName ?? "Услуга"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <form action={formAction} className="space-y-6">
          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="space-y-4 rounded-lg border border-[#e6ded1] bg-white p-4">
              <div>
                <h2 className="font-semibold">Клиент</h2>
                <p className="mt-1 text-sm text-[#69655e]">
                  Избери съществуващ клиент или попълни бърз нов клиент.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerId">Съществуващ клиент</Label>
                <select
                  id="customerId"
                  name="customerId"
                  value={selectedCustomerId}
                  onChange={(event) => setSelectedCustomerId(event.target.value)}
                  className={selectClassName()}
                >
                  <option value="">Нов клиент</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.fullName}
                      {customer.phone ? ` · ${customer.phone}` : ""}
                    </option>
                  ))}
                </select>
                <FieldError message={state.fieldErrors?.customerId} />
              </div>

              <div
                className={cn(
                  "grid gap-4 sm:grid-cols-2",
                  hasExistingCustomer && "opacity-50",
                )}
              >
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="customerName">Име на нов клиент</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    placeholder="Име и фамилия"
                    maxLength={120}
                    disabled={hasExistingCustomer}
                  />
                  <FieldError message={state.fieldErrors?.customerName} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Телефон</Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    placeholder="+359..."
                    maxLength={40}
                    disabled={hasExistingCustomer}
                  />
                  <FieldError message={state.fieldErrors?.customerPhone} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Имейл</Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    placeholder="client@example.com"
                    maxLength={160}
                    disabled={hasExistingCustomer}
                  />
                  <FieldError message={state.fieldErrors?.customerEmail} />
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-lg border border-[#e6ded1] bg-white p-4">
              <div>
                <h2 className="font-semibold">Час</h2>
                <p className="mt-1 text-sm text-[#69655e]">
                  Услугата попълва продължителността автоматично, но можеш да я
                  коригираш.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceId">Услуга</Label>
                <select
                  id="serviceId"
                  name="serviceId"
                  value={selectedServiceId}
                  required
                  onChange={(event) => {
                    const nextService = services.find(
                      (service) => service.id === event.target.value,
                    );

                    setSelectedServiceId(event.target.value);

                    if (nextService) {
                      setDurationMinutes(nextService.durationMinutes);
                    }
                  }}
                  className={selectClassName()}
                >
                  {services.length === 0 ? (
                    <option value="">Няма услуги</option>
                  ) : null}
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} · {formatDuration(service.durationMinutes)} ·{" "}
                      {formatPrice(service.priceCents, service.currency)}
                    </option>
                  ))}
                </select>
                <FieldError message={state.fieldErrors?.serviceId} />
              </div>

              {selectedService ? (
                <p className="rounded-md border border-[#e6ded1] bg-[#fbfaf6] px-3 py-2 text-sm text-[#575048]">
                  Избрана услуга: {selectedService.name},{" "}
                  {formatDuration(selectedService.durationMinutes)}.
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="date">Дата</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    required
                  />
                  <FieldError message={state.fieldErrors?.date} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Начало</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    required
                  />
                  <FieldError message={state.fieldErrors?.startTime} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Минути</Label>
                  <Input
                    id="durationMinutes"
                    name="durationMinutes"
                    type="number"
                    min={1}
                    max={720}
                    step={1}
                    value={durationMinutes}
                    onChange={(event) =>
                      setDurationMinutes(Number(event.target.value))
                    }
                    required
                  />
                  <FieldError message={state.fieldErrors?.durationMinutes} />
                </div>
              </div>

              <p className="text-sm text-[#69655e]">
                Край:{" "}
                <span className="font-medium text-[#171412]">
                  {(() => {
                    const startsAt = buildLocalDate(date, startTime);

                    if (!startsAt || !Number.isFinite(durationMinutes)) {
                      return "Не е изчислен";
                    }

                    const endsAt = new Date(
                      startsAt.getTime() + durationMinutes * 60_000,
                    );

                    return formatAppointmentTime(endsAt.toISOString());
                  })()}
                </span>
              </p>

              <div className="space-y-2">
                <Label htmlFor="notes">Бележки</Label>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Вътрешна бележка за часа."
                  maxLength={1000}
                  className="min-h-28 w-full resize-y rounded-md border border-[#d9d2c5] bg-white px-3 py-2 text-sm outline-none focus-visible:border-[#16372f] focus-visible:ring-2 focus-visible:ring-[#16372f]/20"
                />
                <FieldError message={state.fieldErrors?.notes} />
              </div>
            </section>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#ece4d7] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button asChild variant="outline" className="border-[#d8d0c2] bg-white">
              <Link href="/dashboard/appointments">Назад</Link>
            </Button>
            <Button
              type="submit"
              disabled={isPending || services.length === 0}
              className="bg-[#16372f] text-white hover:bg-[#214b42]"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Създаване...
                </>
              ) : (
                "Създай час"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
