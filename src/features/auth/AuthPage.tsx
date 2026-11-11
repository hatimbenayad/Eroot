import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ErootLogo } from '@/components/eroot/ErootLogo';
import { LanguageSwitcher } from '@/components/eroot/LanguageSwitcher';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/i18n/useTranslation';
import { signInSchema, signUpSchema, type SignInValues, type SignUpValues } from './schemas';
import { useAuth } from './useAuth';

function sanitizeRedirect(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return '/library';
  }
  return raw;
}

export function AuthPage() {
  const { t } = useTranslation();
  const { user, isConfigured, signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = sanitizeRedirect(searchParams.get('redirect'));

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate, redirectPath]);

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  async function handleSignIn(values: SignInValues) {
    setAuthError(null);
    setVerificationNotice(null);
    const result = await signIn(values.email, values.password);
    if (result.error) {
      setAuthError(result.error);
      return;
    }
    navigate(redirectPath, { replace: true });
  }

  async function handleSignUp(values: SignUpValues) {
    setAuthError(null);
    setVerificationNotice(null);
    const result = await signUp(values.email, values.password, values.displayName);
    if (result.error) {
      setAuthError(result.error);
      return;
    }
    if (result.needsEmailConfirmation) {
      setVerificationNotice(t('auth.verificationSent'));
      return;
    }
    navigate(redirectPath, { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Eroot home">
            <ErootLogo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              to="/join"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline"
            >
              {t('nav.joinGame')}
            </Link>
          </div>
        </div>

        {!isConfigured && (
          <Alert variant="info" title={t('common.unconfiguredTitle')}>
            {t('common.unconfiguredDescription')}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t('auth.title')}</CardTitle>
            <CardDescription>{t('auth.subtitle')}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {authError && <Alert variant="error">{authError}</Alert>}
            {verificationNotice && <Alert variant="success">{verificationNotice}</Alert>}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              loading={oauthLoading}
              onClick={async () => {
                setAuthError(null);
                setOauthLoading(true);
                const res = await signInWithGoogle(redirectPath);
                if (res.error) {
                  setAuthError(res.error);
                  setOauthLoading(false);
                }
              }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">or with email</span>
              </div>
            </div>

            <Tabs
              value={mode}
              onValueChange={(value) => {
                setMode(value as 'signin' | 'signup');
                setAuthError(null);
                setVerificationNotice(null);
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">{t('auth.signInTab')}</TabsTrigger>
                <TabsTrigger value="signup">{t('auth.signUpTab')}</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form
                  onSubmit={signInForm.handleSubmit(handleSignIn)}
                  noValidate
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email">{t('auth.emailLabel')}</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      autoComplete="email"
                      placeholder={t('auth.emailPlaceholder')}
                      aria-invalid={Boolean(signInForm.formState.errors.email)}
                      aria-describedby={
                        signInForm.formState.errors.email ? 'signin-email-err' : undefined
                      }
                      {...signInForm.register('email')}
                    />
                    {signInForm.formState.errors.email && (
                      <p id="signin-email-err" className="text-xs font-medium text-violet-700">
                        {t(signInForm.formState.errors.email.message ?? 'auth.errors.invalidEmail')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signin-password">{t('auth.passwordLabel')}</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      autoComplete="current-password"
                      placeholder={t('auth.passwordPlaceholder')}
                      aria-invalid={Boolean(signInForm.formState.errors.password)}
                      aria-describedby={
                        signInForm.formState.errors.password ? 'signin-password-err' : undefined
                      }
                      {...signInForm.register('password')}
                    />
                    {signInForm.formState.errors.password && (
                      <p id="signin-password-err" className="text-xs font-medium text-violet-700">
                        {t(signInForm.formState.errors.password.message ?? 'auth.errors.passwordMin')}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    loading={signInForm.formState.isSubmitting}
                  >
                    {t('auth.submitSignIn')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form
                  onSubmit={signUpForm.handleSubmit(handleSignUp)}
                  noValidate
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name">{t('auth.displayNameLabel')}</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      placeholder={t('auth.displayNamePlaceholder')}
                      {...signUpForm.register('displayName')}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email">{t('auth.emailLabel')}</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      placeholder={t('auth.emailPlaceholder')}
                      aria-invalid={Boolean(signUpForm.formState.errors.email)}
                      aria-describedby={
                        signUpForm.formState.errors.email ? 'signup-email-err' : undefined
                      }
                      {...signUpForm.register('email')}
                    />
                    {signUpForm.formState.errors.email && (
                      <p id="signup-email-err" className="text-xs font-medium text-violet-700">
                        {t(signUpForm.formState.errors.email.message ?? 'auth.errors.invalidEmail')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password">{t('auth.passwordLabel')}</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder={t('auth.passwordPlaceholder')}
                      aria-invalid={Boolean(signUpForm.formState.errors.password)}
                      aria-describedby={
                        signUpForm.formState.errors.password ? 'signup-password-err' : undefined
                      }
                      {...signUpForm.register('password')}
                    />
                    {signUpForm.formState.errors.password && (
                      <p id="signup-password-err" className="text-xs font-medium text-violet-700">
                        {t(signUpForm.formState.errors.password.message ?? 'auth.errors.passwordMin')}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    loading={signUpForm.formState.isSubmitting}
                  >
                    {t('auth.submitSignUp')}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

