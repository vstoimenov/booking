"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Palette, UploadCloud } from "lucide-react";

import {
  createBusinessWorkspace,
  type OnboardingState,
} from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: OnboardingState = {
  status: "idle",
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-[#a33b26]">{message}</p>;
}

export function OnboardingForm({ email }: { email: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createBusinessWorkspace,
    initialState,
  );
  const [primaryColor, setPrimaryColor] = useState("#16372f");

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.replace("/dashboard");
      router.refresh();
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [router, state.status]);

  const statusTone = useMemo(() => {
    if (state.status === "success") {
      return "border-[#b9d8c5] bg-[#edf8f0] text-[#245d36]";
    }

    return "border-[#efb3a5] bg-[#fff1ed] text-[#9d321d]";
  }, [state.status]);

  return (
    <Card className="border-[#ded8cb] bg-white/95 shadow-sm">
      <CardHeader className="border-b border-[#ece4d7]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-semibold">
              Създай профил на бизнеса
            </CardTitle>
            <p className="mt-2 text-sm leading-6 text-[#69655e]">
              Влязъл си като {email}. Това създава бизнес профил, достъп като
              собственик и началния брандинг.
            </p>
          </div>
          <span className="hidden rounded-md bg-[#16372f] px-3 py-2 text-sm font-medium text-white sm:inline-flex">
            Стъпка 1 от 1
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {state.message ? (
          <div className={`mb-5 rounded-md border px-3 py-3 text-sm ${statusTone}`}>
            <div className="flex items-center gap-2">
              {state.status === "success" ? (
                <CheckCircle2 className="size-4" />
              ) : null}
              <span>{state.message}</span>
            </div>
          </div>
        ) : null}

        <form action={formAction} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessName">Име на салона/бизнеса</Label>
              <Input
                id="businessName"
                name="businessName"
                placeholder="Glow Studio"
                autoComplete="organization"
                required
                minLength={2}
                maxLength={120}
              />
              <FieldError message={state.fieldErrors?.businessName} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vertical">Тип бизнес</Label>
              <select
                id="vertical"
                name="vertical"
                defaultValue="beauty_wellness"
                className="flex h-11 w-full rounded-md border border-[#d9d2c5] bg-white px-3 text-sm outline-none focus-visible:border-[#16372f] focus-visible:ring-2 focus-visible:ring-[#16372f]/20"
              >
                <option value="beauty_wellness">Салон красота / wellness</option>
                <option value="dental_esthetic">Дентална / естетична клиника</option>
                <option value="cleaning_field_service">Почистване / услуги на адрес</option>
                <option value="other">Друг локален бизнес</option>
              </select>
              <FieldError message={state.fieldErrors?.vertical} />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Основен цвят</Label>
              <div className="flex h-11 items-center gap-3 rounded-md border border-[#d9d2c5] bg-white px-3">
                <input
                  id="primaryColor"
                  name="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(event) => setPrimaryColor(event.target.value)}
                  className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
                  aria-label="Основен цвят"
                />
                <Palette className="size-4 text-[#8a8176]" />
                <span className="font-mono text-sm text-[#575048]">
                  {primaryColor}
                </span>
              </div>
              <FieldError message={state.fieldErrors?.primaryColor} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+359 88 123 4567"
                autoComplete="tel"
              />
              <FieldError message={state.fieldErrors?.phone} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Уебсайт</Label>
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="https://salon.bg"
              autoComplete="url"
            />
            <FieldError message={state.fieldErrors?.website} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Качване на лого</Label>
            <label
              htmlFor="logo"
              className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#cfc5b5] bg-[#fbfaf6] px-4 py-6 text-center transition hover:border-[#16372f]"
            >
              <UploadCloud className="size-6 text-[#a84b32]" />
              <span className="mt-3 text-sm font-medium">
                Качи PNG, JPG, WebP или SVG
              </span>
              <span className="mt-1 text-xs text-[#69655e]">
                По желание, до 2 MB
              </span>
            </label>
            <Input
              id="logo"
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="sr-only"
            />
            <FieldError message={state.fieldErrors?.logo} />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#ece4d7] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-[#69655e]">
              След тази стъпка ще можеш да управляваш запитвания, услуги и резервации.
            </p>
            <Button
              type="submit"
              disabled={isPending || state.status === "success"}
              className="h-11 bg-[#16372f] text-white hover:bg-[#214b42]"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Създаване...
                </>
              ) : state.status === "success" ? (
                "Бизнес профилът е готов"
              ) : (
                "Създай бизнес профил"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
