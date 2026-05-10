"use client";

import { useState, useRef, useMemo } from "react";
import { toPng } from "html-to-image";
import type { Match, Team } from "@/lib/types";
import { toast } from "sonner";

import { User } from "@supabase/supabase-js";

type Props = {
  matches: (Match & { team_a: Team; team_b: Team })[];
  userPredictions: Record<string, string>;
  user: User;
};

const ROUND_GROUPS = [
  { id: "all", label: "Todos", stages: [] as string[] },
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

function getRoundLabel(roundId: string) {
  return ROUND_GROUPS.find(g => g.id === roundId)?.label || "Todos";
}

export function SharePredictions({ matches, userPredictions, user }: Props) {
  const [generating, setGenerating] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [mode, setMode] = useState<"picks" | "results">("picks");
  const ref = useRef<HTMLDivElement>(null);

  // Which round groups have predicted matches
  const activeRounds = useMemo(() => {
    const stagesWithPreds = new Set(matches.filter(m => userPredictions[m.id]).map(m => m.stage));
    return ROUND_GROUPS.filter(g => g.id === "all" || g.stages.some(s => stagesWithPreds.has(s)));
  }, [matches, userPredictions]);

  // Default to last predicted phase (latest round with predictions)
  const defaultRound = useMemo(() => {
    if (activeRounds.length <= 1) return "all";
    // Last active round (excluding "all")
    return activeRounds[activeRounds.length - 1].id;
  }, [activeRounds]);

  const [roundFilter, setRoundFilter] = useState<string | null>(null);
  const effectiveRound = roundFilter ?? defaultRound;

  // Filter matches by round
  const filteredMatches = useMemo(() => {
    if (effectiveRound === "all") return matches;
    const group = ROUND_GROUPS.find(g => g.id === effectiveRound);
    if (!group) return matches;
    return matches.filter(m => group.stages.includes(m.stage));
  }, [matches, effectiveRound]);

  const predictedMatches = filteredMatches.filter(m => userPredictions[m.id]);
  const finishedMatches = predictedMatches.filter(m => m.status === "completed");

  const currentMatches = mode === "picks" ? predictedMatches : finishedMatches;
  const matchCount = Math.min(currentMatches.length, 8);
  const displayMatches = currentMatches.slice(0, matchCount);

  const stats = {
    total: finishedMatches.length,
    correct: finishedMatches.filter(m => userPredictions[m.id] === m.winner_id).length,
    wrong: finishedMatches.filter(m => userPredictions[m.id] !== m.winner_id).length,
  };
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  async function preloadImages(container: HTMLElement) {
    const imgs = container.querySelectorAll("img");
    await Promise.all(
      Array.from(imgs).map(async (img) => {
        if (!img.src || img.src.startsWith("data:")) return;
        try {
          const res = await fetch(img.src, { mode: "no-cors" }).catch(() => null);
          if (!res || !res.ok) {
            img.style.display = "none";
            return;
          }
          const blob = await res.blob();
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          img.src = dataUrl;
        } catch {
          img.style.display = "none";
        }
      })
    );
  }

  async function handleShare() {
    if (!ref.current) return;
    setGenerating(true);
    try {
      const clone = ref.current.cloneNode(true) as HTMLElement;
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      document.body.appendChild(clone);

      await preloadImages(clone);

      const dataUrl = await toPng(clone, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#07090D",
      });

      document.body.removeChild(clone);

      const link = document.createElement("a");
      link.download = `mis-${mode}-${effectiveRound}-slc.png`;
      link.href = dataUrl;
      link.click();
      toast.success("¡Imagen descargada!");
    } catch (err) {
      console.error("Failed to generate image", err);
      try {
        const dataUrl = await toPng(ref.current!, {
          cacheBust: false,
          pixelRatio: 2,
          backgroundColor: "#07090D",
          skipFonts: true,
        });
        const link = document.createElement("a");
        link.download = `mis-${mode}-${effectiveRound}-slc.png`;
        link.href = dataUrl;
        link.click();
        toast.success("¡Imagen descargada!");
      } catch {
        toast.error("Error al generar la imagen. Prueba con una captura de pantalla.");
      }
    } finally {
      setGenerating(false);
    }
  }

  if (predictedMatches.length === 0 && effectiveRound === "all") return null;

  // Dynamic grid
  const gridClass = matchCount <= 4 ? "grid-cols-2 gap-6" : "grid-cols-4 gap-5";
  const cardHeight = matchCount <= 4 ? "min-h-[800px]" : "min-h-[950px]";
  const roundLabel = getRoundLabel(effectiveRound);

  return (
    <div className="mt-16 mb-8 flex flex-col items-center w-full overflow-hidden border-t border-border pt-12">
      <div className="text-center mb-6 px-4">
        <h3 className="text-2xl font-heading font-black tracking-widest uppercase text-text">TU TARJETA DE {mode === "picks" ? "PICKS" : "RESULTADOS"}</h3>
        <p className="text-text-secondary text-xs font-heading tracking-[0.2em] uppercase mt-2 opacity-60">Guárdala y compártela en redes sociales</p>
      </div>

      {/* Controls row */}
      <div className="flex flex-col gap-3 w-full max-w-2xl px-4 mb-8">
        {/* Mode Selector */}
        <div className="flex bg-bg-alt/50 backdrop-blur-md slc-cyber-clip border border-border p-1 w-full">
          <button
            onClick={() => setMode("picks")}
            className={`flex-1 py-2.5 font-heading font-black tracking-widest text-[10px] uppercase transition-all ${mode === "picks" ? "bg-accent text-bg" : "text-text-secondary hover:text-text"}`}
          >
            Mis Picks
          </button>
          <button
            onClick={() => setMode("results")}
            className={`flex-1 py-2.5 font-heading font-black tracking-widest text-[10px] uppercase transition-all ${mode === "results" ? "bg-accent text-bg" : "text-text-secondary hover:text-text"}`}
            disabled={stats.total === 0}
          >
            Resultados
          </button>
        </div>

        {/* Round Selector */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {activeRounds.map((g) => (
            <button
              key={g.id}
              onClick={() => setRoundFilter(g.id === defaultRound ? null : g.id)}
              className={`shrink-0 px-3 py-2 text-[10px] font-heading font-bold tracking-widest uppercase transition-all border slc-cyber-clip ${
                effectiveRound === g.id
                  ? "bg-accent/15 border-accent/50 text-accent"
                  : "bg-bg-alt border-border text-text-secondary hover:text-text hover:border-border-light"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {displayMatches.length === 0 ? (
        <div className="text-center py-10 text-text-secondary font-heading tracking-widest text-xs uppercase">
          No hay {mode === "picks" ? "predicciones" : "resultados"} en esta ronda
        </div>
      ) : (
        <>
          {/* Card preview */}
          <div className="w-full flex justify-center px-4 overflow-hidden mb-8">
            <div className="relative origin-top" style={{ transform: "scale(min(1, calc((100vw - 32px) / 850)))", height: `calc(min(1, calc((100vw - 32px) / 850)) * ${matchCount <= 4 ? 800 : 950}px)`, width: "850px" }}>
              <div ref={ref} className={`w-[850px] ${cardHeight} bg-[#07090D] p-10 flex flex-col relative overflow-hidden font-heading shrink-0 border border-border/40 rounded-2xl shadow-2xl shadow-black`}>
                {/* Background */}
                <div className="absolute inset-0 bg-[url('/fantasix_logoW.png')] bg-[center_top_40%] bg-no-repeat opacity-[0.04] grayscale pointer-events-none" style={{ backgroundSize: '70%' }} />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-r6-red/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex justify-between items-end mb-10 border-b border-white/5 pb-8">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-accent/30 blur-xl rounded-full" />
                        {(user.user_metadata?.avatar_url && !avatarError) ? (
                          <img
                            src={user.user_metadata.avatar_url.replace("_normal", "_200x200")}
                            alt="Avatar"
                            onError={() => setAvatarError(true)}
                            crossOrigin="anonymous"
                            className="w-24 h-24 rounded-full border-4 border-accent relative z-10 object-cover shadow-[0_0_20px_rgba(209,242,0,0.4)]"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full border-4 border-accent bg-card flex items-center justify-center text-3xl text-accent font-black relative z-10 uppercase">
                            {(user.user_metadata?.preferred_username || user.email || "U")[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-white text-4xl font-black tracking-widest uppercase italic">@{user.user_metadata?.preferred_username || user.email?.split('@')[0]}</h2>
                        <p className="text-text-secondary text-xl tracking-[0.2em] uppercase mt-1 font-bold opacity-80">{mode === "picks" ? "Predicciones" : "Resultados"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h1 className="text-white text-4xl font-black tracking-widest uppercase italic leading-none">SIX MAJOR</h1>
                      <p className="text-r6-red text-2xl font-black tracking-widest uppercase mt-1 italic">SLC 2026</p>
                      {effectiveRound !== "all" && (
                        <p className="text-accent text-sm font-black tracking-widest uppercase mt-2 bg-accent/10 px-3 py-1 border border-accent/20 inline-block">{roundLabel}</p>
                      )}
                    </div>
                  </div>

                  {mode === "results" ? (
                    <div className="flex-1 flex flex-col justify-center gap-8">
                      {/* Stats row */}
                      <div className="bg-gradient-to-br from-bg-alt/80 to-bg-alt/40 border border-border/50 rounded-2xl p-8 relative overflow-hidden text-center">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
                        <div className="relative z-10">
                          <div className="flex items-center justify-center gap-3">
                            <span className="text-[120px] font-black text-success leading-none italic">{accuracy}%</span>
                          </div>
                          <div className="text-2xl text-text-secondary font-black tracking-[0.5em] uppercase -mt-2 italic opacity-70">DE ACIERTOS</div>

                          <div className="w-full h-3 bg-white/5 rounded-full mt-8 relative overflow-hidden border border-white/5">
                            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-success/80 to-success" style={{ width: `${accuracy}%` }} />
                          </div>

                          <div className="grid grid-cols-3 gap-8 mt-8">
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                              <p className="text-5xl font-black text-success italic">{stats.correct}</p>
                              <p className="text-[10px] text-success/70 font-black tracking-[0.2em] uppercase mt-1">ACIERTOS</p>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                              <p className="text-5xl font-black text-r6-red italic">{stats.wrong}</p>
                              <p className="text-[10px] text-r6-red/70 font-black tracking-[0.2em] uppercase mt-1">FALLOS</p>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                              <p className="text-5xl font-black text-white italic">{stats.total}</p>
                              <p className="text-[10px] text-text-secondary font-black tracking-[0.2em] uppercase mt-1">TOTAL</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Results Grid */}
                      <div className={`grid ${gridClass}`}>
                        {displayMatches.map(m => {
                          const isCorrect = userPredictions[m.id] === m.winner_id;
                          const team = userPredictions[m.id] === m.team_a_id ? m.team_a : m.team_b;
                          const vs = userPredictions[m.id] === m.team_a_id ? m.team_b : m.team_a;
                          if (!team) return null;
                          return (
                            <div key={m.id} className={`p-4 border-2 slc-cyber-clip flex items-center gap-4 ${isCorrect ? 'bg-success/10 border-success/40' : 'bg-r6-red/10 border-r6-red/40'}`}>
                              <img src={team.logo_url || ""} className="w-14 h-14 object-contain" alt="" />
                              <div className="min-w-0">
                                <p className="text-white font-black text-lg truncate uppercase italic">{team.short_name}</p>
                                <p className="text-xs text-text-secondary font-bold uppercase tracking-widest opacity-70">vs {vs?.short_name || "???"}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className={`text-base font-black italic ${isCorrect ? 'text-success' : 'text-r6-red'}`}>
                                    {m.score_a} - {m.score_b}
                                  </p>
                                  <span className={`text-base ${isCorrect ? 'text-success' : 'text-r6-red'}`}>{isCorrect ? "✓" : "✗"}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Picks Content */
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="bg-gradient-to-br from-bg-alt/90 to-bg-alt/40 border-2 border-border/50 p-10 flex-1 flex flex-col rounded-2xl relative slc-cyber-clip shadow-2xl shadow-black/60">
                        <div className="absolute top-0 left-0 w-20 h-20 border-t-6 border-l-6 border-accent/40 m-6 rounded-tl-lg" />
                        <div className="absolute bottom-0 right-0 w-20 h-20 border-b-6 border-r-6 border-r6-red/40 m-6 rounded-br-lg" />

                        <div className="text-center mb-10 relative z-10">
                          <h3 className="text-accent text-6xl font-black tracking-widest uppercase italic">{displayMatches.length} PICKS</h3>
                          <div className="w-48 h-1.5 bg-gradient-to-r from-transparent via-accent/50 to-transparent mx-auto mt-4" />
                          {effectiveRound !== "all" && (
                            <p className="text-accent/60 text-lg tracking-[0.3em] uppercase mt-3 font-black italic">{roundLabel}</p>
                          )}
                        </div>

                        <div className={`grid ${gridClass} relative z-10 flex-1 content-center`}>
                          {displayMatches.map((match) => {
                            const pickedTeamId = userPredictions[match.id];
                            const isTeamA = match.team_a_id === pickedTeamId;
                            const team = isTeamA ? match.team_a : match.team_b;
                            const opposingTeam = isTeamA ? match.team_b : match.team_a;
                            if (!team) return null;

                            return (
                              <div key={match.id} className="bg-black/40 border-2 border-border/60 flex flex-col items-center justify-center p-6 slc-cyber-clip relative">
                                {team.logo_url ? (
                                  <img src={team.logo_url} alt={team.short_name} className="w-20 h-20 object-contain mb-4" />
                                ) : (
                                  <div className="w-20 h-20 flex items-center justify-center text-2xl font-black text-white mb-4">{team.short_name}</div>
                                )}
                                <span className="text-white font-black text-xl tracking-widest uppercase block italic">{team.short_name}</span>
                                <div className="flex items-center justify-center gap-1.5 mt-2 opacity-40">
                                  <span className="w-2 h-[1px] bg-text-secondary" />
                                  <span className="text-text-secondary font-black text-[10px] tracking-[0.15em] uppercase">VS {opposingTeam?.short_name || "???"}</span>
                                  <span className="w-2 h-[1px] bg-text-secondary" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex justify-between items-center text-text-secondary text-2xl font-black uppercase tracking-[0.25em] italic opacity-30 mt-8 px-2">
                    <span className="flex items-center gap-3">
                      <span className="w-10 h-[2px] bg-accent/50" />
                      predicciones.tebimedia.com
                    </span>
                    <span className="text-accent">🎯</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleShare}
            disabled={generating}
            className="flex items-center gap-3 bg-accent hover:bg-accent-hover text-bg text-lg font-heading font-black px-10 py-5 slc-cyber-clip tracking-[0.2em] uppercase transition duration-500 cursor-pointer disabled:opacity-50 shadow-[0_0_30px_rgba(209,242,0,0.3)] hover:shadow-[0_0_50px_rgba(209,242,0,0.5)] hover:-translate-y-1 active:translate-y-0"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/></svg>
            {generating ? "GENERANDO..." : `DESCARGAR ${mode === "picks" ? "TARJETA" : "RESULTADOS"}`}
          </button>
        </>
      )}
    </div>
  );
}
