// components/admin/SimulationPanel.tsx
"use client";

import { useState, useTransition } from "react";
import { createSimBots, advanceSimDay, resetSimulation } from "@/lib/actions/simulate";
import type { SimStatus } from "@/lib/actions/simulate";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface SimulationPanelProps {
  status: SimStatus;
  locale: string;
}

type LogEntry = { time: string; msg: string; type: "info" | "success" | "error" };

export function SimulationPanel({ status, locale }: SimulationPanelProps) {
  const isSv = locale === "sv";
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [botCount, setBotCount] = useState(10);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  function addLog(msg: string, type: LogEntry["type"] = "info") {
    const time = new Date().toLocaleTimeString("sv-SE");
    setLog((prev) => [{ time, msg, type }, ...prev].slice(0, 30));
  }

  async function handleCreateBots() {
    setLoading("bots");
    startTransition(async () => {
      const res = await createSimBots(status.competitionId, botCount);
      if (res.success) {
        addLog(`✓ ${res.created} ${isSv ? "bottar skapade med slumpmässiga tips" : "bots created with random tips"}`, "success");
      } else {
        addLog(`✗ ${res.error}`, "error");
      }
      setLoading(null);
      router.refresh();
    });
  }

  async function handleAdvanceDay() {
    setLoading("advance");
    startTransition(async () => {
      const res = await advanceSimDay(status.competitionId);
      if (res.success) {
        const dateStr = new Date(res.newDate).toLocaleDateString(isSv ? "sv-SE" : "en-GB");
        addLog(
          `📅 ${dateStr} — ${res.matchesResolved} ${isSv ? "matcher" : "matches"}${
            res.groupsCompleted > 0
              ? `, ${res.groupsCompleted} ${isSv ? "grupper klara" : "groups complete"}`
              : ""
          }`,
          "success"
        );
      } else {
        addLog(`✗ ${res.error}`, "error");
      }
      setLoading(null);
      router.refresh();
    });
  }

  async function handleReset() {
    if (!confirm(isSv ? "Återställ all simuleringsdata? Kan inte ångras." : "Reset all simulation data? Cannot be undone.")) return;
    setLoading("reset");
    startTransition(async () => {
      const res = await resetSimulation(status.competitionId);
      if (res.success) {
        addLog(`🔄 ${isSv ? "Återställd" : "Reset"} — ${res.removed} ${isSv ? "bottar borttagna" : "bots removed"}`, "info");
      } else {
        addLog(`✗ ${res.error}`, "error");
      }
      setLoading(null);
      router.refresh();
    });
  }

  const progressPct = status.totalDays > 0
    ? Math.max(0, Math.min(100, (status.currentDay / status.totalDays) * 100))
    : 0;

  const isFinished = status.matchesFinished >= status.matchesTotal && status.matchesTotal > 0;

  return (
    <div className="space-y-4">
      {/* Status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: isSv ? "Bottar" : "Bots",
            value: status.botCount,
            icon: "🤖",
          },
          {
            label: isSv ? "Matcher klara" : "Matches done",
            value: `${status.matchesFinished}/${status.matchesTotal}`,
            icon: "⚽",
          },
          {
            label: isSv ? "Simulerad dag" : "Simulated day",
            value: status.currentDay >= 0 ? `Dag ${status.currentDay}` : "—",
            icon: "📅",
          },
          {
            label: isSv ? "Status" : "Status",
            value: isFinished
              ? (isSv ? "Klar" : "Done")
              : status.currentDay < 0
                ? (isSv ? "Ej startad" : "Not started")
                : (isSv ? "Pågår" : "Running"),
            icon: isFinished ? "🏆" : status.currentDay < 0 ? "⏸" : "▶",
          },
        ].map(({ label, value, icon }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <div className="text-xl mb-1">{icon}</div>
            <div className="font-bold text-slate-800">{value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>{formatDate(status.tournamentStartDate, locale)}</span>
          <span>{progressPct.toFixed(0)}%</span>
          <span>{formatDate(status.tournamentEndDate, locale)}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-pitch-400 to-pitch-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {status.simulatedDate && (
          <p className="text-xs text-slate-500 text-center">
            {isSv ? "Nuvarande simuleringsdatum:" : "Current simulation date:"}{" "}
            <strong>{formatDate(status.simulatedDate, locale)}</strong>
          </p>
        )}
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>{isSv ? "Kontroller" : "Controls"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create bots */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">
                {isSv ? "Antal bottar:" : "Number of bots:"}
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={botCount}
                onChange={(e) => setBotCount(parseInt(e.target.value) || 1)}
                className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm text-center"
              />
            </div>
            <Button
              onClick={handleCreateBots}
              loading={loading === "bots"}
              disabled={!!loading}
              variant="secondary"
            >
              🤖 {isSv ? "Skapa bottar" : "Create bots"}
            </Button>
            <p className="text-xs text-slate-400">
              {isSv
                ? "Varje bott får slumpmässiga tips på alla matcher"
                : "Each bot gets random tips on all matches"}
            </p>
          </div>

          {/* Advance day */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={handleAdvanceDay}
              loading={loading === "advance"}
              disabled={!!loading || isFinished}
              className="gap-2"
            >
              📅 {isSv ? "Stega en dag framåt" : "Advance one day"}
            </Button>
            <p className="text-xs text-slate-400">
              {isSv
                ? "Sätter slumpmässiga resultat på alla matcher schedulerade nästa dag"
                : "Sets random results for all matches scheduled the next day"}
            </p>
          </div>

          {/* Reset */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <Button
              onClick={handleReset}
              loading={loading === "reset"}
              disabled={!!loading}
              variant="destructive"
              size="sm"
            >
              🔄 {isSv ? "Återställ simulering" : "Reset simulation"}
            </Button>
            <p className="text-xs text-slate-400">
              {isSv
                ? "Tar bort alla bottar, resultat och poäng"
                : "Removes all bots, results and points"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Activity log */}
      {log.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {isSv ? "Aktivitetslogg" : "Activity log"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-48 overflow-y-auto font-mono text-xs">
              {log.map((entry, i) => (
                <div
                  key={i}
                  className={`px-4 py-1.5 border-b border-slate-50 flex gap-3 ${
                    entry.type === "success"
                      ? "text-green-700 bg-green-50/30"
                      : entry.type === "error"
                        ? "text-red-700 bg-red-50/30"
                        : "text-slate-600"
                  }`}
                >
                  <span className="text-slate-300 shrink-0">{entry.time}</span>
                  <span>{entry.msg}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
