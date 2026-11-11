import { describe, expect, it } from 'vitest';
import { signInSchema, signUpSchema } from '@/features/auth/schemas';

describe('Auth validation schemas', () => {
  it('rejects invalid email and short password on sign up', () => {
    const res = signUpSchema.safeParse({
      displayName: 'Hatim',
      email: 'not-an-email',
      password: 'short',
    });
    expect(res.success).toBe(false);
  });

  it('accepts valid credentials on sign in and sign up', () => {
    expect(
      signInSchema.safeParse({ email: 'host@example.com', password: 'password123' }).success
    ).toBe(true);
    expect(
      signUpSchema.safeParse({
        displayName: 'Host One',
        email: 'host@example.com',
        password: 'password123',
      }).success
    ).toBe(true);
  });
});

