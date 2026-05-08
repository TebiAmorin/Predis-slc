import { createClient } from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/leaderboard-table";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Ranking de predicciones del BLAST R6 Major Salt Lake City 2026. Consulta quién lidera las predicciones de Rainbow Six Siege.",
  openGraph: {
    title: "Leaderboard - BLAST R6 Major SLC 2026",
    description: "Ranking de predicciones del Major de R6 Siege. Consulta quién lidera.",
  },
};

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const { data: entries } = await supabase
    .from("leaderboard")
    .select("*");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-alt/50 p-6 slc-cyber-clip border-l-4 border-l-r6-red relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-full bg-r6-red/5 -skew-x-12 translate-x-8" />
        <div className="relative z-10">
          <h1 className="font-heading font-black text-3xl tracking-widest text-text drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">LEADERBOARD</h1>
          <p className="text-text-secondary font-bold font-heading tracking-widest text-xs mt-1 uppercase">Ranking de aciertos en predicciones</p>
        </div>
        <div className="bg-card/80 border border-border slc-cyber-clip px-4 py-3 text-center relative z-10 shadow-[0_0_10px_rgba(209,242,0,0.1)]">
          <p className="text-[10px] text-accent tracking-widest uppercase font-black">PREMIO #1</p>
          <p className="text-xs font-heading font-bold mt-0.5 text-text">🏆 Regalo exclusivo Major SLC</p>
        </div>
      </div>

      <LeaderboardTable entries={entries || []} currentUserId={session?.user?.id} />
    </div>
  );
}
