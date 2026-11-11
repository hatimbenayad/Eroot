import type { TeamScoreboardEntry, TeamSummary } from '../schemas/game';

export interface TeamPlayerRef {
  id: string;
  team_id?: string | null;
  is_kicked: boolean;
}

export interface TeamAnswerRef {
  player_id: string;
  slide_id: string;
  points: number;
}

/**
 * Computes Team standings where each question's team score equals
 * the rounded arithmetic mean of its active members' scores on that question.
 */
export function computeTeamStandings(
  teams: readonly TeamSummary[],
  players: readonly TeamPlayerRef[],
  answers: readonly TeamAnswerRef[]
): TeamScoreboardEntry[] {
  const activePlayers = players.filter((p) => !p.is_kicked);
  const playerTeam = new Map<string, string>();
  const membersPerTeam = new Map<string, number>();

  for (const t of teams) {
    membersPerTeam.set(t.id, 0);
  }
  for (const p of activePlayers) {
    if (p.team_id && membersPerTeam.has(p.team_id)) {
      playerTeam.set(p.id, p.team_id);
      membersPerTeam.set(p.team_id, (membersPerTeam.get(p.team_id) ?? 0) + 1);
    }
  }

  // Group points by (teamId -> slideId -> sumPoints)
  const teamSlideSum = new Map<string, Map<string, number>>();
  for (const t of teams) {
    teamSlideSum.set(t.id, new Map());
  }

  for (const ans of answers) {
    const teamId = playerTeam.get(ans.player_id);
    if (!teamId) continue;
    const bySlide = teamSlideSum.get(teamId)!;
    bySlide.set(ans.slide_id, (bySlide.get(ans.slide_id) ?? 0) + ans.points);
  }

  const entries = teams.map((team) => {
    const memberCount = membersPerTeam.get(team.id) ?? 0;
    let totalScore = 0;
    if (memberCount > 0) {
      const bySlide = teamSlideSum.get(team.id)!;
      for (const slideSum of bySlide.values()) {
        totalScore += Math.round(slideSum / memberCount);
      }
    }
    return {
      teamId: team.id,
      name: team.name,
      colorHex: team.colorHex,
      memberCount,
      totalScore,
      rank: 1,
    };
  });

  entries.sort((a, b) => b.totalScore - a.totalScore);
  return entries.map((e, idx) => ({ ...e, rank: idx + 1 }));
}

