export type Team = {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
  group_name: string | null;
};

export type Match = {
  id: string;
  team_a_id: string;
  team_b_id: string;
  stage: string;
  best_of: number;
  match_date: string;
  lock_date: string | null;
  winner_id: string | null;
  score_a: number | null;
  score_b: number | null;
  status: "upcoming" | "live" | "completed";
  team_a?: Team;
  team_b?: Team;
};

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
};

export type Prediction = {
  id: string;
  user_id: string;
  match_id: string;
  predicted_team_id: string;
  created_at: string;
};

export type LeaderboardEntry = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  total_predictions: number;
  correct_predictions: number;
  accuracy: number;
};
