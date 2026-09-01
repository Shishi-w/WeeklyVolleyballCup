export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  position_x: number;
  position_y: number;
  rotation: number;
  color: string;
  pattern: string;
  created_at: string;
  updated_at: string;
  edited_by: string | null;
}

export interface TeamPlayer {
  user_id: string;
  name: string;
  position?: string | null;
}

export interface Team {
  id: string;
  team_name: string;
  description: string | null;
  captain_name: string;
  captain_id: string | null;
  captain_contact: string | null;
  status: string | null;
  expected_position: string | null;
  players: TeamPlayer[] | null;
  match_id: string;
  created_at: string;
  matches?: { id: string; name: string; start_date?: string } | null;
}

export interface MatchContent {
  id: string;
  match_id: string;
  content: string;
  edited_by: string | null;
  edited_by_username: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchRecord {
  id: string;
  match_id: string;
  image_url: string;
  caption: string | null;
  edited_by: string | null;
  edited_by_username: string | null;
  comments: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface TeamResult {
  id: string;
  match_id: string;
  team_id: string;
  rank: number;
  points: number | null;
  is_winner: boolean;
  created_at: string;
  teams?: { team_name?: string; captain_name?: string; players?: TeamPlayer[] | null } | null;
  matches?: { id: string; name?: string; start_date?: string } | null;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  match_id: string;
  team_id: string | null;
  achievement_type: string;
  title: string;
  description: string | null;
  awarded_at: string;
  created_at: string;
  teams?: { team_name?: string } | null;
  user_name?: string;
}
