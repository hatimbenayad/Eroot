import { Link, useSearchParams } from 'react-router-dom';
import { ErootLogo } from '@/components/eroot/ErootLogo';
import { HostStageShell } from '@/components/eroot/HostStageShell';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/i18n/useTranslation';

export function JoinPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialPin = searchParams.get('pin') ?? '';

  return (
    <HostStageShell className="flex flex-col justify-between px-4 py-8">
      <header className="mx-auto flex w-full max-w-md items-center justify-between">
        <Link to="/" aria-label="Eroot home">
          <ErootLogo variant="dark" size="md" />
        </Link>
        <Link to="/auth" className="text-sm font-medium text-indigo-200 hover:text-white">
          {t('nav.hostSignIn')}
        </Link>
      </header>

      <main className="mx-auto my-8 w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{t('join.title')}</CardTitle>
            <CardDescription>{t('join.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="join-pin">{t('join.pinPlaceholder')}</Label>
              <Input
                id="join-pin"
                inputMode="numeric"
                defaultValue={initialPin}
                placeholder="1234567"
                className="h-12 text-center text-lg font-bold tracking-widest"
              />
            </div>

            <Alert variant="info">{t('join.comingInU4')}</Alert>

            <Button asChild variant="outline" className="w-full">
              <Link to="/">{t('common.backHome')}</Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="text-center text-xs text-indigo-200/80">
        {t('common.appName')} — {t('common.tagline')}
      </footer>
    </HostStageShell>
  );
}

