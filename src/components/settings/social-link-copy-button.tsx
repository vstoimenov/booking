"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

type SocialLinkCopyButtonProps = {
  link: string;
  label?: string;
};

export function SocialLinkCopyButton({
  link,
  label = "Копирай линка",
}: SocialLinkCopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
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
        variant="outline"
        onClick={copyLink}
        className="w-full justify-start border-[#d8d0c2] bg-white text-[#16372f] hover:bg-[#f1ebe0] sm:w-auto"
      >
        {status === "copied" ? (
          <Check className="size-4" />
        ) : (
          <Copy className="size-4" />
        )}
        {status === "copied" ? "Копирано" : label}
      </Button>
      {status === "error" ? (
        <p className="text-xs text-[#a33b26]">
          Копирането не успя. Маркирай линка и го копирай ръчно.
        </p>
      ) : null}
    </div>
  );
}
