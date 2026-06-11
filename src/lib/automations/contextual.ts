import type { ContextualAutomationMessage } from "@/components/automations/contextual-message-card";
import {
  automationTypeLabels,
  renderAutomationTemplate,
  type AutomationRenderData,
  type AutomationTemplateType,
} from "@/lib/automations/templates";

export type AutomationTemplateForRender = {
  id: string;
  type: string;
  name: string;
  body: string;
  is_active: boolean;
};

export function buildContextualAutomationMessages(
  templates: AutomationTemplateForRender[],
  types: AutomationTemplateType[],
  data: AutomationRenderData,
): ContextualAutomationMessage[] {
  return types
    .map((type) => {
      const template = templates.find(
        (candidate) => candidate.type === type && candidate.is_active,
      );

      if (!template) {
        return null;
      }

      return {
        key: template.id,
        title: template.name || automationTypeLabels[type],
        description: automationTypeLabels[type],
        text: renderAutomationTemplate(template.body, data),
        isActive: template.is_active,
      };
    })
    .filter((message): message is ContextualAutomationMessage => Boolean(message));
}
