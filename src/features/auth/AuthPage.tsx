import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ErootLogo } from '@/components/eroot/ErootLogo';
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
  const { user, isConfigured, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = sanitizeRedirect(searchParams.get('redirect'));

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);

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
          <Link
            to="/join"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline"
          >
            {t('nav.joinGame')}
          </Link>
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

