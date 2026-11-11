import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createChallengeRequestSchema,
  manageChallengeRequestSchema,
} from '../../shared/schemas/game';
import { sanitizeSlidesForPlayer } from '../../shared/schemas/sanitizer';
import type {
  PointsMode,
  SelectMode,
  SlideContent,
  SlideDraft,
  SlideType,
  TimeLimit,
} from '../../shared/schemas/slide';
import type { QuizRow, SlideRow } from '../../shared/types/database';
import { validateQuiz } from '../../shared/validation/quiz-validation';
import { generateGamePin } from '../_lib/game-helpers';
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
  const supabase = getAdminClient();
  const user = await requireHostUser(req, supabase);
  if (!user) {
    sendError(res, 401, 'UNAUTHORIZED', 'Host authentication required.');
    return;
  }

  if (req.method === 'GET') {
    const { data: games, error } = await supabase
      .from('games')
      .select(
        'id, pin, quiz_title, state, challenge_deadline, challenge_timer_enabled, challenge_accuracy_only, max_players, created_at, players(id, nickname, identifier, total_score, is_kicked)'
      )
      .eq('host_id', user.id)
      .eq('mode', 'challenge')
      .order('created_at', { ascending: false });

    if (error) {
      sendError(res, 500, 'CHALLENGES_FETCH_FAILED', error.message);
      return;
    }

    res.status(200).json({ challenges: games ?? [] });
    return;
  }

  if (req.method === 'POST') {
    const parsed = createChallengeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, 'INVALID_REQUEST', parsed.error.issues[0]?.message ?? 'Invalid input.');
      return;
    }

    const {
      quizId,
      deadline,
      timerEnabled,
      accuracyOnly,
      requirePlayerIdentifier,
      playerIdentifierLabel,
      friendlyNicknames,
      maxPlayers,
    } = parsed.data;

    if (Date.parse(deadline) <= Date.now()) {
      sendError(res, 400, 'INVALID_DEADLINE', 'Deadline must be in the future.');
      return;
    }

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
      sendError(res, 500, 'SLIDES_FETCH_FAILED', 'Unable to load slides.');
      return;
    }

    const slides = slideRows.map((row) => mapDbSlide(row as SlideRow));
    if (!validateQuiz(slides).valid) {
      sendError(res, 400, 'INVALID_QUIZ', 'Fix invalid slides before assigning.');
      return;
    }

    const publicSlides = sanitizeSlidesForPlayer(slides);

    let createdId: string | null = null;
    let createdPin = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      const pin = generateGamePin();
      const { data, error } = await supabase
        .from('games')
        .insert({
          pin,
          host_id: user.id,
          quiz_id: quizRow.id,
          mode: 'challenge',
          state: 'question_active',
          current_slide_index: 0,
          settings: {
            mode: 'classic',
            requirePlayerIdentifier,
            playerIdentifierLabel,
            friendlyNicknames,
            maxPlayers,
          },
          theme_id: quizRow.theme_id,
          quiz_title: quizRow.title.trim() || 'Assigned Challenge',
          max_players: maxPlayers,
          public_slides: publicSlides,
          challenge_deadline: deadline,
          challenge_timer_enabled: timerEnabled,
          challenge_accuracy_only: accuracyOnly,
          started_at: new Date().toISOString(),
        })
        .select('id, pin')
        .single();

      if (!error && data) {
        createdId = data.id;
        createdPin = data.pin;
        break;
      }
    }

    if (!createdId) {
      sendError(res, 500, 'CREATE_FAILED', 'Unable to create challenge.');
      return;
    }

    await supabase.from('game_snapshots').insert({
      game_id: createdId,
      host_id: user.id,
      authoritative_slides: slides,
    });

    await supabase.from('reports').insert({
      game_id: createdId,
      host_id: user.id,
      title: `${quizRow.title.trim() || 'Assigned Challenge'} (Challenge)`,
      mode: 'challenge',
      summary_cache: { playerCount: 0, questionCount: slides.length },
    });

    res.status(201).json({ gameId: createdId, pin: createdPin });
    return;
  }

  if (req.method === 'PATCH') {
    const parsed = manageChallengeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, 'INVALID_REQUEST', parsed.error.issues[0]?.message ?? 'Invalid input.');
      return;
    }

    const { gameId, deadline, endEarly, removePlayerId } = parsed.data;
    const { data: game } = await supabase
      .from('games')
      .select('id')
      .eq('id', gameId)
      .eq('host_id', user.id)
      .eq('mode', 'challenge')
      .maybeSingle();

    if (!game) {
      sendError(res, 404, 'NOT_FOUND', 'Challenge not found.');
      return;
    }

    if (removePlayerId) {
      await supabase
        .from('players')
        .update({ is_kicked: true })
        .eq('id', removePlayerId)
        .eq('game_id', gameId);
    }

    const patch: Record<string, unknown> = {};
    if (deadline) patch.challenge_deadline = deadline;
    if (endEarly) {
      patch.state = 'ended';
      patch.ended_at = new Date().toISOString();
    }

    if (Object.keys(patch).length > 0) {
      await supabase.from('games').update(patch).eq('id', gameId);
    }

    res.status(200).json({ ok: true });
    return;
  }

  res.setHeader('Allow', 'GET, POST, PATCH');
  sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Method not allowed.');
}

