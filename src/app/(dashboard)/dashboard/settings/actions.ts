"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUserBusiness } from "@/lib/business/current";
import { createClient } from "@/lib/supabase/server";

export type BusinessProfileFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  publicSlug?: string;
  fieldErrors?: Partial<
    Record<
      | "name"
      | "slug"
      | "vertical"
      | "description"
      | "phone"
      | "email"
      | "website"
      | "address"
      | "city",
      string
    >
  >;
};

export type BrandingFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  fieldErrors?: Partial<Record<"brandName" | "primaryColor" | "logo", string>>;
};

type ValidProfileInput = {
  name: string;
  slug: string;
  vertical: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  isActive: boolean;
};

type BrandingRow = {
  id: string;
  brand_name: string;
  primary_color: string;
  logo_url: string | null;
};

const profileInitialState: BusinessProfileFormState = {
  status: "idle",
};

const brandingInitialState: BrandingFormState = {
  status: "idle",
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

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeUrl(value: string) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
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

function workspaceErrorState(message: string): BusinessProfileFormState {
  return {
    status: "error",
    message,
  };
}

function brandingErrorState(message: string): BrandingFormState {
  return {
    status: "error",
    message,
  };
}

function validateProfileForm(formData: FormData):
  | { ok: true; data: ValidProfileInput }
  | { ok: false; state: BusinessProfileFormState } {
  const name = cleanText(formData.get("name"));
  const slug = normalizeSlug(cleanText(formData.get("slug")));
  const vertical = cleanText(formData.get("vertical")) || "beauty_wellness";
  const description = cleanText(formData.get("description"));
  const phone = cleanText(formData.get("phone"));
  const email = cleanText(formData.get("email")).toLowerCase();
  const websiteRaw = cleanText(formData.get("website"));
  const address = cleanText(formData.get("address"));
  const city = cleanText(formData.get("city"));
  const fieldErrors: BusinessProfileFormState["fieldErrors"] = {};

  if (!name) {
    fieldErrors.name = "Името на бизнеса е задължително.";
  } else if (name.length > 120) {
    fieldErrors.name = "Името трябва да е до 120 символа.";
  }

  if (!slug) {
    fieldErrors.slug = "Линкът е задължителен.";
  } else if (slug.length < 2 || slug.length > 140) {
    fieldErrors.slug = "Линкът трябва да е между 2 и 140 символа.";
  } else if (!/^[a-z0-9-]+$/.test(slug)) {
    fieldErrors.slug = "Използвай само малки латински букви, цифри и тирета.";
  }

  if (!VERTICALS.has(vertical)) {
    fieldErrors.vertical = "Избери валидна категория.";
  }

  if (description.length > 1000) {
    fieldErrors.description = "Описанието трябва да е до 1000 символа.";
  }

  if (phone && !/^[0-9+()\-\s.]{6,40}$/.test(phone)) {
    fieldErrors.phone = "Въведи валиден телефон.";
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Въведи валиден имейл.";
  }

  const website = normalizeUrl(websiteRaw);

  if (websiteRaw && !website) {
    fieldErrors.website = "Уебсайтът трябва да е валиден http или https URL.";
  }

  if (address.length > 240) {
    fieldErrors.address = "Адресът трябва да е до 240 символа.";
  }

  if (city.length > 120) {
    fieldErrors.city = "Градът трябва да е до 120 символа.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      state: {
        status: "error",
        message: "Поправи маркираните полета.",
        fieldErrors,
        publicSlug: slug,
      },
    };
  }

  return {
    ok: true,
    data: {
      name,
      slug,
      vertical,
      description: description || null,
      phone: phone || null,
      email: email || null,
      website,
      address: address || null,
      city: city || null,
      isActive: formData.get("isActive") === "on",
    },
  };
}

function profileUniquenessError(): BusinessProfileFormState {
  return {
    status: "error",
    message: "Този публичен линк вече е зает.",
    fieldErrors: {
      slug: "Избери друг линк.",
    },
  };
}

export async function updateBusinessProfile(
  previousState: BusinessProfileFormState = profileInitialState,
  formData: FormData,
): Promise<BusinessProfileFormState> {
  void previousState;

  const validated = validateProfileForm(formData);

  if (!validated.ok) {
    return validated.state;
  }

  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    return workspaceErrorState(current.message);
  }

  const supabase = await createClient();
  const { data: duplicateSlug, error: duplicateError } = await supabase
    .from("businesses")
    .select("id")
    .eq("public_slug", validated.data.slug)
    .neq("id", current.business.id)
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (duplicateError) {
    return workspaceErrorState(duplicateError.message);
  }

  if (duplicateSlug) {
    return profileUniquenessError();
  }

  const oldPublicSlug = current.business.publicSlug;
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .update({
      name: validated.data.name,
      slug: validated.data.slug,
      public_slug: validated.data.slug,
      vertical: validated.data.vertical,
      status: validated.data.isActive ? "active" : "paused",
      contact_email: validated.data.email,
      phone: validated.data.phone,
      address_line: validated.data.address,
      city: validated.data.city,
    })
    .eq("id", current.business.id)
    .eq("partner_id", current.business.partnerId)
    .select("id, public_slug")
    .maybeSingle<{ id: string; public_slug: string }>();

  if (businessError) {
    if (businessError.code === "23505") {
      return profileUniquenessError();
    }

    return workspaceErrorState(businessError.message);
  }

  if (!business) {
    return workspaceErrorState("Бизнесът не беше намерен или нямаш достъп до него.");
  }

  const { data: branding } = await supabase
    .from("branding_settings")
    .select("id, brand_name, primary_color, logo_url")
    .eq("business_id", current.business.id)
    .limit(1)
    .maybeSingle<BrandingRow>();

  if (branding) {
    const { error: brandingError } = await supabase
      .from("branding_settings")
      .update({
        website_url: validated.data.website,
        booking_page_title: validated.data.description,
      })
      .eq("id", branding.id)
      .eq("business_id", current.business.id);

    if (brandingError) {
      return workspaceErrorState(brandingError.message);
    }
  } else {
    const { error: brandingError } = await supabase
      .from("branding_settings")
      .insert({
        partner_id: current.business.partnerId,
        business_id: current.business.id,
        brand_name: validated.data.name,
        primary_color: "#16372f",
        website_url: validated.data.website,
        booking_page_title: validated.data.description,
      });

    if (brandingError) {
      return workspaceErrorState(brandingError.message);
    }
  }

  await supabase.from("events").insert({
    partner_id: current.business.partnerId,
    business_id: current.business.id,
    actor_profile_id: current.user.id,
    event_type: "business_profile_updated",
    entity_table: "businesses",
    entity_id: current.business.id,
    properties: {
      public_slug: validated.data.slug,
      previous_public_slug: oldPublicSlug,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/settings/profile");
  revalidatePath(`/b/${oldPublicSlug}`);
  revalidatePath(`/b/${validated.data.slug}`);

  return {
    status: "success",
    message: "Бизнес профилът е запазен.",
    publicSlug: business.public_slug,
  };
}

function validateBrandingForm(formData: FormData):
  | {
      ok: true;
      data: {
        brandName: string;
        primaryColor: string;
        logo: File | null;
      };
    }
  | { ok: false; state: BrandingFormState } {
  const brandName = cleanText(formData.get("brandName"));
  const primaryColor = cleanText(formData.get("primaryColor")).toLowerCase();
  const logo = formData.get("logo");
  const fieldErrors: BrandingFormState["fieldErrors"] = {};

  if (!brandName) {
    fieldErrors.brandName = "Името на бранда е задължително.";
  } else if (brandName.length > 120) {
    fieldErrors.brandName = "Името на бранда трябва да е до 120 символа.";
  }

  if (!/^#[0-9a-f]{6}$/.test(primaryColor)) {
    fieldErrors.primaryColor = "Избери валиден hex цвят.";
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
      ok: false,
      state: {
        status: "error",
        message: "Поправи маркираните полета.",
        fieldErrors,
        primaryColor,
      },
    };
  }

  return {
    ok: true,
    data: {
      brandName,
      primaryColor,
      logo: hasLogo ? logo : null,
    },
  };
}

export async function updateBrandingSettings(
  previousState: BrandingFormState = brandingInitialState,
  formData: FormData,
): Promise<BrandingFormState> {
  void previousState;

  const validated = validateBrandingForm(formData);

  if (!validated.ok) {
    return validated.state;
  }

  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    return brandingErrorState(current.message);
  }

  const supabase = await createClient();
  const { data: existingBranding, error: existingError } = await supabase
    .from("branding_settings")
    .select("id, brand_name, primary_color, logo_url")
    .eq("business_id", current.business.id)
    .limit(1)
    .maybeSingle<BrandingRow>();

  if (existingError) {
    return brandingErrorState(existingError.message);
  }

  let logoUrl = existingBranding?.logo_url ?? null;

  if (validated.data.logo) {
    const extension = fileExtension(validated.data.logo);
    const objectPath = `${current.user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("partner-logos")
      .upload(objectPath, validated.data.logo, {
        contentType: validated.data.logo.type,
        upsert: false,
      });

    if (uploadError) {
      return {
        status: "error",
        message: "Качването на логото не успя.",
        fieldErrors: {
          logo: "Пробвай с PNG, JPG, WebP или SVG до 2 MB.",
        },
        primaryColor: validated.data.primaryColor,
        logoUrl,
      };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("partner-logos").getPublicUrl(objectPath);

    logoUrl = publicUrl;
  }

  if (existingBranding) {
    const { error } = await supabase
      .from("branding_settings")
      .update({
        brand_name: validated.data.brandName,
        primary_color: validated.data.primaryColor,
        logo_url: logoUrl,
      })
      .eq("id", existingBranding.id)
      .eq("business_id", current.business.id);

    if (error) {
      return brandingErrorState(error.message);
    }
  } else {
    const { error } = await supabase.from("branding_settings").insert({
      partner_id: current.business.partnerId,
      business_id: current.business.id,
      brand_name: validated.data.brandName,
      primary_color: validated.data.primaryColor,
      logo_url: logoUrl,
    });

    if (error) {
      return brandingErrorState(error.message);
    }
  }

  await supabase.from("events").insert({
    partner_id: current.business.partnerId,
    business_id: current.business.id,
    actor_profile_id: current.user.id,
    event_type: "branding_updated",
    entity_table: "branding_settings",
    entity_id: existingBranding?.id ?? current.business.id,
    properties: {
      primary_color: validated.data.primaryColor,
      has_logo: Boolean(logoUrl),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/settings/branding");
  revalidatePath(`/b/${current.business.publicSlug}`);

  return {
    status: "success",
    message: "Брандингът е запазен.",
    logoUrl,
    primaryColor: validated.data.primaryColor,
  };
}
