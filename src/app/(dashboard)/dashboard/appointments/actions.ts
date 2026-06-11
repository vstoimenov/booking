"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  appointmentDateRange,
  appointmentStatusEventTypes,
  isAppointmentStatus,
  type AppointmentStatus,
} from "@/lib/appointments/format";
import { getCurrentUserBusiness } from "@/lib/business/current";
import { createClient } from "@/lib/supabase/server";

export type AppointmentActionFeedback = {
  status: "success" | "error";
  message: string;
};

export type ManualAppointmentFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<
    Record<
      | "customerId"
      | "customerName"
      | "customerPhone"
      | "customerEmail"
      | "serviceId"
      | "date"
      | "startTime"
      | "durationMinutes"
      | "notes",
      string
    >
  >;
};

type AppointmentForAction = {
  id: string;
  customer_id: string;
  lead_id: string | null;
  status: string;
};

type ServiceForAction = {
  id: string;
  duration_minutes: number;
};

type CustomerForAction = {
  id: string;
};

const initialManualAppointmentState: ManualAppointmentFormState = {
  status: "idle",
};

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function revalidateAppointmentViews(
  appointmentId: string,
  leadId?: string | null,
  customerId?: string | null,
) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/appointments");
  revalidatePath(`/dashboard/appointments/${appointmentId}`);
  revalidatePath("/dashboard/clients");

  if (leadId) {
    revalidatePath("/dashboard/leads");
    revalidatePath(`/dashboard/leads/${leadId}`);
  }

  if (customerId) {
    revalidatePath(`/dashboard/clients/${customerId}`);
  }
}

function eventTypeForStatus(status: AppointmentStatus) {
  if (status === "scheduled") {
    return "appointment_scheduled";
  }

  return appointmentStatusEventTypes[status];
}

async function findAppointmentForCurrentBusiness(appointmentId: string) {
  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    return {
      ok: false as const,
      current,
      appointment: null,
      message: current.message,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, customer_id, lead_id, status")
    .eq("id", appointmentId)
    .eq("business_id", current.business.id)
    .maybeSingle<AppointmentForAction>();

  if (error) {
    return {
      ok: false as const,
      current,
      appointment: null,
      message: error.message,
    };
  }

  if (!data) {
    return {
      ok: false as const,
      current,
      appointment: null,
      message: "Часът не беше намерен или нямаш достъп до него.",
    };
  }

  return {
    ok: true as const,
    current,
    appointment: data,
  };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  nextStatus: AppointmentStatus,
): Promise<AppointmentActionFeedback> {
  if (!isAppointmentStatus(nextStatus)) {
    return {
      status: "error",
      message: "Невалиден статус.",
    };
  }

  const result = await findAppointmentForCurrentBusiness(appointmentId);

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
    };
  }

  if (result.appointment.status === nextStatus) {
    return {
      status: "success",
      message: "Статусът вече е актуален.",
    };
  }

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status: nextStatus })
    .eq("id", appointmentId)
    .eq("business_id", result.current.business.id);

  if (updateError) {
    return {
      status: "error",
      message: updateError.message,
    };
  }

  if (
    result.appointment.lead_id &&
    (nextStatus === "completed" ||
      nextStatus === "cancelled" ||
      nextStatus === "no_show")
  ) {
    const { error: leadError } = await supabase
      .from("leads")
      .update({ status: nextStatus })
      .eq("id", result.appointment.lead_id)
      .eq("business_id", result.current.business.id);

    if (leadError) {
      return {
        status: "error",
        message: leadError.message,
      };
    }
  }

  const { error: eventError } = await supabase.from("events").insert({
    partner_id: result.current.business.partnerId,
    business_id: result.current.business.id,
    actor_profile_id: result.current.user.id,
    customer_id: result.appointment.customer_id,
    event_type: eventTypeForStatus(nextStatus),
    entity_table: "appointments",
    entity_id: appointmentId,
    properties: {
      from_status: result.appointment.status,
      to_status: nextStatus,
      lead_id: result.appointment.lead_id,
    },
  });

  if (eventError) {
    return {
      status: "error",
      message: eventError.message,
    };
  }

  revalidateAppointmentViews(
    appointmentId,
    result.appointment.lead_id,
    result.appointment.customer_id,
  );

  return {
    status: "success",
    message: "Статусът на часа е обновен.",
  };
}

function validateManualAppointmentForm(formData: FormData):
  | {
      ok: true;
      data: {
        customerId: string | null;
        customerName: string;
        customerPhone: string;
        customerEmail: string | null;
        serviceId: string;
        date: string;
        startTime: string;
        durationMinutes: number;
        notes: string | null;
      };
    }
  | { ok: false; state: ManualAppointmentFormState } {
  const customerId = cleanText(formData.get("customerId"));
  const customerName = cleanText(formData.get("customerName"));
  const customerPhone = cleanText(formData.get("customerPhone"));
  const customerEmail = cleanText(formData.get("customerEmail"));
  const serviceId = cleanText(formData.get("serviceId"));
  const date = cleanText(formData.get("date"));
  const startTime = cleanText(formData.get("startTime"));
  const durationRaw = cleanText(formData.get("durationMinutes"));
  const notes = cleanText(formData.get("notes"));
  const durationMinutes = Number(durationRaw);
  const fieldErrors: ManualAppointmentFormState["fieldErrors"] = {};
  const hasExistingCustomer = Boolean(customerId);

  if (customerId && !isUuid(customerId)) {
    fieldErrors.customerId = "Избери валиден клиент.";
  }

  if (!hasExistingCustomer) {
    if (!customerName || customerName.length < 2) {
      fieldErrors.customerName = "Името на клиента е задължително.";
    } else if (customerName.length > 120) {
      fieldErrors.customerName = "Името трябва да е до 120 символа.";
    }

    if (!customerPhone || customerPhone.length < 5) {
      fieldErrors.customerPhone = "Телефонът е задължителен за нов клиент.";
    } else if (customerPhone.length > 40) {
      fieldErrors.customerPhone = "Телефонът трябва да е до 40 символа.";
    }
  }

  if (customerEmail && (customerEmail.length > 160 || !isValidEmail(customerEmail))) {
    fieldErrors.customerEmail = "Имейлът не е валиден.";
  }

  if (!isUuid(serviceId)) {
    fieldErrors.serviceId = "Избери услуга.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    fieldErrors.date = "Избери дата.";
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
      customerId: customerId || null,
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      serviceId,
      date,
      startTime,
      durationMinutes,
      notes: notes || null,
    },
  };
}

export async function createManualAppointment(
  previousState: ManualAppointmentFormState = initialManualAppointmentState,
  formData: FormData,
): Promise<ManualAppointmentFormState> {
  void previousState;

  const validated = validateManualAppointmentForm(formData);

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
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, duration_minutes")
    .eq("id", validated.data.serviceId)
    .eq("business_id", current.business.id)
    .maybeSingle<ServiceForAction>();

  if (serviceError) {
    return {
      status: "error",
      message: serviceError.message,
    };
  }

  if (!service) {
    return {
      status: "error",
      message: "Услугата не беше намерена или нямаш достъп до нея.",
    };
  }

  let customerId = validated.data.customerId;

  if (customerId) {
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("id", customerId)
      .eq("business_id", current.business.id)
      .maybeSingle<CustomerForAction>();

    if (customerError) {
      return {
        status: "error",
        message: customerError.message,
      };
    }

    if (!customer) {
      return {
        status: "error",
        message: "Клиентът не беше намерен или нямаш достъп до него.",
      };
    }
  } else {
    const { data: newCustomer, error: customerCreateError } = await supabase
      .from("customers")
      .insert({
        business_id: current.business.id,
        full_name: validated.data.customerName,
        email: validated.data.customerEmail,
        phone: validated.data.customerPhone,
        source: "manual",
      })
      .select("id")
      .single<CustomerForAction>();

    if (customerCreateError) {
      return {
        status: "error",
        message: customerCreateError.message,
      };
    }

    customerId = newCustomer.id;
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

  const { count: overlapCount, error: overlapError } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("business_id", current.business.id)
    .in("status", ["scheduled", "confirmed"])
    .lt("starts_at", dateRange.endsAt)
    .gt("ends_at", dateRange.startsAt);

  if (overlapError) {
    return {
      status: "error",
      message: overlapError.message,
    };
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .insert({
      business_id: current.business.id,
      customer_id: customerId,
      service_id: service.id,
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

  const { error: eventError } = await supabase.from("events").insert({
    partner_id: current.business.partnerId,
    business_id: current.business.id,
    actor_profile_id: current.user.id,
    customer_id: customerId,
    event_type: "appointment_created",
    entity_table: "appointments",
    entity_id: appointment.id,
    properties: {
      source: "manual",
      service_id: service.id,
      start_time: dateRange.startsAt,
      duration_minutes: validated.data.durationMinutes,
      overlap_detected: (overlapCount ?? 0) > 0,
    },
  });

  if (eventError) {
    return {
      status: "error",
      message: eventError.message,
    };
  }

  revalidateAppointmentViews(appointment.id, null, customerId);
  redirect(`/dashboard/appointments/${appointment.id}`);
}
