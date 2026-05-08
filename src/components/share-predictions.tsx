"use client";

import { useState, useRef } from "react";
import { toPng } from "html-to-image";
import type { Match, Team } from "@/lib/types";
import { toast } from "sonner";

import { User } from "@supabase/supabase-js";

type Props = {
  matches: (Match & { team_a: Team; team_b: Team })[];
  userPredictions: Record<string, string>;
  user: User;
};

export function SharePredictions({ matches, userPredictions, user }: Props) {
  const [generating, setGenerating] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [mode, setMode] = useState<"picks" | "results">("picks");
  const ref = useRef<HTMLDivElement>(null);

  const predictedMatches = matches.filter(m => userPredictions[m.id]);
  const finishedMatches = predictedMatches.filter(m => m.status === "completed");
  
  // Decide how many matches to show (4 or 8)
  const currentMatches = mode === "picks" ? predictedMatches : finishedMatches;
  const matchCount = currentMatches.length >= 8 ? 8 : currentMatches.length >= 4 ? 4 : currentMatches.length;
  const displayMatches = currentMatches.slice(0, matchCount);

  const stats = {
    total: finishedMatches.length,
    correct: finishedMatches.filter(m => userPredictions[m.id] === m.winner_id).length,
    wrong: finishedMatches.filter(m => userPredictions[m.id] !== m.winner_id).length,
  };
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  async function handleShare() {
    if (!ref.current) return;
    setGenerating(true);
    try {
      const dataUrl = await toPng(ref.current, { 
        cacheBust: true, 
        pixelRatio: 3,
        backgroundColor: "#07090D",
        style: {
          fontFamily: "var(--font-heading)"
        }
      });
      
      const link = document.createElement("a");
      link.download = `mis-${mode}-slc.png`;
      link.href = dataUrl;
      link.click();
      toast.success("¡Imagen descargada!");
    } catch (err) {
      console.error("Failed to generate image", err);
      toast.error("Error al generar la imagen");
    } finally {
      setGenerating(false);
    }
  }

  if (predictedMatches.length === 0) return null;

  // Dynamic grid classes
  const gridClass = matchCount <= 4 ? "grid-cols-2 gap-8" : "grid-cols-4 gap-6";
  const cardHeight = matchCount <= 4 ? "min-h-[850px]" : "min-h-[1000px]";

  return (
    <div className="mt-20 mb-12 flex flex-col items-center w-full overflow-hidden border-t border-border pt-16">
      <div className="text-center mb-10 px-4">
        <h3 className="text-3xl font-heading font-black tracking-widest uppercase text-text italic">TU TARJETA DE {mode === "picks" ? "PICKS" : "RESULTADOS"}</h3>
        <p className="text-text-secondary text-sm font-heading tracking-[0.2em] uppercase mt-3 opacity-60">Guárdala y compártela en redes sociales</p>
      </div>

      {/* Mode Selector */}
      <div className="flex bg-bg-alt/50 backdrop-blur-md slc-cyber-clip border border-border p-1.5 mb-12 w-full max-w-sm shadow-xl">
        <button
          onClick={() => setMode("picks")}
          className={`flex-1 py-3 font-heading font-black tracking-widest text-xs uppercase transition-all duration-300 ${mode === "picks" ? "bg-accent text-bg shadow-[0_0_15px_rgba(209,242,0,0.3)]" : "text-text-secondary hover:text-text"}`}
        >
          Mis Picks
        </button>
        <button
          onClick={() => setMode("results")}
          className={`flex-1 py-3 font-heading font-black tracking-widest text-xs uppercase transition-all duration-300 ${mode === "results" ? "bg-accent text-bg shadow-[0_0_15px_rgba(209,242,0,0.3)]" : "text-text-secondary hover:text-text"}`}
          disabled={stats.total === 0}
        >
          Resultados
        </button>
      </div>

      {/* Mobile Preview Container */}
      <div className="w-full flex justify-center px-4 overflow-hidden mb-12">
        <div className="relative origin-top" style={{ transform: "scale(min(1, calc((100vw - 32px) / 850)))", height: `calc(min(1, calc((100vw - 32px) / 850)) * ${matchCount <= 4 ? 850 : 1000}px)`, width: "850px" }}>
          <div ref={ref} className={`w-[850px] ${cardHeight} bg-[#07090D] p-12 flex flex-col relative overflow-hidden font-heading shrink-0 border border-border/40 rounded-2xl shadow-2xl shadow-black`}>
            {/* Background design */}
            <div className="absolute inset-0 bg-[url('/fantasix_logoW.png')] bg-[center_top_40%] bg-no-repeat opacity-[0.04] grayscale pointer-events-none" style={{ backgroundSize: '70%' }} />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-r6-red/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-end mb-16 border-b border-white/5 pb-10">
                <div className="flex items-center gap-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-accent/30 blur-xl rounded-full" />
                    {(user.user_metadata?.avatar_url && !avatarError) ? (
                      <img 
                        src={user.user_metadata.avatar_url.replace("_normal", "_400x400")} 
                        alt="Avatar" 
                        onError={() => setAvatarError(true)}
                        className="w-28 h-28 rounded-full border-4 border-accent relative z-10 object-cover shadow-[0_0_25px_rgba(209,242,0,0.4)]" 
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-full border-4 border-accent bg-card flex items-center justify-center text-4xl text-accent font-black relative z-10 uppercase">
                        {(user.user_metadata?.preferred_username || user.email || "U")[0]}
                      </div>
                    )}
                  </div>
                  <div className="mb-2">
                    <h2 className="text-white text-5xl font-black tracking-widest uppercase italic drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">@{user.user_metadata?.preferred_username || user.email?.split('@')[0]}</h2>
                    <p className="text-text-secondary text-2xl tracking-[0.2em] uppercase mt-2 font-bold opacity-80">Mis {mode === "picks" ? "Predicciones" : "Resultados"}</p>
                  </div>
                </div>
                <div className="text-right mb-2">
                  <h1 className="text-white text-5xl font-black tracking-widest uppercase italic leading-none">SIX MAJOR</h1>
                  <p className="text-r6-red text-3xl font-black tracking-widest uppercase mt-2 italic shadow-sm drop-shadow-[0_0_8px_rgba(255,0,60,0.3)]">SALT LAKE CITY 2026</p>
                </div>
              </div>

              {mode === "results" ? (
                <div className="flex-1 flex flex-col justify-center gap-12">
                  {/* Results Stats */}
                  <div className="bg-gradient-to-br from-bg-alt/80 to-bg-alt/40 border border-border/50 rounded-3xl p-12 relative overflow-hidden text-center shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-center gap-4">
                        <span className="text-[140px] font-black text-success leading-none drop-shadow-[0_0_40px_rgba(0,255,136,0.4)] italic">{accuracy}%</span>
                      </div>
                      <div className="text-3xl text-text-secondary font-black tracking-[0.6em] uppercase -mt-4 italic opacity-70">DE ACIERTOS</div>
                      
                      <div className="w-full h-4 bg-white/5 rounded-full mt-10 relative overflow-hidden border border-white/5">
                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-success/80 to-success shadow-[0_0_20px_rgba(0,255,136,0.6)]" style={{ width: `${accuracy}%` }} />
                      </div>

                      <div className="grid grid-cols-3 gap-12 mt-12">
                        <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                          <p className="text-6xl font-black text-success italic">{stats.correct}</p>
                          <p className="text-xs text-success/70 font-black tracking-[0.2em] uppercase mt-2">ACIERTOS</p>
                        </div>
                        <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                          <p className="text-6xl font-black text-r6-red italic">{stats.wrong}</p>
                          <p className="text-xs text-r6-red/70 font-black tracking-[0.2em] uppercase mt-2">FALLOS</p>
                        </div>
                        <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                          <p className="text-6xl font-black text-white italic">{stats.total}</p>
                          <p className="text-xs text-text-secondary font-black tracking-[0.2em] uppercase mt-2">TOTAL</p>
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
                      return (
                        <div key={m.id} className={`p-5 border-2 slc-cyber-clip flex items-center gap-5 transition-all shadow-lg ${isCorrect ? 'bg-success/10 border-success/40' : 'bg-r6-red/10 border-r6-red/40'}`}>
                          <img src={team.logo_url || ""} className="w-16 h-16 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" alt="" />
                          <div className="min-w-0">
                            <p className="text-white font-black text-xl truncate uppercase italic">{team.short_name}</p>
                            <p className="text-sm text-text-secondary font-bold uppercase tracking-widest opacity-70">vs {vs.short_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className={`text-lg font-black italic ${isCorrect ? 'text-success' : 'text-r6-red'}`}>
                                {m.score_a} - {m.score_b}
                              </p>
                              <span className={`text-xl ${isCorrect ? 'text-success' : 'text-r6-red'}`}>{isCorrect ? "✓" : "✗"}</span>
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
                  <div className="bg-gradient-to-br from-bg-alt/90 to-bg-alt/40 border-2 border-border/50 p-12 flex-1 flex flex-col rounded-[2.5rem] backdrop-blur-2xl relative slc-cyber-clip shadow-2xl shadow-black/60">
                    <div className="absolute top-0 left-0 w-24 h-24 border-t-8 border-l-8 border-accent/40 m-8 rounded-tl-xl" />
                    <div className="absolute bottom-0 right-0 w-24 h-24 border-b-8 border-r-8 border-r6-red/40 m-8 rounded-br-xl" />
                    
                    <div className="text-center mb-16 relative z-10">
                      <h3 className="text-accent text-7xl font-black tracking-widest uppercase italic drop-shadow-[0_0_25px_rgba(209,242,0,0.4)]">MIS {displayMatches.length} PICKS</h3>
                      <div className="w-64 h-2 bg-gradient-to-r from-transparent via-accent/50 to-transparent mx-auto mt-6" />
                      <p className="text-text-secondary text-lg tracking-[0.4em] uppercase mt-4 font-black opacity-50 italic">PREDICCIONES GUARDADAS</p>
                    </div>
                    
                    <div className={`grid ${gridClass} relative z-10 flex-1 content-center`}>
                      {displayMatches.map((match) => {
                        const pickedTeamId = userPredictions[match.id];
                        const isTeamA = match.team_a_id === pickedTeamId;
                        const team = isTeamA ? match.team_a : match.team_b;
                        const opposingTeam = isTeamA ? match.team_b : match.team_a;
                        
                        return (
                          <div key={match.id} className="bg-black/40 border-2 border-border/60 flex flex-col items-center justify-center p-8 slc-cyber-clip relative group transition-all duration-500 hover:border-accent/40 hover:bg-black/60 hover:-translate-y-2">
                            <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {team.logo_url ? (
                              <img src={team.logo_url} alt={team.short_name} className="w-24 h-24 object-contain mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-24 h-24 flex items-center justify-center text-3xl font-black text-white">{team.short_name}</div>
                            )}
                            <div className="text-center">
                              <span className="text-white font-black text-2xl tracking-widest uppercase block italic">{team.short_name}</span>
                              <div className="flex items-center justify-center gap-2 mt-3 opacity-40">
                                <span className="w-3 h-[1px] bg-text-secondary" />
                                <span className="text-text-secondary font-black text-[11px] tracking-[0.2em] uppercase">VS {opposingTeam.short_name}</span>
                                <span className="w-3 h-[1px] bg-text-secondary" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-between items-center text-text-secondary text-3xl font-black uppercase tracking-[0.3em] italic opacity-30 mt-12 px-2">
                <span className="flex items-center gap-4">
                  <span className="w-12 h-[3px] bg-accent/50" />
                  predicciones.tebimedia.com
                </span>
                <span className="text-accent drop-shadow-[0_0_8px_rgba(209,242,0,0.5)]">🎯</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleShare}
        disabled={generating}
        className="mt-12 flex items-center gap-4 bg-accent hover:bg-accent-hover text-bg text-xl font-heading font-black px-12 py-6 slc-cyber-clip tracking-[0.2em] uppercase transition duration-500 cursor-pointer disabled:opacity-50 shadow-[0_0_40px_rgba(209,242,0,0.3)] hover:shadow-[0_0_60px_rgba(209,242,0,0.5)] hover:-translate-y-1.5 active:translate-y-0 active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/></svg>
        {generating ? "GENERANDO..." : `DESCARGAR ${mode === "picks" ? "TARJETA" : "RESULTADOS"}`}
      </button>
    </div>
  );
}


