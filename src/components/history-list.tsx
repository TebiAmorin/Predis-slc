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

export function HistoryList({ predictions }: HistoryListProps) {
  const [filter, setFilter] = useState<"all" | "correct" | "wrong" | "pending">("all");

  const filtered = useMemo(() => {
    return predictions.filter((pred) => {
      const match = pred.match;
      const isCompleted = match.status === "completed";
      const isCorrect = isCompleted && pred.predicted_team_id === match.winner_id;
      const isWrong = isCompleted && pred.predicted_team_id !== match.winner_id;
      
      if (filter === "correct") return isCorrect;
      if (filter === "wrong") return isWrong;
      if (filter === "pending") return !isCompleted;
      return true;
    });
  }, [predictions, filter]);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: "all", label: "TODOS", count: predictions.length },
          { id: "correct", label: "ACIERTOS", count: predictions.filter(p => p.match.status === "completed" && p.predicted_team_id === p.match.winner_id).length },
          { id: "wrong", label: "FALLOS", count: predictions.filter(p => p.match.status === "completed" && p.predicted_team_id !== p.match.winner_id).length },
          { id: "pending", label: "PENDIENTES", count: predictions.filter(p => p.match.status !== "completed").length },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as "all" | "correct" | "wrong" | "pending")}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 text-[10px] font-heading font-black tracking-widest uppercase transition-colors border slc-cyber-clip ${
              filter === f.id 
                ? "bg-accent border-accent text-bg" 
                : "bg-bg-alt border-border text-text-secondary hover:text-text hover:border-border-light"
            }`}
          >
            {f.label} <span className={`px-1.5 py-0.5 rounded-sm ${filter === f.id ? "bg-bg/20" : "bg-card text-muted"}`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Lista compacta */}
      <div className="bg-card border border-border slc-cyber-clip overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-text-secondary font-heading tracking-widest text-sm">
            NO HAY PARTIDOS EN ESTA CATEGORÍA
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((pred) => {
              const match = pred.match;
              const isCompleted = match.status === "completed";
              const isCorrect = isCompleted && pred.predicted_team_id === match.winner_id;
              const isWrong = isCompleted && pred.predicted_team_id !== match.winner_id;
              const isLive = match.status === "live";

              const teamA_won = isCompleted && match.winner_id === match.team_a_id;
              const teamB_won = isCompleted && match.winner_id === match.team_b_id;

              return (
                <div key={pred.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 hover:bg-card-hover transition-colors relative">
                  {isCompleted && (
                    <div className={`absolute left-0 top-0 w-1 h-full ${isCorrect ? "bg-success" : "bg-r6-red"}`} />
                  )}
                  
                  {/* Izquierda: Estado y Fase */}
                  <div className="flex items-center gap-3 sm:w-[25%] pl-2 sm:pl-3">
                    <div className={`w-6 h-6 flex items-center justify-center shrink-0 font-black text-[10px] ${
                      isCorrect ? "bg-success/20 text-success" :
                      isWrong ? "bg-r6-red/20 text-r6-red" :
                      isLive ? "bg-accent/20 text-accent animate-pulse" :
                      "bg-border text-text-secondary"
                    }`}>
                      {isCorrect ? "✓" : isWrong ? "✗" : isLive ? "▶" : "⏳"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-heading font-bold text-text-secondary tracking-widest uppercase truncate">{match.stage}</p>
                      <p className="text-[9px] text-muted tracking-wider truncate">{new Date(match.match_date).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>

                  {/* Centro: Marcador */}
                  <div className="flex items-center justify-between sm:justify-center gap-3 sm:w-[50%] bg-bg-alt/30 sm:bg-transparent p-2 sm:p-0 rounded">
                    {/* Team A */}
                    <div className={`flex items-center gap-2 w-[40%] sm:w-auto justify-end ${teamA_won ? "text-text" : isCompleted ? "text-text-secondary grayscale opacity-50 line-through" : "text-text"}`}>
                      <span className="font-heading font-black text-sm tracking-widest">{match.team_a.short_name}</span>
                      {match.team_a.logo_url ? (
                        <Image src={match.team_a.logo_url} alt="" width={20} height={20} className="w-5 h-5 object-contain" />
                      ) : (
                        <div className="w-5 h-5 bg-bg flex items-center justify-center text-[8px] font-black">{match.team_a.short_name[0]}</div>
                      )}
                    </div>

                    {/* Score */}
                    <div className="flex-shrink-0 flex items-center justify-center w-[20%] sm:w-20">
                      {isCompleted ? (
                        <span className="font-heading font-black text-sm tracking-widest bg-bg border border-border px-2 py-1 flex gap-1.5">
                          <span className={teamA_won ? "text-success" : ""}>{match.score_a}</span>
                          <span className="text-text-secondary">-</span>
                          <span className={teamB_won ? "text-success" : ""}>{match.score_b}</span>
                        </span>
                      ) : (
                        <span className="font-heading font-bold text-[10px] tracking-widest text-border-light px-2 py-1">VS</span>
                      )}
                    </div>

                    {/* Team B */}
                    <div className={`flex items-center gap-2 w-[40%] sm:w-auto justify-start ${teamB_won ? "text-text" : isCompleted ? "text-text-secondary grayscale opacity-50 line-through" : "text-text"}`}>
                      {match.team_b.logo_url ? (
                        <Image src={match.team_b.logo_url} alt="" width={20} height={20} className="w-5 h-5 object-contain" />
                      ) : (
                        <div className="w-5 h-5 bg-bg flex items-center justify-center text-[8px] font-black">{match.team_b.short_name[0]}</div>
                      )}
                      <span className="font-heading font-black text-sm tracking-widest">{match.team_b.short_name}</span>
                    </div>
                  </div>

                  {/* Derecha: Tu Pick */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:w-[25%] pr-2">
                    <span className="text-[9px] text-text-secondary tracking-widest font-bold uppercase sm:hidden">TU PICK:</span>
                    <div className="flex flex-col sm:items-end">
                      <span className="text-[8px] text-text-secondary tracking-widest font-bold uppercase hidden sm:block mb-0.5">TU PICK</span>
                      <span className={`font-heading font-black text-sm tracking-widest uppercase ${
                        isCorrect ? "text-success" : isWrong ? "text-r6-red" : "text-accent"
                      }`}>
                        {pred.predicted_team?.short_name}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
