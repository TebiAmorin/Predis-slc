/**
 * Static tournament schedule config.
 *
 * This is SEPARATE from the `matches` table.
 * The matches table only has matches with known teams (for predictions).
 * This config defines the full tournament schedule including TBD slots,
 * so the calendar can show "8 matches on Swiss R1" even before those
 * matches exist in the DB.
 *
 * The calendar merges this config with real matches from the DB:
 * - Real matches → show team logos, names, scores
 * - Remaining TBD slots → show "TBD vs TBD" with phase info
 *
 * NOTE: startTime values are in CEST (hora española, UTC+2).
 * Dates use the "broadcast day" from Liquipedia (UTC date).
 */

export type SchedulePhase = {
  stage: string;       // Must match match.stage values in DB
  stageLabel: string;  // Display label
  matchCount: number;  // Expected number of matches
  bestOf: number;
  startTime?: string;  // Approximate start time (HH:MM)
};

export type ScheduleDay = {
  date: string;        // YYYY-MM-DD
  dayLabel: string;
  phaseTag: "play-in" | "swiss" | "playoffs" | "final";
  phases: SchedulePhase[];
};

export const TOURNAMENT_DAYS: ScheduleDay[] = [
  // ─── PLAY-IN (Phase 1) ───
  {
    date: "2026-05-08",
    dayLabel: "Play-In Día 1",
    phaseTag: "play-in",
    phases: [
      { stage: "Phase 1 - Upper Bracket", stageLabel: "Upper Bracket", matchCount: 4, bestOf: 3, startTime: "18:30" },
      { stage: "Phase 1 - UB Final", stageLabel: "UB Final", matchCount: 1, bestOf: 3, startTime: "00:00" },
    ],
  },
  {
    date: "2026-05-09",
    dayLabel: "Play-In Día 2",
    phaseTag: "play-in",
    phases: [
      { stage: "Phase 1 - Lower Bracket", stageLabel: "Lower Bracket", matchCount: 2, bestOf: 3, startTime: "18:30" },
      { stage: "Phase 1 - LB Final", stageLabel: "LB Final", matchCount: 1, bestOf: 3, startTime: "00:30" },
    ],
  },

  // ─── SWISS (Phase 2) ───
  {
    date: "2026-05-10",
    dayLabel: "Swiss Rondas 1 y 2",
    phaseTag: "swiss",
    phases: [
      { stage: "Phase 2 - Swiss Round 1", stageLabel: "Swiss R1", matchCount: 8, bestOf: 1, startTime: "18:30" },
      { stage: "Phase 2 - Swiss Round 2", stageLabel: "Swiss R2", matchCount: 8, bestOf: 1, startTime: "22:30" },
    ],
  },
  {
    date: "2026-05-11",
    dayLabel: "Swiss Ronda 3",
    phaseTag: "swiss",
    phases: [
      { stage: "Phase 2 - Swiss Round 3", stageLabel: "Swiss R3", matchCount: 8, bestOf: 1, startTime: "19:45" },
    ],
  },
  {
    date: "2026-05-12",
    dayLabel: "Swiss Ronda 4",
    phaseTag: "swiss",
    phases: [
      { stage: "Phase 2 - Swiss Round 4", stageLabel: "Swiss R4", matchCount: 6, bestOf: 3, startTime: "19:45" },
    ],
  },
  {
    date: "2026-05-13",
    dayLabel: "Swiss Ronda 5",
    phaseTag: "swiss",
    phases: [
      { stage: "Phase 2 - Swiss Round 5", stageLabel: "Swiss R5", matchCount: 3, bestOf: 3, startTime: "19:45" },
    ],
  },

  // ─── PLAYOFFS (Phase 3) ───
  {
    date: "2026-05-15",
    dayLabel: "Cuartos de Final",
    phaseTag: "playoffs",
    phases: [
      { stage: "Playoffs - Quarterfinal", stageLabel: "Cuartos", matchCount: 3, bestOf: 3, startTime: "18:00" },
    ],
  },
  {
    date: "2026-05-16",
    dayLabel: "Semifinales",
    phaseTag: "playoffs",
    phases: [
      { stage: "Playoffs - Semifinal", stageLabel: "Semifinales", matchCount: 3, bestOf: 3, startTime: "21:00" },
    ],
  },

  // ─── GRAN FINAL ───
  {
    date: "2026-05-17",
    dayLabel: "Gran Final",
    phaseTag: "final",
    phases: [
      { stage: "Playoffs - Grand Final", stageLabel: "Gran Final", matchCount: 1, bestOf: 5, startTime: "00:30" },
    ],
  },
];

/** Get total expected matches for a day */
export function getDayMatchCount(day: ScheduleDay): number {
  return day.phases.reduce((sum, p) => sum + p.matchCount, 0);
}

/** Phase tag color mapping */
export const PHASE_COLORS: Record<ScheduleDay["phaseTag"], string> = {
  "play-in": "text-purple-400",
  "swiss": "text-accent",
  "playoffs": "text-r6-red",
  "final": "text-amber-400",
};

export const PHASE_BG_COLORS: Record<ScheduleDay["phaseTag"], string> = {
  "play-in": "bg-purple-400",
  "swiss": "bg-accent",
  "playoffs": "bg-r6-red",
  "final": "bg-amber-400",
};

export const PHASE_DOT_COLORS: Record<ScheduleDay["phaseTag"], string> = {
  "play-in": "bg-purple-400",
  "swiss": "bg-accent",
  "playoffs": "bg-r6-red",
  "final": "bg-amber-400",
};

/** External links */
export const TOURNAMENT_LINKS = {
  liquipedia: "https://liquipedia.net/rainbowsix/BLAST_Major/2026/May",
  siegegg: "https://siege.gg/competitions/100-blast-major-salt-lake-city-2026",
  ubisoft: "https://www.ubisoft.com/es-es/esports/rainbow-six/siege/calendar",
  twitch: "https://twitch.tv/rainbow6",
  youtube: "https://youtube.com/@rainbow6esports",
};
