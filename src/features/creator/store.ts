import { create } from 'zustand';
import {
  createDefaultSlide,
  createSlideId,
  isMediaSlideType,
  isOpinionSlideType,
  type PointsMode,
  type QuizContent,
  type QuizDraft,
  type SlideDraft,
  type SlideType,
  type TimeLimit,
} from '@shared/schemas/slide';
import { validateQuiz, type QuizValidationSummary } from '@shared/validation/quiz-validation';

export type SaveStatus = 'saved' | 'dirty' | 'saving' | 'error';

export function convertSlideType(slide: SlideDraft, nextType: SlideType): SlideDraft {
  if (slide.type === nextType) return slide;

  const base = createDefaultSlide(slide.quizId, slide.position, nextType);
  base.id = slide.id;
  base.title = slide.title;
  base.mediaUrl = slide.mediaUrl;
  base.mediaReveal = slide.mediaReveal;
  base.timeLimit = slide.timeLimit;
  const nonScored = isOpinionSlideType(nextType) || isMediaSlideType(nextType);
  base.pointsMode = nonScored ? 'none' : slide.pointsMode === 'none' ? 'standard' : slide.pointsMode;

  // Preserve option text when converting between quiz and poll
  if (
    (slide.type === 'quiz' && nextType === 'poll') ||
    (slide.type === 'poll' && nextType === 'quiz')
  ) {
    const oldOptions = (slide.content as QuizContent).options ?? [];
    if (nextType === 'poll') {
      base.content = {
        options: oldOptions.slice(0, 4).map((o) => ({
          id: o.id,
          text: o.text,
          imageUrl: o.imageUrl ?? null,
        })),
      };
    } else {
      base.content = {
        options: oldOptions.map((o, idx) => ({
          id: o.id,
          text: o.text,
          imageUrl: o.imageUrl ?? null,
          isCorrect: idx === 0,
        })),
      };
    }
  }

  return base;
}

interface CreatorState {
  quiz: QuizDraft | null;
  slides: SlideDraft[];
  activeSlideId: string | null;
  saveStatus: SaveStatus;
  saveError: string | null;
  validation: QuizValidationSummary;

  hydrate: (quiz: QuizDraft, slides: SlideDraft[]) => void;
  setActiveSlide: (slideId: string) => void;
  updateQuizMeta: (patch: Partial<QuizDraft>) => void;
  updateSlide: (slideId: string, updater: (slide: SlideDraft) => SlideDraft) => void;
  addSlide: (type?: SlideType) => void;
  appendSlides: (newSlides: SlideDraft[]) => void;
  duplicateSlide: (slideId: string) => void;
  deleteSlide: (slideId: string) => void;
  reorderSlides: (activeId: string, overId: string) => void;
  moveSlideByOffset: (slideId: string, delta: -1 | 1) => void;
  changeSlideType: (slideId: string, nextType: SlideType) => void;
  applyTimeLimitToAll: (timeLimit: TimeLimit) => void;
  setPointsMode: (slideId: string, mode: PointsMode) => void;
  setSaveStatus: (status: SaveStatus, error?: string | null) => void;
}

function recomputeValidation(slides: SlideDraft[]): QuizValidationSummary {
  return validateQuiz(slides);
}

export const useCreatorStore = create<CreatorState>((set, get) => ({
  quiz: null,
  slides: [],
  activeSlideId: null,
  saveStatus: 'saved',
  saveError: null,
  validation: { valid: false, firstInvalidSlideId: null, bySlideId: {} },

  hydrate: (quiz, slides) => {
    const ordered = [...slides].sort((a, b) => a.position - b.position);
    set({
      quiz,
      slides: ordered,
      activeSlideId: ordered[0]?.id ?? null,
      saveStatus: 'saved',
      saveError: null,
      validation: recomputeValidation(ordered),
    });
  },

  setActiveSlide: (slideId) => set({ activeSlideId: slideId }),

  updateQuizMeta: (patch) => {
    const { quiz } = get();
    if (!quiz) return;
    set({
      quiz: { ...quiz, ...patch },
      saveStatus: 'dirty',
      saveError: null,
    });
  },

  updateSlide: (slideId, updater) => {
    const { slides } = get();
    const nextSlides = slides.map((s) => (s.id === slideId ? updater(s) : s));
    set({
      slides: nextSlides,
      saveStatus: 'dirty',
      saveError: null,
      validation: recomputeValidation(nextSlides),
    });
  },

  addSlide: (type = 'quiz') => {
    const { quiz, slides, activeSlideId } = get();
    if (!quiz) return;

    const activeIdx = slides.findIndex((s) => s.id === activeSlideId);
    const insertAt = activeIdx >= 0 ? activeIdx + 1 : slides.length;
    const newSlide = createDefaultSlide(quiz.id, insertAt, type);

    const nextSlides = [
      ...slides.slice(0, insertAt),
      newSlide,
      ...slides.slice(insertAt),
    ].map((s, idx) => ({ ...s, position: idx }));

    set({
      slides: nextSlides,
      activeSlideId: newSlide.id,
      saveStatus: 'dirty',
      saveError: null,
      validation: recomputeValidation(nextSlides),
    });
  },

  appendSlides: (incoming) => {
    const { quiz, slides } = get();
    if (!quiz || incoming.length === 0) return;

    const cloned = incoming.map((s) => ({
      ...s,
      id: createSlideId(),
      quizId: quiz.id,
      content: structuredClone(s.content),
    }));

    const nextSlides = [...slides, ...cloned].map((s, idx) => ({ ...s, position: idx }));
    set({
      slides: nextSlides,
      activeSlideId: cloned[0]?.id ?? get().activeSlideId,
      saveStatus: 'dirty',
      saveError: null,
      validation: recomputeValidation(nextSlides),
    });
  },

  duplicateSlide: (slideId) => {
    const { slides } = get();
    const index = slides.findIndex((s) => s.id === slideId);
    if (index === -1) return;

    const source = slides[index]!;
    const clonedContent = structuredClone(source.content);
    if ('options' in clonedContent && Array.isArray(clonedContent.options)) {
      clonedContent.options = clonedContent.options.map((opt) => ({
        ...opt,
        id: createSlideId(),
      }));
    }

    const duplicate: SlideDraft = {
      ...source,
      id: createSlideId(),
      content: clonedContent,
    };

    const nextSlides = [
      ...slides.slice(0, index + 1),
      duplicate,
      ...slides.slice(index + 1),
    ].map((s, idx) => ({ ...s, position: idx }));

    set({
      slides: nextSlides,
      activeSlideId: duplicate.id,
      saveStatus: 'dirty',
      saveError: null,
      validation: recomputeValidation(nextSlides),
    });
  },

  deleteSlide: (slideId) => {
    const { slides, activeSlideId } = get();
    if (slides.length <= 1) return;

    const index = slides.findIndex((s) => s.id === slideId);
    if (index === -1) return;

    const nextSlides = slides
      .filter((s) => s.id !== slideId)
      .map((s, idx) => ({ ...s, position: idx }));

    const nextActiveId =
      activeSlideId === slideId
        ? (nextSlides[Math.max(0, index - 1)]?.id ?? nextSlides[0]?.id ?? null)
        : activeSlideId;

    set({
      slides: nextSlides,
      activeSlideId: nextActiveId,
      saveStatus: 'dirty',
      saveError: null,
      validation: recomputeValidation(nextSlides),
    });
  },

  reorderSlides: (activeId, overId) => {
    if (activeId === overId) return;
    const { slides } = get();
    const oldIndex = slides.findIndex((s) => s.id === activeId);
    const newIndex = slides.findIndex((s) => s.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const updated = [...slides];
    const [moved] = updated.splice(oldIndex, 1);
    if (!moved) return;
    updated.splice(newIndex, 0, moved);

    const normalized = updated.map((s, idx) => ({ ...s, position: idx }));
    set({
      slides: normalized,
      saveStatus: 'dirty',
      saveError: null,
      validation: recomputeValidation(normalized),
    });
  },

  moveSlideByOffset: (slideId, delta) => {
    const { slides } = get();
    const index = slides.findIndex((s) => s.id === slideId);
    const target = index + delta;
    if (index === -1 || target < 0 || target >= slides.length) return;
    const targetSlide = slides[target];
    if (!targetSlide) return;
    get().reorderSlides(slideId, targetSlide.id);
  },

  changeSlideType: (slideId, nextType) => {
    get().updateSlide(slideId, (slide) => convertSlideType(slide, nextType));
  },

  applyTimeLimitToAll: (timeLimit) => {
    const { slides } = get();
    const nextSlides = slides.map((s) => ({ ...s, timeLimit }));
    set({
      slides: nextSlides,
      saveStatus: 'dirty',
      saveError: null,
    });
  },

  setPointsMode: (slideId, mode) => {
    get().updateSlide(slideId, (slide) => ({ ...slide, pointsMode: mode }));
  },

  setSaveStatus: (saveStatus, saveError = null) => set({ saveStatus, saveError }),
}));

