"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

interface SubmitButtonProps {
  label: string;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function SubmitButton({
  label,
  pendingLabel,
  className,
  disabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      disabled={isDisabled}
    >
      {pending ? pendingLabel ?? "Saving..." : label}
    </button>
  );
}
