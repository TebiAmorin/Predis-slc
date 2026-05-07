import { createClient } from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/leaderboard-table";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const { data: entries } = await supabase
    .from("leaderboard")
    .select("*");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl tracking-wider">Leaderboard</h1>
          <p className="text-text-secondary text-sm mt-0.5">Ranking de aciertos en predicciones</p>
        </div>
        <div className="bg-gradient-to-r from-r6-red/10 to-accent-dim border border-border rounded-lg px-3 py-2 text-center">
          <p className="text-[10px] text-muted tracking-wider uppercase">Premio #1</p>
          <p className="text-xs font-heading font-bold">🏆 Regalo exclusivo Major SLC</p>
        </div>
      </div>

      <LeaderboardTable entries={entries || []} currentUserId={session?.user?.id} />
    </div>
  );
}
