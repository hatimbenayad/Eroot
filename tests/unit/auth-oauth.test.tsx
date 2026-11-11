import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/features/auth/auth-context';
import { AuthPage } from '@/features/auth/AuthPage';

describe('Google OAuth on AuthPage (U5)', () => {
  it('invokes signInWithGoogle preserving redirect path', async () => {
    const user = userEvent.setup();
    const signInWithGoogle = vi.fn().mockResolvedValue({ error: null });

    render(
      <AuthContext.Provider
        value={{
          user: null,
          session: null,
          loading: false,
          isConfigured: true,
          signIn: async () => ({ error: null }),
          signUp: async () => ({ error: null }),
          signInWithGoogle,
          signOut: async () => {},
        }}
      >
        <MemoryRouter initialEntries={['/auth?redirect=%2Fcreator%2F123']}>
          <AuthPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await user.click(screen.getByRole('button', { name: /Continue with Google/i }));
    expect(signInWithGoogle).toHaveBeenCalledWith('/creator/123');
  });
});

