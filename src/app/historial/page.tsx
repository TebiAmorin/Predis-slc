import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl tracking-wider">Tu Historial</h1>
          <p className="text-text-secondary text-sm mt-0.5">Todas tus predicciones</p>
        </div>
        <a
          href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-r6-red hover:bg-r6-red/80 text-white text-xs font-heading font-bold px-4 py-2 rounded-lg tracking-wider uppercase transition"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Compartir
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="font-heading font-bold text-2xl">{total}</p>
          <p className="text-[10px] text-muted tracking-wider uppercase">Total</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="font-heading font-bold text-2xl text-success">{correct}</p>
          <p className="text-[10px] text-muted tracking-wider uppercase">Aciertos</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="font-heading font-bold text-2xl text-r6-red">{wrong}</p>
          <p className="text-[10px] text-muted tracking-wider uppercase">Fallos</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="font-heading font-bold text-2xl text-accent">{pending}</p>
          <p className="text-[10px] text-muted tracking-wider uppercase">Pendientes</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {(!predictions || predictions.length === 0) && (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <p className="text-muted font-heading tracking-wider">No has hecho predicciones aún</p>
            <Link href="/predicciones" className="text-accent text-sm mt-2 inline-block hover:text-accent-hover">
              Hacer predicciones →
            </Link>
          </div>
        )}

        {predictions?.map((pred) => {
          const match = pred.match;
          if (!match) return null;
          const isCompleted = match.status === "completed";
          const isCorrect = isCompleted && pred.predicted_team_id === match.winner_id;
          const matchDate = new Date(match.match_date);

          return (
            <div
              key={pred.id}
              className={`bg-card border rounded-xl p-4 flex items-center gap-4 ${
                isCompleted
                  ? isCorrect ? "border-success/30" : "border-r6-red/30"
                  : "border-border"
              }`}
            >
              {/* Status icon */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                isCompleted
                  ? isCorrect ? "bg-success-dim text-success" : "bg-r6-red-dim text-r6-red"
                  : "bg-accent-dim text-accent"
              }`}>
                {isCompleted ? (isCorrect ? "✓" : "✗") : "?"}
              </div>

              {/* Match info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-sm">
                    {match.team_a.short_name} vs {match.team_b.short_name}
                  </span>
                  <span className="text-[10px] bg-border text-text-secondary px-1.5 rounded font-heading">
                    BO{match.best_of}
                  </span>
                </div>
                <p className="text-[10px] text-muted mt-0.5">
                  {match.stage} · {matchDate.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                </p>
              </div>

              {/* Prediction */}
              <div className="text-right shrink-0">
                <p className="text-[10px] text-muted">Tu predicción:</p>
                <p className={`font-heading font-bold text-sm ${
                  isCompleted ? (isCorrect ? "text-success" : "text-r6-red") : "text-accent"
                }`}>
                  {pred.predicted_team?.short_name || "—"}
                </p>
              </div>

              {/* Score if completed */}
              {isCompleted && match.score_a !== null && (
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted">Resultado:</p>
                  <p className="font-heading font-bold text-sm">
                    {match.score_a} - {match.score_b}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
