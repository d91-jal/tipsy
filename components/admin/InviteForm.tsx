// components/admin/InviteForm.tsx
"use client";

import { useState, useTransition } from "react";
import { inviteUser } from "@/lib/actions/admin";
import { Button, Input, Label } from "@/components/ui";

export function InviteForm({ locale }: { locale: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("email", email);
        if (name) fd.append("name", name);
        await inviteUser(fd);
        setStatus("success");
        setEmail("");
        setName("");
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(
          err.message === "USER_EXISTS"
            ? (locale === "sv" ? "Användaren finns redan" : "User already exists")
            : (locale === "sv" ? "Något gick fel" : "Something went wrong")
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <div className="space-y-1">
        <Label htmlFor="invite-name">
          {locale === "sv" ? "Namn (valfritt)" : "Name (optional)"}
        </Label>
        <Input
          id="invite-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={locale === "sv" ? "Anna Svensson" : "Jane Smith"}
          className="w-48"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="invite-email">E-post *</Label>
        <Input
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
          placeholder="spelare@exempel.se"
          className="w-64"
          required
        />
      </div>
      <Button type="submit" loading={isPending}>
        {locale === "sv" ? "Bjud in" : "Invite"}
      </Button>

      {status === "success" && (
        <span className="text-sm text-green-600 font-medium">
          ✓ {locale === "sv" ? "Inbjudan skickad!" : "Invitation sent!"}
        </span>
      )}
      {status === "error" && (
        <span className="text-sm text-red-600">{errorMsg}</span>
      )}
    </form>
  );
}
