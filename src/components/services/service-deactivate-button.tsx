"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PowerOff } from "lucide-react";

import { deactivateService } from "@/app/(dashboard)/dashboard/services/actions";
import { Button } from "@/components/ui/button";

export function ServiceDeactivateButton({ serviceId }: { serviceId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDeactivate() {
    setError(null);
    startTransition(async () => {
      const result = await deactivateService(serviceId);

      if (result.status === "error") {
        setError(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        onClick={handleDeactivate}
        disabled={isPending}
        className="w-full justify-start border-[#ead2a9] bg-white text-[#8a5a20] hover:bg-[#fff7e8] sm:w-auto"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <PowerOff className="size-4" />
        )}
        {isPending ? "Деактивиране..." : "Деактивирай"}
      </Button>
      {error ? <p className="text-xs text-[#a33b26]">{error}</p> : null}
    </div>
  );
}
