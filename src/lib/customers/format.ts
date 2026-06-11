export const customerSourceLabels: Record<string, string> = {
  booking_page: "Публична страница",
  manual: "Ръчно",
  website: "Уебсайт",
  phone: "Телефон",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  google: "Google",
  referral: "Препоръка",
  walk_in: "На място",
  other: "Друго",
};

export const customerSourceOptions = [
  "booking_page",
  "manual",
  "phone",
  "website",
  "instagram",
  "tiktok",
  "facebook",
  "google",
  "referral",
  "walk_in",
  "other",
] as const;

export function formatCustomerSource(source: string | null | undefined) {
  if (!source) {
    return "Неизвестен";
  }

  return customerSourceLabels[source] ?? source.replaceAll("_", " ");
}

export function formatCustomerDate(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatCustomerDateTime(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function relationValue<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
    value,
  );
}
