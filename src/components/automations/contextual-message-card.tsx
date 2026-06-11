import { MessageSquareText } from "lucide-react";

import { CopyMessageButton } from "@/components/automations/copy-message-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type ContextualAutomationMessage = {
  key: string;
  title: string;
  description: string;
  text: string;
  isActive: boolean;
};

type ContextualMessageCardProps = {
  title?: string;
  description?: string;
  messages: ContextualAutomationMessage[];
  emptyText?: string;
};

export function ContextualMessageCard({
  title = "Готови съобщения",
  description = "Копирай шаблон и го изпрати ръчно през предпочитания канал.",
  messages,
  emptyText = "Няма активни шаблони за този контекст.",
}: ContextualMessageCardProps) {
  const visibleMessages = messages.filter((message) => message.text.trim());

  return (
    <Card className="border-[#ded7c8] bg-[#fbfaf6]">
      <CardHeader className="border-b border-[#ece4d7]">
        <CardTitle className="flex items-center gap-2">
          <MessageSquareText className="size-5 text-[#a84b32]" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-5">
        {visibleMessages.length > 0 ? (
          visibleMessages.map((message) => (
            <div
              key={message.key}
              className="rounded-lg border border-[#e6ded1] bg-white p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{message.title}</p>
                    <Badge
                      variant="outline"
                      className={
                        message.isActive
                          ? "border-[#b9d8c5] text-[#245d36]"
                          : "border-[#d8d0c2] text-[#69655e]"
                      }
                    >
                      {message.isActive ? "Активен" : "Неактивен"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-[#69655e]">
                    {message.description}
                  </p>
                </div>
                <CopyMessageButton
                  text={message.text}
                  label="Копирай"
                  className="border-[#d8d0c2] bg-white"
                />
              </div>
              <p className="mt-4 whitespace-pre-line rounded-md bg-[#fbfaf6] p-3 text-sm leading-6 text-[#575048]">
                {message.text}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-[#d6cbbb] bg-white px-4 py-8 text-center">
            <p className="font-medium">{emptyText}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
