"use server";

import { revalidatePath } from "next/cache";

import {
  defaultAutomationTemplates,
  isAutomationChannel,
  isAutomationTemplateType,
  type AutomationChannel,
  type AutomationTemplateType,
} from "@/lib/automations/templates";
import { getCurrentUserBusiness } from "@/lib/business/current";
import { isUuid } from "@/lib/customers/format";
import { createClient } from "@/lib/supabase/server";

export type AutomationActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<
    Record<"name" | "type" | "channel" | "subject" | "body", string>
  >;
};

type ExistingTemplateRow = {
  type: string;
};

type TemplateRow = {
  id: string;
  type: string;
  channel: string;
  name: string;
  subject: string | null;
  body: string;
  is_active: boolean;
};

const idleState: AutomationActionState = {
  status: "idle",
};

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function actionError(message: string): AutomationActionState {
  return {
    status: "error",
    message,
  };
}

function revalidateAutomationViews(templateId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/automations");

  if (templateId) {
    revalidatePath(`/dashboard/automations/${templateId}/edit`);
  }
}

export async function createDefaultAutomationTemplates(
  previousState: AutomationActionState = idleState,
): Promise<AutomationActionState> {
  void previousState;

  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    return actionError(current.message);
  }

  const supabase = await createClient();
  const { data: existingData, error: existingError } = await supabase
    .from("automation_templates")
    .select("type")
    .eq("business_id", current.business.id)
    .eq("scope", "business")
    .limit(50);

  if (existingError) {
    return actionError(existingError.message);
  }

  const existingTypes = new Set(
    ((existingData ?? []) as ExistingTemplateRow[]).map((template) => template.type),
  );
  const missingTemplates = defaultAutomationTemplates.filter(
    (template) => !existingTypes.has(template.type),
  );

  if (missingTemplates.length === 0) {
    return {
      status: "success",
      message: "Стандартните шаблони вече са създадени.",
    };
  }

  const { error: insertError } = await supabase.from("automation_templates").insert(
    missingTemplates.map((template) => ({
      partner_id: current.business.partnerId,
      business_id: current.business.id,
      scope: "business",
      type: template.type,
      channel: template.channel,
      name: template.name,
      subject: template.subject,
      body: template.body,
      delay_minutes: template.delayMinutes,
      is_active: template.isActive,
    })),
  );

  if (insertError) {
    return actionError(insertError.message);
  }

  await supabase.from("events").insert({
    partner_id: current.business.partnerId,
    business_id: current.business.id,
    actor_profile_id: current.user.id,
    event_type: "automation_templates_created",
    entity_table: "automation_templates",
    properties: {
      count: missingTemplates.length,
      types: missingTemplates.map((template) => template.type),
    },
  });

  revalidateAutomationViews();

  return {
    status: "success",
    message: "Стандартните шаблони са създадени.",
  };
}

function validateTemplateForm(formData: FormData):
  | {
      ok: true;
      data: {
        name: string;
        type: AutomationTemplateType;
        channel: AutomationChannel;
        subject: string | null;
        body: string;
        isActive: boolean;
      };
    }
  | { ok: false; state: AutomationActionState } {
  const name = cleanText(formData.get("name"));
  const type = cleanText(formData.get("type"));
  const channel = cleanText(formData.get("channel"));
  const subject = cleanText(formData.get("subject"));
  const body = cleanText(formData.get("body"));
  const fieldErrors: AutomationActionState["fieldErrors"] = {};

  if (!name) {
    fieldErrors.name = "Името е задължително.";
  } else if (name.length > 140) {
    fieldErrors.name = "Името трябва да е до 140 символа.";
  }

  if (!isAutomationTemplateType(type)) {
    fieldErrors.type = "Избери валиден тип шаблон.";
  }

  if (!isAutomationChannel(channel)) {
    fieldErrors.channel = "Избери валиден канал.";
  }

  if (subject.length > 160) {
    fieldErrors.subject = "Темата трябва да е до 160 символа.";
  }

  if (!body) {
    fieldErrors.body = "Съдържанието е задължително.";
  } else if (body.length > 1600) {
    fieldErrors.body = "Съдържанието трябва да е до 1600 символа.";
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
      name,
      type: type as AutomationTemplateType,
      channel: channel as AutomationChannel,
      subject: subject || null,
      body,
      isActive: formData.get("isActive") === "on",
    },
  };
}

export async function updateAutomationTemplate(
  templateId: string,
  previousState: AutomationActionState = idleState,
  formData: FormData,
): Promise<AutomationActionState> {
  void previousState;

  if (!isUuid(templateId)) {
    return actionError("Невалиден шаблон.");
  }

  const validation = validateTemplateForm(formData);

  if (!validation.ok) {
    return validation.state;
  }

  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    return actionError(current.message);
  }

  const supabase = await createClient();
  const { data: updated, error: updateError } = await supabase
    .from("automation_templates")
    .update({
      name: validation.data.name,
      type: validation.data.type,
      channel: validation.data.channel,
      subject: validation.data.subject,
      body: validation.data.body,
      is_active: validation.data.isActive,
    })
    .eq("id", templateId)
    .eq("business_id", current.business.id)
    .select("id, type, channel, name, subject, body, is_active")
    .maybeSingle<TemplateRow>();

  if (updateError) {
    return actionError(updateError.message);
  }

  if (!updated) {
    return actionError("Шаблонът не беше намерен или нямаш достъп до него.");
  }

  await supabase.from("events").insert({
    partner_id: current.business.partnerId,
    business_id: current.business.id,
    actor_profile_id: current.user.id,
    event_type: "automation_template_updated",
    entity_table: "automation_templates",
    entity_id: updated.id,
    properties: {
      type: updated.type,
      channel: updated.channel,
      is_active: updated.is_active,
    },
  });

  revalidateAutomationViews(updated.id);

  return {
    status: "success",
    message: "Шаблонът е запазен.",
  };
}
