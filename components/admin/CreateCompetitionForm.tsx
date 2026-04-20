// components/admin/CreateCompetitionForm.tsx
"use client";

import { useActionState, useState } from "react";
import { createCompetition } from "@/lib/actions/competitions";
import type { CreateCompetitionState } from "@/lib/actions/competitions";
import { Button, Input, Label } from "@/components/ui";
import { useRouter } from "next/navigation";

const initialState: CreateCompetitionState = { success: false };

interface Props {
  tournaments: { slug: string; name: string }[];
  locale: string;
}

export function CreateCompetitionForm({ tournaments, locale }: Props) {
  const [state, action] = useActionState(createCompetition, initialState);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSim, setIsSim] = useState(false);
  const isSv = locale === "sv";

  if (state.success && state.slug) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 text-sm">
        ✓ {isSv ? "Tävling skapad!" : "Competition created!"}{" "}
        <span className="font-mono text-xs">{state.slug}</span>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="cc-tournament">{isSv ? "Turnering" : "Tournament"}</Label>
          <select
            id="cc-tournament"
            name="tournamentSlug"
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-pitch-500"
          >
            {tournaments.map((t) => (
              <option key={t.slug} value={t.slug}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="cc-name">{isSv ? "Namn" : "Name"} *</Label>
          <Input id="cc-name" name="name" placeholder={isSv ? "Min grupp" : "My group"} required />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="cc-desc">{isSv ? "Beskrivning (valfritt)" : "Description (optional)"}</Label>
          <Input id="cc-desc" name="description" placeholder={isSv ? "Kort beskrivning..." : "Short description..."} />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            name="isPublic"
            value="false"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="rounded"
          />
          {isSv ? "Privat (kräver kod)" : "Private (requires code)"}
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            name="simulationMode"
            value="true"
            checked={isSim}
            onChange={(e) => setIsSim(e.target.checked)}
            className="rounded"
          />
          🤖 {isSv ? "Simuleringsläge" : "Simulation mode"}
        </label>
      </div>

      {/* Hidden isPublic field */}
      <input type="hidden" name="isPublic" value={isPrivate ? "false" : "true"} />

      {isPrivate && (
        <div className="space-y-1">
          <Label htmlFor="cc-code">{isSv ? "Åtkomstkod" : "Access code"}</Label>
          <Input
            id="cc-code"
            name="accessCode"
            placeholder="hemligkod123"
            className="font-mono"
          />
        </div>
      )}

      {isSim && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
          🤖 {isSv
            ? "Simuleringsläge: du kan generera testanvändare och steppa fram tid dag för dag. Matchar i denna tävling skrivs över med simulerade resultat."
            : "Simulation mode: you can generate test users and advance time day by day. Matches in this competition will be overwritten with simulated results."}
        </div>
      )}

      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <Button type="submit">
        {isSv ? "Skapa tävling" : "Create competition"}
      </Button>
    </form>
  );
}
