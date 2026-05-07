import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Match, Team } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: todayMatches } = await supabase
    .from("matches")
    .select("*, team_a:teams!matches_team_a_id_fkey(*), team_b:teams!matches_team_b_id_fkey(*)")
    .gte("match_date", startOfDay.toISOString())
    .lte("match_date", endOfDay.toISOString())
    .order("match_date", { ascending: true });

  let userPredictions: Record<string, string> = {};
  if (session?.user) {
    const { data: preds } = await supabase
      .from("predictions")
      .select("match_id, predicted_team_id")
      .eq("user_id", session.user.id);
    if (preds) {
      userPredictions = Object.fromEntries(preds.map(p => [p.match_id, p.predicted_team_id]));
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Stream */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-r6-red rounded-full animate-pulse" />
            <h1 className="font-heading font-bold text-xl tracking-wider">Live Stream</h1>
          </div>
          <div className="twitch-embed rounded-xl overflow-hidden border border-border">
            <iframe
              src="https://player.twitch.tv/?channel=tebi10&parent=localhost&parent=predicciones.tebimedia.com&muted=true"
              allowFullScreen
            />
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-heading font-bold tracking-wider text-sm">tebi10</p>
              <p className="text-xs text-muted">Stream de los partidos del BLAST R6 Major SLC 2026</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://twitch.tv/tebi10"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#9146FF] hover:bg-[#7c3aed] text-white font-heading font-bold text-[11px] px-3 py-1.5 rounded tracking-wider uppercase transition"
              >
                Twitch
              </a>
              <a
                href="https://x.com/TebiiR6"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-border hover:bg-border-light text-text font-heading font-bold text-[11px] px-3 py-1.5 rounded tracking-wider uppercase transition"
              >
                @TebiiR6
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar - today matches + prize */}
        <div className="space-y-4">
          {/* Prize */}
          <div className="bg-gradient-to-b from-r6-red/10 to-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl mb-2">🏆</p>
            <h3 className="font-heading font-bold text-sm tracking-wider">Premio al #1</h3>
            <p className="text-[11px] text-text-secondary mt-1">
              El ganador del leaderboard se lleva un regalo exclusivo del Major SLC
            </p>
            {!session && (
              <Link
                href="/login"
                className="mt-3 inline-block bg-r6-red hover:bg-r6-red/80 text-white font-heading font-bold text-[11px] px-4 py-1.5 rounded tracking-wider uppercase transition"
              >
                Login con 𝕏
              </Link>
            )}
          </div>

          {/* Today's matches */}
          <div>
            <h2 className="font-heading font-bold text-sm tracking-wider mb-3 text-text-secondary">
              {todayMatches && todayMatches.length > 0 ? "Partidos de hoy" : "Próximos partidos"}
            </h2>
            {todayMatches && todayMatches.length > 0 ? (
              <div className="space-y-3">
                {todayMatches.map(match => (
                  <SidebarMatch key={match.id} match={match} prediction={userPredictions[match.id]} />
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-muted">No hay partidos hoy</p>
                <Link href="/predicciones" className="text-[11px] text-accent hover:text-accent-hover mt-1 inline-block">
                  Ver todos los partidos →
                </Link>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="space-y-2">
            <Link
              href="/predicciones"
              className="block bg-card border border-border rounded-xl p-3 hover:border-accent/30 transition"
            >
              <p className="font-heading font-bold text-xs tracking-wider">Hacer predicciones →</p>
              <p className="text-[10px] text-muted mt-0.5">Predice ganadores y gana puntos</p>
            </Link>
            <Link
              href="/leaderboard"
              className="block bg-card border border-border rounded-xl p-3 hover:border-accent/30 transition"
            >
              <p className="font-heading font-bold text-xs tracking-wider">Ver leaderboard →</p>
              <p className="text-[10px] text-muted mt-0.5">Ranking de aciertos</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarMatch({ match, prediction }: { match: Match & { team_a: Team; team_b: Team }; prediction?: string }) {
  const time = new Date(match.match_date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] text-muted font-heading tracking-wider uppercase">{match.stage}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] bg-border text-text-secondary px-1 rounded font-heading">BO{match.best_of}</span>
          {match.status === "live" && (
            <span className="text-[9px] bg-r6-red text-white px-1 rounded font-bold animate-pulse">LIVE</span>
          )}
          <span className="text-[9px] text-muted">{time}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 ${prediction === match.team_a_id ? "text-accent" : ""}`}>
          {prediction === match.team_a_id && <span className="text-[10px]">→</span>}
          <span className="font-heading font-bold text-xs">{match.team_a.short_name}</span>
        </div>
        <span className="text-r6-red font-heading font-bold text-[10px]">VS</span>
        <div className={`flex items-center gap-2 ${prediction === match.team_b_id ? "text-accent" : ""}`}>
          <span className="font-heading font-bold text-xs">{match.team_b.short_name}</span>
          {prediction === match.team_b_id && <span className="text-[10px]">←</span>}
        </div>
      </div>
    </div>
  );
}
