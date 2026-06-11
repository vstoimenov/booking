"use client";

import { useActionState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

import type { ServiceFormState } from "@/app/(dashboard)/dashboard/services/actions";
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

type ServiceFormValues = {
  name: string;
  description: string;
  durationMinutes: number;
  price: string;
  currency: string;
  isActive: boolean;
};

type ServiceFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  pendingLabel: string;
  successRedirectHref?: string;
  action: (
    previousState: ServiceFormState,
    formData: FormData,
  ) => Promise<ServiceFormState>;
  initialValues?: Partial<ServiceFormValues>;
};

const initialState: ServiceFormState = {
  status: "idle",
};

const defaultValues: ServiceFormValues = {
  name: "",
  description: "",
  durationMinutes: 60,
  price: "0",
  currency: "BGN",
  isActive: true,
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-[#a33b26]">{message}</p>;
}

export function ServiceForm({
  title,
  description,
  submitLabel,
  pendingLabel,
  successRedirectHref = "/dashboard/services",
  action,
  initialValues,
}: ServiceFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, initialState);
  const values = {
    ...defaultValues,
    ...initialValues,
  };

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.replace(successRedirectHref);
      router.refresh();
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [router, state.status, successRedirectHref]);

  const statusTone = useMemo(() => {
    if (state.status === "success") {
      return "border-[#b9d8c5] bg-[#edf8f0] text-[#245d36]";
    }

    return "border-[#efb3a5] bg-[#fff1ed] text-[#9d321d]";
  }, [state.status]);

  return (
    <Card className="border-[#ded7c8] bg-[#fbfaf6]">
      <CardHeader className="border-b border-[#ece4d7]">
        <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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
            <Label htmlFor="name">Име на услугата</Label>
            <Input
              id="name"
              name="name"
              defaultValue={values.name}
              placeholder="Маникюр с гел лак"
              required
              maxLength={120}
              autoComplete="off"
            />
            <FieldError message={state.fieldErrors?.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <textarea
              id="description"
              name="description"
              defaultValue={values.description}
              placeholder="Кратко описание, което клиентът ще вижда при резервация."
              maxLength={1000}
              className="min-h-28 w-full resize-y rounded-md border border-[#d9d2c5] bg-white px-3 py-2 text-sm outline-none focus-visible:border-[#16372f] focus-visible:ring-2 focus-visible:ring-[#16372f]/20"
            />
            <FieldError message={state.fieldErrors?.description} />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Продължителност</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min={1}
                max={720}
                step={1}
                defaultValue={values.durationMinutes}
                required
              />
              <FieldError message={state.fieldErrors?.durationMinutes} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Цена</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                step="0.01"
                defaultValue={values.price}
                required
              />
              <FieldError message={state.fieldErrors?.price} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Валута</Label>
              <Input
                id="currency"
                name="currency"
                defaultValue={values.currency}
                required
                maxLength={3}
                className="uppercase"
              />
              <FieldError message={state.fieldErrors?.currency} />
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#e2dbcf] bg-white p-4">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={values.isActive}
              className="mt-1 size-4 accent-[#16372f]"
            />
            <span>
              <span className="block text-sm font-medium">Активна услуга</span>
              <span className="mt-1 block text-sm leading-6 text-[#69655e]">
                Активните услуги ще се показват на публичната booking страница.
              </span>
            </span>
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-[#ece4d7] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/services")}
              className="border-[#d8d0c2] bg-white"
            >
              Назад
            </Button>
            <Button
              type="submit"
              disabled={isPending || state.status === "success"}
              className="bg-[#16372f] text-white hover:bg-[#214b42]"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {pendingLabel}
                </>
              ) : state.status === "success" ? (
                "Готово"
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
