import { createClient } from "@/lib/supabase/server";
import { TournamentCalendar } from "@/components/tournament-calendar";
import { FormatExplainer } from "@/components/format-explainer";
import { TOURNAMENT_LINKS } from "@/lib/tournament-schedule";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Info del Torneo",
  description: "Toda la información del BLAST R6 Major Salt Lake City 2026: calendario, formato, horarios y simulador Swiss.",
  openGraph: {
    title: "Info - BLAST R6 Major SLC 2026",
    description: "Calendario, formato, simulador Swiss y toda la info del Major de R6 Siege.",
  },
};

export default async function InfoPage() {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("*, team_a:teams!matches_team_a_id_fkey(*), team_b:teams!matches_team_b_id_fkey(*)")
    .neq("status", "draft")
    .order("match_date", { ascending: true });

  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-bg-alt/50 p-5 slc-cyber-clip border-l-4 border-l-r6-red relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-full bg-r6-red/5 -skew-x-12 translate-x-12" />
        <div className="relative z-10">
          <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-widest text-text">
            INFO DEL TORNEO
          </h1>
          <p className="text-r6-red font-bold font-heading tracking-widest text-xs mt-1 uppercase">
            BLAST R6 Major Salt Lake City 2026
          </p>
        </div>
      </div>

      {/* Format Explainer */}
      <section>
        <SectionHeader title="FORMATO" subtitle="Play-In → Swiss → Playoffs" />
        <FormatExplainer />
      </section>

      {/* Calendar */}
      <section>
        <SectionHeader title="CALENDARIO" subtitle="Horarios y partidos por día" />
        <TournamentCalendar matches={matches || []} />
      </section>


      {/* External Links */}
      <section>
        <SectionHeader title="ENLACES ÚTILES" subtitle="Cobertura y recursos" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ExternalLink
            href={TOURNAMENT_LINKS.liquipedia}
            title="Liquipedia"
            description="Brackets, resultados y estadísticas completas"
            icon={
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
          />
          <ExternalLink
            href={TOURNAMENT_LINKS.siegegg}
            title="SiegeGG"
            description="Estadísticas de equipos y jugadores en detalle"
            icon={
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 8v8m-4-5v5m-4-2v2m-2 4h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <ExternalLink
            href={TOURNAMENT_LINKS.ubisoft}
            title="R6 Esports Oficial"
            description="Calendario oficial de Ubisoft con todos los partidos"
            icon={
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <ExternalLink
            href={TOURNAMENT_LINKS.twitch}
            title="Twitch — Rainbow6"
            description="Stream oficial del torneo en vivo"
            icon={
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
              </svg>
            }
          />
          <ExternalLink
            href={TOURNAMENT_LINKS.youtube}
            title="YouTube — R6 Esports"
            description="VODs y highlights de todos los partidos"
            icon={
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            }
          />
          <ExternalLink
            href="https://x.com/TebiiR6"
            title="@TebiiR6"
            description="Actualizaciones y contenido del Major en X"
            icon={
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            }
          />
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-end gap-3 mb-3">
      <h2 className="font-heading font-black text-lg tracking-widest text-text uppercase">{title}</h2>
      <span className="text-[10px] font-heading font-bold tracking-widest text-text-secondary/50 uppercase pb-0.5">{subtitle}</span>
    </div>
  );
}

function ExternalLink({ href, title, description, icon }: { href: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-card border border-border slc-cyber-clip p-4 flex items-start gap-3 hover:border-border-light hover:bg-card-hover transition group"
    >
      <div className="text-text-secondary group-hover:text-accent transition shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <h3 className="font-heading font-black text-xs tracking-widest text-text uppercase group-hover:text-accent transition">
          {title}
        </h3>
        <p className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">{description}</p>
      </div>
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-text-secondary/30 group-hover:text-accent/50 transition shrink-0 ml-auto mt-0.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}
