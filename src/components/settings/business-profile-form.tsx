"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, ExternalLink, Loader2, TriangleAlert } from "lucide-react";

import {
  updateBusinessProfile,
  type BusinessProfileFormState,
} from "@/app/(dashboard)/dashboard/settings/actions";
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
import { businessVerticalLabels } from "@/lib/business/labels";
import type { BusinessVertical } from "@/lib/business/current";

type BusinessProfileValues = {
  name: string;
  slug: string;
  vertical: BusinessVertical;
  description: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  isActive: boolean;
};

type BusinessProfileFormProps = {
  initialValues: BusinessProfileValues;
};

const initialState: BusinessProfileFormState = {
  status: "idle",
};

const verticalOptions: BusinessVertical[] = [
  "beauty_wellness",
  "dental_esthetic",
  "cleaning_field_service",
  "other",
];

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-[#a33b26]">{message}</p>;
}

function normalizeSlugInput(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-/, "");
}

export function BusinessProfileForm({ initialValues }: BusinessProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateBusinessProfile,
    initialState,
  );
  const [slug, setSlug] = useState(initialValues.slug);
  const [savedSlug, setSavedSlug] = useState(initialValues.slug);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const bookingPath = `/b/${savedSlug}`;

  useEffect(() => {
    if (state.status !== "success" || !state.publicSlug) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (!state.publicSlug) {
        return;
      }

      setSavedSlug(state.publicSlug);
      setSlug(state.publicSlug);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [state.publicSlug, state.status]);

  const statusTone = useMemo(() => {
    if (state.status === "success") {
      return "border-[#b9d8c5] bg-[#edf8f0] text-[#245d36]";
    }

    return "border-[#efb3a5] bg-[#fff1ed] text-[#9d321d]";
  }, [state.status]);

  const slugChanged = slug !== savedSlug;

  async function copyBookingLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${bookingPath}`);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1800);
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <Card className="border-[#ded7c8] bg-[#fbfaf6]">
      <CardHeader className="border-b border-[#ece4d7]">
        <CardTitle className="text-2xl font-semibold">Бизнес профил</CardTitle>
        <CardDescription>
          Данните тук се показват на публичната страница за заявки и в работното
          табло.
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

        <div className="mb-6 rounded-xl border border-[#e4dccf] bg-white p-4">
          <p className="text-xs font-medium uppercase text-[#8a8176]">
            Публичен линк
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <code className="break-all rounded-md bg-[#f5f1e8] px-3 py-2 text-sm text-[#342f2a]">
              {bookingPath}
            </code>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={copyBookingLink}
                className="justify-start border-[#d8d0c2] bg-white"
              >
                <Copy className="size-4" />
                {copyStatus === "copied" ? "Копирано" : "Копирай линка"}
              </Button>
              <Button
                asChild
                variant="outline"
                className="justify-start border-[#d8d0c2] bg-white"
              >
                <Link href={bookingPath} target="_blank">
                  <ExternalLink className="size-4" />
                  Отвори страницата
                </Link>
              </Button>
            </div>
          </div>
          {copyStatus === "error" ? (
            <p className="mt-2 text-sm text-[#a33b26]">
              Копирането не успя. Линкът е {bookingPath}.
            </p>
          ) : null}
        </div>

        <form action={formAction} className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Име на бизнеса</Label>
              <Input
                id="name"
                name="name"
                defaultValue={initialValues.name}
                required
                maxLength={120}
                autoComplete="organization"
              />
              <FieldError message={state.fieldErrors?.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vertical">Категория</Label>
              <select
                id="vertical"
                name="vertical"
                defaultValue={initialValues.vertical}
                className="h-9 w-full rounded-md border border-[#d9d2c5] bg-white px-3 text-sm outline-none focus-visible:border-[#16372f] focus-visible:ring-2 focus-visible:ring-[#16372f]/20"
              >
                {verticalOptions.map((vertical) => (
                  <option key={vertical} value={vertical}>
                    {businessVerticalLabels[vertical]}
                  </option>
                ))}
              </select>
              <FieldError message={state.fieldErrors?.vertical} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Публичен адрес</Label>
            <div className="flex rounded-md border border-[#d9d2c5] bg-white focus-within:border-[#16372f] focus-within:ring-2 focus-within:ring-[#16372f]/20">
              <span className="flex items-center border-r border-[#e6ded1] px-3 text-sm text-[#8a8176]">
                /b/
              </span>
              <input
                id="slug"
                name="slug"
                value={slug}
                onChange={(event) => setSlug(normalizeSlugInput(event.target.value))}
                required
                maxLength={140}
                className="h-9 min-w-0 flex-1 rounded-r-md px-3 text-sm outline-none"
              />
            </div>
            {slugChanged ? (
              <div className="flex gap-2 rounded-lg border border-[#ead2a9] bg-[#fff7e8] p-3 text-sm leading-6 text-[#80591f]">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                <span>
                  Промяната на линка ще промени публичния адрес на страницата.
                </span>
              </div>
            ) : null}
            <FieldError message={state.fieldErrors?.slug} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <textarea
              id="description"
              name="description"
              defaultValue={initialValues.description}
              maxLength={1000}
              placeholder="Кратко описание на бизнеса и какво могат да заявят клиентите."
              className="min-h-32 w-full resize-y rounded-md border border-[#d9d2c5] bg-white px-3 py-2 text-sm outline-none focus-visible:border-[#16372f] focus-visible:ring-2 focus-visible:ring-[#16372f]/20"
            />
            <FieldError message={state.fieldErrors?.description} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={initialValues.phone}
                placeholder="+359 88 123 4567"
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
                placeholder="studio@example.com"
                autoComplete="email"
              />
              <FieldError message={state.fieldErrors?.email} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Уебсайт</Label>
            <Input
              id="website"
              name="website"
              type="url"
              defaultValue={initialValues.website}
              placeholder="https://example.com"
            />
            <FieldError message={state.fieldErrors?.website} />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-2">
              <Label htmlFor="address">Адрес</Label>
              <Input
                id="address"
                name="address"
                defaultValue={initialValues.address}
                placeholder="ул. Примерна 12"
                autoComplete="street-address"
              />
              <FieldError message={state.fieldErrors?.address} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Град</Label>
              <Input
                id="city"
                name="city"
                defaultValue={initialValues.city}
                placeholder="София"
                autoComplete="address-level2"
              />
              <FieldError message={state.fieldErrors?.city} />
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#e2dbcf] bg-white p-4">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={initialValues.isActive}
              className="mt-1 size-4 accent-[#16372f]"
            />
            <span>
              <span className="block text-sm font-medium">
                Публичната страница е активна
              </span>
              <span className="mt-1 block text-sm leading-6 text-[#69655e]">
                Ако я изключиш, клиентите няма да могат да отварят публичната
                страница.
              </span>
            </span>
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-[#ece4d7] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button asChild variant="outline" className="border-[#d8d0c2] bg-white">
              <Link href="/dashboard/settings">Назад</Link>
            </Button>
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
                "Запази профила"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
