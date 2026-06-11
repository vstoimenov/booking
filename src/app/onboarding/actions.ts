"use server";

import { createClient } from "@/lib/supabase/server";

export type OnboardingState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<
    Record<
      "businessName" | "vertical" | "primaryColor" | "website" | "phone" | "logo",
      string
    >
  >;
};

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const LOGO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

const VERTICALS = new Set([
  "beauty_wellness",
  "dental_esthetic",
  "cleaning_field_service",
  "other",
]);

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function validateWebsite(value: string) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

function fileExtension(file: File) {
  const fallback = file.type === "image/png" ? "png" : "webp";
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!extension || !["png", "jpg", "jpeg", "webp", "svg"].includes(extension)) {
    return fallback;
  }

  return extension === "jpeg" ? "jpg" : extension;
}

function localizeOnboardingError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("authentication is required")) {
    return "Нужен е вход в акаунта.";
  }

  if (
    normalized.includes("already belong to a partner workspace") ||
    normalized.includes("already has an active workspace")
  ) {
    return "Вече имаш активно работно пространство.";
  }

  if (
    normalized.includes("business name") ||
    normalized.includes("agency name")
  ) {
    return "Името на бизнеса трябва да е между 2 и 120 символа.";
  }

  if (normalized.includes("brand name")) {
    return "Името на бранда трябва да е между 2 и 120 символа.";
  }

  if (normalized.includes("primary color")) {
    return "Основният цвят трябва да е валиден hex цвят.";
  }

  if (normalized.includes("website")) {
    return "Уебсайтът трябва да започва с http:// или https://.";
  }

  if (normalized.includes("business type")) {
    return "Избери валиден тип бизнес.";
  }

  return message;
}

export async function createBusinessWorkspace(
  _previousState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const businessName = cleanText(formData.get("businessName"));
  const vertical = cleanText(formData.get("vertical")) || "beauty_wellness";
  const primaryColor = cleanText(formData.get("primaryColor")).toLowerCase();
  const rawWebsite = cleanText(formData.get("website"));
  const phone = cleanText(formData.get("phone"));
  const logo = formData.get("logo");
  const fieldErrors: OnboardingState["fieldErrors"] = {};

  if (businessName.length < 2 || businessName.length > 120) {
    fieldErrors.businessName =
      "Името на бизнеса трябва да е между 2 и 120 символа.";
  }

  if (!VERTICALS.has(vertical)) {
    fieldErrors.vertical = "Избери валиден тип бизнес.";
  }

  if (!/^#[0-9a-f]{6}$/.test(primaryColor)) {
    fieldErrors.primaryColor = "Избери валиден hex цвят.";
  }

  const website = validateWebsite(rawWebsite);

  if (rawWebsite && !website) {
    fieldErrors.website = "Сайтът трябва да е валиден http или https URL.";
  }

  if (phone.length > 40) {
    fieldErrors.phone = "Телефонът трябва да е до 40 символа.";
  }

  const hasLogo = logo instanceof File && logo.size > 0;

  if (hasLogo) {
    if (!LOGO_TYPES.has(logo.type)) {
      fieldErrors.logo = "Логото трябва да е PNG, JPG, WebP или SVG.";
    }

    if (logo.size > MAX_LOGO_SIZE) {
      fieldErrors.logo = "Логото трябва да е до 2 MB.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Поправи маркираните полета.",
      fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      message: "Влез в акаунта си, преди да създадеш бизнес профил.",
    };
  }

  const { data: existingPartnerMembership, error: partnerMembershipError } =
    await supabase
      .from("partner_users")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

  if (partnerMembershipError) {
    return {
      status: "error",
      message: localizeOnboardingError(partnerMembershipError.message),
    };
  }

  const { data: existingBusinessMembership, error: businessMembershipError } =
    await supabase
      .from("business_users")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

  if (businessMembershipError) {
    return {
      status: "error",
      message: localizeOnboardingError(businessMembershipError.message),
    };
  }

  if (existingPartnerMembership || existingBusinessMembership) {
    return {
      status: "success",
      message: "Работното пространство вече съществува. Отваряме таблото.",
    };
  }

  let logoUrl: string | null = null;

  if (hasLogo) {
    const extension = fileExtension(logo);
    const objectPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("partner-logos")
      .upload(objectPath, logo, {
        contentType: logo.type,
        upsert: false,
      });

    if (uploadError) {
      return {
        status: "error",
        message: "Качването на логото не успя.",
        fieldErrors: {
          logo: "Качването на логото не успя. Пробвай с по-малък файл или продължи без лого.",
        },
      };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("partner-logos").getPublicUrl(objectPath);

    logoUrl = publicUrl;
  }

  const { error } = await supabase.rpc("create_business_onboarding", {
    business_name: businessName,
    business_type: vertical,
    primary_color: primaryColor,
    website_url: website || null,
    phone_number: phone || null,
    logo_url: logoUrl,
  });

  if (error) {
    return {
      status: "error",
      message: localizeOnboardingError(error.message),
    };
  }

  return {
    status: "success",
    message: "Бизнес профилът е създаден. Отваряме таблото...",
  };
}
