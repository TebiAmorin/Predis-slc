import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
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
      <section className="relative overflow-hidden slc-cyber-clip bg-bg-alt border border-border p-8 sm:p-14 text-center">
        <div className="absolute inset-0 bg-cyber-dots opacity-30" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-r6-red/10 blur-[100px] pointer-events-none" />
        
        {/* Decorative corner pieces */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent/40" />
        <div className="absolute bottom-0 right-16 w-8 h-8 border-b-2 border-r-2 border-r6-red/40" />

        <div className="relative z-10">
          <div className="inline-block bg-card px-3 py-1 mb-4 border border-border/50 shadow-[0_0_15px_rgba(209,242,0,0.1)]">
            <p className="text-[10px] text-accent font-heading font-bold tracking-[0.3em] uppercase">
              <span className="text-r6-red mr-2">■</span>
              8 — 17 Mayo 2026
            </p>
          </div>
          
          <h1 className="font-heading font-black text-4xl sm:text-7xl tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-br from-text to-text-secondary">
            SALT LAKE CITY
          </h1>
          <p className="font-heading font-black text-accent text-xl sm:text-3xl tracking-[0.2em] mt-2 mb-6">
            BLAST <span className="text-r6-red">R6</span> MAJOR
          </p>
          <p className="text-text-secondary max-w-md mx-auto text-sm sm:text-base leading-relaxed bg-bg-alt/50 backdrop-blur-sm p-2 rounded">
            Predice los ganadores de cada partido y compite por el primer puesto
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link
              href="/predicciones"
              className="slc-cyber-clip bg-accent hover:bg-accent-hover text-bg font-heading font-black text-sm px-8 py-3 tracking-widest uppercase transition w-full sm:w-auto text-center shadow-[0_0_20px_rgba(209,242,0,0.2)] hover:shadow-[0_0_30px_rgba(209,242,0,0.4)]"
            >
              Hacer predicciones
            </Link>
            <Link
              href="/live"
              className="slc-cyber-clip-reverse bg-card border border-border hover:border-r6-red text-text font-heading font-bold text-sm px-8 py-3 tracking-widest uppercase transition w-full sm:w-auto text-center"
            >
              Ver Stream
            </Link>
          </div>
        </div>
      </section>

      {/* Prize */}
      <section className="bg-card slc-cyber-clip border-l-4 border-l-accent p-4 sm:p-5 flex items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-full bg-accent/5 -skew-x-12 translate-x-8" />
        <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded flex items-center justify-center text-2xl shrink-0 text-accent">
          <span className="drop-shadow-[0_0_8px_rgba(209,242,0,0.5)]">🏆</span>
        </div>
        <div className="flex-1 min-w-0 z-10">
          <h3 className="font-heading font-bold text-sm tracking-widest text-accent uppercase">Premio al ganador</h3>
          <p className="text-text-secondary text-xs mt-1">
            El #1 del leaderboard se lleva un regalo exclusivo del Major Salt Lake City
          </p>
        </div>
        {!session && (
          <Link
            href="/login"
            className="slc-cyber-clip bg-r6-red hover:bg-r6-red/80 text-white font-heading font-bold text-[11px] px-5 py-2.5 tracking-widest uppercase transition shrink-0 hidden sm:block z-10"
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
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: "/live", icon: "📺", label: "Live Stream", desc: "Ver en directo" },
          { href: "/predicciones", icon: "🎯", label: "Predicciones", desc: "Predice ganadores" },
          { href: "/leaderboard", icon: "🏆", label: "Leaderboard", desc: "Ranking" },
          { href: "/historial", icon: "📊", label: "Historial", desc: "Tus predicciones" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-card slc-cyber-clip border border-border p-5 hover:border-accent/50 hover:bg-card-hover transition-all text-center group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition-colors" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-border group-hover:border-accent transition-colors m-2" />
            <p className="text-2xl mb-3 relative z-10 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform">{link.icon}</p>
            <p className="font-heading font-bold text-xs tracking-widest text-text group-hover:text-accent transition relative z-10 uppercase">{link.label}</p>
            <p className="text-[10px] text-text-secondary mt-1 relative z-10">{link.desc}</p>
          </Link>
        ))}
      </section>

      {/* Mini Leaderboard */}
      {leaderboard && leaderboard.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-black text-xl tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-6 bg-accent block skew-x-[-15deg]"></span>
              Top Predictores
            </h2>
            <Link href="/leaderboard" className="text-xs font-heading font-bold text-text-secondary hover:text-accent transition tracking-widest uppercase flex items-center gap-1">
              Ver ranking <span className="text-accent">→</span>
            </Link>
          </div>
          <div className="bg-card border border-border slc-cyber-clip-reverse">
            {leaderboard.map((entry, i) => (
              <div key={entry.id} className="flex items-center gap-4 px-5 py-4 border-b border-border/40 last:border-0 hover:bg-card-hover transition">
                <span className={`font-heading font-black text-xl w-6 text-center ${
                  i === 0 ? "text-accent drop-shadow-[0_0_8px_rgba(209,242,0,0.5)]" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-muted"
                }`}>
                  {i + 1}
                </span>
                {entry.avatar_url ? (
                  <Image src={entry.avatar_url} alt="" width={36} height={36} className="w-9 h-9 slc-cyber-clip object-cover" unoptimized />
                ) : (
                  <div className="w-9 h-9 slc-cyber-clip bg-border" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm truncate block">{entry.display_name || entry.username}</span>
                  {entry.username && <span className="text-[10px] text-muted font-heading tracking-widest">@{entry.username}</span>}
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="font-heading font-black text-success text-xl leading-none">{entry.correct_predictions}</span>
                  <span className="text-[10px] text-muted mt-1 uppercase tracking-widest border-t border-border/50 pt-0.5">/{entry.total_predictions} TOTAL</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
