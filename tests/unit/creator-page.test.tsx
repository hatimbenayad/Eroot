import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/features/auth/auth-context';
import { CreatorPage } from '@/features/creator/CreatorPage';
import { createDefaultSlide, type QuizDraft } from '@shared/schemas/slide';
import type { User } from '@supabase/supabase-js';

const mockQuiz: QuizDraft = {
  id: 'quiz-abc',
  ownerId: 'host-1',
  title: 'Geography Warmup',
  description: '',
  visibility: 'private',
  themeId: 'indigo-stage',
  coverImageUrl: null,
  language: 'en',
  musicPreset: 'chill-pulse',
  isValid: false,
  isPublished: false,
};

const saveMock = vi.fn().mockResolvedValue({ isValid: true, isPublished: true });

vi.mock('@/features/creator/api', () => ({
  fetchQuizWithSlides: vi.fn(async () => ({
    quiz: mockQuiz,
    slides: [createDefaultSlide('quiz-abc', 0, 'quiz')],
  })),
  saveQuizAndSlides: (...args: unknown[]) => saveMock(...args),
  uploadQuizMedia: vi.fn(async () => 'https://example.com/media.png'),
}));

function renderCreator() {
  return render(
    <AuthContext.Provider
      value={{
        user: { id: 'host-1', email: 'host@example.com' } as User,
        session: null,
        loading: false,
        isConfigured: true,
        signIn: async () => ({ error: null }),
        signUp: async () => ({ error: null }),
        signOut: async () => {},
      }}
    >
      <MemoryRouter initialEntries={['/creator/quiz-abc']}>
        <Routes>
          <Route path="/creator/:quizId" element={<CreatorPage />} />
          <Route path="/library" element={<div>Library Screen</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('CreatorPage integration (U2)', () => {
  beforeEach(() => {
    saveMock.mockClear();
  });

  it('renders three-pane layout with inline purple tooltips and blocks invalid publish', async () => {
    const user = userEvent.setup();
    renderCreator();

    expect(await screen.findByDisplayValue('Geography Warmup')).toBeInTheDocument();
    expect(screen.getByText("You haven't added a question.")).toBeInTheDocument();
    expect(screen.getByText("You haven't added Answer 1.")).toBeInTheDocument();
    expect(screen.getByLabelText('Incomplete slide')).toBeInTheDocument();

    // No AI or Upgrade buttons
    expect(screen.queryByText(/Upgrade/i)).toBeNull();
    expect(screen.queryByText(/Generate/i)).toBeNull();

    // Attempt invalid Save
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Fix highlighted slides before publishing.')).toBeInTheDocument();
    expect(saveMock).not.toHaveBeenCalled();

    // Fill question, answers 1 & 2, and mark answer 1 correct
    await user.type(screen.getByPlaceholderText('Start typing your question'), 'Capital of Japan?');
    await user.type(screen.getByLabelText('Answer 1'), 'Tokyo');
    await user.type(screen.getByLabelText('Answer 2'), 'Osaka');
    await user.click(screen.getByRole('button', { name: 'Mark answer 1 as correct' }));

    // Purple invalid badge disappears
    expect(screen.queryByLabelText('Incomplete slide')).toBeNull();

    // Save now succeeds
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(saveMock).toHaveBeenCalledTimes(1);

    // Switch theme and open Preview modal
    await user.click(screen.getByRole('tab', { name: /Themes/i }));
    await user.click(screen.getByRole('button', { name: /Ocean Current/i }));
    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.getByText(/Geography Warmup — Preview/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Capital of Japan?' })).toBeInTheDocument();
  });
});

