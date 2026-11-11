import { Eye, LogOut, Play, Save, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErootLogo } from '@/components/eroot/ErootLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/i18n/useTranslation';
import type { SaveStatus } from '../store';

interface CreatorTopBarProps {
  title: string;
  saveStatus: SaveStatus;
  canHost?: boolean;
  onTitleChange: (title: string) => void;
  onOpenSettings: () => void;
  onOpenPreview: () => void;
  onSavePublish: () => void;
  onHostGame?: () => void;
  onRetrySave: () => void;
  onBeforeExit?: () => Promise<void> | void;
}

export function CreatorTopBar({
  title,
  saveStatus,
  canHost = false,
  onTitleChange,
  onOpenSettings,
  onOpenPreview,
  onSavePublish,
  onHostGame,
  onRetrySave,
}: CreatorTopBarProps) {
  const { t } = useTranslation();

  const statusText = {
    saved: t('creator.saveStatus.saved'),
    saving: t('creator.saveStatus.saving'),
    dirty: t('creator.saveStatus.dirty'),
    error: t('creator.saveStatus.error'),
  }[saveStatus];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Link to="/library" aria-label="Back to library" className="shrink-0">
          <ErootLogo size="sm" />
        </Link>

        <div className="w-full max-w-xs">
          <label htmlFor="quiz-title-input" className="sr-only">
            {t('creator.settingsModal.quizTitle')}
          </label>
          <Input
            id="quiz-title-input"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={t('creator.titlePlaceholder')}
            className="h-9 font-semibold"
          />
        </div>

        <Button type="button" variant="outline" size="sm" onClick={onOpenSettings}>
          <Settings className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t('creator.settings')}</span>
        </Button>

        <div className="hidden md:flex items-center text-xs font-medium text-slate-600">
          {saveStatus === 'error' ? (
            <button
              type="button"
              onClick={onRetrySave}
              className="text-red-600 underline hover:text-red-700"
            >
              {statusText}
            </button>
          ) : (
            <span data-testid="autosave-status">{statusText}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onOpenPreview}>
          <Eye className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t('creator.preview')}</span>
        </Button>

        <Button asChild variant="ghost" size="sm">
          <Link to="/library">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t('creator.exit')}</span>
          </Link>
        </Button>

        <Button type="button" size="sm" onClick={onSavePublish}>
          <Save className="h-4 w-4" aria-hidden="true" />
          {t('creator.save')}
        </Button>

        {onHostGame && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!canHost}
            onClick={onHostGame}
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Host
          </Button>
        )}
      </div>
    </header>
  );
}

