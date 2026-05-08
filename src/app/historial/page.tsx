import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HistoryList } from "@/components/history-list";
import { HistorialShare } from "@/components/historial-share";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Historial",
  description: "Revisa tu historial de predicciones del BLAST R6 Major Salt Lake City 2026. Aciertos, fallos y estadísticas.",
  openGraph: {
    title: "Historial - BLAST R6 Major SLC 2026",
    description: "Revisa tu historial de predicciones del Major de R6 Siege.",
  },
};

export default async function HistorialPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: predictions } = await supabase
    .from("predictions")
    .select(`
      *,
      match:matches(*, team_a:teams!matches_team_a_id_fkey(*), team_b:teams!matches_team_b_id_fkey(*)),
      predicted_team:teams(*)
    `)
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  // Get matches with teams for the share component
  const { data: allMatches } = await supabase
    .from("matches")
    .select("*, team_a:teams!matches_team_a_id_fkey(*), team_b:teams!matches_team_b_id_fkey(*)")
    .order("match_date", { ascending: true });

  const userPredictions: Record<string, string> = {};
  if (predictions) {
    predictions.forEach((p: { match_id: string; predicted_team_id: string }) => {
      userPredictions[p.match_id] = p.predicted_team_id;
    });
  }

  const total = predictions?.length || 0;
  const correct = predictions?.filter(p =>
    p.match?.status === "completed" && p.predicted_team_id === p.match?.winner_id
  ).length || 0;
  const wrong = predictions?.filter(p =>
    p.match?.status === "completed" && p.predicted_team_id !== p.match?.winner_id
  ).length || 0;
  const pending = predictions?.filter(p => p.match?.status !== "completed").length || 0;

  const shareText = `🎯 Mis predicciones BLAST R6 Major SLC 2026:\n\n✅ Aciertos: ${correct}\n❌ Fallos: ${wrong}\n⏳ Pendientes: ${pending}\n📊 Precisión: ${total > 0 ? Math.round((correct / (correct + wrong || 1)) * 100) : 0}%\n\n¿Puedes superarme?\nhttps://predicciones.tebimedia.com\n\n@TebiiR6 #R6Major`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-alt/50 p-6 slc-cyber-clip border-l-4 border-l-success relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-full bg-success/5 -skew-x-12 translate-x-8" />
        <div className="relative z-10">
          <h1 className="font-heading font-black text-3xl tracking-widest text-text drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">TU HISTORIAL</h1>
          <p className="text-text-secondary font-bold font-heading tracking-widest text-xs mt-1 uppercase">Todas tus predicciones</p>
        </div>
        <a
          href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-r6-red hover:bg-r6-red/80 text-white text-[11px] font-heading font-black px-4 py-2 slc-cyber-clip tracking-widest uppercase transition relative z-10 shadow-[0_0_10px_rgba(255,0,60,0.3)] hover:-translate-y-0.5"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          COMPARTIR
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 sm:gap-4">
        {/* Accuracy ring */}
        <div className="col-span-5 sm:col-span-1 bg-card border border-border slc-cyber-clip p-5 flex flex-col items-center justify-center relative overflow-hidden animate-fade-in-up">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="3"
                strokeDasharray={`${total > 0 ? Math.round((correct / (correct + wrong || 1)) * 100) : 0}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-heading font-black text-xl text-accent">
              {total > 0 ? Math.round((correct / (correct + wrong || 1)) * 100) : 0}%
            </span>
          </div>
          <p className="text-[9px] text-text-secondary tracking-widest uppercase mt-2 font-bold">PRECISIÓN</p>
        </div>

        <div className="bg-card border border-border slc-cyber-clip p-5 text-center relative overflow-hidden animate-fade-in-up stagger-1">
          <div className="absolute top-0 left-0 w-1 h-full bg-border-light" />
          <p className="font-heading font-black text-3xl animate-count-up">{total}</p>
          <p className="text-[10px] text-text-secondary tracking-widest uppercase mt-1 font-bold">TOTAL</p>
        </div>
        <div className="bg-card border border-border slc-cyber-clip p-5 text-center relative overflow-hidden animate-fade-in-up stagger-2">
          <div className="absolute top-0 left-0 w-1 h-full bg-success" />
          <p className="font-heading font-black text-3xl text-success animate-count-up">{correct}</p>
          <p className="text-[10px] text-text-secondary tracking-widest uppercase mt-1 font-bold">ACIERTOS</p>
        </div>
        <div className="bg-card border border-border slc-cyber-clip p-5 text-center relative overflow-hidden animate-fade-in-up stagger-3">
          <div className="absolute top-0 left-0 w-1 h-full bg-r6-red" />
          <p className="font-heading font-black text-3xl text-r6-red animate-count-up">{wrong}</p>
          <p className="text-[10px] text-text-secondary tracking-widest uppercase mt-1 font-bold">FALLOS</p>
        </div>
        <div className="bg-card border border-border slc-cyber-clip p-5 text-center relative overflow-hidden animate-fade-in-up stagger-4">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
          <p className="font-heading font-black text-3xl text-accent animate-count-up">{pending}</p>
          <p className="text-[10px] text-text-secondary tracking-widest uppercase mt-1 font-bold">PENDIENTES</p>
        </div>
      </div>

      {/* Lista Compacta Interactiva */}
      <div className="pt-2">
        {predictions && predictions.length > 0 ? (
          <HistoryList 
            predictions={predictions as unknown as Parameters<typeof HistoryList>[0]['predictions']} 
          />
        ) : (
          <div className="text-center py-14 bg-bg-alt/50 slc-cyber-clip border border-border">
            <p className="text-text-secondary font-heading tracking-widest uppercase font-bold text-sm">No has hecho predicciones aún</p>
            <a href="/predicciones" className="text-accent text-xs font-bold font-heading tracking-widest uppercase mt-3 inline-block hover:text-accent-hover transition">
              Hacer predicciones →
            </a>
          </div>
        )}
      </div>

      {/* Share Card */}
      {allMatches && allMatches.length > 0 && (
        <HistorialShare
          matches={allMatches}
          userPredictions={userPredictions}
          user={session.user}
        />
      )}
    </div>
  );
}
