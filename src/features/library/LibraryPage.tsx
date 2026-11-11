import { FolderPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth/useAuth';
import { useTranslation } from '@/i18n/useTranslation';

export function LibraryPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">{t('library.title')}</h1>
        <p className="text-sm text-slate-600">
          {t('library.signedInAs')} <span className="font-medium text-slate-900">{user?.email}</span>
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader className="items-center text-center py-12">
          <div className="mb-3 rounded-full bg-indigo-50 p-3 text-indigo-600">
            <FolderPlus className="h-7 w-7" aria-hidden="true" />
          </div>
          <CardTitle>{t('library.emptyTitle')}</CardTitle>
          <CardDescription className="max-w-md">{t('library.emptyDescription')}</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}

