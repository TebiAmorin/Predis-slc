"use client";

import { MatchCard } from "./match-card";
import type { Match, Team } from "@/lib/types";

type Props = {
  matches: (Match & { team_a: Team; team_b: Team })[];
  userPredictions: Record<string, string>;
  userId: string | null;
};

export function MatchesGrid({ matches, userPredictions, userId }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          userPrediction={userPredictions[match.id] || null}
          userId={userId}
        />
      ))}
    </div>
  );
}
