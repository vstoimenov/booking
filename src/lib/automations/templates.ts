export const automationTemplateTypes = [
  "new_lead_confirmation",
  "appointment_confirmation",
  "appointment_reminder",
  "follow_up_after_visit",
  "review_request",
  "client_reactivation",
] as const;

export type AutomationTemplateType = (typeof automationTemplateTypes)[number];

export const automationChannels = [
  "manual",
  "email",
  "sms",
  "viber",
  "whatsapp",
] as const;

export type AutomationChannel = (typeof automationChannels)[number];

export type AutomationRenderData = {
  customer_name?: string | null;
  business_name?: string | null;
  service_name?: string | null;
  appointment_date?: string | null;
  appointment_time?: string | null;
  google_review_url?: string | null;
};

export type DefaultAutomationTemplate = {
  type: AutomationTemplateType;
  channel: AutomationChannel;
  name: string;
  subject: string | null;
  body: string;
  delayMinutes: number;
  isActive: boolean;
};

export const automationTypeLabels: Record<AutomationTemplateType, string> = {
  new_lead_confirmation: "Потвърждение за нова заявка",
  appointment_confirmation: "Потвърждение на час",
  appointment_reminder: "Напомняне за час",
  follow_up_after_visit: "Follow-up след посещение",
  review_request: "Заявка за отзив",
  client_reactivation: "Реактивация на клиент",
};

export const automationChannelLabels: Record<AutomationChannel, string> = {
  manual: "Ръчно / копиране",
  email: "Имейл",
  sms: "SMS",
  viber: "Viber",
  whatsapp: "WhatsApp",
};

export const automationPlaceholders = [
  "{{customer_name}}",
  "{{business_name}}",
  "{{service_name}}",
  "{{appointment_date}}",
  "{{appointment_time}}",
  "{{google_review_url}}",
] as const;

export const sampleAutomationData: Required<AutomationRenderData> = {
  customer_name: "Мария Иванова",
  business_name: "Glow Studio",
  service_name: "Маникюр с гел лак",
  appointment_date: "15 юни 2026",
  appointment_time: "14:30",
  google_review_url: "https://g.page/r/example/review",
};

export const defaultAutomationTemplates: DefaultAutomationTemplate[] = [
  {
    type: "new_lead_confirmation",
    channel: "manual",
    name: "Потвърждение за нова заявка",
    subject: null,
    body: "Здравейте, {{customer_name}}! Получихме вашата заявка към {{business_name}} за {{service_name}}. Ще се свържем с вас възможно най-скоро.",
    delayMinutes: 0,
    isActive: true,
  },
  {
    type: "appointment_confirmation",
    channel: "manual",
    name: "Потвърждение на час",
    subject: null,
    body: "Здравейте, {{customer_name}}! Потвърждаваме вашия час в {{business_name}} за {{service_name}} на {{appointment_date}} в {{appointment_time}}.",
    delayMinutes: 0,
    isActive: true,
  },
  {
    type: "appointment_reminder",
    channel: "manual",
    name: "Напомняне за час",
    subject: null,
    body: "Здравейте, {{customer_name}}! Напомняме ви за вашия час в {{business_name}} утре в {{appointment_time}} за {{service_name}}.",
    delayMinutes: 1440,
    isActive: true,
  },
  {
    type: "follow_up_after_visit",
    channel: "manual",
    name: "Follow-up след посещение",
    subject: null,
    body: "Здравейте, {{customer_name}}! Благодарим ви, че избрахте {{business_name}}. Надяваме се, че сте доволни от услугата {{service_name}}.",
    delayMinutes: 60,
    isActive: true,
  },
  {
    type: "review_request",
    channel: "manual",
    name: "Заявка за отзив",
    subject: null,
    body: "Здравейте, {{customer_name}}! Ще се радваме, ако ни оставите отзив тук: {{google_review_url}}",
    delayMinutes: 120,
    isActive: true,
  },
  {
    type: "client_reactivation",
    channel: "manual",
    name: "Реактивация на клиент",
    subject: null,
    body: "Здравейте, {{customer_name}}! Отдавна не сме ви виждали в {{business_name}}. Заповядайте отново - ще се радваме да ви видим.",
    delayMinutes: 0,
    isActive: true,
  },
];

export function isAutomationTemplateType(
  value: string,
): value is AutomationTemplateType {
  return automationTemplateTypes.includes(value as AutomationTemplateType);
}

export function isAutomationChannel(value: string): value is AutomationChannel {
  return automationChannels.includes(value as AutomationChannel);
}

export function normalizeAutomationTemplateType(
  value: string,
): AutomationTemplateType {
  if (value === "lead_follow_up") {
    return "new_lead_confirmation";
  }

  return isAutomationTemplateType(value) ? value : "new_lead_confirmation";
}

export function normalizeAutomationChannel(value: string): AutomationChannel {
  return isAutomationChannel(value) ? value : "manual";
}

export function formatAutomationType(value: string) {
  return isAutomationTemplateType(value)
    ? automationTypeLabels[value]
    : value.replaceAll("_", " ");
}

export function formatAutomationChannel(value: string) {
  return isAutomationChannel(value)
    ? automationChannelLabels[value]
    : value.replaceAll("_", " ");
}

export function renderAutomationTemplate(
  template: string,
  data: AutomationRenderData = sampleAutomationData,
) {
  const merged = {
    ...sampleAutomationData,
    ...Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value || sampleAutomationData[key as keyof Required<AutomationRenderData>],
      ]),
    ),
  };

  return template.replace(/\{\{([a-z_]+)\}\}/g, (match, key: string) => {
    const value = merged[key as keyof Required<AutomationRenderData>];

    return value || match;
  });
}

export function defaultTemplateForType(type: AutomationTemplateType) {
  return defaultAutomationTemplates.find((template) => template.type === type);
}
