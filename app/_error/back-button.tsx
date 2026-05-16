"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  label: string;
  className?: string;
};

export function BackButton({ label, className }: Props) {
  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      className={className}
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = "/";
        }
      }}
    >
      <ArrowLeft />
      {label}
    </Button>
  );
}
