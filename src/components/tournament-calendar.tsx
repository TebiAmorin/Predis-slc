"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  TOURNAMENT_DAYS,
  getDayMatchCount,
  PHASE_DOT_COLORS,
  PHASE_BG_COLORS,
  type ScheduleDay,
} from "@/lib/tournament-schedule";
import type { Match, Team } from "@/lib/types";

type MatchWithTeams = Match & { team_a: Team; team_b: Team };

type Props = {
  matches: MatchWithTeams[];
};

const DAY_NAMES = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Monday=0, Sunday=6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  return { daysInMonth, startDow };
}

function formatDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function TournamentCalendar({ matches }: Props) {
  // Start on May 2026 (tournament month)
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(4); // 0-indexed, 4 = May
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { daysInMonth, startDow } = useMemo(() => getMonthDays(year, month), [year, month]);

  // Index schedule days by date
  const scheduleByDate = useMemo(() => {
    const map: Record<string, ScheduleDay> = {};
    for (const day of TOURNAMENT_DAYS) {
      map[day.date] = day;
    }
    return map;
  }, []);

  // Helper: get local YYYY-MM-DD from a UTC date string
  function toLocalDateStr(utcDate: string): string {
    const d = new Date(utcDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // Index real matches by LOCAL date (YYYY-MM-DD in user timezone)
  const matchesByDate = useMemo(() => {
    const map: Record<string, MatchWithTeams[]> = {};
    for (const m of matches) {
      const d = toLocalDateStr(m.match_date);
      if (!map[d]) map[d] = [];
      map[d].push(m);
    }
    return map;
  }, [matches]);

  // Count real matches per stage per LOCAL date
  const realMatchCountByDateStage = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const m of matches) {
      const d = toLocalDateStr(m.match_date);
      if (!map[d]) map[d] = {};
      map[d][m.stage] = (map[d][m.stage] || 0) + 1;
    }
    return map;
  }, [matches]);

  const today = new Date().toISOString().slice(0, 10);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }
  function goToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  // Build selected day data
  const selectedSchedule = selectedDate ? scheduleByDate[selectedDate] : null;
  const selectedMatches = selectedDate ? matchesByDate[selectedDate] || [] : [];
  const selectedRealCounts = selectedDate ? realMatchCountByDateStage[selectedDate] || {} : {};

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-black text-xl tracking-widest uppercase">
          <span className="text-r6-red">{MONTH_NAMES[month]}</span>{" "}
          <span className="text-text-secondary">{year}</span>
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="px-3 py-1.5 bg-bg-alt border border-border hover:border-border-light text-text-secondary hover:text-text text-xs font-heading font-bold tracking-widest transition slc-cyber-clip">
            ← {MONTH_NAMES[month === 0 ? 11 : month - 1].slice(0, 3)}
          </button>
          <button onClick={goToday} className="px-3 py-1.5 bg-bg-alt border border-border hover:border-accent text-text-secondary hover:text-accent text-xs font-heading font-bold tracking-widest transition slc-cyber-clip">
            HOY
          </button>
          <button onClick={nextMonth} className="px-3 py-1.5 bg-bg-alt border border-border hover:border-border-light text-text-secondary hover:text-text text-xs font-heading font-bold tracking-widest transition slc-cyber-clip">
            {MONTH_NAMES[month === 11 ? 0 : month + 1].slice(0, 3)} →
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-card border border-border slc-cyber-clip overflow-hidden">
        {/* Day names header */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center py-2 text-[10px] font-heading font-bold tracking-widest text-text-secondary uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {/* Empty cells before month starts */}
          {Array.from({ length: startDow }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square border-b border-r border-border/20" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = formatDate(year, month, dayNum);
            const schedule = scheduleByDate[dateStr];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const hasMatches = !!schedule || !!matchesByDate[dateStr];
            const totalExpected = schedule ? getDayMatchCount(schedule) : (matchesByDate[dateStr]?.length || 0);

            return (
              <button
                key={dayNum}
                onClick={() => hasMatches ? setSelectedDate(isSelected ? null : dateStr) : undefined}
                disabled={!hasMatches}
                className={`aspect-square border-b border-r border-border/20 flex flex-col items-center justify-center gap-1 transition relative group ${
                  hasMatches ? "cursor-pointer hover:bg-card-hover" : "cursor-default"
                } ${isSelected ? "bg-card-hover ring-1 ring-accent/50" : ""} ${
                  isToday ? "ring-1 ring-r6-red/60" : ""
                } ${schedule ? "bg-bg-alt/30" : ""}`}
              >
                <span className={`text-sm font-heading font-bold ${
                  isToday ? "text-r6-red" : hasMatches ? "text-text" : "text-text-secondary/40"
                }`}>
                  {dayNum}
                </span>

                {/* Match dots */}
                {hasMatches && schedule && (
                  <div className="flex flex-wrap justify-center gap-[2px] max-w-[80%]">
                    {Array.from({ length: Math.min(totalExpected, 10) }).map((_, di) => (
                      <div
                        key={di}
                        className={`w-1.5 h-1.5 rounded-full ${PHASE_DOT_COLORS[schedule.phaseTag]} ${
                          isToday ? "animate-pulse" : ""
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Real matches without schedule entry */}
                {hasMatches && !schedule && matchesByDate[dateStr] && (
                  <div className="flex flex-wrap justify-center gap-[2px] max-w-[80%]">
                    {Array.from({ length: Math.min(matchesByDate[dateStr].length, 10) }).map((_, di) => (
                      <div key={di} className="w-1.5 h-1.5 rounded-full bg-border-light" />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Phase legend */}
      <div className="flex flex-wrap gap-3 justify-center items-center">
        {(["play-in", "swiss", "playoffs", "final"] as const).map((tag) => (
          <div key={tag} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${PHASE_DOT_COLORS[tag]}`} />
            <span className="text-[10px] font-heading font-bold tracking-widest text-text-secondary uppercase">
              {tag === "play-in" ? "Play-In" : tag === "swiss" ? "Swiss" : tag === "playoffs" ? "Playoffs" : "Final"}
            </span>
          </div>
        ))}
        <span className="text-[9px] text-text-secondary/40 font-heading tracking-widest">🇪🇸 HORA ESPAÑOLA</span>
      </div>

      {/* Selected day detail */}
      {selectedDate && (selectedSchedule || selectedMatches.length > 0) && (
        <div className="bg-card border border-border slc-cyber-clip overflow-hidden animate-fade-in">
          {/* Day header */}
          <div className={`px-4 py-3 border-b border-border flex items-center justify-between ${
            selectedSchedule ? `border-l-4 ${selectedSchedule.phaseTag === "play-in" ? "border-l-purple-400" : selectedSchedule.phaseTag === "swiss" ? "border-l-accent" : selectedSchedule.phaseTag === "final" ? "border-l-amber-400" : "border-l-r6-red"
            }` : ""
          }`}>
            <div>
              <h3 className="font-heading font-black text-sm tracking-widest uppercase text-text">
                {selectedSchedule?.dayLabel || new Date(selectedDate).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <p className="text-[10px] text-text-secondary font-heading tracking-widest uppercase mt-0.5" suppressHydrationWarning>
                {mounted ? new Date(selectedDate + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) : "..."}
              </p>
            </div>
            {selectedSchedule && (
              <span className={`text-[10px] font-heading font-black tracking-widest uppercase px-2 py-1 slc-cyber-clip ${PHASE_BG_COLORS[selectedSchedule.phaseTag]} text-bg`}>
                {selectedSchedule.phaseTag === "play-in" ? "PLAY-IN" : selectedSchedule.phaseTag.toUpperCase()}
              </span>
            )}
          </div>

          {/* Matches list */}
          <div className="divide-y divide-border/30">
            {/* Real matches first */}
            {selectedMatches.map((match) => (
              <MatchRow key={match.id} match={match} mounted={mounted} />
            ))}

            {/* TBD slots for remaining expected matches */}
            {selectedSchedule?.phases.map((phase) => {
              const realCount = selectedRealCounts[phase.stage] || 0;
              const tbdCount = Math.max(0, phase.matchCount - realCount);
              return Array.from({ length: tbdCount }).map((_, i) => (
                <TbdRow
                  key={`tbd-${phase.stage}-${i}`}
                  phase={phase}
                  phaseTag={selectedSchedule.phaseTag}
                />
              ));
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchRow({ match, mounted }: { match: MatchWithTeams; mounted: boolean }) {
  const isCompleted = match.status === "completed";
  const isLive = match.status === "live";
  const time = mounted ? new Date(match.match_date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "--:--";
  const teamAWon = isCompleted && match.winner_id === match.team_a_id;
  const teamBWon = isCompleted && match.winner_id === match.team_b_id;

  const teamA = match.team_a;
  const teamB = match.team_b;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-card-hover transition-colors">
      {/* Time */}
      <div className="w-12 shrink-0 text-center">
        <span className={`text-xs font-heading font-bold tracking-wider ${
          isLive ? "text-r6-red animate-pulse" : "text-text-secondary"
        }`}>
          {isLive ? "LIVE" : time}
        </span>
      </div>

      {/* BO tag */}
      <span className="text-[9px] font-heading font-bold text-text-secondary/50 tracking-widest shrink-0">
        BO{match.best_of}
      </span>

      {/* Team A */}
      <div className={`flex items-center gap-2 flex-1 justify-end ${isCompleted && !teamAWon ? "opacity-40" : ""}`}>
        <span className={`font-heading font-black text-xs tracking-widest uppercase truncate ${teamAWon ? "text-success" : ""}`}>
          {teamA?.short_name || "TBD"}
        </span>
        {teamA?.logo_url ? (
          <Image src={teamA.logo_url} alt="" width={22} height={22} className="w-[22px] h-[22px] object-contain shrink-0" />
        ) : (
          <div className="w-[22px] h-[22px] bg-bg-alt rounded flex items-center justify-center text-[8px] font-black shrink-0">
            {teamA?.short_name?.[0] || "?"}
          </div>
        )}
      </div>

      {/* Score */}
      <div className="w-16 text-center shrink-0">
        {isCompleted ? (
          <span className="font-heading font-black text-sm tracking-wider">
            <span className={teamAWon ? "text-success" : "text-text-secondary"}>{match.score_a}</span>
            <span className="text-border-light mx-1">:</span>
            <span className={teamBWon ? "text-success" : "text-text-secondary"}>{match.score_b}</span>
          </span>
        ) : isLive && match.score_a !== null ? (
          <span className="font-heading font-black text-sm text-r6-red animate-pulse">
            {match.score_a} : {match.score_b}
          </span>
        ) : (
          <span className="font-heading text-[10px] text-border-light tracking-widest">VS</span>
        )}
      </div>

      {/* Team B */}
      <div className={`flex items-center gap-2 flex-1 ${isCompleted && !teamBWon ? "opacity-40" : ""}`}>
        {teamB?.logo_url ? (
          <Image src={teamB.logo_url} alt="" width={22} height={22} className="w-[22px] h-[22px] object-contain shrink-0" />
        ) : (
          <div className="w-[22px] h-[22px] bg-bg-alt rounded flex items-center justify-center text-[8px] font-black shrink-0">
            {teamB?.short_name?.[0] || "?"}
          </div>
        )}
        <span className={`font-heading font-black text-xs tracking-widest uppercase truncate ${teamBWon ? "text-success" : ""}`}>
          {teamB?.short_name || "TBD"}
        </span>
      </div>

      {/* Status badge */}
      <div className="w-20 text-right shrink-0">
        {isCompleted ? (
          <span className="text-[9px] font-heading font-bold tracking-widest text-success/60 uppercase">Terminado</span>
        ) : isLive ? (
          <span className="text-[9px] font-heading font-bold tracking-widest text-r6-red animate-pulse uppercase">En vivo</span>
        ) : (
          <span className="text-[9px] font-heading font-bold tracking-widest text-text-secondary/50 uppercase">Próximo</span>
        )}
      </div>
    </div>
  );
}

function TbdRow({ phase }: { phase: { stageLabel: string; bestOf: number; startTime?: string }; phaseTag: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 opacity-50">
      {/* Time */}
      <div className="w-12 shrink-0 text-center">
        <span className="text-xs font-heading font-bold tracking-wider text-text-secondary/40">
          {phase.startTime || "--:--"}
        </span>
      </div>

      {/* BO tag */}
      <span className="text-[9px] font-heading font-bold text-text-secondary/30 tracking-widest shrink-0">
        BO{phase.bestOf}
      </span>

      {/* TBD vs TBD */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        <span className="font-heading font-bold text-xs tracking-widest text-text-secondary/40 italic">TBD</span>
        <div className="w-[22px] h-[22px] bg-border/20 rounded flex items-center justify-center text-[8px] text-text-secondary/30 shrink-0">?</div>
      </div>

      <div className="w-16 text-center shrink-0">
        <span className="font-heading text-[10px] text-border-light/50 tracking-widest">VS</span>
      </div>

      <div className="flex items-center gap-2 flex-1">
        <div className="w-[22px] h-[22px] bg-border/20 rounded flex items-center justify-center text-[8px] text-text-secondary/30 shrink-0">?</div>
        <span className="font-heading font-bold text-xs tracking-widest text-text-secondary/40 italic">TBD</span>
      </div>

      {/* Phase tag */}
      <div className="w-20 text-right shrink-0">
        <span className="text-[9px] font-heading font-bold tracking-widest text-text-secondary/30 uppercase">
          {phase.stageLabel}
        </span>
      </div>
    </div>
  );
}
