"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Match, Team } from "@/lib/types";

type MatchCardProps = {
  match: Match & { team_a: Team; team_b: Team };
  userPrediction?: string | null;
  userId?: string | null;
};

function TeamLogo({ team }: { team: Team }) {
  if (team.logo_url) {
    return <img src={team.logo_url} alt={team.name} className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-lg" />;
  }
  return (
    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-border-light flex items-center justify-center font-heading font-bold text-base text-muted">
      {team.short_name}
    </div>
  );
}

export function MatchCard({ match, userPrediction, userId }: MatchCardProps) {
  const [predicting, setPredicting] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState(userPrediction);
  const supabase = createClient();

  const isCompleted = match.status === "completed";
  const isLive = match.status === "live";
  const isLocked = match.status !== "upcoming" || (match.lock_date && new Date(match.lock_date) <= new Date());

  async function handlePredict(teamId: string) {
    if (!userId || isLocked || predicting) return;
    setPredicting(true);
    if (currentPrediction) {
      await supabase
        .from("predictions")
        .update({ predicted_team_id: teamId })
        .eq("user_id", userId)
        .eq("match_id", match.id);
    } else {
      await supabase.from("predictions").insert({
        user_id: userId, match_id: match.id, predicted_team_id: teamId,
      });
    }
    setCurrentPrediction(teamId);
    setPredicting(false);
  }

  const matchDate = new Date(match.match_date);
  const dayStr = matchDate.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }).toUpperCase();
  const timeStr = matchDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  const isPickedA = currentPrediction === match.team_a_id;
  const isPickedB = currentPrediction === match.team_b_id;
  const winnerA = isCompleted && match.winner_id === match.team_a_id;
  const winnerB = isCompleted && match.winner_id === match.team_b_id;
  const correctPick = isCompleted && currentPrediction === match.winner_id;
  const wrongPick = isCompleted && currentPrediction && currentPrediction !== match.winner_id;

  function teamBg(isPicked: boolean, isWinner: boolean) {
    if (isPicked && isCompleted) {
      return correctPick ? "bg-success/8 border-success/40" : "bg-r6-red/8 border-r6-red/40";
    }
    if (isPicked) return "bg-accent/8 border-accent/40";
    if (isCompleted && isWinner) return "bg-success/5 border-border-light";
    return "border-transparent hover:bg-card-hover";
  }

  return (
    <div className={`bg-card rounded-2xl overflow-hidden border transition-all duration-200 ${
      isCompleted ? "border-border/50" : isLive ? "border-r6-red/40 shadow-[0_0_20px_rgba(204,41,54,0.1)]" : "border-border hover:border-border-light hover:shadow-lg hover:shadow-black/20"
    }`}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-bg-alt/60">
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] bg-r6-red text-white px-2 py-0.5 rounded-full font-bold">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              EN VIVO
            </span>
          )}
          {isCompleted && (
            <span className="text-[10px] bg-border text-text-secondary px-2 py-0.5 rounded-full font-heading font-bold">
              FINALIZADO
            </span>
          )}
          <span className="text-[10px] text-muted font-heading tracking-wider">{match.stage}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-heading font-bold bg-card text-text-secondary px-2 py-0.5 rounded-full border border-border">
            BO{match.best_of}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 py-4">
        {/* Date */}
        <p className="text-center text-[10px] text-muted mb-3">{dayStr} · {timeStr}</p>

        {/* Teams row */}
        <div className="flex items-center gap-2">
          {/* Team A */}
          <button
            onClick={() => handlePredict(match.team_a_id)}
            disabled={!userId || !!isLocked || predicting}
            className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${teamBg(isPickedA, winnerA)} ${(!userId || isLocked) ? "cursor-default" : ""}`}
          >
            <TeamLogo team={match.team_a} />
            <div className="text-center">
              <p className={`font-heading font-bold text-sm tracking-wider ${winnerA ? "text-success" : isPickedA && !isCompleted ? "text-accent" : ""}`}>
                {match.team_a.short_name}
              </p>
              <p className="text-[9px] text-muted leading-tight mt-0.5 hidden sm:block">{match.team_a.name}</p>
            </div>
            {isCompleted && match.score_a !== null && (
              <span className={`text-xl font-heading font-bold ${winnerA ? "text-success" : "text-muted"}`}>
                {match.score_a}
              </span>
            )}
            {isPickedA && !isCompleted && (
              <span className="text-[9px] bg-accent text-bg px-2 py-0.5 rounded-full font-bold">
                TU PICK
              </span>
            )}
          </button>

          {/* VS divider */}
          <div className="flex flex-col items-center gap-1 px-1">
            <span className={`font-heading font-bold text-lg ${isLive ? "text-r6-red" : "text-muted"}`}>
              VS
            </span>
          </div>

          {/* Team B */}
          <button
            onClick={() => handlePredict(match.team_b_id)}
            disabled={!userId || !!isLocked || predicting}
            className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${teamBg(isPickedB, winnerB)} ${(!userId || isLocked) ? "cursor-default" : ""}`}
          >
            <TeamLogo team={match.team_b} />
            <div className="text-center">
              <p className={`font-heading font-bold text-sm tracking-wider ${winnerB ? "text-success" : isPickedB && !isCompleted ? "text-accent" : ""}`}>
                {match.team_b.short_name}
              </p>
              <p className="text-[9px] text-muted leading-tight mt-0.5 hidden sm:block">{match.team_b.name}</p>
            </div>
            {isCompleted && match.score_b !== null && (
              <span className={`text-xl font-heading font-bold ${winnerB ? "text-success" : "text-muted"}`}>
                {match.score_b}
              </span>
            )}
            {isPickedB && !isCompleted && (
              <span className="text-[9px] bg-accent text-bg px-2 py-0.5 rounded-full font-bold">
                TU PICK
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Bottom status */}
      {!userId && !isLocked && (
        <div className="bg-bg-alt/40 px-4 py-2.5 text-center border-t border-border/50">
          <p className="text-[11px] text-muted">
            <a href="/login" className="text-accent hover:text-accent-hover font-semibold">Inicia sesión</a> para predecir
          </p>
        </div>
      )}
      {userId && !isLocked && !currentPrediction && (
        <div className="bg-accent/5 px-4 py-2.5 text-center border-t border-accent/10">
          <p className="text-[11px] text-accent font-medium">↑ Toca un equipo para predecir el ganador</p>
        </div>
      )}
      {correctPick && (
        <div className="bg-success/10 px-4 py-2.5 text-center border-t border-success/20">
          <p className="text-[11px] font-bold text-success">✓ ¡Acertaste!</p>
        </div>
      )}
      {wrongPick && (
        <div className="bg-r6-red/10 px-4 py-2.5 text-center border-t border-r6-red/20">
          <p className="text-[11px] font-bold text-r6-red">✗ No acertaste</p>
        </div>
      )}
    </div>
  );
}
