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
          <div className="flex items-center gap-3 bg-bg-alt/50 p-2 slc-cyber-clip border-l-4 border-r6-red">
            <div className="w-2 h-2 bg-r6-red rounded-full animate-pulse shadow-[0_0_8px_rgba(255,0,60,0.8)]" />
            <h1 className="font-heading font-black text-2xl tracking-widest text-text">LIVE STREAM</h1>
          </div>
          <div className="twitch-embed slc-cyber-clip border border-border shadow-[0_0_30px_rgba(209,242,0,0.05)] bg-bg-alt">
            <iframe
              src="https://player.twitch.tv/?channel=tebi10&parent=localhost&parent=predicciones.tebimedia.com&muted=true"
              allowFullScreen
            />
          </div>
          <div className="bg-card/80 backdrop-blur-md slc-cyber-clip border border-border p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-heading font-black tracking-widest text-lg text-accent drop-shadow-[0_0_5px_rgba(209,242,0,0.3)]">TEBI10</p>
              <p className="text-xs text-text-secondary mt-1">Stream de los partidos del BLAST R6 Major SLC 2026</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://twitch.tv/tebi10"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#9146FF] hover:bg-[#7c3aed] text-white font-heading font-black text-xs px-5 py-2 slc-cyber-clip tracking-widest uppercase transition shadow-[0_0_10px_rgba(145,70,255,0.4)]"
              >
                Twitch
              </a>
              <a
                href="https://x.com/TebiiR6"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-bg-alt border border-border hover:border-accent hover:text-accent text-text font-heading font-black text-xs px-5 py-2 slc-cyber-clip tracking-widest uppercase transition"
              >
                @TebiiR6
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar - today matches + prize */}
        <div className="space-y-4">
          {/* Prize */}
          <div className="bg-card/80 slc-cyber-clip border-l-4 border-l-accent p-5 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-accent/5 group-hover:bg-accent/10 transition-colors" />
            <div className="absolute right-0 top-0 w-16 h-full bg-accent/10 -skew-x-12 translate-x-4" />
            <p className="text-3xl mb-3 relative z-10 drop-shadow-[0_0_10px_rgba(209,242,0,0.5)]">🏆</p>
            <h3 className="font-heading font-black text-sm tracking-widest text-accent relative z-10">PREMIO AL #1</h3>
            <p className="text-[11px] text-text-secondary mt-2 relative z-10">
              El ganador del leaderboard se lleva un regalo exclusivo del Major SLC
            </p>
            {!session && (
              <Link
                href="/login"
                className="mt-4 inline-block bg-r6-red hover:bg-r6-red/80 text-white font-heading font-black text-xs px-6 py-2 slc-cyber-clip tracking-widest uppercase transition relative z-10 shadow-[0_0_10px_rgba(255,0,60,0.3)] hover:-translate-y-0.5"
              >
                Login con 𝕏
              </Link>
            )}
          </div>

          {/* Today's matches */}
          <div>
            <h2 className="font-heading font-black text-sm tracking-widest mb-4 text-text-secondary border-b border-border/50 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-accent block skew-x-[-15deg]"></span>
              {todayMatches && todayMatches.length > 0 ? "PARTIDOS DE HOY" : "PRÓXIMOS PARTIDOS"}
            </h2>
            {todayMatches && todayMatches.length > 0 ? (
              <div className="space-y-3">
                {todayMatches.map(match => (
                  <SidebarMatch key={match.id} match={match} prediction={userPredictions[match.id]} />
                ))}
              </div>
            ) : (
              <div className="bg-bg-alt/50 slc-cyber-clip border border-border p-6 text-center">
                <p className="text-xs text-text-secondary font-medium">No hay partidos hoy</p>
                <Link href="/predicciones" className="text-xs font-heading font-bold tracking-widest text-accent hover:text-accent-hover mt-3 inline-block uppercase">
                  Ver calendario →
                </Link>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <Link
              href="/predicciones"
              className="block bg-card slc-cyber-clip border border-border p-4 hover:border-accent/50 hover:bg-card-hover transition group"
            >
              <p className="font-heading font-black text-xs tracking-widest text-text group-hover:text-accent transition uppercase flex items-center justify-between">
                Hacer predicciones <span className="text-accent group-hover:translate-x-1 transition-transform">→</span>
              </p>
              <p className="text-[10px] text-text-secondary mt-1">Predice ganadores y gana puntos</p>
            </Link>
            <Link
              href="/leaderboard"
              className="block bg-card slc-cyber-clip border border-border p-4 hover:border-accent/50 hover:bg-card-hover transition group"
            >
              <p className="font-heading font-black text-xs tracking-widest text-text group-hover:text-accent transition uppercase flex items-center justify-between">
                Ver leaderboard <span className="text-accent group-hover:translate-x-1 transition-transform">→</span>
              </p>
              <p className="text-[10px] text-text-secondary mt-1">Ranking de aciertos</p>
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
    <div className="bg-card slc-cyber-clip border border-border p-3 hover:bg-card-hover transition-colors relative overflow-hidden">
      {match.status === "live" && (
        <div className="absolute top-0 left-0 w-1 h-full bg-r6-red animate-pulse" />
      )}
      <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
        <span className="text-[9px] text-text-secondary font-heading font-bold tracking-widest uppercase">{match.stage}</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] bg-bg-alt border border-border text-text-secondary px-1.5 py-0.5 font-heading font-bold tracking-widest uppercase">BO{match.best_of}</span>
          {match.status === "live" && (
            <span className="text-[9px] bg-r6-red/20 text-r6-red border border-r6-red/50 px-1.5 py-0.5 font-black tracking-widest uppercase animate-pulse">LIVE</span>
          )}
          <span className="text-[10px] text-text-secondary font-medium">{time}</span>
        </div>
      </div>
      <div className="flex items-center justify-between px-1">
        <div className={`flex items-center gap-2 ${prediction === match.team_a_id ? "text-accent drop-shadow-[0_0_5px_rgba(209,242,0,0.5)]" : "text-text"}`}>
          {prediction === match.team_a_id && <span className="text-[10px]">►</span>}
          <span className="font-heading font-black text-sm tracking-wider uppercase">{match.team_a.short_name}</span>
        </div>
        <span className="text-text-secondary opacity-50 font-heading font-black text-[10px] mx-2">VS</span>
        <div className={`flex items-center gap-2 ${prediction === match.team_b_id ? "text-accent drop-shadow-[0_0_5px_rgba(209,242,0,0.5)]" : "text-text"}`}>
          <span className="font-heading font-black text-sm tracking-wider uppercase">{match.team_b.short_name}</span>
          {prediction === match.team_b_id && <span className="text-[10px]">◄</span>}
        </div>
      </div>
    </div>
  );
}
