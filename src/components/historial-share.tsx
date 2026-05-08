"use client";

import { SharePredictions } from "./share-predictions";
import type { Match, Team } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

type Props = {
  matches: (Match & { team_a: Team; team_b: Team })[];
  userPredictions: Record<string, string>;
  user: User;
};

export function HistorialShare({ matches, userPredictions, user }: Props) {
  return (
    <SharePredictions
      matches={matches}
      userPredictions={userPredictions}
      user={user}
    />
  );
}
