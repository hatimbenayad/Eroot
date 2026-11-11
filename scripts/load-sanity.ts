import { performance } from 'node:perf_hooks';
import { sanitizeSlidesForPlayer } from '../shared/schemas/sanitizer';
import { createDefaultSlide, type QuizContent } from '../shared/schemas/slide';
import { aggregateBrainstormIdeas, evaluateSlideAnswer } from '../shared/scoring/scoring';
import { computeTeamStandings, type TeamAnswerRef } from '../shared/scoring/team';
import { generateFriendlyNickname, isNicknameClean } from '../shared/moderation/nickname';

const PLAYERS = 100;
const ROUNDS = 10;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return Number(sorted[idx]!.toFixed(3));
}

function main() {
  // 1. Build representative 10-slide mixed quiz (Quiz, Multi-Select, Slider, Pin Answer, Brainstorm, etc.)
  const slides = Array.from({ length: ROUNDS }, (_, idx) => {
    if (idx === 4) {
      const s = createDefaultSlide('load-quiz', idx, 'pin_answer');
      s.title = `Slide ${idx + 1}: Pin Target`;
      s.mediaUrl = 'https://example.com/map.png';
      return s;
    }
    if (idx === 8) {
      const s = createDefaultSlide('load-quiz', idx, 'brainstorm');
      s.title = `Slide ${idx + 1}: Brainstorm`;
      return s;
    }
    const s = createDefaultSlide('load-quiz', idx, 'quiz');
    s.title = `Slide ${idx + 1}: Sample Knowledge Question`;
    const opts = (s.content as QuizContent).options.map((o, i) => ({
      ...o,
      text: `Choice ${i + 1}`,
      isCorrect: i === 0,
    }));
    s.content = { options: opts };
    return s;
  });

  // 2. Verify player sanitization overhead & payload byte size
  const tSanStart = performance.now();
  const sanitized = sanitizeSlidesForPlayer(slides);
  const sanitizeMs = Number((performance.now() - tSanStart).toFixed(3));
  const publicPayloadBytes = Buffer.byteLength(JSON.stringify(sanitized), 'utf8');

  // 3. Simulate 100 players joining with nickname moderation + assigning into 4 teams
  const joinStart = performance.now();
  const teams = [
    { id: 'team-1', name: 'Crimson Foxes', color_hex: '#dc2626', position: 0 },
    { id: 'team-2', name: 'Cobalt Owls', color_hex: '#2563eb', position: 1 },
    { id: 'team-3', name: 'Amber Lions', color_hex: '#eab308', position: 2 },
    { id: 'team-4', name: 'Emerald Lynxes', color_hex: '#15803d', position: 3 },
  ];
  const players = Array.from({ length: PLAYERS }, (_, i) => {
    const nickname = generateFriendlyNickname(i);
    if (!isNicknameClean(nickname)) {
      throw new Error(`Nickname check failed for ${nickname}`);
    }
    return {
      id: `player-${i + 1}`,
      nickname,
      team_id: teams[i % teams.length]!.id,
      total_score: 0,
      streak: 0,
    };
  });
  const joinSimMs = Number((performance.now() - joinStart).toFixed(3));

  // 4. Simulate 100 concurrent players x 10 rounds = 1000 authoritative answer evaluations
  const latenciesMs: number[] = [];
  const answerRefs: TeamAnswerRef[] = [];
  const brainstormRows: Array<{ playerId: string; nickname?: string; payload: { ideas: string[]; votedIdeaIds: string[] } }> = [];

  for (const slide of slides) {
    for (let i = 0; i < players.length; i++) {
      const p = players[i]!;
      const t0 = performance.now();
      const responseMs = 1200 + ((i * 173) % 15000);

      if (slide.type === 'pin_answer') {
        const hit = i % 3 === 0;
        const evalRes = evaluateSlideAnswer(
          slide,
          { pin: hit ? { x: 0.52, y: 0.51 } : { x: 0.9, y: 0.9 } },
          responseMs
        );
        p.total_score += evalRes.points;
        answerRefs.push({ player_id: p.id, slide_id: slide.id, points: evalRes.points });
      } else if (slide.type === 'brainstorm') {
        const evalRes = evaluateSlideAnswer(slide, { text: `Idea ${i + 1}` }, responseMs);
        brainstormRows.push({
          playerId: p.id,
          nickname: p.nickname,
          payload: {
            ideas: [`Idea ${i + 1} from ${p.nickname}`],
            votedIdeaIds: [`player-${((i + 1) % 20) + 1}:0`],
          },
        });
        p.total_score += evalRes.points;
      } else {
        const opts = (slide.content as QuizContent).options;
        const picked = i % 4 === 0 ? opts[1]!.id : opts[0]!.id;
        const evalRes = evaluateSlideAnswer(slide, { optionId: picked }, responseMs);
        p.total_score += evalRes.points;
        answerRefs.push({ player_id: p.id, slide_id: slide.id, points: evalRes.points });
      }

      latenciesMs.push(performance.now() - t0);
    }
  }

  latenciesMs.sort((a, b) => a - b);

  // 5. Measure Team Standings & Brainstorm aggregation across all 100 players
  const tTeam0 = performance.now();
  const teamStandings = computeTeamStandings(teams, players, answerRefs);
  const teamComputeMs = Number((performance.now() - tTeam0).toFixed(3));

  const tBrain0 = performance.now();
  const rankedIdeas = aggregateBrainstormIdeas(brainstormRows);
  const brainstormComputeMs = Number((performance.now() - tBrain0).toFixed(3));

  const report = {
    simulatedPlayers: PLAYERS,
    simulatedRounds: ROUNDS,
    totalSubmissions: PLAYERS * ROUNDS,
    sanitizePayloadMs: sanitizeMs,
    publicSlidesPayloadBytes: publicPayloadBytes,
    joinAndModeration100PlayersMs: joinSimMs,
    perSubmissionEvalLatencyMs: {
      p50: percentile(latenciesMs, 50),
      p95: percentile(latenciesMs, 95),
      p99: percentile(latenciesMs, 99),
      max: Number((latenciesMs[latenciesMs.length - 1] ?? 0).toFixed(3)),
    },
    teamStandingsComputeMs: teamComputeMs,
    topTeamScore: teamStandings[0]?.totalScore ?? 0,
    brainstormAggregate100IdeasMs: brainstormComputeMs,
    rankedIdeasCount: rankedIdeas.length,
  };

  console.log(JSON.stringify(report, null, 2));
}

main();

