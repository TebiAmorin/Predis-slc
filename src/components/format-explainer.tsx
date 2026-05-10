"use client";

import { useState } from "react";

const PHASES = [
  {
    id: "play-in",
    title: "PLAY-IN",
    subtitle: "Fase 1 · Mayo 8-9",
    color: "purple-400",
    borderColor: "border-purple-400",
    bgColor: "bg-purple-400",
    textColor: "text-purple-400",
    teams: 8,
    advance: 4,
    format: "GSL (Doble Eliminación)",
    details: [
      "8 equipos compiten en formato GSL",
      "Upper Bracket: 4 partidos BO3",
      "Lower Bracket: 2 partidos BO3",
      "4 equipos avanzan al Swiss",
      "4 equipos eliminados del torneo",
    ],
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    id: "swiss",
    title: "SWISS",
    subtitle: "Fase 2 · Mayo 10-13",
    color: "accent",
    borderColor: "border-accent",
    bgColor: "bg-accent",
    textColor: "text-accent",
    teams: 16,
    advance: 8,
    format: "Sistema Suizo (5 Rondas)",
    details: [
      "12 equipos invitados + 4 del Play-In",
      "Ronda 1-2: BO1",
      "Ronda 3-4: BO3 para ascenso/eliminación",
      "Ronda 5: Todo BO3",
      "3 victorias → clasificado a Playoffs",
      "3 derrotas → eliminado",
      "Seeding por Buchholz Score",
    ],
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    id: "playoffs",
    title: "PLAYOFFS",
    subtitle: "Fase 3 · Mayo 15-18",
    color: "r6-red",
    borderColor: "border-r6-red",
    bgColor: "bg-r6-red",
    textColor: "text-r6-red",
    teams: 8,
    advance: 1,
    format: "Eliminación Directa",
    details: [
      "8 equipos del Swiss",
      "Cuartos de Final: 4 partidos BO3",
      "Semifinales: 2 partidos BO3",
      "Gran Final: 1 partido BO5",
      "¡El ganador es el campeón del Major!",
    ],
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 19.24 7 20v2M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 19.24 17 20v2M18 2H6v7a6 6 0 0012 0V2z" />
      </svg>
    ),
  },
];

export function FormatExplainer() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Flow diagram */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PHASES.map((phase, idx) => (
          <div key={phase.id} className="relative">
            <button
              onClick={() => setExpanded(expanded === phase.id ? null : phase.id)}
              className={`w-full text-left bg-card border ${phase.borderColor}/30 hover:${phase.borderColor}/60 slc-cyber-clip p-4 transition-all group relative overflow-hidden ${
                expanded === phase.id ? `${phase.borderColor}/60 ring-1 ring-${phase.color}/20` : ""
              }`}
            >
              {/* Accent bar */}
              <div className={`absolute left-0 top-0 w-1 h-full ${phase.bgColor}`} />

              <div className="flex items-start justify-between ml-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={phase.textColor}>{phase.icon}</span>
                    <h3 className={`font-heading font-black text-lg tracking-widest ${phase.textColor}`}>
                      {phase.title}
                    </h3>
                  </div>
                  <p className="text-[10px] font-heading font-bold tracking-widest text-text-secondary uppercase mt-1">
                    {phase.subtitle}
                  </p>
                  <p className="text-[10px] font-heading tracking-widest text-text-secondary/60 uppercase mt-0.5">
                    {phase.format}
                  </p>
                </div>

                {/* Team count badge */}
                <div className="text-right shrink-0">
                  <div className={`text-2xl font-heading font-black ${phase.textColor}`}>
                    {phase.teams}
                  </div>
                  <div className="text-[8px] font-heading font-bold tracking-widest text-text-secondary uppercase">
                    EQUIPOS
                  </div>
                </div>
              </div>

              {/* Advance info */}
              <div className="mt-3 ml-2 flex items-center gap-2">
                <span className="text-[10px] font-heading font-bold tracking-widest text-success">
                  {phase.advance === 1 ? "→ CAMPEÓN" : `→ ${phase.advance} AVANZAN`}
                </span>
                {phase.teams - phase.advance > 0 && phase.advance > 1 && (
                  <span className="text-[10px] font-heading font-bold tracking-widest text-r6-red/60">
                    · {phase.teams - phase.advance} ELIMINADOS
                  </span>
                )}
              </div>

              {/* Expand indicator */}
              <div className="absolute bottom-2 right-3">
                <span className={`text-[9px] font-heading font-bold tracking-widest ${phase.textColor}/50 uppercase`}>
                  {expanded === phase.id ? "▲ CERRAR" : "▼ DETALLES"}
                </span>
              </div>
            </button>

            {/* Arrow between phases */}
            {idx < PHASES.length - 1 && (
              <div className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-text-secondary/30">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            )}

            {/* Mobile arrow */}
            {idx < PHASES.length - 1 && (
              <div className="sm:hidden flex justify-center py-1 text-text-secondary/30">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className={`bg-card border slc-cyber-clip p-4 animate-fade-in ${
          PHASES.find(p => p.id === expanded)?.borderColor
        }/30`}>
          <ul className="space-y-2 ml-3">
            {PHASES.find(p => p.id === expanded)?.details.map((detail, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`text-[10px] mt-0.5 ${PHASES.find(p => p.id === expanded)?.textColor}`}>▸</span>
                <span className="text-xs font-heading tracking-wider text-text-secondary">{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-heading font-black tracking-widest text-purple-400">8</span>
          <span className="text-[8px] text-text-secondary/40">+</span>
          <span className="text-[10px] font-heading font-black tracking-widest text-accent">12</span>
        </div>
        <span className="text-[8px] text-text-secondary/30">→</span>
        <span className="text-[10px] font-heading font-bold tracking-widest text-text-secondary">20 EQUIPOS</span>
        <span className="text-[8px] text-text-secondary/30">→</span>
        <span className="text-[10px] font-heading font-bold tracking-widest text-text-secondary">43 PARTIDOS</span>
        <span className="text-[8px] text-text-secondary/30">→</span>
        <span className="text-[10px] font-heading font-black tracking-widest text-amber-400">1 CAMPEÓN</span>
      </div>
    </div>
  );
}
