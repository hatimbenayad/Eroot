import { beforeEach, describe, expect, it } from 'vitest';
import { useCreatorStore } from '@/features/creator/store';
import { createDefaultSlide, type QuizDraft } from '@shared/schemas/slide';

const mockQuiz: QuizDraft = {
  id: 'quiz-1',
  ownerId: 'user-1',
  title: 'Sample Quiz',
  description: '',
  visibility: 'private',
  themeId: 'indigo-stage',
  coverImageUrl: null,
  language: 'en',
  musicPreset: 'chill-pulse',
  isValid: false,
  isPublished: false,
};

describe('useCreatorStore', () => {
  beforeEach(() => {
    const starter = createDefaultSlide('quiz-1', 0, 'quiz');
    useCreatorStore.getState().hydrate(mockQuiz, [starter]);
  });

  it('adds, duplicates, reorders, and deletes slides while keeping positions normalized', () => {
    const store = useCreatorStore.getState();
    store.addSlide('true_false');
    expect(useCreatorStore.getState().slides).toHaveLength(2);

    const secondId = useCreatorStore.getState().slides[1]!.id;
    useCreatorStore.getState().duplicateSlide(secondId);
    expect(useCreatorStore.getState().slides).toHaveLength(3);

    const firstId = useCreatorStore.getState().slides[0]!.id;
    const thirdId = useCreatorStore.getState().slides[2]!.id;
    useCreatorStore.getState().reorderSlides(firstId, thirdId);

    const reordered = useCreatorStore.getState().slides;
    expect(reordered.map((s) => s.position)).toEqual([0, 1, 2]);
    expect(reordered[2]!.id).toBe(firstId);

    useCreatorStore.getState().deleteSlide(firstId);
    expect(useCreatorStore.getState().slides).toHaveLength(2);
    expect(useCreatorStore.getState().slides.map((s) => s.position)).toEqual([0, 1]);
  });

  it('applies selected time limit to all slides', () => {
    useCreatorStore.getState().addSlide('poll');
    useCreatorStore.getState().applyTimeLimitToAll(60);

    const allLimits = useCreatorStore.getState().slides.map((s) => s.timeLimit);
    expect(allLimits).toEqual([60, 60]);
  });
});

