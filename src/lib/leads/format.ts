export const leadStatuses = [
  "new",
  "contacted",
  "booked",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type LeadStatus = (typeof leadStatuses)[number];

export const leadStatusLabels: Record<LeadStatus, string> = {
  new: "Ново",
  contacted: "Свързан",
  booked: "Записан час",
  completed: "Завършен",
  cancelled: "Отказан",
  no_show: "Не се яви",
};

export const leadSourceLabels: Record<string, string> = {
  booking_page: "Публична страница",
  manual: "Ръчно",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  google: "Google",
  other: "Друго",
  website: "Уебсайт",
  phone: "Телефон",
};

export const leadStatusBadgeClassNames: Record<LeadStatus, string> = {
  new: "border-[#b9d8c5] bg-[#edf8f0] text-[#245d36]",
  contacted: "border-[#c6d9ef] bg-[#edf5ff] text-[#28577f]",
  booked: "border-[#d8c5ee] bg-[#f5efff] text-[#5c3c82]",
  completed: "border-[#c5dec9] bg-[#eff8f0] text-[#25613a]",
  cancelled: "border-[#efc3b5] bg-[#fff2ee] text-[#9d321d]",
  no_show: "border-[#dfc8a2] bg-[#fff6e6] text-[#7a4f12]",
};

export function isLeadStatus(value: string): value is LeadStatus {
  return leadStatuses.includes(value as LeadStatus);
}

export function formatLeadDateTime(date: string | null, time: string | null) {
  if (!date && !time) {
    return "Не е посочено";
  }

  const formattedDate = date
    ? new Intl.DateTimeFormat("bg-BG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(`${date}T00:00:00`))
    : null;

  return [formattedDate, time].filter(Boolean).join(" · ");
}

export function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatSource(source: string) {
  return leadSourceLabels[source] ?? source.replaceAll("_", " ");
}

export function relationValue<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
