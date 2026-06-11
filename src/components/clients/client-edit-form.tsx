"use client";

import { useActionState, useMemo } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import {
  updateClient,
  type ClientFormState,
} from "@/app/(dashboard)/dashboard/clients/actions";
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
  customerSourceOptions,
  formatCustomerSource,
} from "@/lib/customers/format";

type ClientEditValues = {
  fullName: string;
  phone: string;
  email: string;
  notes: string;
  source: string;
};

type ClientEditFormProps = {
  clientId: string;
  initialValues: ClientEditValues;
};

const initialState: ClientFormState = {
  status: "idle",
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-[#a33b26]">{message}</p>;
}

function sourceOptions(currentSource: string) {
  return Array.from(new Set([...customerSourceOptions, currentSource])).filter(Boolean);
}

export function ClientEditForm({ clientId, initialValues }: ClientEditFormProps) {
  const action = useMemo(() => updateClient.bind(null, clientId), [clientId]);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const statusTone = useMemo(() => {
    if (state.status === "success") {
      return "border-[#b9d8c5] bg-[#edf8f0] text-[#245d36]";
    }

    return "border-[#efb3a5] bg-[#fff1ed] text-[#9d321d]";
  }, [state.status]);

  return (
    <Card id="edit" className="border-[#ded7c8] bg-[#fbfaf6]">
      <CardHeader className="border-b border-[#ece4d7]">
        <CardTitle>Редакция на клиент</CardTitle>
        <CardDescription>
          Контактите се използват в историята на запитванията и часовете.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {state.message ? (
          <div className={`mb-5 rounded-lg border px-3 py-3 text-sm ${statusTone}`}>
            <div className="flex items-center gap-2">
              {state.status === "success" ? (
                <CheckCircle2 className="size-4" />
              ) : null}
              <span>{state.message}</span>
            </div>
          </div>
        ) : null}

        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fullName">Име</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={initialValues.fullName}
              required
              maxLength={120}
              autoComplete="name"
            />
            <FieldError message={state.fieldErrors?.fullName} />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={initialValues.phone}
                required
                maxLength={40}
                autoComplete="tel"
              />
              <FieldError message={state.fieldErrors?.phone} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Имейл</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={initialValues.email}
                maxLength={160}
                autoComplete="email"
              />
              <FieldError message={state.fieldErrors?.email} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Източник</Label>
            <select
              id="source"
              name="source"
              defaultValue={initialValues.source}
              className="h-9 w-full rounded-lg border border-[#d8d0c2] bg-white px-3 text-sm outline-none focus-visible:border-[#16372f] focus-visible:ring-2 focus-visible:ring-[#16372f]/20"
            >
              {sourceOptions(initialValues.source).map((source) => (
                <option key={source} value={source}>
                  {formatCustomerSource(source)}
                </option>
              ))}
            </select>
            <FieldError message={state.fieldErrors?.source} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Бележки</Label>
            <textarea
              id="notes"
              name="notes"
              defaultValue={initialValues.notes}
              maxLength={1000}
              placeholder="Вътрешни бележки за клиента."
              className="min-h-28 w-full resize-y rounded-md border border-[#d9d2c5] bg-white px-3 py-2 text-sm outline-none focus-visible:border-[#16372f] focus-visible:ring-2 focus-visible:ring-[#16372f]/20"
            />
            <FieldError message={state.fieldErrors?.notes} />
          </div>

          <div className="flex justify-end border-t border-[#ece4d7] pt-5">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#16372f] text-white hover:bg-[#214b42]"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Запазване...
                </>
              ) : (
                "Запази клиента"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
