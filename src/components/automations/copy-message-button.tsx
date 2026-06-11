"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

type CopyMessageButtonProps = {
  text: string;
  label?: string;
  copiedLabel?: string;
  variant?: "default" | "outline";
  className?: string;
};

export function CopyMessageButton({
  text,
  label = "Копирай",
  copiedLabel = "Копирано",
  variant = "outline",
  className,
}: CopyMessageButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant={variant}
        onClick={copyMessage}
        className={className}
      >
        {status === "copied" ? (
          <Check className="size-4" />
        ) : (
          <Copy className="size-4" />
        )}
        {status === "copied" ? copiedLabel : label}
      </Button>
      {status === "error" ? (
        <p className="text-xs text-[#a33b26]">
          Копирането не успя. Маркирай текста и го копирай ръчно.
        </p>
      ) : null}
    </div>
  );
}
