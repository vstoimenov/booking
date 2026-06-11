"use server";

import { createPublicClient } from "@/lib/supabase/public";

export type BookingRequestState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<
    Record<
      | "fullName"
      | "phone"
      | "email"
      | "serviceId"
      | "preferredDate"
      | "preferredTime"
      | "message",
      string
    >
  >;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SUPPORTED_PUBLIC_SOURCES = new Set([
  "instagram",
  "tiktok",
  "facebook",
  "google",
  "booking_page",
  "other",
]);

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeTrackingSource(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);

  if (!normalized) {
    return "booking_page";
  }

  return SUPPORTED_PUBLIC_SOURCES.has(normalized) ? normalized : "other";
}

function cleanTrackingValue(value: FormDataEntryValue | null, maxLength: number) {
  return cleanText(value).replace(/[<>{}"'`]/g, "").slice(0, maxLength);
}

function canRetryWithoutTracking(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("function") ||
    normalized.includes("schema cache") ||
    normalized.includes("could not find") ||
    normalized.includes("not found")
  );
}

function localizeBookingError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("not found")) {
    return "Страницата за резервации не е активна.";
  }

  if (normalized.includes("service")) {
    return "Избраната услуга вече не е налична.";
  }

  if (normalized.includes("date")) {
    return "Избери валидна бъдеща дата.";
  }

  if (normalized.includes("phone")) {
    return "Въведи валиден телефон.";
  }

  if (normalized.includes("email")) {
    return "Въведи валиден имейл или остави полето празно.";
  }

  return "Заявката не беше изпратена. Провери данните и опитай отново.";
}

export async function submitBookingRequest(
  slug: string,
  previousState: BookingRequestState,
  formData: FormData,
): Promise<BookingRequestState> {
  void previousState;

  const honeypot = cleanText(formData.get("companyWebsite"));

  if (honeypot) {
    return {
      status: "success",
      message: "Благодарим! Заявката ви беше изпратена успешно.",
    };
  }

  const fullName = cleanText(formData.get("fullName"));
  const phone = cleanText(formData.get("phone"));
  const email = cleanText(formData.get("email"));
  const serviceId = cleanText(formData.get("serviceId"));
  const preferredDate = cleanText(formData.get("preferredDate"));
  const preferredTime = cleanText(formData.get("preferredTime"));
  const message = cleanText(formData.get("message"));
  const trackingSource = normalizeTrackingSource(cleanText(formData.get("utmSource")));
  const trackingMedium = cleanTrackingValue(formData.get("utmMedium"), 80);
  const trackingCampaign = cleanTrackingValue(formData.get("utmCampaign"), 120);
  const fieldErrors: BookingRequestState["fieldErrors"] = {};

  if (fullName.length < 2 || fullName.length > 120) {
    fieldErrors.fullName = "Името е задължително и трябва да е до 120 символа.";
  }

  if (phone.length < 5 || phone.length > 40) {
    fieldErrors.phone = "Телефонът е задължителен.";
  }

  if (
    email &&
    (email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  ) {
    fieldErrors.email = "Имейлът не е валиден.";
  }

  if (!UUID_PATTERN.test(serviceId)) {
    fieldErrors.serviceId = "Избери услуга.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
    fieldErrors.preferredDate = "Избери дата.";
  } else if (preferredDate < todayIsoDate()) {
    fieldErrors.preferredDate = "Датата не може да е в миналото.";
  }

  if (preferredTime && !/^\d{2}:\d{2}$/.test(preferredTime)) {
    fieldErrors.preferredTime = "Часът не е валиден.";
  }

  if (message.length > 1000) {
    fieldErrors.message = "Съобщението трябва да е до 1000 символа.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Поправи маркираните полета.",
      fieldErrors,
    };
  }

  const supabase = createPublicClient();
  const rpcPayload = {
    business_slug: slug,
    service_id: serviceId,
    customer_full_name: fullName,
    customer_phone: phone,
    preferred_date: preferredDate,
    customer_email: email || null,
    preferred_time: preferredTime || null,
    customer_message: message || null,
  };
  const { error } = await supabase.rpc("submit_public_booking_request", {
    ...rpcPayload,
    lead_source: trackingSource,
    utm_medium: trackingMedium || null,
    utm_campaign: trackingCampaign || null,
  });

  if (error) {
    if (canRetryWithoutTracking(error.message)) {
      const { error: fallbackError } = await supabase.rpc(
        "submit_public_booking_request",
        rpcPayload,
      );

      if (!fallbackError) {
        return {
          status: "success",
          message: "Благодарим! Заявката ви беше изпратена успешно.",
        };
      }

      return {
        status: "error",
        message: localizeBookingError(fallbackError.message),
      };
    }

    return {
      status: "error",
      message: localizeBookingError(error.message),
    };
  }

  return {
    status: "success",
    message: "Благодарим! Заявката ви беше изпратена успешно.",
  };
}
