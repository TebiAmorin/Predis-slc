import type { LeaderboardEntry } from "@/lib/types";
import Image from "next/image";

export function LeaderboardTable({ entries, currentUserId }: { entries: LeaderboardEntry[]; currentUserId?: string }) {
  return (
    <div className="bg-card slc-cyber-clip border border-border">
      <div className="grid grid-cols-[2rem_1fr_3.5rem_3rem_3rem] gap-2 px-5 py-3 border-b border-border bg-card-hover/50 text-[10px] text-text-secondary font-heading tracking-widest uppercase relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0" />
        <span>#</span>
        <span>Operador</span>
        <span className="text-center">Aciertos</span>
        <span className="text-center">Total</span>
        <span className="text-center">% Win</span>
      </div>

      {entries.length === 0 && (
        <div className="px-4 py-8 text-center text-muted text-sm">
          Aún no hay predicciones
        </div>
      )}

      {entries.map((entry, i) => (
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
            i === 0 ? "text-accent drop-shadow-[0_0_8px_rgba(209,242,0,0.5)]" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-muted"
          }`}>
            {i + 1}
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
      ))}
    </div>
  );
}
