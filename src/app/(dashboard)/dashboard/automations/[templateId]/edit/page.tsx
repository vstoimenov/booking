import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AutomationTemplateForm } from "@/components/automations/automation-template-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatAutomationType,
  normalizeAutomationChannel,
  normalizeAutomationTemplateType,
} from "@/lib/automations/templates";
import { getCurrentUserBusiness } from "@/lib/business/current";
import { isUuid } from "@/lib/customers/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AutomationEditPageProps = {
  params: Promise<{ templateId: string }>;
};

type AutomationTemplateRow = {
  id: string;
  type: string;
  channel: string;
  name: string;
  subject: string | null;
  body: string;
  is_active: boolean;
};

function AutomationEditError({ message }: { message: string }) {
  return (
    <Card className="border-[#efb3a5] bg-[#fff7f4]">
      <CardHeader>
        <CardTitle>Не успяхме да заредим шаблона</CardTitle>
        <CardDescription className="text-[#8f3a25]">{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function AutomationTemplateEditPage({
  params,
}: AutomationEditPageProps) {
  const { templateId } = await params;

  if (!isUuid(templateId)) {
    notFound();
  }

  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect(`/login?next=/dashboard/automations/${templateId}/edit`);
    }

    if (current.reason === "missing_business") {
      redirect("/onboarding");
    }

    return <AutomationEditError message={current.message} />;
  }

  const supabase = await createClient();
  const { data: template, error } = await supabase
    .from("automation_templates")
    .select("id, type, channel, name, subject, body, is_active")
    .eq("id", templateId)
    .eq("business_id", current.business.id)
    .eq("scope", "business")
    .maybeSingle<AutomationTemplateRow>();

  if (error) {
    return <AutomationEditError message={error.message} />;
  }

  if (!template) {
    notFound();
  }

  const normalizedType = normalizeAutomationTemplateType(template.type);
  const normalizedChannel = normalizeAutomationChannel(template.channel);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="min-w-0">
        <Button
          asChild
          variant="ghost"
          className="mb-3 justify-start px-0 text-[#575048] hover:bg-transparent"
        >
          <Link href="/dashboard/automations">
            <ArrowLeft className="size-4" />
            Обратно към автоматизациите
          </Link>
        </Button>
        <Badge className="mb-3 border-[#b9d8c5] bg-[#edf8f0] text-[#245d36] hover:bg-[#edf8f0]">
          {formatAutomationType(normalizedType)}
        </Badge>
        <h1 className="break-words text-3xl font-semibold tracking-normal sm:text-4xl">
          {template.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69655e] sm:text-base">
          Редактирай шаблона, виж preview и копирай примерното съобщение.
        </p>
      </div>

      <AutomationTemplateForm
        templateId={template.id}
        initialValues={{
          name: template.name,
          type: normalizedType,
          channel: normalizedChannel,
          subject: template.subject ?? "",
          body: template.body,
          isActive: template.is_active,
        }}
      />
    </div>
  );
}
