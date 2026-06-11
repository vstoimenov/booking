"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUserBusiness } from "@/lib/business/current";
import { isLeadStatus, type LeadStatus } from "@/lib/leads/format";
import { createClient } from "@/lib/supabase/server";

export type LeadActionFeedback = {
  status: "success" | "error";
  message: string;
};

export type AppointmentFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<
    Record<"date" | "startTime" | "durationMinutes" | "notes", string>
  >;
};

type LeadForAction = {
  id: string;
  customer_id: string | null;
  service_id: string | null;
  status: string;
};

type LeadWithServiceForAction = LeadForAction & {
  service:
    | {
        id: string;
        duration_minutes: number;
      }
    | Array<{
        id: string;
        duration_minutes: number;
      }>
    | null;
};

const initialAppointmentState: AppointmentFormState = {
  status: "idle",
};

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function relationValue<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function revalidateLeadViews(leadId: string, customerId?: string | null) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
  revalidatePath(`/dashboard/leads/${leadId}`);

  if (customerId) {
    revalidatePath("/dashboard/clients");
    revalidatePath(`/dashboard/clients/${customerId}`);
  }
}

async function findLeadForCurrentBusiness(leadId: string) {
  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    return {
      ok: false as const,
      current,
      lead: null,
      message: current.message,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, customer_id, service_id, status")
    .eq("id", leadId)
    .eq("business_id", current.business.id)
    .maybeSingle<LeadForAction>();

  if (error) {
    return {
      ok: false as const,
      current,
      lead: null,
      message: error.message,
    };
  }

  if (!data) {
    return {
      ok: false as const,
      current,
      lead: null,
      message: "Запитването не беше намерено или нямаш достъп до него.",
    };
  }

  return {
    ok: true as const,
    current,
    lead: data,
  };
}

export async function updateLeadStatus(
  leadId: string,
  nextStatus: LeadStatus,
): Promise<LeadActionFeedback> {
  if (!isLeadStatus(nextStatus)) {
    return {
      status: "error",
      message: "Невалиден статус.",
    };
  }

  const result = await findLeadForCurrentBusiness(leadId);

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
    };
  }

  if (result.lead.status === nextStatus) {
    return {
      status: "success",
      message: "Статусът вече е актуален.",
    };
  }

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("leads")
    .update({ status: nextStatus })
    .eq("id", leadId)
    .eq("business_id", result.current.business.id);

  if (updateError) {
    return {
      status: "error",
      message: updateError.message,
    };
  }

  const { error: eventError } = await supabase.from("events").insert({
    partner_id: result.current.business.partnerId,
    business_id: result.current.business.id,
    actor_profile_id: result.current.user.id,
    customer_id: result.lead.customer_id,
    event_type: "lead_status_changed",
    entity_table: "leads",
    entity_id: leadId,
    properties: {
      from_status: result.lead.status,
      to_status: nextStatus,
    },
  });

  if (eventError) {
    return {
      status: "error",
      message: eventError.message,
    };
  }

  revalidateLeadViews(leadId, result.lead.customer_id);

  return {
    status: "success",
    message: "Статусът е обновен.",
  };
}

function validateAppointmentForm(formData: FormData):
  | {
      ok: true;
      data: {
        date: string;
        startTime: string;
        durationMinutes: number;
        notes: string | null;
      };
    }
  | { ok: false; state: AppointmentFormState } {
  const date = cleanText(formData.get("date"));
  const startTime = cleanText(formData.get("startTime"));
  const durationRaw = cleanText(formData.get("durationMinutes"));
  const notes = cleanText(formData.get("notes"));
  const durationMinutes = Number(durationRaw);
  const fieldErrors: AppointmentFormState["fieldErrors"] = {};

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    fieldErrors.date = "Избери дата за часа.";
  }

  if (!/^\d{2}:\d{2}$/.test(startTime)) {
    fieldErrors.startTime = "Избери начален час.";
  }

  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0 ||
    durationMinutes > 720
  ) {
    fieldErrors.durationMinutes =
      "Продължителността трябва да е между 1 и 720 минути.";
  }

  if (notes.length > 1000) {
    fieldErrors.notes = "Бележките трябва да са до 1000 символа.";
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
      date,
      startTime,
      durationMinutes,
      notes: notes || null,
    },
  };
}

function appointmentDateRange(date: string, startTime: string, durationMinutes: number) {
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

export async function createAppointmentFromLead(
  leadId: string,
  previousState: AppointmentFormState = initialAppointmentState,
  formData: FormData,
): Promise<AppointmentFormState> {
  void previousState;

  const validated = validateAppointmentForm(formData);

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
  const { data: leadData, error: leadError } = await supabase
    .from("leads")
    .select("id, customer_id, service_id, status, service:services(id, duration_minutes)")
    .eq("id", leadId)
    .eq("business_id", current.business.id)
    .maybeSingle<LeadWithServiceForAction>();

  if (leadError) {
    return {
      status: "error",
      message: leadError.message,
    };
  }

  if (!leadData) {
    return {
      status: "error",
      message: "Запитването не беше намерено или нямаш достъп до него.",
    };
  }

  if (!leadData.customer_id) {
    return {
      status: "error",
      message: "Запитването няма свързан клиент.",
    };
  }

  const { data: existingAppointment, error: existingAppointmentError } =
    await supabase
      .from("appointments")
      .select("id")
      .eq("business_id", current.business.id)
      .eq("lead_id", leadId)
      .limit(1)
      .maybeSingle<{ id: string }>();

  if (existingAppointmentError) {
    return {
      status: "error",
      message: existingAppointmentError.message,
    };
  }

  if (existingAppointment) {
    return {
      status: "error",
      message: "Това запитване вече има създаден час.",
    };
  }

  const dateRange = appointmentDateRange(
    validated.data.date,
    validated.data.startTime,
    validated.data.durationMinutes,
  );

  if (!dateRange) {
    return {
      status: "error",
      message: "Датата или часът са невалидни.",
    };
  }

  const service = relationValue(leadData.service);
  const serviceId = service?.id ?? leadData.service_id;
  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .insert({
      business_id: current.business.id,
      customer_id: leadData.customer_id,
      service_id: serviceId,
      lead_id: leadId,
      assigned_profile_id: current.user.id,
      starts_at: dateRange.startsAt,
      ends_at: dateRange.endsAt,
      status: "scheduled",
      notes: validated.data.notes,
    })
    .select("id")
    .single<{ id: string }>();

  if (appointmentError) {
    return {
      status: "error",
      message: appointmentError.message,
    };
  }

  const { error: leadUpdateError } = await supabase
    .from("leads")
    .update({ status: "booked" })
    .eq("id", leadId)
    .eq("business_id", current.business.id);

  if (leadUpdateError) {
    return {
      status: "error",
      message: leadUpdateError.message,
    };
  }

  const { error: eventError } = await supabase.from("events").insert({
    partner_id: current.business.partnerId,
    business_id: current.business.id,
    actor_profile_id: current.user.id,
    customer_id: leadData.customer_id,
    event_type: "appointment_created",
    entity_table: "appointments",
    entity_id: appointment.id,
    properties: {
      lead_id: leadId,
      previous_lead_status: leadData.status,
      start_time: dateRange.startsAt,
      duration_minutes: validated.data.durationMinutes,
    },
  });

  if (eventError) {
    return {
      status: "error",
      message: eventError.message,
    };
  }

  revalidateLeadViews(leadId, leadData.customer_id);

  return {
    status: "success",
    message: "Часът е създаден и запитването е маркирано като записано.",
  };
}
