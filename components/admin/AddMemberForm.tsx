// components/admin/AddMemberForm.tsx
"use client";

import { useState, useTransition } from "react";
import { addUserToCompetition } from "@/lib/actions/competitions";
import { Button, Input } from "@/components/ui";

export function AddMemberForm({ competitionId, locale }: { competitionId: string; locale: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [isPending, startTransition] = useTransition();
  const isSv = locale === "sv";

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("competitionId", competitionId);
        fd.append("email", email);
        await addUserToCompetition(fd);
        setStatus("ok");
        setEmail("");
      } catch {
        setStatus("err");
      }
    });
  }

  return (
    <form onSubmit={handle} className="flex gap-2 items-center">
      <Input
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
        placeholder={isSv ? "Lägg till e-post..." : "Add by email..."}
        className="text-xs"
      />
      <Button type="submit" size="sm" variant="outline" loading={isPending}>
        {isSv ? "Lägg till" : "Add"}
      </Button>
      {status === "ok" && <span className="text-xs text-green-600">✓</span>}
      {status === "err" && <span className="text-xs text-red-500">!</span>}
    </form>
  );
}
