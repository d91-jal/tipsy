// components/admin/ResendInviteButton.tsx
"use client";

import { useState } from "react";

interface ResendInviteButtonProps {
  email: string;
  locale: string;
}

export function ResendInviteButton({ email, locale }: ResendInviteButtonProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const isSv = locale === "sv";

  async function handleResend() {
    setStatus("sending");
    try {
      const res = await fetch("/api/admin/resend-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  const label = {
    idle: isSv ? "Skicka om" : "Resend",
    sending: "…",
    sent: isSv ? "✓ Skickad" : "✓ Sent",
    error: isSv ? "Fel — försök om" : "Error — retry",
  }[status];

  const bg = {
    idle: "var(--green-cta)",
    sending: "var(--ink-faint)",
    sent: "var(--green-pale)",
    error: "var(--stamp-red)",
  }[status];

  const color = status === "sent" ? "var(--green-deep)" : "white";

  return (
    <button
      onClick={handleResend}
      disabled={status === "sending" || status === "sent"}
      style={{
        fontFamily: "var(--f-mono)",
        fontSize: 10,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        padding: "6px 14px",
        borderRadius: "var(--r-pill)",
        border: "none",
        cursor: status === "idle" || status === "error" ? "pointer" : "default",
        background: bg,
        color,
        transition: "all 0.15s",
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}
