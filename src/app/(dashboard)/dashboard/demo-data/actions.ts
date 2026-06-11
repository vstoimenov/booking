"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUserBusiness } from "@/lib/business/current";
import { createClient } from "@/lib/supabase/server";

export type DemoDataActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

type ExistingDemoMarkerRow = {
  id: string;
};

type ExistingServiceRow = {
  id: string;
};

const demoServiceNames = [
  "Консултация и план (демо)",
  "Основна процедура (демо)",
  "Премиум пакет (демо)",
];

function actionError(message: string): DemoDataActionState {
  return {
    status: "error",
    message,
  };
}

function dateOnly(daysFromNow: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);

  return date.toISOString().slice(0, 10);
}

function appointmentDateTime(daysFromNow: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);

  return date.toISOString();
}

function appointmentEnd(startsAt: string, durationMinutes: number) {
  return new Date(
    new Date(startsAt).getTime() + durationMinutes * 60_000,
  ).toISOString();
}

function revalidateDemoDataViews() {
  [
    "/dashboard",
    "/dashboard/demo-data",
    "/dashboard/services",
    "/dashboard/leads",
    "/dashboard/appointments",
    "/dashboard/clients",
    "/dashboard/reviews",
    "/dashboard/analytics",
    "/dashboard/automations",
  ].forEach((path) => revalidatePath(path));
}

export async function createDemoData(
  previousState: DemoDataActionState,
): Promise<DemoDataActionState> {
  void previousState;

  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    return actionError(current.message);
  }

  const supabase = await createClient();
  const { data: marker, error: markerError } = await supabase
    .from("events")
    .select("id")
    .eq("business_id", current.business.id)
    .eq("event_type", "demo_data_seeded")
    .limit(1)
    .maybeSingle<ExistingDemoMarkerRow>();

  if (markerError) {
    return actionError(markerError.message);
  }

  if (marker) {
    return {
      status: "success",
      message: "Примерните данни вече са добавени към този бизнес.",
    };
  }

  const { data: existingDemoServices, error: existingServicesError } =
    await supabase
      .from("services")
      .select("id")
      .eq("business_id", current.business.id)
      .in("name", demoServiceNames)
      .limit(1);

  if (existingServicesError) {
    return actionError(existingServicesError.message);
  }

  if (((existingDemoServices ?? []) as ExistingServiceRow[]).length > 0) {
    return {
      status: "success",
      message:
        "Изглежда примерните данни вече са започнати за този бизнес. Няма да ги дублираме.",
    };
  }

  const serviceIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
  const customerIds = [
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID(),
  ];
  const leadIds = [
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID(),
  ];
  const appointmentIds = [
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID(),
  ];
  const reviewIds = [crypto.randomUUID(), crypto.randomUUID()];

  const services = [
    {
      id: serviceIds[0],
      business_id: current.business.id,
      name: demoServiceNames[0],
      description:
        "Кратка първа среща за уточняване на нуждите и избор на най-подходяща услуга.",
      duration_minutes: 45,
      price_cents: 3500,
      currency: "BGN",
      is_active: true,
      sort_order: 10,
    },
    {
      id: serviceIds[1],
      business_id: current.business.id,
      name: demoServiceNames[1],
      description:
        "Най-често резервираната услуга, подходяща за първо посещение.",
      duration_minutes: 60,
      price_cents: 6500,
      currency: "BGN",
      is_active: true,
      sort_order: 20,
    },
    {
      id: serviceIds[2],
      business_id: current.business.id,
      name: demoServiceNames[2],
      description:
        "Разширена услуга с повече време за персонален подход и follow-up.",
      duration_minutes: 90,
      price_cents: 11000,
      currency: "BGN",
      is_active: true,
      sort_order: 30,
    },
  ];

  const customers = [
    {
      id: customerIds[0],
      business_id: current.business.id,
      full_name: "Мария Иванова",
      email: "maria.demo@example.com",
      phone: "+359 88 700 1122",
      source: "instagram",
      notes: "Идва от Instagram линка. Интересува се от основната услуга.",
    },
    {
      id: customerIds[1],
      business_id: current.business.id,
      full_name: "Елена Петрова",
      email: "elena.demo@example.com",
      phone: "+359 89 555 2030",
      source: "booking_page",
      notes: "Иска час след работа.",
    },
    {
      id: customerIds[2],
      business_id: current.business.id,
      full_name: "Николай Димитров",
      email: "nikolay.demo@example.com",
      phone: "+359 87 441 7788",
      source: "google",
      notes: "Намерил бизнеса през Google профила.",
    },
    {
      id: customerIds[3],
      business_id: current.business.id,
      full_name: "Силвия Георгиева",
      email: null,
      phone: "+359 88 912 4455",
      source: "facebook",
      notes: "Пита за премиум пакет.",
    },
    {
      id: customerIds[4],
      business_id: current.business.id,
      full_name: "Даниела Стоянова",
      email: "daniela.demo@example.com",
      phone: "+359 89 220 3344",
      source: "tiktok",
      notes: "Нов клиент от TikTok bio линка.",
    },
  ];

  const leads = [
    {
      id: leadIds[0],
      business_id: current.business.id,
      customer_id: customerIds[0],
      service_id: serviceIds[1],
      assigned_profile_id: current.user.id,
      source: "instagram",
      status: "new",
      priority: "high",
      preferred_date: dateOnly(2),
      preferred_time: "11:00",
      message: "Здравейте, бих искала час за основната процедура тази седмица.",
    },
    {
      id: leadIds[1],
      business_id: current.business.id,
      customer_id: customerIds[1],
      service_id: serviceIds[0],
      assigned_profile_id: current.user.id,
      source: "booking_page",
      status: "contacted",
      priority: "normal",
      preferred_date: dateOnly(3),
      preferred_time: "18:30",
      message: "Може ли час след 18:00?",
    },
    {
      id: leadIds[2],
      business_id: current.business.id,
      customer_id: customerIds[2],
      service_id: serviceIds[1],
      assigned_profile_id: current.user.id,
      source: "google",
      status: "booked",
      priority: "normal",
      preferred_date: dateOnly(5),
      preferred_time: "13:00",
      message: "Предпочитам обедните часове.",
    },
    {
      id: leadIds[3],
      business_id: current.business.id,
      customer_id: customerIds[3],
      service_id: serviceIds[2],
      assigned_profile_id: current.user.id,
      source: "facebook",
      status: "completed",
      priority: "normal",
      preferred_date: dateOnly(-7),
      preferred_time: "10:00",
      message: "Интересувам се от премиум пакета.",
    },
    {
      id: leadIds[4],
      business_id: current.business.id,
      customer_id: customerIds[4],
      service_id: serviceIds[0],
      assigned_profile_id: current.user.id,
      source: "tiktok",
      status: "cancelled",
      priority: "low",
      preferred_date: dateOnly(-2),
      preferred_time: "16:00",
      message: "Промени ми се графикът, ще пиша пак.",
    },
    {
      id: leadIds[5],
      business_id: current.business.id,
      customer_id: customerIds[0],
      service_id: serviceIds[2],
      assigned_profile_id: current.user.id,
      source: "manual",
      status: "no_show",
      priority: "normal",
      preferred_date: dateOnly(-1),
      preferred_time: "15:00",
      message: "Ръчно добавена заявка след телефонен разговор.",
    },
  ];

  const startsAt = [
    appointmentDateTime(1, 10),
    appointmentDateTime(5, 13),
    appointmentDateTime(-7, 10),
    appointmentDateTime(-2, 16),
    appointmentDateTime(-1, 15),
  ];
  const appointments = [
    {
      id: appointmentIds[0],
      business_id: current.business.id,
      customer_id: customerIds[1],
      service_id: serviceIds[0],
      lead_id: leadIds[1],
      assigned_profile_id: current.user.id,
      starts_at: startsAt[0],
      ends_at: appointmentEnd(startsAt[0], 45),
      status: "confirmed",
      notes: "Потвърден час за утре. Клиентът предпочита обаждане.",
    },
    {
      id: appointmentIds[1],
      business_id: current.business.id,
      customer_id: customerIds[2],
      service_id: serviceIds[1],
      lead_id: leadIds[2],
      assigned_profile_id: current.user.id,
      starts_at: startsAt[1],
      ends_at: appointmentEnd(startsAt[1], 60),
      status: "scheduled",
      notes: "Създаден от заявка през Google.",
    },
    {
      id: appointmentIds[2],
      business_id: current.business.id,
      customer_id: customerIds[3],
      service_id: serviceIds[2],
      lead_id: leadIds[3],
      assigned_profile_id: current.user.id,
      starts_at: startsAt[2],
      ends_at: appointmentEnd(startsAt[2], 90),
      status: "completed",
      notes: "Успешно завършен час. Подходящ за заявка за отзив.",
    },
    {
      id: appointmentIds[3],
      business_id: current.business.id,
      customer_id: customerIds[4],
      service_id: serviceIds[0],
      lead_id: leadIds[4],
      assigned_profile_id: current.user.id,
      starts_at: startsAt[3],
      ends_at: appointmentEnd(startsAt[3], 45),
      status: "cancelled",
      notes: "Клиентът отмени предварително.",
    },
    {
      id: appointmentIds[4],
      business_id: current.business.id,
      customer_id: customerIds[0],
      service_id: serviceIds[2],
      lead_id: leadIds[5],
      assigned_profile_id: current.user.id,
      starts_at: startsAt[4],
      ends_at: appointmentEnd(startsAt[4], 90),
      status: "no_show",
      notes: "Клиентът не се яви. Добър пример за no-show статистика.",
    },
  ];

  const reviews = [
    {
      id: reviewIds[0],
      business_id: current.business.id,
      customer_id: customerIds[3],
      appointment_id: appointmentIds[2],
      status: "submitted",
      rating: 5,
      review_url: "https://example.com/reviews/localops-demo",
      requested_at: appointmentDateTime(-6, 12),
      responded_at: appointmentDateTime(-5, 9),
    },
    {
      id: reviewIds[1],
      business_id: current.business.id,
      customer_id: customerIds[1],
      appointment_id: appointmentIds[0],
      status: "requested",
      rating: null,
      review_url: null,
      requested_at: appointmentDateTime(1, 12),
      responded_at: null,
    },
  ];

  const { error: servicesError } = await supabase.from("services").insert(services);

  if (servicesError) {
    return actionError(servicesError.message);
  }

  const { error: customersError } = await supabase
    .from("customers")
    .insert(customers);

  if (customersError) {
    return actionError(customersError.message);
  }

  const { error: leadsError } = await supabase.from("leads").insert(leads);

  if (leadsError) {
    return actionError(leadsError.message);
  }

  const { error: appointmentsError } = await supabase
    .from("appointments")
    .insert(appointments);

  if (appointmentsError) {
    return actionError(appointmentsError.message);
  }

  const { error: reviewsError } = await supabase.from("reviews").insert(reviews);

  if (reviewsError) {
    return actionError(reviewsError.message);
  }

  const activityEvents = [
    ...leads.map((lead) => ({
      partner_id: current.business.partnerId,
      business_id: current.business.id,
      actor_profile_id: current.user.id,
      customer_id: lead.customer_id,
      event_type: "lead_created",
      entity_table: "leads",
      entity_id: lead.id,
      properties: {
        source: lead.source,
        service_id: lead.service_id,
        demo_data: true,
      },
    })),
    ...appointments.map((appointment) => ({
      partner_id: current.business.partnerId,
      business_id: current.business.id,
      actor_profile_id: current.user.id,
      customer_id: appointment.customer_id,
      event_type:
        appointment.status === "completed"
          ? "appointment_completed"
          : "appointment_created",
      entity_table: "appointments",
      entity_id: appointment.id,
      properties: {
        status: appointment.status,
        service_id: appointment.service_id,
        lead_id: appointment.lead_id,
        demo_data: true,
      },
    })),
    ...reviews.map((review) => ({
      partner_id: current.business.partnerId,
      business_id: current.business.id,
      actor_profile_id: current.user.id,
      customer_id: review.customer_id,
      event_type: "review_requested",
      entity_table: "reviews",
      entity_id: review.id,
      properties: {
        status: review.status,
        appointment_id: review.appointment_id,
        demo_data: true,
      },
    })),
    {
      partner_id: current.business.partnerId,
      business_id: current.business.id,
      actor_profile_id: current.user.id,
      customer_id: null,
      event_type: "demo_data_seeded",
      entity_table: "businesses",
      entity_id: current.business.id,
      properties: {
        version: 1,
        services: services.length,
        customers: customers.length,
        leads: leads.length,
        appointments: appointments.length,
        reviews: reviews.length,
      },
    },
  ];

  const { error: eventsError } = await supabase.from("events").insert(activityEvents);

  if (eventsError) {
    return actionError(eventsError.message);
  }

  revalidateDemoDataViews();

  return {
    status: "success",
    message: "Примерните данни са добавени успешно към текущия бизнес.",
  };
}
