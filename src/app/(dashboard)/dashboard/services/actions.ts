"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUserBusiness } from "@/lib/business/current";
import { createClient } from "@/lib/supabase/server";

export type ServiceFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<
    Record<"name" | "description" | "durationMinutes" | "price" | "currency", string>
  >;
};

export type ServiceActionFeedback = {
  status: "success" | "error";
  message: string;
};

type ValidServiceInput = {
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  isActive: boolean;
};

const emptyState: ServiceFormState = {
  status: "idle",
};

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function parsePriceCents(value: string) {
  const normalized = value.replace(",", ".");
  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.round(amount * 100);
}

function validateServiceForm(formData: FormData):
  | { ok: true; data: ValidServiceInput }
  | { ok: false; state: ServiceFormState } {
  const name = cleanText(formData.get("name"));
  const description = cleanText(formData.get("description"));
  const durationRaw = cleanText(formData.get("durationMinutes"));
  const priceRaw = cleanText(formData.get("price")) || "0";
  const currency = (cleanText(formData.get("currency")) || "BGN").toUpperCase();
  const fieldErrors: ServiceFormState["fieldErrors"] = {};
  const durationMinutes = Number(durationRaw);
  const priceCents = parsePriceCents(priceRaw);

  if (!name) {
    fieldErrors.name = "Името на услугата е задължително.";
  } else if (name.length > 120) {
    fieldErrors.name = "Името трябва да е до 120 символа.";
  }

  if (description.length > 1000) {
    fieldErrors.description = "Описанието трябва да е до 1000 символа.";
  }

  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0 ||
    durationMinutes > 720
  ) {
    fieldErrors.durationMinutes =
      "Продължителността трябва да е цяло число между 1 и 720 минути.";
  }

  if (priceCents === null || priceCents < 0) {
    fieldErrors.price = "Цената трябва да е 0 или положително число.";
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    fieldErrors.currency = "Валутата трябва да е с 3 букви, напр. BGN.";
  }

  if (Object.keys(fieldErrors).length > 0 || priceCents === null) {
    return {
      ok: false,
      state: {
        status: "error",
        message: "Поправи маркираните полета.",
        fieldErrors,
      },
    };
  }

  return {
    ok: true,
    data: {
      name,
      description: description || null,
      durationMinutes,
      priceCents,
      currency,
      isActive: formData.get("isActive") === "on",
    },
  };
}

function workspaceErrorState(message: string): ServiceFormState {
  return {
    status: "error",
    message,
  };
}

export async function createService(
  previousState: ServiceFormState = emptyState,
  formData: FormData,
): Promise<ServiceFormState> {
  void previousState;

  const validated = validateServiceForm(formData);

  if (!validated.ok) {
    return validated.state;
  }

  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    return workspaceErrorState(current.message);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    business_id: current.business.id,
    name: validated.data.name,
    description: validated.data.description,
    duration_minutes: validated.data.durationMinutes,
    price_cents: validated.data.priceCents,
    currency: validated.data.currency,
    is_active: validated.data.isActive,
  });

  if (error) {
    return workspaceErrorState(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/services");

  return {
    status: "success",
    message: "Услугата е добавена успешно.",
  };
}

export async function updateService(
  serviceId: string,
  previousState: ServiceFormState = emptyState,
  formData: FormData,
): Promise<ServiceFormState> {
  void previousState;

  const validated = validateServiceForm(formData);

  if (!validated.ok) {
    return validated.state;
  }

  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    return workspaceErrorState(current.message);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .update({
      name: validated.data.name,
      description: validated.data.description,
      duration_minutes: validated.data.durationMinutes,
      price_cents: validated.data.priceCents,
      currency: validated.data.currency,
      is_active: validated.data.isActive,
    })
    .eq("id", serviceId)
    .eq("business_id", current.business.id)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    return workspaceErrorState(error.message);
  }

  if (!data) {
    return workspaceErrorState("Услугата не беше намерена или нямаш достъп до нея.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/services");
  revalidatePath(`/dashboard/services/${serviceId}/edit`);

  return {
    status: "success",
    message: "Промените са запазени.",
  };
}

export async function deactivateService(
  serviceId: string,
): Promise<ServiceActionFeedback> {
  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    return {
      status: "error",
      message: current.message,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .update({ is_active: false })
    .eq("id", serviceId)
    .eq("business_id", current.business.id)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  if (!data) {
    return {
      status: "error",
      message: "Услугата не беше намерена или нямаш достъп до нея.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/services");

  return {
    status: "success",
    message: "Услугата е деактивирана.",
  };
}
