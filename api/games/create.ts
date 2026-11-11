import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createGameRequestSchema } from '../../shared/schemas/game';
import { sanitizeSlidesForPlayer } from '../../shared/schemas/sanitizer';
import type {
  PointsMode,
  QuizContent,
  SelectMode,
  SlideContent,
  SlideDraft,
  SlideType,
  TimeLimit,
} from '../../shared/schemas/slide';
import type { QuizRow, SlideRow } from '../../shared/types/database';
import { validateQuiz } from '../../shared/validation/quiz-validation';
import {
  buildPublicGamePayload,
  generateGamePin,
  shuffleArray,
  type DbGameRow,
  type DbTeamRow,
} from '../_lib/game-helpers';
import { getAdminClient, requireHostUser, sendError } from '../_lib/supabase-admin';

function mapDbSlide(row: SlideRow): SlideDraft {
  return {
    id: row.id,
    quizId: row.quiz_id,
    position: row.position,
    type: row.type as SlideType,
    title: row.title,
    mediaUrl: row.media_url,
    mediaReveal: row.media_reveal,
    timeLimit: row.time_limit as TimeLimit,
    pointsMode: row.points_mode as PointsMode,
    selectMode: row.select_mode as SelectMode,
    content: row.content as unknown as SlideContent,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Use POST.');
    return;
  }

  const parsed = createGameRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'INVALID_REQUEST', parsed.error.issues[0]?.message ?? 'Invalid payload.');
    return;
  }

  const supabase = getAdminClient();
  const user = await requireHostUser(req, supabase);
  if (!user) {
    sendError(res, 401, 'UNAUTHORIZED', 'Host authentication required.');
    return;
  }

  const { quizId, options } = parsed.data;

  const { data: quizData, error: quizErr } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .eq('owner_id', user.id)
    .single();

  if (quizErr || !quizData) {
    sendError(res, 404, 'QUIZ_NOT_FOUND', 'Quiz not found.');
    return;
  }

  const quizRow = quizData as QuizRow;

  const { data: slideRows, error: slidesErr } = await supabase
    .from('slides')
    .select('*')
    .eq('quiz_id', quizId)
    .order('position', { ascending: true });

  if (slidesErr || !slideRows) {
    sendError(res, 500, 'SLIDES_FETCH_FAILED', 'Could not load quiz slides.');
    return;
  }

  let slides = slideRows.map((row) => mapDbSlide(row as SlideRow));
  const validation = validateQuiz(slides);
  if (!validation.valid) {
    sendError(res, 400, 'INVALID_QUIZ', 'Fix incomplete slides before hosting.');
    return;
  }

  if (options.randomizeQuestions) {
    slides = shuffleArray(slides).map((s, idx) => ({ ...s, position: idx }));
  }

  if (options.randomizeAnswers) {
    slides = slides.map((slide) => {
      if (slide.type === 'quiz' || slide.type === 'poll') {
        const content = slide.content as QuizContent;
        return {
          ...slide,
          content: { options: shuffleArray(content.options) },
        };
      }
      return slide;
    });
  }

  const publicSlides = sanitizeSlidesForPlayer(slides);

  let createdGame: DbGameRow | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const pin = generateGamePin();
    const { data, error } = await supabase
      .from('games')
      .insert({
        pin,
        host_id: user.id,
        quiz_id: quizRow.id,
        mode: options.mode,
        state: 'lobby',
        current_slide_index: 0,
        settings: options,
        theme_id: quizRow.theme_id,
        quiz_title: quizRow.title.trim() || 'Untitled quiz',
        max_players: options.maxPlayers,
        public_slides: publicSlides,
      })
      .select('*')
      .single();

    if (!error && data) {
      createdGame = data as DbGameRow;
      break;
    }
  }

  if (!createdGame) {
    sendError(res, 500, 'GAME_CREATE_FAILED', 'Unable to allocate unique Game PIN.');
    return;
  }

  const { error: snapErr } = await supabase.from('game_snapshots').insert({
    game_id: createdGame.id,
    host_id: user.id,
    authoritative_slides: slides,
  });

  if (snapErr) {
    await supabase.from('games').delete().eq('id', createdGame.id);
    sendError(res, 500, 'SNAPSHOT_FAILED', 'Unable to freeze authoritative quiz snapshot.');
    return;
  }

  let createdTeams: DbTeamRow[] | undefined;
  if (options.mode === 'team') {
    const teamRowsToInsert = options.teams.map((t, idx) => ({
      game_id: createdGame.id,
      name: t.name,
      color_hex: t.colorHex,
      position: idx,
    }));
    const { data: teamData, error: teamErr } = await supabase
      .from('teams')
      .insert(teamRowsToInsert)
      .select('*');

    if (teamErr) {
      await supabase.from('games').delete().eq('id', createdGame.id);
      sendError(res, 500, 'TEAMS_FAILED', 'Unable to create game teams.');
      return;
    }
    createdTeams = (teamData ?? []) as DbTeamRow[];
  }

  res.status(201).json({
    game: buildPublicGamePayload(createdGame, [], 0, { teams: createdTeams }),
  });
}

