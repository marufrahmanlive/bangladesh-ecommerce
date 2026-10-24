"use client";

import { CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/features/ui/store";

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => {
        const Icon =
          toast.variant === "success"
            ? CheckCircle2
            : toast.variant === "error"
              ? XCircle
              : Info;
        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-center gap-2 rounded-md border bg-background px-4 py-3 text-sm shadow-lg",
              toast.variant === "error" && "border-destructive text-destructive",
              toast.variant === "success" && "border-success text-success",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
