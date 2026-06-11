import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BellRing,
  Copy,
  Edit3,
  MessageSquareText,
} from "lucide-react";

import { CopyMessageButton } from "@/components/automations/copy-message-button";
import { DefaultTemplatesButton } from "@/components/automations/default-templates-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatAutomationChannel,
  formatAutomationType,
  renderAutomationTemplate,
} from "@/lib/automations/templates";
import { getCurrentUserBusiness } from "@/lib/business/current";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AutomationTemplateRow = {
  id: string;
  type: string;
  channel: string;
  name: string;
  subject: string | null;
  body: string;
  is_active: boolean;
  updated_at: string;
};

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function AutomationsError({ message }: { message: string }) {
  return (
    <Card className="border-[#efb3a5] bg-[#fff7f4]">
      <CardHeader>
        <CardTitle>Не успяхме да заредим автоматизациите</CardTitle>
        <CardDescription className="text-[#8f3a25]">{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function AutomationsPage() {
  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect("/login?next=/dashboard/automations");
    }

    if (current.reason === "missing_business") {
      redirect("/onboarding");
    }

    return <AutomationsError message={current.message} />;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automation_templates")
    .select("id, type, channel, name, subject, body, is_active, updated_at")
    .eq("business_id", current.business.id)
    .eq("scope", "business")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    return <AutomationsError message={error.message} />;
  }

  const templates = (data ?? []) as AutomationTemplateRow[];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Badge className="mb-3 border-[#b9d8c5] bg-[#edf8f0] text-[#245d36] hover:bg-[#edf8f0]">
            {current.business.name}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            Автоматизации
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69655e] sm:text-base">
            Шаблони за съобщения, които екипът може да преглежда, копира и
            използва ръчно. Реално изпращане към SMS, Viber или имейл не е
            включено в MVP.
          </p>
        </div>
        {templates.length > 0 ? <DefaultTemplatesButton /> : null}
      </div>

      {templates.length === 0 ? (
        <Card className="border-dashed border-[#d6cbbb] bg-[#fbfaf6]">
          <CardContent className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
            <BellRing className="size-10 text-[#a84b32]" />
            <h2 className="mt-4 text-xl font-semibold">
              Все още нямате шаблони за автоматизации.
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#69655e]">
              Създай стандартните български шаблони за нови заявки, часове,
              напомняния, follow-up, отзиви и реактивация на клиенти.
            </p>
            <div className="mt-6">
              <DefaultTemplatesButton />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#ded7c8] bg-[#fbfaf6]">
          <CardHeader className="border-b border-[#ece4d7]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Шаблони</CardTitle>
                <CardDescription>
                  {templates.length} шаблона за текущия бизнес.
                </CardDescription>
              </div>
              <Button
                asChild
                variant="outline"
                className="w-full border-[#d8d0c2] bg-white sm:w-auto"
              >
                <Link href="/dashboard/settings/profile">
                  Настройки на профила
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#e2dbcf]">
                    <TableHead>Шаблон</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Канал</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Последна промяна</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => {
                    const preview = renderAutomationTemplate(template.body);

                    return (
                      <TableRow key={template.id} className="border-[#e8e0d4]">
                        <TableCell className="min-w-56 whitespace-normal">
                          <div className="font-medium">{template.name}</div>
                          {template.subject ? (
                            <div className="mt-1 text-xs text-[#69655e]">
                              {template.subject}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="min-w-44 text-[#575048]">
                          {formatAutomationType(template.type)}
                        </TableCell>
                        <TableCell className="min-w-32 text-[#575048]">
                          {formatAutomationChannel(template.channel)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              template.is_active
                                ? "border-[#b9d8c5] bg-[#edf8f0] text-[#245d36]"
                                : "border-[#d8d0c2] text-[#69655e]"
                            }
                          >
                            {template.is_active ? "Активен" : "Неактивен"}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-72 whitespace-normal text-sm leading-6 text-[#575048]">
                          {preview.length > 160
                            ? `${preview.slice(0, 160)}...`
                            : preview}
                        </TableCell>
                        <TableCell className="min-w-40 text-[#69655e]">
                          {formatUpdatedAt(template.updated_at)}
                        </TableCell>
                        <TableCell className="min-w-56">
                          <div className="flex justify-end gap-2">
                            <CopyMessageButton
                              text={preview}
                              label="Копирай"
                              className="border-[#d8d0c2] bg-white"
                            />
                            <Button
                              asChild
                              variant="outline"
                              className="border-[#d8d0c2] bg-white"
                            >
                              <Link href={`/dashboard/automations/${template.id}/edit`}>
                                <Edit3 className="size-4" />
                                Редакция
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-[#ded7c8] bg-[#fbfaf6]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareText className="size-5 text-[#a84b32]" />
            MVP режим
          </CardTitle>
          <CardDescription>
            Шаблоните са за preview и копиране. Реално изпращане през доставчици
            ще бъде добавено по-късно.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-start gap-3 rounded-b-lg bg-white px-5 py-4 text-sm leading-6 text-[#575048]">
          <Copy className="mt-0.5 size-4 shrink-0 text-[#a84b32]" />
          Копираното съобщение може да се постави ръчно в Instagram, Messenger,
          SMS, Viber, WhatsApp или имейл.
        </CardContent>
      </Card>
    </div>
  );
}
