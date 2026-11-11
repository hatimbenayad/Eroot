import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().trim().email('auth.errors.invalidEmail'),
  password: z.string().min(8, 'auth.errors.passwordMin'),
});

export const signUpSchema = z.object({
  displayName: z.string().trim().max(60).optional(),
  email: z.string().trim().email('auth.errors.invalidEmail'),
  password: z.string().min(8, 'auth.errors.passwordMin'),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;

