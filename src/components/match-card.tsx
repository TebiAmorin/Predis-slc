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
    return <Image src={team.logo_url} alt={team.name} width={56} height={56} className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />;
  }
  return (
    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-bg-alt border border-border flex items-center justify-center font-heading font-black text-lg text-text-secondary slc-cyber-clip">
      {team?.short_name || "???"}
    </div>
  );
}

export function MatchCard({ match, userPrediction, userId, readonlyRedirect, matchStats }: MatchCardProps) {
  const [saving, setSaving] = useState(false);
  const [savedPrediction, setSavedPrediction] = useState(userPrediction);
  const [pendingPick, setPendingPick] = useState<string | null>(null);
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
  const [isLocked, setIsLocked] = useState(match.status !== "upcoming");

  useEffect(() => {
    setIsLocked(match.status !== "upcoming" || (!!match.lock_date && new Date(match.lock_date) <= new Date()));
  }, [match.status, match.lock_date]);

  // The "displayed" prediction is either the pending unsaved pick or the saved one
  const displayedPick = pendingPick ?? savedPrediction;
  const hasUnsavedChange = pendingPick !== null && pendingPick !== savedPrediction;

  function handleTeamClick(teamId: string) {
    if (readonlyRedirect) {
      router.push(readonlyRedirect);
      return;
    }
    if (!userId || isLocked || saving) {
      if (!userId) router.push("/login");
      return;
    }
    // If clicking same team as pending, deselect
    if (pendingPick === teamId) {
      setPendingPick(savedPrediction ?? null);
      return;
    }
    setPendingPick(teamId);
  }

  async function handleSave() {
    if (!userId || !pendingPick || saving) return;
    setSaving(true);
    const { error } = await supabase
      .from("predictions")
      .upsert(
        { user_id: userId, match_id: match.id, predicted_team_id: pendingPick },
        { onConflict: "user_id,match_id" }
      );
    if (error) {
      console.error("Error saving prediction:", error);
      toast.error("Error al guardar. Inténtalo de nuevo.", { duration: 3000 });
      setSaving(false);
      return;
    }
    setSavedPrediction(pendingPick);
    setPendingPick(null);
    setSaving(false);
    toast.success("Predicción guardada", { duration: 2000 });
  }

  const matchDate = new Date(match.match_date);
  const dayStr = matchDate.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }).toUpperCase();
  const timeStr = matchDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  const isPickedA = displayedPick === match.team_a_id;
  const isPickedB = displayedPick === match.team_b_id;
  const winnerA = isCompleted && match.winner_id === match.team_a_id;
  const winnerB = isCompleted && match.winner_id === match.team_b_id;
  const correctPick = isCompleted && savedPrediction === match.winner_id;
  const wrongPick = isCompleted && savedPrediction && savedPrediction !== match.winner_id;

  // Real pick percentages (only show when we have real data)
  const totalPicks = matchStats ? (matchStats.a + matchStats.b) : 0;
  let teamAPercent = 50;
  let teamBPercent = 50;

  if (totalPicks > 0 && matchStats) {
    teamAPercent = Math.round((matchStats.a / totalPicks) * 100);
    teamBPercent = 100 - teamAPercent;
  }

  const showStats = matchStats && totalPicks > 0;

  function getTeamStyle(isPicked: boolean, isWinner: boolean) {
    if (isCompleted) {
      if (isWinner) return "bg-success/5 border-success/30 opacity-100 shadow-[inset_0_0_20px_rgba(0,255,136,0.05)]";
      return "opacity-30 grayscale border-transparent";
    }
    if (isPicked && hasUnsavedChange) return "bg-accent/15 border-accent/60 shadow-[0_0_15px_rgba(0,229,209,0.15)] ring-1 ring-accent/30";
    if (isPicked) return "bg-accent/10 border-accent/50 shadow-[0_0_15px_rgba(0,229,209,0.1)]";
    return "border-transparent hover:bg-card-hover hover:border-border";
  }

  let pickText = "SIN PREDICCIÓN";
  if (savedPrediction) {
    const pickedName = savedPrediction === match.team_a_id ? (match.team_a?.short_name || "???") : (match.team_b?.short_name || "???");
    if (correctPick) pickText = `✓ ACIERTO: ${pickedName}`;
    else if (wrongPick) pickText = `✗ FALLO: ${pickedName}`;
    else pickText = pickedName;
  }

  return (
    <div className={`bg-card slc-cyber-clip border transition-all duration-300 flex flex-col relative overflow-hidden ${
      isCompleted ? "border-border/30 opacity-60 grayscale-[0.3]" : isLiveDynamic ? "border-r6-red shadow-[0_0_10px_rgba(255,0,60,0.2)]" : hasUnsavedChange ? "border-accent/40 shadow-[0_0_12px_rgba(0,229,209,0.1)]" : "border-border"
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
          onClick={() => match.team_a_id && handleTeamClick(match.team_a_id)}
          disabled={(!userId && !readonlyRedirect) || !!isLocked || saving || !match.team_a_id}
          className={`w-[40%] flex flex-col items-center gap-2 p-3 slc-cyber-clip border transition-all duration-300 ${getTeamStyle(isPickedA, winnerA)} ${(!userId && !readonlyRedirect) || isLocked ? "cursor-default" : "cursor-pointer hover:-translate-y-1 hover:border-accent/50"} relative touch-bounce`}
        >
          <TeamLogo team={match.team_a} />
          <span className={`font-heading font-black text-sm sm:text-base tracking-widest uppercase mt-1 ${
            isCompleted ? (winnerA ? "text-success drop-shadow-[0_0_8px_rgba(0,255,136,0.3)]" : "text-text-secondary line-through decoration-r6-red/50")
            : isPickedA ? "text-accent" : "text-text"
          }`}>
            {match.team_a?.short_name || "TBD"}
          </span>
          {showStats && <span className="text-[10px] text-text-secondary font-bold tracking-widest">{teamAPercent}%</span>}
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
          ) : isLiveDynamic && match.score_a !== null && match.score_a !== undefined ? (
            <>
              <span className="font-heading font-black text-2xl sm:text-3xl whitespace-nowrap text-text flex items-center gap-1.5">
                <span className="text-r6-red">{match.score_a}</span>
                <span className="text-text-secondary text-lg">-</span>
                <span className="text-r6-red">{match.score_b}</span>
              </span>
              <a
                href="https://twitch.tv/vetelcito01"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 bg-r6-red text-white text-[10px] px-2 py-0.5 font-black tracking-widest uppercase animate-pulse border border-r6-red hover:bg-white hover:text-r6-red transition"
                title="Ver en Twitch"
              >
                LIVE
              </a>
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
          onClick={() => match.team_b_id && handleTeamClick(match.team_b_id)}
          disabled={(!userId && !readonlyRedirect) || !!isLocked || saving || !match.team_b_id}
          className={`w-[40%] flex flex-col items-center gap-2 p-3 slc-cyber-clip border transition-all duration-300 ${getTeamStyle(isPickedB, winnerB)} ${(!userId && !readonlyRedirect) || isLocked ? "cursor-default" : "cursor-pointer hover:-translate-y-1 hover:border-accent/50"} relative touch-bounce`}
        >
          <TeamLogo team={match.team_b} />
          <span className={`font-heading font-black text-sm sm:text-base tracking-widest uppercase mt-1 ${
            isCompleted ? (winnerB ? "text-success drop-shadow-[0_0_8px_rgba(0,255,136,0.3)]" : "text-text-secondary line-through decoration-r6-red/50")
            : isPickedB ? "text-accent" : "text-text"
          }`}>
            {match.team_b?.short_name || "TBD"}
          </span>
          {showStats && <span className="text-[10px] text-text-secondary font-bold tracking-widest">{teamBPercent}%</span>}
        </button>
      </div>

      {/* Pick distribution bar */}
      {!isCompleted && showStats && (
        <div className="px-4 pb-2">
          <div className="pick-bar">
            <div
              className="pick-bar-fill"
              style={{
                width: `${teamAPercent}%`,
                background: isPickedA ? 'var(--color-accent)' : isPickedB ? 'var(--color-text-secondary)' : 'var(--color-border-light)',
              }}
            />
          </div>
        </div>
      )}

      {/* Save button - appears when there's an unsaved pick */}
      {hasUnsavedChange && !isLocked && !isCompleted && (
        <div className="px-4 pb-3 animate-fade-in">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-accent hover:bg-accent-hover text-bg font-heading font-black text-xs tracking-widest uppercase transition-all slc-cyber-clip shadow-[0_0_15px_rgba(0,229,209,0.2)] hover:shadow-[0_0_25px_rgba(0,229,209,0.4)] disabled:opacity-50 touch-bounce flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75"/></svg>
                GUARDANDO...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                GUARDAR PREDICCIÓN
              </>
            )}
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="flex border-t border-border/50 bg-bg-alt/30">
        <div className={`flex-1 py-2.5 text-center border-r border-border/50 transition-colors ${
          correctPick ? "bg-success/20 text-success" :
          wrongPick ? "bg-r6-red/20 text-r6-red" :
          savedPrediction ? "bg-accent/10 text-accent" :
          "text-text-secondary"
        }`}>
          <span className="font-heading font-black text-[10px] uppercase tracking-widest">
            {pickText}
          </span>
        </div>
        <div className="flex-1 py-2.5 text-center text-text-secondary">
          <span className="font-heading font-black text-[10px] uppercase tracking-widest">
            {isCompleted ? "FINALIZADO" : isLive ? "EN JUEGO" : hasUnsavedChange ? "SIN GUARDAR" : "PREDICE AHORA"}
          </span>
        </div>
      </div>
    </div>
  );
}
