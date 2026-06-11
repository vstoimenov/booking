"use client";

import { useActionState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import {
  createDefaultAutomationTemplates,
  type AutomationActionState,
} from "@/app/(dashboard)/dashboard/automations/actions";
import { Button } from "@/components/ui/button";

const initialState: AutomationActionState = {
  status: "idle",
};

export function DefaultTemplatesButton() {
  const [state, formAction, isPending] = useActionState(
    createDefaultAutomationTemplates,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <Button
        type="submit"
        disabled={isPending}
        className="bg-[#16372f] text-white hover:bg-[#214b42]"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        Създай стандартни шаблони
      </Button>
      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "text-sm text-[#a33b26]"
              : "text-sm text-[#245d36]"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
