"use client";

import { useState, useMemo } from "react";
import { MatchCard } from "./match-card";
import type { Match, Team } from "@/lib/types";

type Props = {
  matches: (Match & { team_a: Team; team_b: Team })[];
  userPredictions: Record<string, string>;
  userId: string | null;
};

export function MatchFilters({ matches, userPredictions, userId }: Props) {
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [dayFilter, setDayFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const stages = useMemo(() => Array.from(new Set(matches.map(m => m.stage))), [matches]);

  const days = useMemo(() => {
    const d = new Map<string, string>();
    matches.forEach(m => {
      const date = new Date(m.match_date);
      const key = date.toISOString().split("T")[0];
      const label = date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
      d.set(key, label);
    });
    return Array.from(d.entries());
  }, [matches]);

  const filtered = useMemo(() => {
    return matches.filter(m => {
      if (stageFilter !== "all" && m.stage !== stageFilter) return false;
      if (dayFilter !== "all" && new Date(m.match_date).toISOString().split("T")[0] !== dayFilter) return false;
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      return true;
    });
  }, [matches, stageFilter, dayFilter, statusFilter]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof filtered> = {};
    filtered.forEach(m => {
      if (!g[m.stage]) g[m.stage] = [];
      g[m.stage].push(m);
    });
    return g;
  }, [filtered]);

  const totalPredicted = Object.keys(userPredictions).length;
  const totalUpcoming = matches.filter(m => m.status === "upcoming").length;

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      {userId && (
        <div className="flex items-center gap-4 bg-card border border-border rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-accent text-sm font-heading font-bold">{totalPredicted}</span>
            <span className="text-[11px] text-muted">predicciones hechas</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-r6-red text-sm font-heading font-bold">{totalUpcoming - totalPredicted > 0 ? totalUpcoming - totalPredicted : 0}</span>
            <span className="text-[11px] text-muted">pendientes</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        {/* Status pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[
            { key: "all", label: "Todos", count: matches.length },
            { key: "upcoming", label: "Abiertos", count: matches.filter(m => m.status === "upcoming").length },
            { key: "live", label: "En vivo", count: matches.filter(m => m.status === "live").length },
            { key: "completed", label: "Finalizados", count: matches.filter(m => m.status === "completed").length },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`shrink-0 text-[11px] font-heading font-bold px-3 py-1.5 rounded-lg tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === f.key
                  ? "bg-r6-red text-white"
                  : "bg-card border border-border text-muted hover:text-text"
              }`}
            >
              {f.label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                statusFilter === f.key ? "bg-white/20" : "bg-border"
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Stage + Day filters */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setStageFilter("all")}
            className={`text-[10px] font-heading font-bold px-2.5 py-1 rounded-full tracking-wider uppercase transition cursor-pointer ${
              stageFilter === "all" ? "bg-accent text-bg" : "bg-card border border-border text-muted hover:text-text"
            }`}
          >
            Todas las fases
          </button>
          {stages.map(s => (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              className={`text-[10px] font-heading font-bold px-2.5 py-1 rounded-full tracking-wider uppercase transition cursor-pointer ${
                stageFilter === s ? "bg-accent text-bg" : "bg-card border border-border text-muted hover:text-text"
              }`}
            >
              {s.replace("Phase 1 - ", "P1: ").replace("Phase 2 - ", "P2: ").replace("Playoffs - ", "")}
            </button>
          ))}
        </div>

        {days.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setDayFilter("all")}
              className={`shrink-0 text-[10px] font-heading font-bold px-2.5 py-1 rounded-full tracking-wider transition cursor-pointer ${
                dayFilter === "all" ? "bg-border-light text-text" : "text-muted hover:text-text"
              }`}
            >
              Todos los días
            </button>
            {days.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setDayFilter(key)}
                className={`shrink-0 text-[10px] font-heading font-bold px-2.5 py-1 rounded-full tracking-wider transition cursor-pointer ${
                  dayFilter === key ? "bg-border-light text-text" : "text-muted hover:text-text"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-14 bg-card border border-border rounded-2xl">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-muted font-heading tracking-wider">No hay partidos con estos filtros</p>
          <button
            onClick={() => { setStageFilter("all"); setDayFilter("all"); setStatusFilter("all"); }}
            className="text-accent text-xs mt-2 hover:text-accent-hover cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {Object.entries(grouped).map(([stage, stageMatches]) => (
        <section key={stage}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-r6-red rounded-full" />
            <h2 className="font-heading font-bold text-base tracking-wider">{stage}</h2>
            <span className="text-[10px] text-muted">({stageMatches.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stageMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                userPrediction={userPredictions[match.id] || null}
                userId={userId}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
