"use client";

import { useActionState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

import {
  createAppointmentFromLead,
  type AppointmentFormState,
} from "@/app/(dashboard)/dashboard/leads/actions";
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

type CreateAppointmentFormProps = {
  leadId: string;
  defaultDate?: string | null;
  defaultTime?: string | null;
  defaultDurationMinutes: number;
  disabledReason?: string;
};

const initialState: AppointmentFormState = {
  status: "idle",
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeTime(value?: string | null) {
  if (value && /^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  return "09:00";
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-[#a33b26]">{message}</p>;
}

export function CreateAppointmentForm({
  leadId,
  defaultDate,
  defaultTime,
  defaultDurationMinutes,
  disabledReason,
}: CreateAppointmentFormProps) {
  const router = useRouter();
  const action = useMemo(
    () => createAppointmentFromLead.bind(null, leadId),
    [leadId],
  );
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isDisabled = Boolean(disabledReason) || state.status === "success";

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    router.refresh();
  }, [router, state.status]);

  return (
    <Card className="border-[#ded7c8] bg-[#fbfaf6]">
      <CardHeader className="border-b border-[#ece4d7]">
        <CardTitle>Създай час</CardTitle>
        <CardDescription>
          Конвертирай запитването в реален час без календар.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        {disabledReason ? (
          <div className="rounded-lg border border-[#d8d0c2] bg-white px-3 py-3 text-sm text-[#69655e]">
            {disabledReason}
          </div>
        ) : null}

        {state.message ? (
          <div
            className={`mb-5 rounded-lg border px-3 py-3 text-sm ${
              state.status === "success"
                ? "border-[#b9d8c5] bg-[#edf8f0] text-[#245d36]"
                : "border-[#efb3a5] bg-[#fff1ed] text-[#9d321d]"
            }`}
          >
            <div className="flex items-center gap-2">
              {state.status === "success" ? (
                <CheckCircle2 className="size-4" />
              ) : null}
              <span>{state.message}</span>
            </div>
          </div>
        ) : null}

        <form action={formAction} className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="appointment-date">Дата</Label>
              <Input
                id="appointment-date"
                name="date"
                type="date"
                defaultValue={defaultDate ?? todayIsoDate()}
                required
                disabled={isDisabled}
              />
              <FieldError message={state.fieldErrors?.date} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment-time">Начален час</Label>
              <Input
                id="appointment-time"
                name="startTime"
                type="time"
                defaultValue={normalizeTime(defaultTime)}
                required
                disabled={isDisabled}
              />
              <FieldError message={state.fieldErrors?.startTime} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointment-duration">Продължителност в минути</Label>
            <Input
              id="appointment-duration"
              name="durationMinutes"
              type="number"
              min={1}
              max={720}
              step={1}
              defaultValue={defaultDurationMinutes}
              required
              disabled={isDisabled}
            />
            <FieldError message={state.fieldErrors?.durationMinutes} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointment-notes">Бележки</Label>
            <textarea
              id="appointment-notes"
              name="notes"
              placeholder="Например: клиентът предпочита следобеден час."
              maxLength={1000}
              disabled={isDisabled}
              className="min-h-28 w-full resize-y rounded-md border border-[#d9d2c5] bg-white px-3 py-2 text-sm outline-none focus-visible:border-[#16372f] focus-visible:ring-2 focus-visible:ring-[#16372f]/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <FieldError message={state.fieldErrors?.notes} />
          </div>

          <Button
            type="submit"
            disabled={isPending || isDisabled}
            className="w-full bg-[#16372f] text-white hover:bg-[#214b42]"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Създаване...
              </>
            ) : state.status === "success" ? (
              "Часът е създаден"
            ) : (
              "Създай час"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
