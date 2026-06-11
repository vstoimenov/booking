"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUserBusiness } from "@/lib/business/current";
import { isUuid } from "@/lib/customers/format";
import { createClient } from "@/lib/supabase/server";

export type ClientFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<
    Record<"fullName" | "phone" | "email" | "notes" | "source", string>
  >;
};

type ValidClientInput = {
  fullName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  source: string;
};

const initialClientState: ClientFormState = {
  status: "idle",
};

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateClientForm(formData: FormData):
  | { ok: true; data: ValidClientInput }
  | { ok: false; state: ClientFormState } {
  const fullName = cleanText(formData.get("fullName"));
  const phone = cleanText(formData.get("phone"));
  const email = cleanText(formData.get("email")).toLowerCase();
  const notes = cleanText(formData.get("notes"));
  const source = cleanText(formData.get("source")) || "manual";
  const fieldErrors: ClientFormState["fieldErrors"] = {};

  if (!fullName || fullName.length < 2) {
    fieldErrors.fullName = "Името на клиента е задължително.";
  } else if (fullName.length > 120) {
    fieldErrors.fullName = "Името трябва да е до 120 символа.";
  }

  if (!phone || phone.length < 5) {
    fieldErrors.phone = "Телефонът е задължителен.";
  } else if (phone.length > 40 || !/^[0-9+()\-\s.]{5,40}$/.test(phone)) {
    fieldErrors.phone = "Въведи валиден телефон.";
  }

  if (email && (email.length > 160 || !isValidEmail(email))) {
    fieldErrors.email = "Имейлът не е валиден.";
  }

  if (notes.length > 1000) {
    fieldErrors.notes = "Бележките трябва да са до 1000 символа.";
  }

  if (source.length > 80 || !/^[a-zA-Z0-9_-]+$/.test(source)) {
    fieldErrors.source = "Избери валиден източник.";
  }

  if (Object.keys(fieldErrors).length > 0) {
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
      fullName,
      phone,
      email: email || null,
      notes: notes || null,
      source,
    },
  };
}

export async function updateClient(
  clientId: string,
  previousState: ClientFormState = initialClientState,
  formData: FormData,
): Promise<ClientFormState> {
  void previousState;

  if (!isUuid(clientId)) {
    return {
      status: "error",
      message: "Невалиден клиент.",
    };
  }

  const validated = validateClientForm(formData);

  if (!validated.ok) {
    return validated.state;
  }

  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    return {
      status: "error",
      message: current.message,
    };
  }

  const supabase = await createClient();
  const { data: client, error } = await supabase
    .from("customers")
    .update({
      full_name: validated.data.fullName,
      phone: validated.data.phone,
      email: validated.data.email,
      notes: validated.data.notes,
      source: validated.data.source,
    })
    .eq("id", clientId)
    .eq("business_id", current.business.id)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  if (!client) {
    return {
      status: "error",
      message: "Клиентът не беше намерен или нямаш достъп до него.",
    };
  }

  const { error: eventError } = await supabase.from("events").insert({
    partner_id: current.business.partnerId,
    business_id: current.business.id,
    actor_profile_id: current.user.id,
    customer_id: clientId,
    event_type: "customer_updated",
    entity_table: "customers",
    entity_id: clientId,
    properties: {
      source: validated.data.source,
    },
  });

  if (eventError) {
    return {
      status: "error",
      message: eventError.message,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);

  return {
    status: "success",
    message: "Клиентът е обновен.",
  };
}
