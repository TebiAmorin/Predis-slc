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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl tracking-wider">Predicciones</h1>
          <p className="text-text-secondary text-sm mt-0.5">Toca un equipo para predecir el ganador</p>
        </div>
        <div className="flex items-center gap-2">
          {session && (
            <a
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-card border border-border hover:border-accent/30 text-text text-[11px] font-heading font-bold px-3 py-2 rounded-lg tracking-wider uppercase transition"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Compartir
            </a>
          )}
          {!session && (
            <Link
              href="/login"
              className="bg-r6-red hover:bg-r6-red/80 text-white text-[11px] font-heading font-bold px-4 py-2 rounded-lg tracking-wider uppercase transition"
            >
              Login para predecir
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
