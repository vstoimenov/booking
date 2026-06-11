"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

type CopyBookingLinkButtonProps = {
  publicSlug: string;
};

export function CopyBookingLinkButton({
  publicSlug,
}: CopyBookingLinkButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const bookingPath = `/b/${publicSlug}`;

  async function copyLink() {
    try {
      const absoluteUrl = `${window.location.origin}${bookingPath}`;
      await navigator.clipboard.writeText(absoluteUrl);
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
        {status === "copied" ? "Линкът е копиран" : "Копирай линк за резервации"}
      </Button>
      {status === "error" ? (
        <p className="text-xs text-[#a33b26]">
          Копирането не успя. Линк: {bookingPath}
        </p>
      ) : null}
    </div>
  );
}
