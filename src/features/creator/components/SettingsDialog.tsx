import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/i18n/useTranslation';
import {
  MUSIC_PRESETS,
  quizSettingsSchema,
  type MusicPreset,
  type QuizDraft,
  type QuizSettingsValues,
} from '@shared/schemas/slide';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quiz: QuizDraft;
  onApplySettings: (patch: Partial<QuizDraft>) => void;
  onUploadCover: (file: File) => Promise<string>;
}

const MUSIC_LABELS: Record<MusicPreset, string> = {
  'chill-pulse': 'Chill Pulse (Default)',
  'arcade-focus': 'Arcade Focus',
  'bright-synth': 'Bright Synth',
  silent: 'Silent',
};

export function SettingsDialog({
  open,
  onOpenChange,
  quiz,
  onApplySettings,
  onUploadCover,
}: SettingsDialogProps) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(quiz.coverImageUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const form = useForm<QuizSettingsValues>({
    resolver: zodResolver(quizSettingsSchema),
    defaultValues: {
      title: quiz.title,
      description: quiz.description,
      visibility: quiz.visibility,
      coverImageUrl: quiz.coverImageUrl,
      language: 'en',
      musicPreset: quiz.musicPreset,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: quiz.title,
        description: quiz.description,
        visibility: quiz.visibility,
        coverImageUrl: quiz.coverImageUrl,
        language: 'en',
        musicPreset: quiz.musicPreset,
      });
      setCoverUrl(quiz.coverImageUrl);
      setUploadError(null);
    }
  }, [open, quiz, form]);

  async function handleCoverSelect(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await onUploadCover(file);
      setCoverUrl(url);
      form.setValue('coverImageUrl', url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Cover upload failed.');
    } finally {
      setUploading(false);
    }
  }

  function handleSave(values: QuizSettingsValues) {
    onApplySettings({
      title: values.title,
      description: values.description,
      visibility: values.visibility,
      coverImageUrl: coverUrl,
      language: values.language,
      musicPreset: values.musicPreset,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('creator.settingsModal.title')}</DialogTitle>
          <DialogDescription>{t('creator.settingsModal.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSave)} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="settings-title">{t('creator.settingsModal.quizTitle')}</Label>
            <Input id="settings-title" {...form.register('title')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-desc">{t('creator.settingsModal.quizDescription')}</Label>
            <textarea
              id="settings-desc"
              rows={3}
              {...form.register('description')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="settings-visibility">{t('creator.settingsModal.visibility')}</Label>
              <select
                id="settings-visibility"
                {...form.register('visibility')}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="private">{t('creator.settingsModal.visibilityPrivate')}</option>
                <option value="link">{t('creator.settingsModal.visibilityLink')}</option>
                <option value="public">{t('creator.settingsModal.visibilityPublic')}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="settings-music">{t('creator.settingsModal.musicPreset')}</Label>
              <select
                id="settings-music"
                {...form.register('musicPreset')}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                {MUSIC_PRESETS.map((preset) => (
                  <option key={preset} value={preset}>
                    {MUSIC_LABELS[preset]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t('creator.settingsModal.coverImage')}</Label>
            <div className="flex items-center gap-3">
              {coverUrl && (
                <img
                  src={coverUrl}
                  alt="Quiz cover"
                  className="h-14 w-20 rounded-lg border object-cover"
                />
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => void handleCoverSelect(e.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Upload cover
              </Button>
              {coverUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCoverUrl(null);
                    form.setValue('coverImageUrl', null);
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
            {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

