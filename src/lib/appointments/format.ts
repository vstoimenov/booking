export const appointmentStatuses = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  scheduled: "Планиран",
  confirmed: "Потвърден",
  completed: "Завършен",
  cancelled: "Отказан",
  no_show: "Не се яви",
};

export const appointmentStatusBadgeClassNames: Record<AppointmentStatus, string> = {
  scheduled: "border-[#c6d9ef] bg-[#edf5ff] text-[#28577f]",
  confirmed: "border-[#d8c5ee] bg-[#f5efff] text-[#5c3c82]",
  completed: "border-[#c5dec9] bg-[#eff8f0] text-[#25613a]",
  cancelled: "border-[#efc3b5] bg-[#fff2ee] text-[#9d321d]",
  no_show: "border-[#dfc8a2] bg-[#fff6e6] text-[#7a4f12]",
};

export const appointmentStatusEventTypes: Record<
  Exclude<AppointmentStatus, "scheduled">,
  string
> = {
  confirmed: "appointment_confirmed",
  completed: "appointment_completed",
  cancelled: "appointment_cancelled",
  no_show: "appointment_no_show",
};

export function isAppointmentStatus(value: string): value is AppointmentStatus {
  return appointmentStatuses.includes(value as AppointmentStatus);
}

export function formatAppointmentDate(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatAppointmentTime(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatAppointmentRange(startsAt: string, endsAt: string) {
  return `${formatAppointmentDate(startsAt)} · ${formatAppointmentTime(
    startsAt,
  )} - ${formatAppointmentTime(endsAt)}`;
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

export function relationValue<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function appointmentDateRange(
  date: string,
  startTime: string,
  durationMinutes: number,
) {
  const startsAt = new Date(`${date}T${startTime}:00`);

  if (Number.isNaN(startsAt.getTime())) {
    return null;
  }

  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

  return {
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
}
