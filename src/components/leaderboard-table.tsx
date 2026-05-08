"use client";

import { useState, useMemo } from "react";
import type { LeaderboardEntry } from "@/lib/types";
import Image from "next/image";

export function LeaderboardTable({ entries, currentUserId }: { entries: LeaderboardEntry[]; currentUserId?: string }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const name = (entry.display_name || entry.username || "").toLowerCase();
      return name.includes(search.toLowerCase());
    });
  }, [entries, search]);

  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, page]);

  const totalPages = Math.ceil(filteredEntries.length / pageSize);

  // Top 3 for podium (only on first page, no search)
  const top3 = !search && page === 1 ? filteredEntries.slice(0, 3) : [];

  return (
    <div className="space-y-6">
      {/* Top 3 Podium */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end">
          {[top3[1], top3[0], top3[2]].map((entry, visualIdx) => {
            const rank = visualIdx === 0 ? 2 : visualIdx === 1 ? 1 : 3;
            const isFirst = rank === 1;
            const isMe = entry.id === currentUserId;
            const medalColors = {
              1: { bg: "from-accent/20 to-accent/5", border: "border-accent/50", text: "text-accent", glow: "shadow-[0_0_20px_rgba(0,229,209,0.2)]", medal: "🥇" },
              2: { bg: "from-gray-300/10 to-gray-400/5", border: "border-gray-400/30", text: "text-gray-300", glow: "", medal: "🥈" },
              3: { bg: "from-amber-600/10 to-amber-700/5", border: "border-amber-600/30", text: "text-amber-500", glow: "", medal: "🥉" },
            }[rank]!;

            return (
              <div
                key={entry.id}
                className={`relative bg-gradient-to-b ${medalColors.bg} border ${medalColors.border} ${medalColors.glow} slc-cyber-clip p-4 sm:p-5 text-center transition-all ${isFirst ? "sm:-mt-4" : ""} ${isMe ? "ring-1 ring-accent/50" : ""} animate-fade-in-up stagger-${visualIdx + 1}`}
              >
                <span className="text-2xl sm:text-3xl block mb-2 animate-count-up">{medalColors.medal}</span>
                {entry.avatar_url ? (
                  <Image src={entry.avatar_url} alt="" width={48} height={48} className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto slc-cyber-clip border-2 ${medalColors.border}`} unoptimized />
                ) : (
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto slc-cyber-clip bg-border ${medalColors.border} border-2`} />
                )}
                <p className="font-heading font-black text-xs sm:text-sm tracking-widest mt-2 truncate uppercase">
                  {entry.display_name || entry.username || "Anon"}
                </p>
                {entry.username && <p className="text-[9px] text-text-secondary tracking-widest">@{entry.username}</p>}
                <div className="mt-3 pt-2 border-t border-border/40">
                  <span className={`font-heading font-black text-2xl sm:text-3xl ${medalColors.text} leading-none`}>{entry.correct_predictions}</span>
                  <p className="text-[9px] text-text-secondary tracking-widest uppercase mt-1">{entry.accuracy}% precisión</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-text-secondary group-focus-within:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Buscar operador por nombre..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full bg-card/50 border border-border slc-cyber-clip py-3 pl-10 pr-4 text-sm font-heading tracking-widest uppercase focus:outline-none focus:border-accent/50 focus:bg-card transition-all placeholder:text-text-secondary/50"
        />
      </div>

      <div className="bg-card slc-cyber-clip border border-border">
        <div className="grid grid-cols-[2rem_1fr_3.5rem_3rem_3rem] gap-2 px-5 py-3 border-b border-border bg-card-hover/50 text-[10px] text-text-secondary font-heading tracking-widest uppercase relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0" />
          <span>#</span>
          <span>Operador</span>
          <span className="text-center">Aciertos</span>
          <span className="text-center">Total</span>
          <span className="text-center">% Win</span>
        </div>

        {paginatedEntries.length === 0 && (
          <div className="px-4 py-8 text-center text-muted text-sm uppercase font-heading tracking-widest">
            {search ? "No se encontraron operadores" : "Aún no hay predicciones"}
          </div>
        )}

        {paginatedEntries.map((entry, i) => {
          const rank = (page - 1) * pageSize + i + 1;
          return (
            <div
              key={entry.id}
              className={`grid grid-cols-[2rem_1fr_3.5rem_3rem_3rem] gap-2 px-5 py-3.5 items-center border-b border-border/40 last:border-0 transition relative group ${
                entry.id === currentUserId ? "bg-accent-dim" : "hover:bg-card-hover"
              }`}
            >
              {entry.id === currentUserId && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
              )}
              <span className={`font-heading font-black text-lg ${
                rank === 1 ? "text-accent drop-shadow-[0_0_8px_rgba(209,242,0,0.5)]" : rank === 2 ? "text-gray-300" : rank === 3 ? "text-amber-600" : "text-muted"
              }`}>
                {rank}
              </span>

              <div className="flex items-center gap-3 min-w-0">
                {entry.avatar_url ? (
                  <Image src={entry.avatar_url} alt="" width={32} height={32} className="w-8 h-8 slc-cyber-clip shrink-0" />
                ) : (
                  <div className="w-8 h-8 slc-cyber-clip bg-border shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate text-text group-hover:text-accent transition-colors">
                    {entry.display_name || entry.username || "Anónimo"}
                  </p>
                  {entry.username && (
                    <p className="text-[10px] text-text-secondary truncate font-heading tracking-widest uppercase">@{entry.username}</p>
                  )}
                </div>
              </div>

              <span className="text-center font-heading font-black text-success text-lg drop-shadow-[0_0_5px_rgba(0,255,136,0.3)]">
                {entry.correct_predictions}
              </span>
              <span className="text-center text-xs text-text-secondary font-heading font-bold">
                {entry.total_predictions}
              </span>
              <span className="text-center text-xs font-bold text-text-secondary">
                {entry.accuracy}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 border border-border slc-cyber-clip hover:border-accent/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="font-heading font-black text-sm tracking-widest text-accent">{page}</span>
            <span className="text-text-secondary text-xs uppercase font-heading tracking-widest">de</span>
            <span className="font-heading font-black text-sm tracking-widest text-text-secondary">{totalPages}</span>
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 border border-border slc-cyber-clip hover:border-accent/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

