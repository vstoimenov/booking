"use client";

import { useActionState } from "react";
import { DatabaseZap, Loader2 } from "lucide-react";

import {
  createDemoData,
  type DemoDataActionState,
} from "@/app/(dashboard)/dashboard/demo-data/actions";
import { Button } from "@/components/ui/button";

const initialState: DemoDataActionState = {
  status: "idle",
};

type DemoDataButtonProps = {
  className?: string;
};

export function DemoDataButton({ className }: DemoDataButtonProps) {
  const [state, formAction, isPending] = useActionState(
    createDemoData,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <Button
        type="submit"
        disabled={isPending}
        className={
          className ??
          "bg-[#16372f] text-white hover:bg-[#214b42]"
        }
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <DatabaseZap className="size-4" />
        )}
        Добави примерни данни
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
