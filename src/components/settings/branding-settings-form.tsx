"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ImagePlus, Loader2, Sparkles } from "lucide-react";

import {
  updateBrandingSettings,
  type BrandingFormState,
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
import { formatDuration, formatPrice } from "@/lib/services/format";

type BrandingSettingsValues = {
  businessName: string;
  brandName: string;
  primaryColor: string;
  logoUrl: string | null;
};

type BrandingSettingsFormProps = {
  initialValues: BrandingSettingsValues;
};

const initialState: BrandingFormState = {
  status: "idle",
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-[#a33b26]">{message}</p>;
}

function safeColor(value: string) {
  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return value;
  }

  return "#16372f";
}

export function BrandingSettingsForm({
  initialValues,
}: BrandingSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateBrandingSettings,
    initialState,
  );
  const [brandName, setBrandName] = useState(initialValues.brandName);
  const [primaryColor, setPrimaryColor] = useState(
    safeColor(initialValues.primaryColor),
  );
  const [savedLogoUrl, setSavedLogoUrl] = useState(initialValues.logoUrl);
  const [selectedLogoUrl, setSelectedLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (state.primaryColor) {
        setPrimaryColor(safeColor(state.primaryColor));
      }

      if (state.logoUrl !== undefined) {
        setSavedLogoUrl(state.logoUrl);
        setSelectedLogoUrl(null);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [state.logoUrl, state.primaryColor, state.status]);

  useEffect(() => {
    return () => {
      if (selectedLogoUrl) {
        URL.revokeObjectURL(selectedLogoUrl);
      }
    };
  }, [selectedLogoUrl]);

  const statusTone = useMemo(() => {
    if (state.status === "success") {
      return "border-[#b9d8c5] bg-[#edf8f0] text-[#245d36]";
    }

    return "border-[#efb3a5] bg-[#fff1ed] text-[#9d321d]";
  }, [state.status]);

  const previewLogoUrl = selectedLogoUrl ?? savedLogoUrl;
  const previewColor = safeColor(primaryColor);

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedLogoUrl(null);
      return;
    }

    if (selectedLogoUrl) {
      URL.revokeObjectURL(selectedLogoUrl);
    }

    setSelectedLogoUrl(URL.createObjectURL(file));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <Card className="border-[#ded7c8] bg-[#fbfaf6]">
        <CardHeader className="border-b border-[#ece4d7]">
          <CardTitle className="text-2xl font-semibold">Брандинг</CardTitle>
          <CardDescription>
            Настрой логото и основния цвят, които клиентите виждат на публичната
            страница.
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
              <Label htmlFor="brandName">Име на бранда</Label>
              <Input
                id="brandName"
                name="brandName"
                value={brandName}
                onChange={(event) => setBrandName(event.target.value)}
                required
                maxLength={120}
              />
              <FieldError message={state.fieldErrors?.brandName} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryColor">Основен цвят</Label>
              <div className="flex gap-3">
                <input
                  id="primaryColorPicker"
                  type="color"
                  value={previewColor}
                  onChange={(event) => setPrimaryColor(event.target.value)}
                  className="h-9 w-12 rounded-md border border-[#d9d2c5] bg-white p-1"
                  aria-label="Избери основен цвят"
                />
                <Input
                  id="primaryColor"
                  name="primaryColor"
                  value={primaryColor}
                  onChange={(event) => setPrimaryColor(event.target.value)}
                  required
                  maxLength={7}
                  className="font-mono"
                />
              </div>
              <FieldError message={state.fieldErrors?.primaryColor} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Лого</Label>
              <label
                htmlFor="logo"
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#d6cbbb] bg-white px-4 py-8 text-center transition hover:bg-[#f7f2e9]"
              >
                <ImagePlus className="size-8 text-[#a84b32]" />
                <span className="mt-3 text-sm font-medium">
                  Качи ново лого
                </span>
                <span className="mt-1 text-xs text-[#69655e]">
                  PNG, JPG, WebP или SVG до 2 MB
                </span>
              </label>
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoChange}
                className="sr-only"
              />
              <FieldError message={state.fieldErrors?.logo} />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#ece4d7] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button
                asChild
                variant="outline"
                className="border-[#d8d0c2] bg-white"
              >
                <Link href="/dashboard/settings">Назад</Link>
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="text-white"
                style={{ backgroundColor: previewColor }}
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Запазване...
                  </>
                ) : (
                  "Запази брандинга"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-[#ded7c8] bg-white">
        <CardHeader className="border-b border-[#ece4d7]">
          <CardTitle>Преглед</CardTitle>
          <CardDescription>
            Как ще изглежда началото на публичната страница.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-hidden rounded-2xl border border-[#ded7c8] bg-[#f8f4ec]">
            <div
              className="flex min-h-44 flex-col justify-end p-5 text-white"
              style={{ backgroundColor: previewColor }}
            >
              <div className="flex items-center gap-3">
                {previewLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewLogoUrl}
                    alt=""
                    className="size-14 rounded-xl border border-white/60 bg-white object-cover"
                  />
                ) : (
                  <span className="flex size-14 items-center justify-center rounded-xl border border-white/30 bg-white/15 text-lg font-semibold">
                    {brandName.slice(0, 2).toUpperCase() || "LO"}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm text-white/75">
                    Публична страница за заявки
                  </p>
                  <p className="truncate text-xl font-semibold">{brandName}</p>
                </div>
              </div>
              <p className="mt-5 max-w-sm text-sm leading-6 text-white/82">
                Изберете услуга и изпратете заявка за удобен ден.
              </p>
            </div>

            <div className="space-y-3 bg-white p-4">
              <div className="rounded-xl border border-[#e7dfd2] bg-[#fbfaf6] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">Примерна услуга</p>
                    <p className="mt-1 text-sm text-[#69655e]">
                      {formatDuration(60)} · {formatPrice(6500, "BGN")}
                    </p>
                  </div>
                  <Sparkles className="size-5" style={{ color: previewColor }} />
                </div>
              </div>
              <Button
                type="button"
                className="w-full text-white"
                style={{ backgroundColor: previewColor }}
              >
                Изпрати заявка
              </Button>
              <p className="text-xs leading-5 text-[#8a8176]">
                Прегледът е примерен. Реалната публична страница използва
                услугите, контактите и описанието от профила.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
