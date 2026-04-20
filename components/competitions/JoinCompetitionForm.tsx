// components/competitions/JoinCompetitionForm.tsx
"use client";

import { useState, useActionState, useTransition } from "react";
import { joinCompetition } from "@/lib/actions/competitions";
import type { JoinState } from "@/lib/actions/competitions";
import { Button, Input } from "@/components/ui";

const initialState: JoinState = { success: false };

interface JoinCompetitionFormProps {
  competitionId: string;
  isPublic: boolean;
  locale: string;
}

export function JoinCompetitionForm({ competitionId, isPublic, locale }: JoinCompetitionFormProps) {
  const [state, action] = useActionState(joinCompetition, initialState);
  const [showCode, setShowCode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isSv = locale === "sv";

  if (state.success) {
    return (
      <span className="text-sm text-green-600 font-medium">
        ✓ {isSv ? "Gick med!" : "Joined!"}
      </span>
    );
  }

  if (!isPublic && !showCode) {
    return (
      <Button size="sm" variant="outline" onClick={() => setShowCode(true)}>
        🔒 {isSv ? "Ange kod" : "Enter code"}
      </Button>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      {!isPublic && (
        <Input
          name="accessCode"
          placeholder={isSv ? "Åtkomstkod" : "Access code"}
          className="w-28 text-xs"
          form={`join-${competitionId}`}
        />
      )}
      <form
        id={`join-${competitionId}`}
        action={(fd) => {
          fd.append("competitionId", competitionId);
          startTransition(() => action(fd));
        }}
      >
        <input type="hidden" name="competitionId" value={competitionId} />
        <Button type="submit" size="sm" loading={isPending}>
          {isSv ? "Gå med" : "Join"}
        </Button>
      </form>
      {state.error === "INVALID_ACCESS_CODE" && (
        <span className="text-xs text-red-500">{isSv ? "Fel kod" : "Wrong code"}</span>
      )}
    </div>
  );
}
