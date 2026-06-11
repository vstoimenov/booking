import type { BusinessVertical } from "@/lib/business/current";

export const businessVerticalLabels: Record<BusinessVertical, string> = {
  beauty_wellness: "Красота и wellness",
  dental_esthetic: "Дентална / естетична клиника",
  cleaning_field_service: "Почистване / услуги на адрес",
  other: "Локален бизнес",
};

export const leadStatusLabels: Record<string, string> = {
  new: "Ново",
  contacted: "Свързан",
  booked: "Записан час",
  completed: "Завършен",
  cancelled: "Отказан",
  no_show: "Не се яви",
};

export const leadPriorityLabels: Record<string, string> = {
  low: "Нисък",
  normal: "Нормален",
  high: "Висок",
};
