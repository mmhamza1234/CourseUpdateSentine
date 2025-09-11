import React from "react";
import { cn } from "@/lib/utils";

interface ModuleBadgeProps {
  moduleCode: string;
  className?: string;
}

export default function ModuleBadge({ moduleCode, className }: ModuleBadgeProps) {
  return (
    <span 
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-400",
        className
      )}
      data-testid={`badge-module-${moduleCode.toLowerCase()}`}
    >
      {moduleCode}
    </span>
  );
}
