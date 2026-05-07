import type { LeaderboardEntry } from "@/lib/types";

export function LeaderboardTable({ entries, currentUserId }: { entries: LeaderboardEntry[]; currentUserId?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="grid grid-cols-[2rem_1fr_3.5rem_3rem_3rem] gap-2 px-4 py-2.5 border-b border-border text-[10px] text-muted font-heading tracking-wider uppercase">
        <span>#</span>
        <span>Usuario</span>
        <span className="text-center">Aciertos</span>
        <span className="text-center">Total</span>
        <span className="text-center">%</span>
      </div>

      {entries.length === 0 && (
        <div className="px-4 py-8 text-center text-muted text-sm">
          Aún no hay predicciones
        </div>
      )}

      {entries.map((entry, i) => (
        <div
          key={entry.id}
          className={`grid grid-cols-[2rem_1fr_3.5rem_3rem_3rem] gap-2 px-4 py-2.5 items-center border-b border-border/40 last:border-0 transition ${
            entry.id === currentUserId ? "bg-accent-dim" : "hover:bg-card-hover"
          }`}
        >
          <span className={`font-heading font-bold text-base ${
            i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-muted"
          }`}>
            {i + 1}
          </span>

          <div className="flex items-center gap-2.5 min-w-0">
            {entry.avatar_url ? (
              <img src={entry.avatar_url} alt="" className="w-7 h-7 rounded-full shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-border shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                {entry.display_name || entry.username || "Anónimo"}
              </p>
              {entry.username && (
                <p className="text-[10px] text-muted truncate">@{entry.username}</p>
              )}
            </div>
          </div>

          <span className="text-center font-heading font-bold text-success text-base">
            {entry.correct_predictions}
          </span>
          <span className="text-center text-xs text-muted">
            {entry.total_predictions}
          </span>
          <span className="text-center text-xs font-medium">
            {entry.accuracy}%
          </span>
        </div>
      ))}
    </div>
  );
}
