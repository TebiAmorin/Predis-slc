import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MatchesGrid } from "@/components/matches-grid";

export const dynamic = "force-dynamic";

export default async function Home() {
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

  const { data: upcomingMatches } = await supabase
    .from("matches")
    .select("*, team_a:teams!matches_team_a_id_fkey(*), team_b:teams!matches_team_b_id_fkey(*)")
    .eq("status", "upcoming")
    .order("match_date", { ascending: true })
    .limit(6);

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

  const { data: leaderboard } = await supabase
    .from("leaderboard")
    .select("*")
    .limit(5);

  const displayMatches = todayMatches && todayMatches.length > 0 ? todayMatches : upcomingMatches;
  const isToday = todayMatches && todayMatches.length > 0;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-r6-red/20 via-card to-accent/10 border border-border p-6 sm:p-10 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(46,232,199,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(204,41,54,0.08),transparent_50%)]" />
        <div className="relative">
          <p className="text-[10px] text-text-secondary tracking-[0.3em] uppercase mb-3">8 — 17 Mayo 2026</p>
          <h1 className="font-heading font-bold text-3xl sm:text-5xl tracking-wider leading-tight">
            SALT LAKE CITY
          </h1>
          <p className="font-heading font-bold text-r6-red text-lg sm:text-2xl tracking-widest mt-1">
            ▲6 MAJOR
          </p>
          <p className="text-text-secondary mt-4 max-w-md mx-auto text-sm leading-relaxed">
            Predice los ganadores de cada partido y compite por el primer puesto
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Link
              href="/predicciones"
              className="bg-r6-red hover:bg-r6-red/80 text-white font-heading font-bold text-sm px-6 py-2.5 rounded-xl tracking-wider uppercase transition w-full sm:w-auto text-center"
            >
              Hacer predicciones
            </Link>
            <Link
              href="/live"
              className="bg-card border border-border hover:border-border-light text-text font-heading font-bold text-sm px-6 py-2.5 rounded-xl tracking-wider uppercase transition w-full sm:w-auto text-center"
            >
              Ver Stream
            </Link>
          </div>
        </div>
      </section>

      {/* Prize */}
      <section className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-4">
        <div className="w-11 h-11 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-500/20 rounded-xl flex items-center justify-center text-xl shrink-0">
          🏆
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-sm tracking-wider">Premio al ganador</h3>
          <p className="text-text-secondary text-xs mt-0.5">
            El #1 del leaderboard se lleva un regalo exclusivo del Major Salt Lake City
          </p>
        </div>
        {!session && (
          <Link
            href="/login"
            className="bg-r6-red hover:bg-r6-red/80 text-white font-heading font-bold text-[11px] px-4 py-2 rounded-lg tracking-wider uppercase transition shrink-0 hidden sm:block"
          >
            Participar
          </Link>
        )}
      </section>

      {/* Matches */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            {isToday && <div className="w-2 h-2 bg-r6-red rounded-full animate-pulse" />}
            <h2 className="font-heading font-bold text-xl tracking-wider">
              {isToday ? "Partidos de hoy" : "Próximos partidos"}
            </h2>
          </div>
          <Link href="/predicciones" className="text-xs font-heading font-semibold text-accent hover:text-accent-hover transition tracking-wider uppercase">
            Ver todos →
          </Link>
        </div>

        {displayMatches && displayMatches.length > 0 ? (
          <MatchesGrid matches={displayMatches} userPredictions={userPredictions} userId={session?.user?.id || null} />
        ) : (
          <div className="text-center py-14 bg-card border border-border rounded-2xl">
            <p className="text-3xl mb-3">📅</p>
            <p className="text-muted font-heading text-base tracking-wider">No hay partidos programados</p>
            <p className="text-muted text-xs mt-1">Los partidos se publicarán antes de cada jornada</p>
          </div>
        )}
      </section>

      {/* Quick links - mobile friendly */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/live", icon: "📺", label: "Live Stream", desc: "Ver en directo" },
          { href: "/predicciones", icon: "🎯", label: "Predicciones", desc: "Predice ganadores" },
          { href: "/leaderboard", icon: "🏆", label: "Leaderboard", desc: "Ranking" },
          { href: "/historial", icon: "📊", label: "Historial", desc: "Tus predicciones" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-card border border-border rounded-xl p-4 hover:border-border-light hover:shadow-lg hover:shadow-black/10 transition-all text-center group"
          >
            <p className="text-2xl mb-2">{link.icon}</p>
            <p className="font-heading font-bold text-xs tracking-wider group-hover:text-accent transition">{link.label}</p>
            <p className="text-[10px] text-muted mt-0.5">{link.desc}</p>
          </Link>
        ))}
      </section>

      {/* Mini Leaderboard */}
      {leaderboard && leaderboard.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-xl tracking-wider">Top Predictores</h2>
            <Link href="/leaderboard" className="text-xs font-heading font-semibold text-accent hover:text-accent-hover transition tracking-wider uppercase">
              Ver ranking →
            </Link>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {leaderboard.map((entry, i) => (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0 hover:bg-card-hover transition">
                <span className={`font-heading font-bold text-lg w-6 text-center ${
                  i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-muted"
                }`}>
                  {i + 1}
                </span>
                {entry.avatar_url ? (
                  <img src={entry.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-border" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm truncate block">{entry.display_name || entry.username}</span>
                  {entry.username && <span className="text-[10px] text-muted">@{entry.username}</span>}
                </div>
                <div className="text-right">
                  <span className="font-heading font-bold text-success text-lg">{entry.correct_predictions}</span>
                  <span className="text-[10px] text-muted ml-0.5">/{entry.total_predictions}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
