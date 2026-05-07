import { createClient } from "@/lib/supabase/server";
import { MatchFilters } from "@/components/match-filters";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PrediccionesPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const { data: matches } = await supabase
    .from("matches")
    .select("*, team_a:teams!matches_team_a_id_fkey(*), team_b:teams!matches_team_b_id_fkey(*)")
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

  const shareText = "🎯 Estoy haciendo mis predicciones para el BLAST R6 Major Salt Lake City 2026!\n\n¿Puedes superarme? Haz las tuyas 👇\nhttps://predicciones.tebimedia.com\n\n@TebiiR6 #R6Major #BLASTR6";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-alt/50 p-6 slc-cyber-clip border-l-4 border-l-accent relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-full bg-accent/5 -skew-x-12 translate-x-8" />
        <div className="relative z-10">
          <h1 className="font-heading font-black text-3xl tracking-widest text-text drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">PREDICCIONES</h1>
          <p className="text-accent font-bold font-heading tracking-widest text-xs mt-1 uppercase">Toca un equipo para predecir el ganador</p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          {session && (
            <a
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-bg border border-border hover:border-accent hover:text-accent text-text text-[11px] font-heading font-black px-4 py-2 slc-cyber-clip tracking-widest uppercase transition"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              COMPARTIR
            </a>
          )}
          {!session && (
            <Link
              href="/login"
              className="bg-accent hover:bg-accent-hover text-bg text-[11px] font-heading font-black px-5 py-2 slc-cyber-clip tracking-widest uppercase transition shadow-[0_0_10px_rgba(209,242,0,0.3)]"
            >
              LOGIN PARA PREDECIR
            </Link>
          )}
        </div>
      </div>

      <MatchFilters
        matches={matches || []}
        userPredictions={userPredictions}
        userId={session?.user?.id || null}
      />
    </div>
  );
}
