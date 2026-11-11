import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/i18n/useTranslation';

export function ReportsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">{t('reports.title')}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.title')}</CardTitle>
          <CardDescription>{t('reports.subtitle')}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

