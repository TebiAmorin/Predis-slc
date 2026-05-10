"use client";

import { useState, useMemo } from "react";
import type { Match, Team, Prediction } from "@/lib/types";
import Image from "next/image";

type HistoryListProps = {
  predictions: (Prediction & {
    match: Match & { team_a: Team; team_b: Team };
    predicted_team: Team;
  })[];
};

const ROUND_GROUPS = [
  { id: "all", label: "Todos" },
  { id: "p1-d1", label: "Fase 1 Día 1", stages: ["Phase 1 - Upper Bracket", "Phase 1 - UB Final"] },
  { id: "p1-d2", label: "Fase 1 Día 2", stages: ["Phase 1 - Lower Bracket", "Phase 1 - LB Final"] },
  { id: "swiss-1", label: "Swiss R1", stages: ["Phase 2 - Swiss Round 1"] },
  { id: "swiss-2", label: "Swiss R2", stages: ["Phase 2 - Swiss Round 2"] },
  { id: "swiss-3", label: "Swiss R3", stages: ["Phase 2 - Swiss Round 3"] },
  { id: "swiss-4", label: "Swiss R4", stages: ["Phase 2 - Swiss Round 4"] },
  { id: "swiss-5", label: "Swiss R5", stages: ["Phase 2 - Swiss Round 5"] },
  { id: "playoffs-qf", label: "Cuartos", stages: ["Playoffs - Quarterfinal"] },
  { id: "playoffs-sf", label: "Semis", stages: ["Playoffs - Semifinal"] },
  { id: "playoffs-gf", label: "Final", stages: ["Playoffs - Grand Final"] },
];

export function HistoryList({ predictions }: HistoryListProps) {
  const [filter, setFilter] = useState<"all" | "correct" | "wrong" | "pending">("all");
  const [roundFilter, setRoundFilter] = useState("all");

  // Which round groups actually have predictions
  const activeRounds = useMemo(() => {
    const stagesWithPreds = new Set(predictions.map(p => p.match.stage));
    return ROUND_GROUPS.filter(g => g.id === "all" || g.stages?.some(s => stagesWithPreds.has(s)));
  }, [predictions]);

  const filtered = useMemo(() => {
    return predictions.filter((pred) => {
      const match = pred.match;
      const isCompleted = match.status === "completed";
      const isCorrect = isCompleted && pred.predicted_team_id === match.winner_id;
      const isWrong = isCompleted && pred.predicted_team_id !== match.winner_id;

      if (filter === "correct" && !isCorrect) return false;
      if (filter === "wrong" && !isWrong) return false;
      if (filter === "pending" && isCompleted) return false;

      if (roundFilter !== "all") {
        const group = ROUND_GROUPS.find(g => g.id === roundFilter);
        if (group?.stages && !group.stages.includes(match.stage)) return false;
      }

      return true;
    });
  }, [predictions, filter, roundFilter]);

  const counts = useMemo(() => ({
    all: predictions.length,
    correct: predictions.filter(p => p.match.status === "completed" && p.predicted_team_id === p.match.winner_id).length,
    wrong: predictions.filter(p => p.match.status === "completed" && p.predicted_team_id !== p.match.winner_id).length,
    pending: predictions.filter(p => p.match.status !== "completed").length,
  }), [predictions]);

  return (
    <div className="space-y-3">
      {/* Round filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {activeRounds.map((g) => (
          <button
            key={g.id}
            onClick={() => setRoundFilter(g.id)}
            className={`shrink-0 px-3 py-1.5 text-[10px] font-heading font-bold tracking-widest uppercase transition-all border rounded-sm ${
              roundFilter === g.id
                ? "bg-accent/15 border-accent/50 text-accent"
                : "bg-transparent border-border/50 text-text-secondary hover:text-text hover:border-border"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {([
          { id: "all", label: "Todos", count: counts.all },
          { id: "correct", label: "✓ Aciertos", count: counts.correct },
          { id: "wrong", label: "✗ Fallos", count: counts.wrong },
          { id: "pending", label: "Pendientes", count: counts.pending },
        ] as const).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-heading font-black tracking-widest uppercase transition-colors border slc-cyber-clip ${
              filter === f.id
                ? "bg-accent border-accent text-bg"
                : "bg-bg-alt border-border text-text-secondary hover:text-text hover:border-border-light"
            }`}
          >
            {f.label} <span className={`text-[9px] px-1 py-0.5 rounded-sm ${filter === f.id ? "bg-bg/20" : "bg-card text-muted"}`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Compact list */}
      <div className="bg-card border border-border slc-cyber-clip overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-text-secondary font-heading tracking-widest text-xs">
            NO HAY PARTIDOS EN ESTA CATEGORÍA
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map((pred) => {
              const match = pred.match;
              const isCompleted = match.status === "completed";
              const isCorrect = isCompleted && pred.predicted_team_id === match.winner_id;
              const isWrong = isCompleted && pred.predicted_team_id !== match.winner_id;
              const isLive = match.status === "live";

              const teamA_won = isCompleted && match.winner_id === match.team_a_id;
              const teamB_won = isCompleted && match.winner_id === match.team_b_id;
              const pickedA = pred.predicted_team_id === match.team_a_id;
              const pickedB = pred.predicted_team_id === match.team_b_id;

              return (
                <div key={pred.id} className={`flex items-center gap-2 px-3 py-2.5 hover:bg-card-hover transition-colors relative ${isCompleted && !isCorrect ? "opacity-70" : ""}`}>
                  {/* Left accent bar */}
                  {isCompleted && (
                    <div className={`absolute left-0 top-0 w-0.5 h-full ${isCorrect ? "bg-success" : "bg-r6-red"}`} />
                  )}

                  {/* Status icon */}
                  <div className={`w-5 h-5 flex items-center justify-center shrink-0 text-[9px] font-black ${
                    isCorrect ? "text-success" :
                    isWrong ? "text-r6-red" :
                    isLive ? "text-r6-red animate-pulse" :
                    "text-text-secondary"
                  }`}>
                    {isCorrect ? "✓" : isWrong ? "✗" : isLive ? "●" : "⏳"}
                  </div>

                  {/* Team A */}
                  <div className={`flex items-center gap-1.5 w-[28%] justify-end ${teamA_won ? "" : isCompleted ? "opacity-40" : ""}`}>
                    <span className={`font-heading font-black text-xs tracking-widest uppercase ${pickedA ? (isCorrect ? "text-success" : isWrong ? "text-r6-red" : "text-accent") : ""}`}>
                      {match.team_a?.short_name || "TBD"}
                    </span>
                    {match.team_a?.logo_url ? (
                      <Image src={match.team_a.logo_url} alt="" width={18} height={18} className="w-[18px] h-[18px] object-contain shrink-0" />
                    ) : (
                      <div className="w-[18px] h-[18px] bg-bg-alt flex items-center justify-center text-[7px] font-black shrink-0">{match.team_a?.short_name?.[0] || "?"}</div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="w-[14%] flex items-center justify-center shrink-0">
                    {isCompleted ? (
                      <span className="font-heading font-black text-xs tracking-wider bg-bg-alt border border-border/50 px-2 py-0.5 flex gap-1 items-center">
                        <span className={teamA_won ? "text-success" : "text-text-secondary"}>{match.score_a}</span>
                        <span className="text-border-light text-[10px]">-</span>
                        <span className={teamB_won ? "text-success" : "text-text-secondary"}>{match.score_b}</span>
                      </span>
                    ) : isLive && match.score_a !== null ? (
                      <span className="font-heading font-black text-xs tracking-wider text-r6-red animate-pulse">
                        {match.score_a}-{match.score_b}
                      </span>
                    ) : (
                      <span className="font-heading text-[10px] tracking-widest text-border-light">VS</span>
                    )}
                  </div>

                  {/* Team B */}
                  <div className={`flex items-center gap-1.5 w-[28%] ${teamB_won ? "" : isCompleted ? "opacity-40" : ""}`}>
                    {match.team_b?.logo_url ? (
                      <Image src={match.team_b.logo_url} alt="" width={18} height={18} className="w-[18px] h-[18px] object-contain shrink-0" />
                    ) : (
                      <div className="w-[18px] h-[18px] bg-bg-alt flex items-center justify-center text-[7px] font-black shrink-0">{match.team_b?.short_name?.[0] || "?"}</div>
                    )}
                    <span className={`font-heading font-black text-xs tracking-widest uppercase ${pickedB ? (isCorrect ? "text-success" : isWrong ? "text-r6-red" : "text-accent") : ""}`}>
                      {match.team_b?.short_name || "TBD"}
                    </span>
                  </div>

                  {/* Phase tag (compact) */}
                  <div className="hidden sm:flex items-center ml-auto">
                    <span className="text-[8px] font-heading font-bold text-text-secondary/50 tracking-widest uppercase truncate max-w-[120px]">{match.stage.replace("Phase 1 - ", "P1·").replace("Phase 2 - ", "").replace("Playoffs - ", "")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <p className="text-[10px] text-text-secondary/40 text-center tracking-widest font-heading uppercase">{filtered.length} predicciones</p>
    </div>
  );
}
