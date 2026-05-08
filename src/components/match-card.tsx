"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Match, Team } from "@/lib/types";
import Image from "next/image";
import { toast } from "sonner";

type MatchCardProps = {
  match: Match & { team_a: Team; team_b: Team };
  userPrediction?: string | null;
  userId?: string | null;
  readonlyRedirect?: string;
  matchStats?: { a: number; b: number };
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

export function MatchCard({ match, userPrediction, userId, readonlyRedirect, matchStats }: MatchCardProps) {
  const [predicting, setPredicting] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState(userPrediction);
  const supabase = createClient();
  const router = useRouter();

  const [isLiveDynamic, setIsLiveDynamic] = useState(false);

  useEffect(() => {
    function checkLive() {
      const timePassed = new Date(match.match_date).getTime() <= new Date().getTime();
      setIsLiveDynamic(match.status === "live" || (match.status !== "completed" && timePassed));
    }
    checkLive();
    const interval = setInterval(checkLive, 60000);
    return () => clearInterval(interval);
  }, [match.status, match.match_date]);

  const isCompleted = match.status === "completed";
  const isLive = match.status === "live";
  const isLocked = match.status !== "upcoming" || (match.lock_date && new Date(match.lock_date) <= new Date());

  async function handlePredict(teamId: string) {
    if (readonlyRedirect) {
      router.push(readonlyRedirect);
      return;
    }
    if (!userId || isLocked || predicting) {
      if (!userId) router.push("/login");
      return;
    }
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
    toast.success("Predicción guardada", { duration: 2000 });
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

  // Real or fallback pick percentages
  const totalPicks = matchStats ? (matchStats.a + matchStats.b) : 0;
  let teamAPercent = 50;
  let teamBPercent = 50;
  
  if (totalPicks > 0 && matchStats) {
    teamAPercent = Math.round((matchStats.a / totalPicks) * 100);
    teamBPercent = 100 - teamAPercent;
  } else if (!matchStats) {
    // Fallback deterministic random if RPC is not ready
    const hash = match.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    teamAPercent = (hash % 61) + 20; 
    teamBPercent = 100 - teamAPercent;
  }

  function getTeamStyle(isPicked: boolean, isWinner: boolean) {
    if (isCompleted) {
      if (isWinner) return "bg-success/5 border-success/30 opacity-100 shadow-[inset_0_0_20px_rgba(0,255,136,0.05)]";
      return "opacity-30 grayscale border-transparent";
    }
    if (isPicked) return "bg-accent/10 border-accent/50 shadow-[0_0_15px_rgba(209,242,0,0.1)]";
    return "border-transparent hover:bg-card-hover hover:border-border";
  }

  let pickText = "SIN PREDICCIÓN";
  if (currentPrediction) {
    const pickedName = currentPrediction === match.team_a_id ? match.team_a.short_name : match.team_b.short_name;
    if (correctPick) pickText = `✓ ACIERTO: ${pickedName}`;
    else if (wrongPick) pickText = `✗ FALLO: ${pickedName}`;
    else pickText = pickedName;
  }

  return (
    <div className={`bg-card slc-cyber-clip border transition-all duration-300 flex flex-col relative overflow-hidden ${
      isCompleted ? "border-border/30 opacity-60 grayscale-[0.3]" : isLiveDynamic ? "border-r6-red shadow-[0_0_10px_rgba(255,0,60,0.2)]" : "border-border"
    }`}>
      {/* Top bar */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-border/50 bg-bg-alt/80">
        <span className="font-heading font-black text-[9px] sm:text-[10px] text-text-secondary uppercase tracking-widest">
          {match.stage} - {dayStr}
        </span>
        <span className="font-heading font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-text-secondary">
          {isCompleted ? "COMPLETADO" : isLiveDynamic ? <span className="text-r6-red animate-pulse">EN VIVO</span> : "PENDIENTE"}
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-row p-4 relative z-10 items-center justify-between">
        {/* Team A */}
        <button
          onClick={() => handlePredict(match.team_a_id)}
          disabled={(!userId && !readonlyRedirect) || !!isLocked || predicting}
          className={`w-[40%] flex flex-col items-center gap-2 p-3 slc-cyber-clip border transition-all duration-300 ${getTeamStyle(isPickedA, winnerA)} ${(!userId && !readonlyRedirect) || isLocked ? "cursor-default" : "cursor-pointer hover:-translate-y-1 hover:border-accent/50"} relative`}
        >
          <TeamLogo team={match.team_a} />
          <span className={`font-heading font-black text-sm sm:text-base tracking-widest uppercase mt-1 ${
            isCompleted ? (winnerA ? "text-success drop-shadow-[0_0_8px_rgba(0,255,136,0.3)]" : "text-text-secondary line-through decoration-r6-red/50") 
            : isPickedA ? "text-accent" : "text-text"
          }`}>
            {match.team_a.short_name}
          </span>
          <span className="text-[10px] text-text-secondary font-bold tracking-widest">{teamAPercent}% Picks</span>
        </button>

        {/* Center */}
        <div className="flex flex-col items-center justify-center min-w-[80px] px-2 shrink-0">
          {isCompleted ? (
            <>
              <span className="font-heading font-black text-2xl sm:text-3xl whitespace-nowrap text-text flex items-center gap-1.5">
                <span className={winnerA ? "text-success" : ""}>{match.score_a}</span>
                <span className="text-text-secondary text-lg">-</span>
                <span className={winnerB ? "text-success" : ""}>{match.score_b}</span>
              </span>
              <span className="text-[9px] text-text-secondary uppercase tracking-widest font-bold mt-1 bg-bg-alt px-2 py-0.5 border border-border">FINAL</span>
            </>
          ) : (
            <>
              <span className="font-heading font-bold text-xl sm:text-2xl text-border-light tracking-widest">VS</span>
              {isLiveDynamic ? (
                <a 
                  href="https://twitch.tv/vetelcito01" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-1 bg-r6-red text-white text-[10px] px-2 py-0.5 font-black tracking-widest uppercase animate-pulse border border-r6-red hover:bg-white hover:text-r6-red transition"
                  title="Ver en Twitch"
                >
                  LIVE
                </a>
              ) : (
                <span className="text-[10px] text-text-secondary font-bold tracking-widest mt-1">
                  {timeStr}
                </span>
              )}
            </>
          )}
        </div>

        {/* Team B */}
        <button
          onClick={() => handlePredict(match.team_b_id)}
          disabled={(!userId && !readonlyRedirect) || !!isLocked || predicting}
          className={`w-[40%] flex flex-col items-center gap-2 p-3 slc-cyber-clip border transition-all duration-300 ${getTeamStyle(isPickedB, winnerB)} ${(!userId && !readonlyRedirect) || isLocked ? "cursor-default" : "cursor-pointer hover:-translate-y-1 hover:border-accent/50"} relative`}
        >
          <TeamLogo team={match.team_b} />
          <span className={`font-heading font-black text-sm sm:text-base tracking-widest uppercase mt-1 ${
            isCompleted ? (winnerB ? "text-success drop-shadow-[0_0_8px_rgba(0,255,136,0.3)]" : "text-text-secondary line-through decoration-r6-red/50") 
            : isPickedB ? "text-accent" : "text-text"
          }`}>
            {match.team_b.short_name}
          </span>
          <span className="text-[10px] text-text-secondary font-bold tracking-widest">{teamBPercent}% Picks</span>
        </button>
      </div>

      {/* Footer */}
      <div className="flex border-t border-border/50 bg-bg-alt/30">
        <div className={`flex-1 py-2.5 text-center border-r border-border/50 transition-colors ${
          correctPick ? "bg-success/20 text-success" : 
          wrongPick ? "bg-r6-red/20 text-r6-red" : 
          currentPrediction ? "bg-accent/10 text-accent" : 
          "text-text-secondary"
        }`}>
          <span className="font-heading font-black text-[10px] uppercase tracking-widest">
            {pickText}
          </span>
        </div>
        <div className="flex-1 py-2.5 text-center text-text-secondary">
          <span className="font-heading font-black text-[10px] uppercase tracking-widest">
            {isCompleted ? "FINALIZADO" : isLive ? "EN JUEGO" : "PREDICE AHORA"}
          </span>
        </div>
      </div>
    </div>
  );
}
