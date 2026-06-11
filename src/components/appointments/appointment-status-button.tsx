"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { updateAppointmentStatus } from "@/app/(dashboard)/dashboard/appointments/actions";
import { Button } from "@/components/ui/button";
import {
  appointmentStatusLabels,
  type AppointmentStatus,
} from "@/lib/appointments/format";
import { cn } from "@/lib/utils";

type AppointmentStatusButtonProps = {
  appointmentId: string;
  status: AppointmentStatus;
  label?: string;
  variant?: "default" | "outline" | "destructive" | "ghost";
  className?: string;
};

export function AppointmentStatusButton({
  appointmentId,
  status,
  label,
  variant = "outline",
  className,
}: AppointmentStatusButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  return (
    <div className="min-w-0 space-y-1">
      <Button
        type="button"
        variant={variant}
        disabled={isPending}
        className={cn("w-full justify-center border-[#d8d0c2] bg-white", className)}
        onClick={() => {
          setMessage(null);
          setIsError(false);
          startTransition(async () => {
            const result = await updateAppointmentStatus(appointmentId, status);
            setMessage(result.message);
            setIsError(result.status === "error");

            if (result.status === "success") {
              router.refresh();
            }
          });
        }}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : message && !isError ? (
          <CheckCircle2 className="size-4" />
        ) : null}
        {isPending ? "Обновяване..." : label ?? appointmentStatusLabels[status]}
      </Button>
      {message ? (
        <p
          className={cn(
            "text-xs leading-5",
            isError ? "text-[#a33b26]" : "text-[#245d36]",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
