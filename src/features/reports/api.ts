import { getSupabaseClient } from '@/lib/supabase';
import {
  computeReportAnalytics,
  type ReportAnalytics,
  type ReportAnswerRow,
  type ReportPlayerRow,
} from '@shared/reports/analytics';
import { createDefaultSlide, type SlideDraft } from '@shared/schemas/slide';

export interface ReportSummaryItem {
  id: string;
  gameId: string;
  quizId: string | null;
  title: string;
  mode: 'live' | 'challenge';
  themeId: string;
  playerCount: number;
  questionCount: number;
  createdAt: string;
}

export interface ReportDetailData {
  id: string;
  gameId: string;
  quizId: string | null;
  title: string;
  mode: 'live' | 'challenge';
  themeId: string;
  createdAt: string;
  analytics: ReportAnalytics;
}

export async function fetchReportsList(hostId: string): Promise<ReportSummaryItem[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('reports')
    .select('id, game_id, title, mode, summary_cache, created_at, games(quiz_id, theme_id)')
    .eq('host_id', hostId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      game_id: string;
      title: string;
      mode: 'live' | 'challenge';
      summary_cache: { playerCount?: number; questionCount?: number } | null;
      created_at: string;
      games:
        | { quiz_id: string | null; theme_id: string }
        | { quiz_id: string | null; theme_id: string }[]
        | null;
    };
    const gameMeta = Array.isArray(r.games) ? r.games[0] ?? null : r.games;
    return {
      id: r.id,
      gameId: r.game_id,
      quizId: gameMeta?.quiz_id ?? null,
      title: r.title,
      mode: r.mode,
      themeId: gameMeta?.theme_id ?? 'indigo-stage',
      playerCount: r.summary_cache?.playerCount ?? 0,
      questionCount: r.summary_cache?.questionCount ?? 0,
      createdAt: r.created_at,
    };
  });
}

export async function renameReportById(reportId: string, title: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const trimmed = title.trim();
  if (!trimmed) throw new Error('Report title cannot be empty.');
  const { error } = await supabase.from('reports').update({ title: trimmed }).eq('id', reportId);
  if (error) throw new Error(error.message);
}

export async function deleteReportById(reportId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { error } = await supabase.from('reports').delete().eq('id', reportId);
  if (error) throw new Error(error.message);
}

export async function fetchReportDetail(reportId: string): Promise<ReportDetailData | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: reportRow, error: repErr } = await supabase
    .from('reports')
    .select('id, game_id, title, mode, created_at, games(quiz_id, theme_id)')
    .eq('id', reportId)
    .single();

  if (repErr || !reportRow) return null;

  const rep = reportRow as unknown as {
    id: string;
    game_id: string;
    title: string;
    mode: 'live' | 'challenge';
    created_at: string;
    games:
      | { quiz_id: string | null; theme_id: string }
      | { quiz_id: string | null; theme_id: string }[]
      | null;
  };
  const gameMeta = Array.isArray(rep.games) ? rep.games[0] ?? null : rep.games;

  const [{ data: snapData }, { data: playersData }, { data: answersData }] = await Promise.all([
    supabase
      .from('game_snapshots')
      .select('authoritative_slides')
      .eq('game_id', rep.game_id)
      .single(),
    supabase
      .from('players')
      .select('id, nickname, identifier, total_score, streak, is_kicked, joined_at')
      .eq('game_id', rep.game_id),
    supabase
      .from('answers')
      .select('id, player_id, slide_id, payload, response_ms, points, is_correct')
      .eq('game_id', rep.game_id),
  ]);

  const slides = (snapData?.authoritative_slides ?? []) as SlideDraft[];
  const players = (playersData ?? []) as ReportPlayerRow[];
  const answers = (answersData ?? []) as ReportAnswerRow[];

  return {
    id: rep.id,
    gameId: rep.game_id,
    quizId: gameMeta?.quiz_id ?? null,
    title: rep.title,
    mode: rep.mode,
    themeId: gameMeta?.theme_id ?? 'indigo-stage',
    createdAt: rep.created_at,
    analytics: computeReportAnalytics(slides, players, answers),
  };
}

export async function createDifficultQuestionsQuiz(
  hostId: string,
  reportTitle: string,
  themeId: string,
  difficultSlides: SlideDraft[]
): Promise<string> {
  if (difficultSlides.length < 3) {
    throw new Error('At least 3 difficult questions are required.');
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data: quiz, error: quizErr } = await supabase
    .from('quizzes')
    .insert({
      owner_id: hostId,
      title: `${reportTitle} — Difficult Questions`,
      description: 'Auto-copied difficult questions (<35% correct) for review.',
      visibility: 'private',
      theme_id: themeId,
      language: 'en',
      music_preset: 'chill-pulse',
      is_valid: true,
      is_published: false,
    })
    .select('id')
    .single();

  if (quizErr || !quiz) {
    throw new Error(quizErr?.message ?? 'Unable to create review quiz.');
  }

  const copiedSlides = difficultSlides.map((s, idx) => {
    const fresh = createDefaultSlide(quiz.id, idx, s.type);
    return {
      id: fresh.id,
      quiz_id: quiz.id,
      position: idx,
      type: s.type,
      title: s.title,
      media_url: s.mediaUrl,
      media_reveal: s.mediaReveal,
      time_limit: s.timeLimit,
      points_mode: s.pointsMode,
      select_mode: s.selectMode,
      content: structuredClone(s.content),
    };
  });

  const { error: slidesErr } = await supabase.from('slides').insert(copiedSlides);
  if (slidesErr) {
    throw new Error(slidesErr.message);
  }

  return quiz.id;
}
