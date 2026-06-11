"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { Loader2, Save } from "lucide-react";

import {
  updateAutomationTemplate,
  type AutomationActionState,
} from "@/app/(dashboard)/dashboard/automations/actions";
import { CopyMessageButton } from "@/components/automations/copy-message-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  automationChannelLabels,
  automationChannels,
  automationPlaceholders,
  automationTemplateTypes,
  automationTypeLabels,
  renderAutomationTemplate,
  sampleAutomationData,
  type AutomationChannel,
  type AutomationTemplateType,
} from "@/lib/automations/templates";

type AutomationTemplateFormProps = {
  templateId: string;
  initialValues: {
    name: string;
    type: AutomationTemplateType;
    channel: AutomationChannel;
    subject: string;
    body: string;
    isActive: boolean;
  };
};

const initialState: AutomationActionState = {
  status: "idle",
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-[#a33b26]">{message}</p>;
}

function selectClassName() {
  return "h-10 w-full rounded-lg border border-[#d8d0c2] bg-white px-3 text-sm outline-none focus-visible:border-[#16372f] focus-visible:ring-2 focus-visible:ring-[#16372f]/20";
}

export function AutomationTemplateForm({
  templateId,
  initialValues,
}: AutomationTemplateFormProps) {
  const [body, setBody] = useState(initialValues.body);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [state, formAction, isPending] = useActionState(
    updateAutomationTemplate.bind(null, templateId),
    initialState,
  );
  const preview = useMemo(() => renderAutomationTemplate(body), [body]);

  function insertPlaceholder(placeholder: string) {
    const textarea = textAreaRef.current;

    if (!textarea) {
      setBody((current) => `${current}${placeholder}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextValue = `${body.slice(0, start)}${placeholder}${body.slice(end)}`;
    setBody(nextValue);

    window.requestAnimationFrame(() => {
      textarea.focus();
      const nextPosition = start + placeholder.length;
      textarea.setSelectionRange(nextPosition, nextPosition);
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
      <Card className="border-[#ded7c8] bg-[#fbfaf6]">
        <CardHeader className="border-b border-[#ece4d7]">
          <CardTitle>Редакция на шаблон</CardTitle>
          <CardDescription>
            Промени текста, канала и активността на този шаблон.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {state.message ? (
            <div
              className={
                state.status === "success"
                  ? "mb-5 rounded-lg border border-[#b9d8c5] bg-[#f3fbf5] px-3 py-3 text-sm text-[#245d36]"
                  : "mb-5 rounded-lg border border-[#efb3a5] bg-[#fff1ed] px-3 py-3 text-sm text-[#9d321d]"
              }
            >
              {state.message}
            </div>
          ) : null}

          <form action={formAction} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Име</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={initialValues.name}
                  maxLength={140}
                  required
                  className="bg-white"
                />
                <FieldError message={state.fieldErrors?.name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="channel">Канал</Label>
                <select
                  id="channel"
                  name="channel"
                  defaultValue={initialValues.channel}
                  className={selectClassName()}
                >
                  {automationChannels.map((channel) => (
                    <option key={channel} value={channel}>
                      {automationChannelLabels[channel]}
                    </option>
                  ))}
                </select>
                <FieldError message={state.fieldErrors?.channel} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Тип</Label>
                <select
                  id="type"
                  name="type"
                  defaultValue={initialValues.type}
                  className={selectClassName()}
                >
                  {automationTemplateTypes.map((type) => (
                    <option key={type} value={type}>
                      {automationTypeLabels[type]}
                    </option>
                  ))}
                </select>
                <FieldError message={state.fieldErrors?.type} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Тема</Label>
                <Input
                  id="subject"
                  name="subject"
                  defaultValue={initialValues.subject}
                  maxLength={160}
                  placeholder="по желание"
                  className="bg-white"
                />
                <FieldError message={state.fieldErrors?.subject} />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-[#e6ded1] bg-white p-4">
              <div>
                <p className="text-sm font-medium">Placeholder-и</p>
                <p className="mt-1 text-xs leading-5 text-[#69655e]">
                  Натисни бутон, за да го вмъкнеш в текста.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {automationPlaceholders.map((placeholder) => (
                  <Button
                    key={placeholder}
                    type="button"
                    variant="outline"
                    className="h-8 border-[#d8d0c2] bg-[#fbfaf6] px-2 text-xs"
                    onClick={() => insertPlaceholder(placeholder)}
                  >
                    {placeholder}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Съобщение</Label>
              <textarea
                ref={textAreaRef}
                id="body"
                name="body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                required
                maxLength={1600}
                className="min-h-56 w-full resize-y rounded-lg border border-[#d8d0c2] bg-white px-3 py-3 text-sm leading-6 outline-none focus-visible:border-[#16372f] focus-visible:ring-2 focus-visible:ring-[#16372f]/20"
              />
              <div className="flex items-center justify-between gap-3">
                <FieldError message={state.fieldErrors?.body} />
                <p className="ml-auto text-xs text-[#8a8176]">
                  {body.length}/1600
                </p>
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-[#e6ded1] bg-white px-3 py-3 text-sm font-medium">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={initialValues.isActive}
                className="size-4 accent-[#16372f]"
              />
              Активен шаблон
            </label>

            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#16372f] text-white hover:bg-[#214b42]"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Запази шаблона
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-[#ded7c8] bg-[#fbfaf6]">
          <CardHeader className="border-b border-[#ece4d7]">
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Пример с реалистични данни, без изпращане към клиент.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="rounded-lg border border-[#e6ded1] bg-white p-4">
              <p className="whitespace-pre-line text-sm leading-6 text-[#575048]">
                {preview || "Въведи съобщение, за да видиш preview."}
              </p>
            </div>
            <CopyMessageButton
              text={preview}
              label="Копирай preview"
              className="border-[#d8d0c2] bg-white"
            />
          </CardContent>
        </Card>

        <Card className="border-[#ded7c8] bg-[#fbfaf6]">
          <CardHeader>
            <CardTitle>Примерни данни</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[#575048]">
            {Object.entries(sampleAutomationData).map(([key, value]) => (
              <div
                key={key}
                className="flex items-start justify-between gap-3 rounded-lg border border-[#e6ded1] bg-white px-3 py-2"
              >
                <Badge variant="outline" className="border-[#d8d0c2]">
                  {`{{${key}}}`}
                </Badge>
                <span className="text-right">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
