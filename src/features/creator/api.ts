import { getSupabaseClient } from '@/lib/supabase';
import {
  createDefaultSlide,
  type MusicPreset,
  type PointsMode,
  type QuizDraft,
  type SelectMode,
  type SlideContent,
  type SlideDraft,
  type SlideType,
  type TimeLimit,
} from '@shared/schemas/slide';
import type { QuizRow, SlideRow } from '@shared/types/database';
import { validateQuiz } from '@shared/validation/quiz-validation';

export interface LibraryQuizSummary {
  quiz: QuizDraft;
  slideCount: number;
  updatedAt: string;
}

function mapQuizRow(row: QuizRow): QuizDraft {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    visibility: row.visibility,
    themeId: row.theme_id,
    coverImageUrl: row.cover_image_url,
    language: row.language,
    musicPreset: (row.music_preset as MusicPreset) || 'chill-pulse',
    isValid: row.is_valid,
    isPublished: row.is_published,
  };
}

function mapSlideRow(row: SlideRow): SlideDraft {
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

export async function fetchLibraryQuizzes(ownerId: string): Promise<LibraryQuizSummary[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data: quizzes, error } = await supabase
    .from('quizzes')
    .select('*, slides(id)')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (quizzes ?? []).map((row) => {
    const raw = row as QuizRow & { slides?: { id: string }[] };
    return {
      quiz: mapQuizRow(raw),
      slideCount: Array.isArray(raw.slides) ? raw.slides.length : 0,
      updatedAt: raw.updated_at,
    };
  });
}

export async function createNewQuiz(ownerId: string): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      owner_id: ownerId,
      title: '',
      description: '',
      visibility: 'private',
      theme_id: 'indigo-stage',
      language: 'en',
      music_preset: 'chill-pulse',
      is_valid: false,
      is_published: false,
    })
    .select('*')
    .single();

  if (quizError || !quiz) {
    throw new Error(quizError?.message ?? 'Failed to create quiz.');
  }

  const starterSlide = createDefaultSlide(quiz.id, 0, 'quiz');
  const { error: slideError } = await supabase.from('slides').insert({
    id: starterSlide.id,
    quiz_id: quiz.id,
    position: starterSlide.position,
    type: starterSlide.type,
    title: starterSlide.title,
    media_url: starterSlide.mediaUrl,
    media_reveal: starterSlide.mediaReveal,
    time_limit: starterSlide.timeLimit,
    points_mode: starterSlide.pointsMode,
    select_mode: starterSlide.selectMode,
    content: starterSlide.content,
  });

  if (slideError) {
    throw new Error(slideError.message);
  }

  return quiz.id;
}

export async function fetchQuizWithSlides(
  quizId: string
): Promise<{ quiz: QuizDraft; slides: SlideDraft[] } | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: quizRow, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single();

  if (quizError || !quizRow) {
    return null;
  }

  const { data: slideRows, error: slidesError } = await supabase
    .from('slides')
    .select('*')
    .eq('quiz_id', quizId)
    .order('position', { ascending: true });

  if (slidesError) {
    throw new Error(slidesError.message);
  }

  const slides = (slideRows ?? []).map((row) => mapSlideRow(row as SlideRow));
  return {
    quiz: mapQuizRow(quizRow as QuizRow),
    slides: slides.length > 0 ? slides : [createDefaultSlide(quizId, 0, 'quiz')],
  };
}

export async function saveQuizAndSlides(
  quiz: QuizDraft,
  slides: SlideDraft[],
  options?: { publish?: boolean }
): Promise<{ isValid: boolean; isPublished: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const validation = validateQuiz(slides);
  const nextIsValid = validation.valid;
  const nextIsPublished = options?.publish
    ? nextIsValid
    : nextIsValid
      ? quiz.isPublished
      : false;

  const { error: quizError } = await supabase
    .from('quizzes')
    .update({
      title: quiz.title,
      description: quiz.description,
      visibility: quiz.visibility,
      theme_id: quiz.themeId,
      cover_image_url: quiz.coverImageUrl,
      language: quiz.language,
      music_preset: quiz.musicPreset,
      is_valid: nextIsValid,
      is_published: nextIsPublished,
    })
    .eq('id', quiz.id);

  if (quizError) {
    throw new Error(quizError.message);
  }

  const normalizedSlides = slides.map((s, idx) => ({
    id: s.id,
    quiz_id: quiz.id,
    position: idx,
    type: s.type,
    title: s.title,
    media_url: s.mediaUrl,
    media_reveal: s.mediaReveal,
    time_limit: s.timeLimit,
    points_mode: s.pointsMode,
    select_mode: s.selectMode,
    content: s.content,
  }));

  if (normalizedSlides.length > 0) {
    const { error: upsertError } = await supabase
      .from('slides')
      .upsert(normalizedSlides, { onConflict: 'id' });
    if (upsertError) {
      throw new Error(upsertError.message);
    }
  }

  const { data: existingIds, error: listErr } = await supabase
    .from('slides')
    .select('id')
    .eq('quiz_id', quiz.id);

  if (!listErr && existingIds) {
    const currentIdSet = new Set(normalizedSlides.map((s) => s.id));
    const orphanIds = existingIds
      .map((r) => (r as { id: string }).id)
      .filter((id) => !currentIdSet.has(id));

    if (orphanIds.length > 0) {
      await supabase.from('slides').delete().in('id', orphanIds);
    }
  }

  return { isValid: nextIsValid, isPublished: nextIsPublished };
}

export async function duplicateQuizById(quizId: string, ownerId: string): Promise<string> {
  const existing = await fetchQuizWithSlides(quizId);
  if (!existing) {
    throw new Error('Quiz not found.');
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data: clonedQuiz, error: quizErr } = await supabase
    .from('quizzes')
    .insert({
      owner_id: ownerId,
      title: existing.quiz.title ? `${existing.quiz.title} (Copy)` : 'Untitled quiz (Copy)',
      description: existing.quiz.description,
      visibility: 'private',
      theme_id: existing.quiz.themeId,
      cover_image_url: existing.quiz.coverImageUrl,
      language: existing.quiz.language,
      music_preset: existing.quiz.musicPreset,
      is_valid: existing.quiz.isValid,
      is_published: false,
    })
    .select('*')
    .single();

  if (quizErr || !clonedQuiz) {
    throw new Error(quizErr?.message ?? 'Failed to duplicate quiz.');
  }

  const clonedSlides = existing.slides.map((slide, idx) => {
    const fresh = createDefaultSlide(clonedQuiz.id, idx, slide.type);
    return {
      id: fresh.id,
      quiz_id: clonedQuiz.id,
      position: idx,
      type: slide.type,
      title: slide.title,
      media_url: slide.mediaUrl,
      media_reveal: slide.mediaReveal,
      time_limit: slide.timeLimit,
      points_mode: slide.pointsMode,
      select_mode: slide.selectMode,
      content: slide.content,
    };
  });

  if (clonedSlides.length > 0) {
    const { error: slidesErr } = await supabase.from('slides').insert(clonedSlides);
    if (slidesErr) {
      throw new Error(slidesErr.message);
    }
  }

  return clonedQuiz.id;
}

export async function deleteQuizById(quizId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
  if (error) {
    throw new Error(error.message);
  }
}

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function uploadQuizMedia(
  ownerId: string,
  quizId: string,
  file: File
): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Only PNG, JPG, WebP, or GIF images are supported.');
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image must be 5 MB or smaller.');
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `${ownerId}/${quizId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('quiz-media')
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from('quiz-media').getPublicUrl(storagePath);
  const publicUrl = data.publicUrl;

  await supabase.from('media_assets').insert({
    owner_id: ownerId,
    storage_path: storagePath,
    public_url: publicUrl,
    mime_type: file.type,
    size_bytes: file.size,
  });

  return publicUrl;
}

