import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import type { Match, Team } from "@/lib/types";
import { StreamContainer } from "@/components/stream-container";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "En Vivo",
  description: "Sigue los partidos en vivo del BLAST R6 Major Salt Lake City 2026. Resultados en tiempo real de Rainbow Six Siege.",
  openGraph: {
    title: "En Vivo - BLAST R6 Major SLC 2026",
    description: "Partidos en vivo del Major de R6 Siege. Resultados en tiempo real.",
  },
};

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
    <div className="relative min-h-[calc(100vh-80px)]">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/5 blur-[180px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-r6-red/5 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/2 opacity-30" />
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.03]" />
      </div>

      <div className="relative z-10 space-y-10">
        {/* Page Title Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-border/40">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-1 bg-r6-red" />
              <span className="text-xs font-heading font-black tracking-[0.4em] text-r6-red uppercase italic">Live Broadcast</span>
            </div>
            <h1 className="font-heading font-black text-5xl md:text-6xl tracking-tighter text-text italic">
              STREAMS <span className="text-accent drop-shadow-[0_0_15px_rgba(209,242,0,0.3)]">EN VIVO</span>
            </h1>
          </div>
          <div className="flex items-center gap-6 px-6 py-3 bg-bg-alt/50 backdrop-blur-md slc-cyber-clip border border-border/50">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-bg-alt bg-card overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-accent/20 to-r6-red/20 flex items-center justify-center text-[10px] font-black italic">
                    {i === 1 ? 'V' : i === 2 ? 'T' : '+'}
                  </div>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[10px] text-text-secondary font-black tracking-widest uppercase">Operadores Online</p>
              <p className="text-sm font-heading font-black text-text tracking-widest uppercase italic">Comunidad SLC 🎯</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
          {/* Main Content - Stream */}
          <div className="space-y-8">
            <StreamContainer />
            
            {/* Community Shoutout */}
            <div className="bg-gradient-to-br from-bg-alt/60 to-bg-alt/20 backdrop-blur-md slc-cyber-clip border border-border/40 p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
              <div className="w-20 h-20 shrink-0 bg-accent/10 rounded-full flex items-center justify-center border-2 border-accent/20">
                <svg viewBox="0 0 24 24" className="w-10 h-10 fill-accent drop-shadow-[0_0_8px_rgba(209,242,0,0.5)]"><path d="M12 11.55C9.64 9.35 6.48 8 3 8v11c3.48 0 6.64 1.35 9 3.55 2.36-2.2 5.52-3.55 9-3.55V8c-3.48 0-6.64 1.35-9 3.55zM12 8c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z"/></svg>
              </div>
              <div className="text-center md:text-left space-y-2">
                <h4 className="font-heading font-black text-xl tracking-widest text-text uppercase italic">Apoya a la comunidad</h4>
                <p className="text-sm text-text-secondary max-w-xl">
                  Estamos retransmitiendo todos los partidos del Major SLC. No olvides seguir a los canales para apoyar el contenido de R6 en español.
                </p>
              </div>
              <div className="md:ml-auto">
                <a href="https://twitch.tv/tebi10" target="_blank" rel="noopener noreferrer" className="inline-block bg-white text-bg font-heading font-black text-xs px-8 py-3 slc-cyber-clip tracking-widest uppercase transition hover:bg-accent hover:-translate-y-1 shadow-lg">
                  Subscribirse
                </a>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Donation Card */}
            <a 
              href="https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=estebangarciaamorin1@gmail.com&currency_code=EUR" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative block bg-gradient-to-br from-[#003087]/30 to-[#0070ba]/10 backdrop-blur-2xl slc-cyber-clip border border-[#0070ba]/30 p-8 overflow-hidden transition-all duration-700 hover:shadow-[0_0_50px_rgba(0,112,186,0.3)] hover:-translate-y-1.5 active:translate-y-0"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700">
                <svg viewBox="0 0 24 24" className="w-24 h-24 fill-[#0070ba]"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/></svg>
              </div>
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#0070ba]/20 rounded-2xl flex items-center justify-center border border-[#0070ba]/40 shadow-inner">
                    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#0070ba] drop-shadow-[0_0_8px_rgba(0,112,186,0.5)]"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>
                  </div>
                  <div>
                    <h4 className="font-heading font-black text-lg tracking-[0.1em] text-white uppercase italic leading-none">Donar al Stream</h4>
                    <p className="text-[10px] text-[#0070ba] font-black uppercase tracking-[0.3em] mt-2 bg-white/5 inline-block px-2 py-0.5 rounded">PAYPAL SECURE</p>
                  </div>
                </div>
                <p className="text-[11px] text-text-secondary font-medium leading-relaxed uppercase opacity-60">Tu apoyo nos ayuda a seguir trayendo el mejor contenido de R6</p>
                <div className="flex items-center gap-2 text-[#0070ba] font-black text-xs uppercase tracking-widest mt-2 group-hover:translate-x-2 transition-transform">
                  Hacer donación <span>→</span>
                </div>
              </div>
            </a>

            {/* Prize Card - More Premium */}
            <div className="bg-gradient-to-b from-accent/20 to-accent/5 backdrop-blur-xl slc-cyber-clip border border-accent/30 p-8 text-center relative overflow-hidden group shadow-[0_0_40px_rgba(209,242,0,0.1)]">
              <div className="absolute inset-0 bg-[url('/cyber_pattern.png')] opacity-10 mix-blend-overlay" />
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/20 blur-3xl rounded-full" />
              <div className="relative z-10">
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-accent/20 shadow-[0_0_20px_rgba(209,242,0,0.2)]">
                  <span className="text-5xl drop-shadow-[0_0_15px_rgba(209,242,0,0.6)] animate-bounce">🏆</span>
                </div>
                <h3 className="font-heading font-black text-xl tracking-[0.2em] text-accent uppercase italic mb-3">GRAND PRIZE</h3>
                <p className="text-xs text-text-secondary font-bold leading-relaxed uppercase opacity-80 mb-6">
                  El Operador #1 del leaderboard global recibirá un pack exclusivo del BLAST Major SLC 2026.
                </p>
                {!session && (
                  <Link
                    href="/login"
                    className="w-full inline-block bg-accent hover:bg-accent-hover text-bg font-heading font-black text-sm py-4 slc-cyber-clip tracking-[0.2em] uppercase transition relative z-10 shadow-xl hover:-translate-y-1 active:translate-y-0"
                  >
                    Login con 𝕏
                  </Link>
                )}
              </div>
            </div>

            {/* Today's matches */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <h2 className="font-heading font-black text-sm tracking-[0.3em] text-text-secondary flex items-center gap-3 uppercase italic">
                  <span className="w-2 h-2 bg-r6-red" />
                  {todayMatches && todayMatches.length > 0 ? "Daily Schedule" : "Upcoming"}
                </h2>
                <span className="text-[10px] font-black text-accent tracking-widest uppercase opacity-60">SLC 2026</span>
              </div>
              
              {todayMatches && todayMatches.length > 0 ? (
                <div className="space-y-4">
                  {todayMatches.map(match => (
                    <SidebarMatch key={match.id} match={match} prediction={userPredictions[match.id]} />
                  ))}
                </div>
              ) : (
                <div className="bg-bg-alt/30 slc-cyber-clip border border-border/40 p-10 text-center space-y-4">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-text-secondary opacity-30"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                  </div>
                  <p className="text-[10px] text-text-secondary font-black tracking-widest uppercase">No hay partidos programados hoy</p>
                  <Link href="/predicciones" className="text-[10px] font-heading font-black tracking-[0.3em] text-accent hover:text-white transition-colors uppercase italic border-b border-accent/30 pb-1">
                    Ver Calendario →
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Links Group */}
            <div className="grid grid-cols-1 gap-4">
              <Link
                href="/predicciones"
                className="group relative p-6 bg-bg-alt/40 border border-border/40 slc-cyber-clip hover:border-accent/40 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <p className="font-heading font-black text-sm tracking-[0.2em] text-text group-hover:text-accent transition uppercase flex items-center justify-between italic">
                    Predicciones <span className="text-accent group-hover:translate-x-2 transition-transform">→</span>
                  </p>
                  <p className="text-[10px] text-text-secondary mt-2 font-bold uppercase tracking-tighter opacity-60">Predice y escala en el ranking</p>
                </div>
              </Link>
              <Link
                href="/leaderboard"
                className="group relative p-6 bg-bg-alt/40 border border-border/40 slc-cyber-clip hover:border-accent/40 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <p className="font-heading font-black text-sm tracking-[0.2em] text-text group-hover:text-accent transition uppercase flex items-center justify-between italic">
                    Leaderboard <span className="text-accent group-hover:translate-x-2 transition-transform">→</span>
                  </p>
                  <p className="text-[10px] text-text-secondary mt-2 font-bold uppercase tracking-tighter opacity-60">Ranking de los mejores operadores</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarMatch({ match, prediction }: { match: Match & { team_a: Team; team_b: Team }; prediction?: string }) {
  const time = new Date(match.match_date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const isLive = match.status === "live";
  
  return (
    <div className={`bg-card/40 backdrop-blur-md slc-cyber-clip border p-5 transition-all duration-500 relative overflow-hidden group ${isLive ? 'border-r6-red/50 shadow-[0_0_20px_rgba(255,0,60,0.1)]' : 'border-border/50 hover:border-border hover:bg-card/60'}`}>
      {isLive && (
        <div className="absolute top-0 left-0 w-1.5 h-full bg-r6-red animate-pulse" />
      )}
      
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
        <span className="text-[10px] text-text-secondary font-black tracking-widest uppercase italic opacity-70">{match.stage}</span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-text-secondary tracking-widest uppercase">BO{match.best_of}</span>
          {isLive ? (
            <div className="flex items-center gap-2 bg-r6-red/20 px-2 py-0.5 rounded border border-r6-red/30">
              <span className="w-1.5 h-1.5 rounded-full bg-r6-red animate-pulse" />
              <span className="text-[10px] text-r6-red font-black tracking-widest uppercase">LIVE</span>
            </div>
          ) : (
            <span className="text-[10px] text-text-secondary font-black tracking-widest opacity-40 uppercase">{time}</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className={`flex flex-col items-center gap-2 group-hover:scale-105 transition-transform duration-500 ${prediction === match.team_a_id ? "text-accent" : "text-text"}`}>
          {match.team_a.logo_url ? (
            <Image src={match.team_a.logo_url} width={40} height={40} className={`w-10 h-10 object-contain ${prediction === match.team_a_id ? "ring-2 ring-accent/50" : ""}`} alt="" unoptimized />
          ) : (
            <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center text-[10px] font-black">{match.team_a.short_name[0]}</div>
          )}
          <span className="font-heading font-black text-xs tracking-[0.2em] uppercase italic">{match.team_a.short_name}</span>
          {prediction === match.team_a_id && <div className="w-4 h-1 bg-accent rounded-full shadow-[0_0_8px_rgba(209,242,0,0.5)]" />}
        </div>

        <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-40 transition-opacity">
          <span className="text-[10px] font-black uppercase italic tracking-tighter">VS</span>
        </div>

        <div className={`flex flex-col items-center gap-2 group-hover:scale-105 transition-transform duration-500 ${prediction === match.team_b_id ? "text-accent" : "text-text"}`}>
          {match.team_b.logo_url ? (
            <Image src={match.team_b.logo_url} width={40} height={40} className={`w-10 h-10 object-contain ${prediction === match.team_b_id ? "ring-2 ring-accent/50" : ""}`} alt="" unoptimized />
          ) : (
            <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center text-[10px] font-black">{match.team_b.short_name[0]}</div>
          )}
          <span className="font-heading font-black text-xs tracking-[0.2em] uppercase italic">{match.team_b.short_name}</span>
          {prediction === match.team_b_id && <div className="w-4 h-1 bg-accent rounded-full shadow-[0_0_8px_rgba(209,242,0,0.5)]" />}
        </div>
      </div>
    </div>
  );
}
