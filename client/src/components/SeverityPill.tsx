import React from "react";
import { cn } from "@/lib/utils";

interface SeverityPillProps {
  severity: "SEV1" | "SEV2" | "SEV3";
  className?: string;
}

export default function SeverityPill({ severity, className }: SeverityPillProps) {
  const severityClasses = {
    SEV1: "severity-sev1",
    SEV2: "severity-sev2", 
    SEV3: "severity-sev3",
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
        severityClasses[severity],
        className
      )}
      data-testid={`pill-severity-${severity.toLowerCase()}`}
    >
      {severity}
    </span>
  );
}
