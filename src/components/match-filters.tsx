"use client";

import { useState, useMemo } from "react";
import { MatchCard } from "./match-card";
import type { Match, Team } from "@/lib/types";

type Props = {
  matches: (Match & { team_a: Team; team_b: Team })[];
  userPredictions: Record<string, string>;
  userId: string | null;
  matchStats?: Record<string, { a: number; b: number }>;
};

export function MatchFilters({ matches, userPredictions, userId, matchStats }: Props) {
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const stages = useMemo(() => Array.from(new Set(matches.map(m => m.stage))), [matches]);



  const filtered = useMemo(() => {
    return matches.filter(m => {
      if (stageFilter !== "all" && m.stage !== stageFilter) return false;
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      return true;
    });
  }, [matches, stageFilter, statusFilter]);

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
      <div className="space-y-5 bg-card/50 backdrop-blur-sm border border-border p-4 sm:p-6 rounded-xl">
        {/* Status tabs (Primary Navigation) */}
        <div className="flex flex-wrap gap-3 border-b border-border/50 pb-5">
          {[
            { key: "all", label: "TODOS", count: matches.length },
            { key: "upcoming", label: "ABIERTOS", count: matches.filter(m => m.status === "upcoming").length },
            { key: "live", label: "EN VIVO", count: matches.filter(m => m.status === "live").length },
            { key: "completed", label: "FINALIZADOS", count: matches.filter(m => m.status === "completed").length },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`btn-skew shrink-0 px-6 py-2.5 transition-all cursor-pointer border ${
                statusFilter === f.key
                  ? "bg-accent border-accent text-bg shadow-lg shadow-accent/20"
                  : "bg-bg-alt border-border text-text-secondary hover:text-text hover:border-border-light hover:bg-card-hover"
              }`}
            >
              <div className="flex items-center gap-2 font-heading font-black tracking-widest text-sm">
                <span>{f.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-sm ${
                  statusFilter === f.key ? "bg-bg-alt/20 text-bg" : "bg-card text-muted"
                }`}>
                  {f.count}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          {/* Stage filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStageFilter("all")}
              className={`text-xs font-heading font-bold px-4 py-2 rounded-lg tracking-wider transition cursor-pointer ${
                stageFilter === "all" ? "bg-card-hover border border-border-light text-text" : "bg-transparent border border-transparent text-text-secondary hover:bg-card/50"
              }`}
            >
              TODAS LAS FASES
            </button>
            {stages.map(s => (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className={`text-xs font-heading font-bold px-4 py-2 rounded-lg tracking-wider transition cursor-pointer ${
                  stageFilter === s ? "bg-card-hover border border-border-light text-text" : "bg-transparent border border-transparent text-text-secondary hover:bg-card/50"
                }`}
              >
                {s.replace("Phase 1 - ", "P1: ").replace("Phase 2 - ", "P2: ").replace("Playoffs - ", "").toUpperCase()}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Results */}
      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-14 bg-card border border-border rounded-2xl">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-muted font-heading tracking-wider">No hay partidos con estos filtros</p>
          <button
            onClick={() => { setStageFilter("all"); setStatusFilter("all"); }}
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
                matchStats={matchStats?.[match.id]}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
