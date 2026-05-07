"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Match, Team } from "@/lib/types";
import Image from "next/image";

type MatchCardProps = {
  match: Match & { team_a: Team; team_b: Team };
  userPrediction?: string | null;
  userId?: string | null;
};

function TeamLogo({ team }: { team: Team }) {
  if (team.logo_url) {
    return <Image src={team.logo_url} alt={team.name} width={56} height={56} className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />;
  }
  return (
    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-bg-alt border border-border flex items-center justify-center font-heading font-black text-lg text-text-secondary slc-cyber-clip">
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
    <div className={`bg-card slc-cyber-clip relative group transition-all duration-300 ${
      isCompleted ? "border border-border opacity-90" : isLive ? "border-2 border-r6-red" : "border border-border hover:border-text-secondary"
    }`}>
      {/* Tech background pattern */}
      <div className="absolute inset-0 bg-cyber-dots opacity-10 pointer-events-none" />
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-bg-alt/80 border-b border-border/50 relative">
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-border via-border-light to-border" />
        <div className="flex items-center gap-3">
          {isLive && (
            <span className="flex items-center gap-1.5 text-[10px] bg-r6-red/20 border border-r6-red text-r6-red px-2 py-0.5 font-black tracking-widest uppercase">
              <span className="w-1.5 h-1.5 bg-r6-red rounded-full animate-pulse shadow-[0_0_5px_rgba(255,0,60,0.8)]" />
              EN VIVO
            </span>
          )}
          {isCompleted && (
            <span className="text-[10px] bg-bg border border-border text-text-secondary px-2 py-0.5 font-heading font-black tracking-widest uppercase">
              FINALIZADO
            </span>
          )}
          <span className="text-[10px] text-text-secondary font-heading font-bold tracking-widest uppercase">{match.stage}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-heading font-black bg-bg text-text-secondary px-2 py-0.5 border border-border tracking-widest uppercase">
            BO{match.best_of}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="px-5 py-5 relative z-10">
        {/* Date */}
        <p className="text-center text-[11px] text-text-secondary mb-4 font-heading tracking-widest font-bold uppercase">{dayStr} <span className="mx-2 text-border-light">/</span> {timeStr}</p>

        {/* Teams row */}
        <div className="flex items-center gap-3">
          {/* Team A */}
          <button
            onClick={() => handlePredict(match.team_a_id)}
            disabled={!userId || !!isLocked || predicting}
            className={`flex-1 flex flex-col items-center gap-3 p-4 slc-cyber-clip border transition-all duration-300 cursor-pointer ${teamBg(isPickedA, winnerA)} ${(!userId || isLocked) ? "cursor-default" : "hover:-translate-y-1 hover:border-r6-red"}`}
          >
            <TeamLogo team={match.team_a} />
            <div className="text-center w-full">
              <p className={`font-heading font-black text-sm sm:text-base tracking-widest uppercase truncate w-full ${winnerA ? "text-success" : isPickedA && !isCompleted ? "text-r6-red" : "text-text"}`}>
                {match.team_a.short_name}
              </p>
              <p className="text-[9px] text-text-secondary leading-tight mt-1 hidden sm:block truncate w-full tracking-wider uppercase font-medium">{match.team_a.name}</p>
            </div>
            {isCompleted && match.score_a !== null && (
              <span className={`text-2xl font-heading font-black leading-none mt-1 ${winnerA ? "text-success" : "text-text-secondary"}`}>
                {match.score_a}
              </span>
            )}
            {isPickedA && !isCompleted && (
              <span className="text-[10px] bg-r6-red text-white px-3 py-1 font-black tracking-widest uppercase mt-2">
                TU PICK
              </span>
            )}
          </button>

          {/* VS divider */}
          <div className="flex flex-col items-center gap-1 px-1">
            <span className={`font-heading font-black text-xl tracking-widest ${isLive ? "text-r6-red drop-shadow-[0_0_5px_rgba(255,0,60,0.5)]" : "text-border-light"}`}>
              VS
            </span>
          </div>

          {/* Team B */}
          <button
            onClick={() => handlePredict(match.team_b_id)}
            disabled={!userId || !!isLocked || predicting}
            className={`flex-1 flex flex-col items-center gap-3 p-4 slc-cyber-clip border transition-all duration-300 cursor-pointer ${teamBg(isPickedB, winnerB)} ${(!userId || isLocked) ? "cursor-default" : "hover:-translate-y-1 hover:border-r6-red"}`}
          >
            <TeamLogo team={match.team_b} />
            <div className="text-center w-full">
              <p className={`font-heading font-black text-sm sm:text-base tracking-widest uppercase truncate w-full ${winnerB ? "text-success" : isPickedB && !isCompleted ? "text-r6-red" : "text-text"}`}>
                {match.team_b.short_name}
              </p>
              <p className="text-[9px] text-text-secondary leading-tight mt-1 hidden sm:block truncate w-full tracking-wider uppercase font-medium">{match.team_b.name}</p>
            </div>
            {isCompleted && match.score_b !== null && (
              <span className={`text-2xl font-heading font-black leading-none mt-1 ${winnerB ? "text-success" : "text-text-secondary"}`}>
                {match.score_b}
              </span>
            )}
            {isPickedB && !isCompleted && (
              <span className="text-[10px] bg-r6-red text-white px-3 py-1 font-black tracking-widest uppercase mt-2">
                TU PICK
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Bottom status */}
      {!userId && !isLocked && (
        <div className="bg-bg-alt/80 px-5 py-3 text-center border-t border-border relative z-10">
          <p className="text-[11px] text-text-secondary font-heading tracking-widest uppercase">
            <a href="/login" className="text-accent hover:text-accent-hover font-black underline underline-offset-4 decoration-accent/30 mr-1">INICIA SESIÓN</a> PARA PREDECIR
          </p>
        </div>
      )}
      {userId && !isLocked && !currentPrediction && (
        <div className="bg-accent/10 px-5 py-3 text-center border-t border-accent/20 relative z-10">
          <p className="text-[11px] text-accent font-heading font-black tracking-widest uppercase animate-pulse">↑ SELECCIONA UN EQUIPO PARA PREDECIR ↑</p>
        </div>
      )}
      {correctPick && (
        <div className="bg-success/10 px-5 py-3 text-center border-t border-success/30 relative z-10">
          <p className="text-[11px] font-heading font-black tracking-widest uppercase text-success drop-shadow-[0_0_5px_rgba(0,255,136,0.5)]">✓ ¡ACERTASTE!</p>
        </div>
      )}
      {wrongPick && (
        <div className="bg-r6-red/10 px-5 py-3 text-center border-t border-r6-red/30 relative z-10">
          <p className="text-[11px] font-heading font-black tracking-widest uppercase text-r6-red drop-shadow-[0_0_5px_rgba(255,0,60,0.5)]">✗ FALLASTE LA PREDICCIÓN</p>
        </div>
      )}
    </div>
  );
}
