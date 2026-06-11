import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Scissors,
  Sparkles,
} from "lucide-react";

import {
  BookingRequestForm,
  type BookingServiceOption,
} from "@/components/booking/booking-request-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { businessVerticalLabels } from "@/lib/business/labels";
import type { BusinessVertical } from "@/lib/business/current";
import { formatDuration, formatPrice } from "@/lib/services/format";
import { createPublicClient } from "@/lib/supabase/public";

import { submitBookingRequest } from "./actions";

export const dynamic = "force-dynamic";

type BookingPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type PublicBusinessRow = {
  id: string;
  name: string;
  public_slug: string;
  vertical: BusinessVertical;
  status: string;
  contact_email: string | null;
  phone: string | null;
  address_line: string | null;
  city: string | null;
  region: string | null;
  country: string;
};

type PublicBrandingRow = {
  business_id: string;
  brand_name: string;
  primary_color: string;
  logo_url: string | null;
  website_url: string | null;
  booking_page_title: string | null;
};

type PublicServiceRow = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  currency: string;
};

function safeBrandColor(value?: string | null) {
  if (value && /^#[0-9a-f]{6}$/i.test(value)) {
    return value;
  }

  return "#16372f";
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanTrackingValue(value: string | string[] | undefined, maxLength: number) {
  return (firstParam(value) ?? "")
    .trim()
    .replace(/[<>{}"'`]/g, "")
    .slice(0, maxLength);
}

function getAddress(business: PublicBusinessRow) {
  return [business.address_line, business.city, business.region]
    .filter(Boolean)
    .join(", ");
}

function getDescription(business: PublicBusinessRow, branding: PublicBrandingRow | null) {
  if (branding?.booking_page_title) {
    return branding.booking_page_title;
  }

  const category = businessVerticalLabels[business.vertical];

  return `Изберете услуга от ${business.name} и изпратете заявка за удобен ден. ${category} екипът ще се свърже с вас за потвърждение.`;
}

function LogoMark({
  businessName,
  logoUrl,
  brandColor,
}: {
  businessName: string;
  logoUrl?: string | null;
  brandColor: string;
}) {
  if (logoUrl) {
    return (
      <div
        role="img"
        aria-label={`${businessName} logo`}
        className="size-16 rounded-2xl border border-white/60 bg-white bg-cover bg-center shadow-sm"
        style={{ backgroundImage: `url("${logoUrl.replaceAll('"', "%22")}")` }}
      />
    );
  }

  return (
    <div
      className="flex size-16 items-center justify-center rounded-2xl text-xl font-semibold text-white shadow-sm"
      style={{ backgroundColor: brandColor }}
    >
      {businessName.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default async function BookingPage({
  params,
  searchParams,
}: BookingPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const normalizedSlug = slug.trim().toLowerCase();

  if (!/^[a-z0-9-]{2,140}$/.test(normalizedSlug)) {
    notFound();
  }

  const supabase = createPublicClient();
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select(
      "id, name, public_slug, vertical, status, contact_email, phone, address_line, city, region, country",
    )
    .eq("public_slug", normalizedSlug)
    .eq("status", "active")
    .maybeSingle<PublicBusinessRow>();

  if (businessError || !business) {
    notFound();
  }

  const [{ data: brandingData }, { data: servicesData, error: servicesError }] =
    await Promise.all([
      supabase
        .from("branding_settings")
        .select(
          "business_id, brand_name, primary_color, logo_url, website_url, booking_page_title",
        )
        .eq("business_id", business.id)
        .limit(1)
        .maybeSingle<PublicBrandingRow>(),
      supabase
        .from("services")
        .select(
          "id, name, description, duration_minutes, price_cents, currency",
        )
        .eq("business_id", business.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

  if (servicesError) {
    notFound();
  }

  const branding = brandingData ?? null;
  const brandColor = safeBrandColor(branding?.primary_color);
  const brandName = branding?.brand_name || business.name;
  const address = getAddress(business);
  const services = ((servicesData ?? []) as PublicServiceRow[]).map(
    (service): BookingServiceOption => ({
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: service.duration_minutes,
      priceCents: service.price_cents,
      currency: service.currency,
    }),
  );
  const tracking = {
    source: cleanTrackingValue(query.utm_source, 40),
    medium: cleanTrackingValue(query.utm_medium, 80),
    campaign: cleanTrackingValue(query.utm_campaign, 120),
  };
  const formAction = submitBookingRequest.bind(null, business.public_slug);

  return (
    <main className="min-h-screen bg-[#f7f2e9] text-[#171412]">
      <section className="relative overflow-hidden border-b border-[#ded7c8] bg-[#f8f4ec]">
        <div className="absolute inset-0 opacity-[0.28] [background-image:linear-gradient(90deg,#d9d0c1_1px,transparent_1px),linear-gradient(#d9d0c1_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8 lg:py-12">
          <div className="flex min-w-0 flex-col justify-between gap-8">
            <div>
              <div className="flex items-center gap-4">
                <LogoMark
                  businessName={brandName}
                  logoUrl={branding?.logo_url}
                  brandColor={brandColor}
                />
                <div className="min-w-0">
                  <Badge className="mb-2 border-[#d8cdbb] bg-white/85 text-[#5d554c] hover:bg-white/85">
                    {businessVerticalLabels[business.vertical]}
                  </Badge>
                  <p className="truncate text-sm font-medium text-[#69655e]">
                    {brandName}
                  </p>
                </div>
              </div>

              <h1 className="mt-8 max-w-3xl text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
                {business.name}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#5f5a53] sm:text-lg">
                {getDescription(business, branding)}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {address ? (
                <div className="rounded-2xl border border-[#ded7c8] bg-white/85 p-4">
                  <MapPin className="size-5" style={{ color: brandColor }} />
                  <p className="mt-3 text-sm leading-6 text-[#5f5a53]">
                    {address}
                  </p>
                </div>
              ) : null}
              {business.phone ? (
                <a
                  href={`tel:${business.phone}`}
                  className="rounded-2xl border border-[#ded7c8] bg-white/85 p-4 transition hover:bg-white"
                >
                  <Phone className="size-5" style={{ color: brandColor }} />
                  <p className="mt-3 text-sm font-medium">{business.phone}</p>
                </a>
              ) : null}
              {business.contact_email ? (
                <a
                  href={`mailto:${business.contact_email}`}
                  className="rounded-2xl border border-[#ded7c8] bg-white/85 p-4 transition hover:bg-white"
                >
                  <Mail className="size-5" style={{ color: brandColor }} />
                  <p className="mt-3 break-all text-sm font-medium">
                    {business.contact_email}
                  </p>
                </a>
              ) : null}
              {branding?.website_url ? (
                <Button
                  asChild
                  variant="outline"
                  className="h-full min-h-24 justify-start rounded-2xl border-[#ded7c8] bg-white/85 p-4 text-left hover:bg-white"
                >
                  <Link href={branding.website_url}>
                    <Sparkles className="size-5" style={{ color: brandColor }} />
                    <span className="mt-3 block text-sm font-medium">
                      Уебсайт
                    </span>
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-[#ded7c8] bg-white p-5 shadow-sm">
            <div
              className="flex min-h-72 flex-col justify-between rounded-2xl p-5 text-white"
              style={{ backgroundColor: brandColor }}
            >
              <div>
                <p className="text-sm font-medium text-white/80">
                  Записване онлайн
                </p>
                <p className="mt-3 text-3xl font-semibold leading-tight">
                  Изберете услуга. Изпратете заявка. Очаквайте потвърждение.
                </p>
              </div>
              <div className="mt-8 space-y-3">
                <div className="grid gap-2 text-sm text-white/85">
                  <span>{services.length} активни услуги</span>
                  <span>Бърза форма за контакт</span>
                  <span>Потвърждение от екипа</span>
                </div>
                {services.length > 0 ? (
                  <Button
                    asChild
                    className="w-full bg-white text-[#171412] hover:bg-white/90"
                  >
                    <a href="#booking-form">
                      Изпрати заявка
                      <ArrowRight className="size-4" />
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-10">
        <div className="space-y-4">
          <div>
            <Badge
              className="border-[#ead2a9] bg-[#fff7e8] text-[#8a5a20] hover:bg-[#fff7e8]"
            >
              Активни услуги
            </Badge>
            <h2 className="mt-3 text-2xl font-semibold">Услуги</h2>
            <p className="mt-2 text-sm leading-6 text-[#69655e]">
              Изберете услугата, която ви интересува, и попълнете формата вдясно
              или по-долу на телефона си.
            </p>
          </div>

          {services.length > 0 ? (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-2xl border border-[#ded7c8] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-semibold">
                        {service.name}
                      </h3>
                      {service.description ? (
                        <p className="mt-2 text-sm leading-6 text-[#69655e]">
                          {service.description}
                        </p>
                      ) : null}
                    </div>
                    <Scissors
                      className="mt-1 size-5 shrink-0"
                      style={{ color: brandColor }}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#e6ded1] bg-[#fbfaf6] px-3 py-1 text-xs font-medium text-[#5f5a53]">
                      <Clock3 className="size-3" />
                      {formatDuration(service.durationMinutes)}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[#e6ded1] bg-[#fbfaf6] px-3 py-1 text-xs font-medium text-[#5f5a53]">
                      {formatPrice(service.priceCents, service.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#d6cbbb] bg-white p-6 text-sm leading-6 text-[#69655e]">
              Този бизнес все още няма активни услуги.
            </div>
          )}
        </div>

        <div id="booking-form" className="scroll-mt-6 lg:sticky lg:top-6 lg:self-start">
          {services.length > 0 ? (
            <BookingRequestForm
              services={services}
              brandColor={brandColor}
              tracking={tracking}
              action={formAction}
            />
          ) : (
            <div className="rounded-2xl border border-[#ded7c8] bg-white p-6 shadow-sm">
              <CalendarDays className="size-8" style={{ color: brandColor }} />
              <h2 className="mt-4 text-2xl font-semibold">
                Заявките още не са активни.
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#69655e]">
                След като бизнесът добави активни услуги, формата за заявки ще
                се появи тук.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
