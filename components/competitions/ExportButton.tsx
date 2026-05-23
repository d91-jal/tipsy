// components/competitions/ExportButton.tsx
"use client";

import { useState } from "react";

interface ExportButtonProps {
  slug: string;
  locale: string;
}

export function ExportButton({ slug, locale }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const isSv = locale === "sv";

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/competitions/${slug}/export`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tipsy-${slug}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert(
        isSv ? "Kunde inte generera exporten" : "Could not generate export",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--f-mono)",
        fontSize: 10,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: loading ? "var(--ink-faint)" : "var(--ink-soft)",
        background: "transparent",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--r-pill)",
        padding: "5px 12px",
        cursor: loading ? "default" : "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "var(--gold)";
          (e.currentTarget as HTMLButtonElement).style.color =
            "var(--green-deep)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "var(--hairline)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-soft)";
      }}
    >
      {loading ? (
        <>
          <svg
            style={{
              animation: "spin 1s linear infinite",
              width: 12,
              height: 12,
            }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              opacity="0.25"
            />
            <path
              d="M4 12a8 8 0 018-8"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          {isSv ? "Genererar..." : "Generating..."}
        </>
      ) : (
        <>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          {isSv ? "Exportera Excel" : "Export Excel"}
        </>
      )}
    </button>
  );
}
