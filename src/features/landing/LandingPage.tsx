import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Gamepad2, Layers, ShieldCheck } from 'lucide-react';
import { AnswerTile } from '@/components/eroot/AnswerTile';
import { ErootLogo } from '@/components/eroot/ErootLogo';
import { LanguageSwitcher } from '@/components/eroot/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/useAuth';
import { useTranslation } from '@/i18n/useTranslation';

export function LandingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');

  function handleQuickJoin(event: FormEvent) {
    event.preventDefault();
    const cleaned = pin.replace(/\D/g, '');
    navigate(cleaned ? `/join?pin=${encodeURIComponent(cleaned)}` : '/join');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Eroot home">
            <ErootLogo size="md" />
          </Link>
          <nav aria-label="Top actions" className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Button asChild variant="outline" size="sm">
              <Link to="/join">{t('nav.joinGame')}</Link>
            </Button>
            <Button asChild size="sm">
              <Link to={user ? '/library' : '/auth'}>
                {user ? t('nav.library') : t('nav.hostSignIn')}
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="eroot-stage-bg text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
            <div className="space-y-6">
              <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
                {t('landing.heroTitle')}
              </h1>
              <p className="max-w-xl text-base text-indigo-100 sm:text-lg">
                {t('landing.heroSubtitle')}
              </p>

              <form onSubmit={handleQuickJoin} className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1 max-w-xs">
                  <Label htmlFor="landing-pin" className="sr-only">
                    {t('join.pinPlaceholder')}
                  </Label>
                  <Input
                    id="landing-pin"
                    inputMode="numeric"
                    placeholder={t('join.pinPlaceholder')}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="h-12 bg-white text-base font-bold tracking-widest text-slate-900"
                  />
                </div>
                <Button type="submit" variant="stage" size="lg">
                  {t('landing.joinCta')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </form>

              <div>
                <Link
                  to={user ? '/library' : '/auth'}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-200 hover:text-white underline-offset-4 hover:underline"
                >
                  {t('landing.hostCta')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div
              aria-label="Sample Eroot geometric answer tiles"
              className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm space-y-4"
            >
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-200">
                Sample Question Preview
              </p>
              <p className="text-lg font-bold text-white">
                Which geometric shape pairs with every Eroot option for accessibility?
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AnswerTile index={0} label="Triangle" interactive={false} compact />
                <AnswerTile index={1} label="Diamond" interactive={false} compact />
                <AnswerTile index={2} label="Circle" interactive={false} compact />
                <AnswerTile index={3} label="Square" interactive={false} compact />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-6">
            {t('landing.featureGridTitle')}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Layers className="h-6 w-6 text-indigo-600 mb-2" aria-hidden="true" />
                <CardTitle className="text-lg">{t('landing.featureCreatorTitle')}</CardTitle>
                <CardDescription>{t('landing.featureCreatorDesc')}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
            <Card>
              <CardHeader>
                <Gamepad2 className="h-6 w-6 text-indigo-600 mb-2" aria-hidden="true" />
                <CardTitle className="text-lg">{t('landing.featureLiveTitle')}</CardTitle>
                <CardDescription>{t('landing.featureLiveDesc')}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
            <Card>
              <CardHeader>
                <ShieldCheck className="h-6 w-6 text-indigo-600 mb-2" aria-hidden="true" />
                <CardTitle className="text-lg">{t('landing.featureAccessTitle')}</CardTitle>
                <CardDescription>{t('landing.featureAccessDesc')}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}

