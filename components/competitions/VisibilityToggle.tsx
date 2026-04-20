// components/competitions/VisibilityToggle.tsx
"use client";

import { useState, useTransition } from "react";
import { updateTipsVisibility } from "@/lib/actions/competitions";

interface VisibilityToggleProps {
  competitionId: string;
  current: boolean;
  locale: string;
}

export function VisibilityToggle({ competitionId, current, locale }: VisibilityToggleProps) {
  const [isPublic, setIsPublic] = useState(current);
  const [isPending, startTransition] = useTransition();
  const isSv = locale === "sv";

  function toggle() {
    const next = !isPublic;
    setIsPublic(next);
    startTransition(() => updateTipsVisibility(competitionId, next));
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
      title={isSv ? "Styr om dina tips syns för andra" : "Control if your tips are visible to others"}
    >
      <span className={`inline-flex items-center justify-center w-7 h-4 rounded-full transition-colors ${isPublic ? "bg-pitch-500" : "bg-slate-200"}`}>
        <span className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${isPublic ? "translate-x-1.5" : "-translate-x-1.5"}`} />
      </span>
      <span>
        {isPublic
          ? (isSv ? "Tips synliga" : "Tips visible")
          : (isSv ? "Tips dolda" : "Tips hidden")}
      </span>
    </button>
  );
}
