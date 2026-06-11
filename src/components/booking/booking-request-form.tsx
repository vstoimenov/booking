"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import type { BookingRequestState } from "@/app/b/[slug]/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDuration, formatPrice } from "@/lib/services/format";

export type BookingServiceOption = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  currency: string;
};

type BookingRequestFormProps = {
  services: BookingServiceOption[];
  brandColor: string;
  tracking?: {
    source: string;
    medium: string;
    campaign: string;
  };
  action: (
    previousState: BookingRequestState,
    formData: FormData,
  ) => Promise<BookingRequestState>;
};

const initialState: BookingRequestState = {
  status: "idle",
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-[#a33b26]">{message}</p>;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function BookingRequestForm({
  services,
  brandColor,
  tracking,
  action,
}: BookingRequestFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-[#b9d8c5] bg-[#f3fbf5] p-6 shadow-sm">
        <div
          className="flex size-12 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: brandColor }}
        >
          <CheckCircle2 className="size-6" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold">
          Благодарим! Заявката ви беше изпратена успешно.
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#52635a]">
          Екипът ще я прегледа и ще се свърже с вас за потвърждение на деня и
          часа.
        </p>
        <p className="mt-4 rounded-lg border border-[#cfe6d4] bg-white/70 px-3 py-3 text-sm leading-6 text-[#52635a]">
          Можете спокойно да затворите страницата. Ако има нужда от уточнение,
          бизнесът ще се свърже на посочения телефон.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#ded7c8] bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge className="border-[#ead2a9] bg-[#fff7e8] text-[#8a5a20] hover:bg-[#fff7e8]">
            Заявка за час
          </Badge>
          <h2 className="mt-4 text-2xl font-semibold">Запазете час</h2>
          <p className="mt-2 text-sm leading-6 text-[#69655e]">
            Попълнете данните си и екипът ще потвърди точния час.
          </p>
        </div>
      </div>

      {state.message ? (
        <div className="mt-5 rounded-lg border border-[#efb3a5] bg-[#fff1ed] px-3 py-3 text-sm text-[#9d321d]">
          {state.message}
        </div>
      ) : null}

      <form action={formAction} className="mt-6 space-y-5">
        <div className="hidden" aria-hidden="true">
          <Label htmlFor="companyWebsite">Уебсайт</Label>
          <Input
            id="companyWebsite"
            name="companyWebsite"
            tabIndex={-1}
            autoComplete="off"
          />
          <input type="hidden" name="utmSource" value={tracking?.source ?? ""} />
          <input type="hidden" name="utmMedium" value={tracking?.medium ?? ""} />
          <input
            type="hidden"
            name="utmCampaign"
            value={tracking?.campaign ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="serviceId">Услуга</Label>
          <select
            id="serviceId"
            name="serviceId"
            required
            defaultValue=""
            className="h-11 w-full rounded-lg border border-[#d9d2c5] bg-white px-3 text-sm outline-none focus-visible:border-[#16372f] focus-visible:ring-2 focus-visible:ring-[#16372f]/20"
          >
            <option value="" disabled>
              Изберете услуга
            </option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} · {formatDuration(service.durationMinutes)} ·{" "}
                {formatPrice(service.priceCents, service.currency)}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors?.serviceId} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Име и фамилия</Label>
            <Input
              id="fullName"
              name="fullName"
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              className="h-11 bg-white"
            />
            <FieldError message={state.fieldErrors?.fullName} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              maxLength={40}
              autoComplete="tel"
              className="h-11 bg-white"
            />
            <FieldError message={state.fieldErrors?.phone} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Имейл</Label>
          <Input
            id="email"
            name="email"
            type="email"
            maxLength={160}
            autoComplete="email"
            placeholder="по желание"
            className="h-11 bg-white"
          />
          <FieldError message={state.fieldErrors?.email} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="preferredDate">Предпочитана дата</Label>
            <Input
              id="preferredDate"
              name="preferredDate"
              type="date"
              required
              min={todayIsoDate()}
              className="h-11 bg-white"
            />
            <FieldError message={state.fieldErrors?.preferredDate} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredTime">Предпочитан час</Label>
            <Input
              id="preferredTime"
              name="preferredTime"
              type="time"
              className="h-11 bg-white"
            />
            <FieldError message={state.fieldErrors?.preferredTime} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Съобщение</Label>
          <textarea
            id="message"
            name="message"
            maxLength={1000}
            placeholder="Кратка бележка към заявката"
            className="min-h-28 w-full resize-y rounded-lg border border-[#d9d2c5] bg-white px-3 py-2 text-sm outline-none focus-visible:border-[#16372f] focus-visible:ring-2 focus-visible:ring-[#16372f]/20"
          />
          <FieldError message={state.fieldErrors?.message} />
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="h-12 w-full text-white hover:opacity-90"
          style={{ backgroundColor: brandColor }}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Изпращане...
            </>
          ) : (
            <>
              <Send className="size-4" />
              Изпрати заявка
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
