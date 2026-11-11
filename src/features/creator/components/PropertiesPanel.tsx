import { useState } from 'react';
import { Copy, HelpCircle, Palette, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/i18n/useTranslation';
import { cn } from '@/lib/cn';
import { EROOT_THEMES } from '@shared/constants/themes';
import {
  TIME_LIMITS,
  type PointsMode,
  type SlideDraft,
  type SlideType,
  type TimeLimit,
} from '@shared/schemas/slide';

interface PropertiesPanelProps {
  slide: SlideDraft;
  totalSlides: number;
  selectedThemeId: string;
  onChangeType: (nextType: SlideType) => void;
  onChangeTimeLimit: (limit: TimeLimit) => void;
  onApplyTimeLimitToAll: (limit: TimeLimit) => void;
  onChangePointsMode: (mode: PointsMode) => void;
  onSelectTheme: (themeId: string) => void;
  onDuplicateSlide: () => void;
  onDeleteSlide: () => void;
}

export function PropertiesPanel({
  slide,
  totalSlides,
  selectedThemeId,
  onChangeType,
  onChangeTimeLimit,
  onApplyTimeLimitToAll,
  onChangePointsMode,
  onSelectTheme,
  onDuplicateSlide,
  onDeleteSlide,
}: PropertiesPanelProps) {
  const { t } = useTranslation();
  const [helpOpen, setHelpOpen] = useState(false);

  const isOpinionOrMedia = slide.type === 'poll' || slide.type === 'classic';

  return (
    <aside
      aria-label="Question properties and themes"
      className="flex w-72 shrink-0 flex-col border-l border-slate-200 bg-white p-4"
    >
      <Tabs defaultValue="properties" className="flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-2">
          <TabsList className="grid flex-1 grid-cols-2">
            <TabsTrigger value="properties" className="gap-1.5 text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              {t('creator.propertiesTab')}
            </TabsTrigger>
            <TabsTrigger value="themes" className="gap-1.5 text-xs">
              <Palette className="h-3.5 w-3.5" aria-hidden="true" />
              {t('creator.themesTab')}
            </TabsTrigger>
          </TabsList>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={t('creator.help')}
            onClick={() => setHelpOpen(true)}
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <TabsContent value="properties" className="flex flex-1 flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="prop-slide-type">{t('creator.properties.questionType')}</Label>
              <select
                id="prop-slide-type"
                value={slide.type}
                onChange={(e) => onChangeType(e.target.value as SlideType)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
              >
                <option value="quiz">Quiz</option>
                <option value="true_false">True or false</option>
                <option value="poll">Poll</option>
                <option value="classic">Classic slide</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prop-time-limit">{t('creator.properties.timeLimit')}</Label>
              <select
                id="prop-time-limit"
                value={slide.timeLimit}
                onChange={(e) => onChangeTimeLimit(Number(e.target.value) as TimeLimit)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
              >
                {TIME_LIMITS.map((limit) => (
                  <option key={limit} value={limit}>
                    {limit} seconds
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onApplyTimeLimitToAll(slide.timeLimit)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                {t('creator.properties.applyToAll')}
              </button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prop-answer-options">{t('creator.properties.answerOptions')}</Label>
              <select
                id="prop-answer-options"
                value={slide.selectMode}
                disabled
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
              >
                <option value="single">{t('creator.properties.singleSelect')}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prop-points-mode">{t('creator.properties.points')}</Label>
              <select
                id="prop-points-mode"
                value={isOpinionOrMedia ? 'none' : slide.pointsMode}
                disabled={isOpinionOrMedia}
                onChange={(e) => onChangePointsMode(e.target.value as PointsMode)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="standard">{t('creator.properties.standardPoints')}</option>
                <option value="double">{t('creator.properties.doublePoints')}</option>
                <option value="none">{t('creator.properties.noPoints')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onDuplicateSlide}>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              {t('common.duplicate')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={totalSlides <= 1}
              onClick={onDeleteSlide}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t('common.delete')}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="themes" className="space-y-3 overflow-y-auto">
          <p className="text-xs text-slate-600">Select an original theme for this quiz.</p>
          <div className="grid grid-cols-2 gap-2.5">
            {EROOT_THEMES.map((theme) => {
              const active = theme.id === selectedThemeId;
              return (
                <button
                  key={theme.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectTheme(theme.id)}
                  className={cn(
                    'flex flex-col overflow-hidden rounded-xl border text-left transition-all',
                    active
                      ? 'border-indigo-600 ring-2 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div className={cn('h-12 w-full', theme.canvasBackdropClass)} />
                  <span className="px-2 py-1.5 text-xs font-semibold text-slate-800">
                    {theme.name}
                  </span>
                </button>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('creator.helpModal.title')}</DialogTitle>
            <DialogDescription>{t('creator.helpModal.body')}</DialogDescription>
          </DialogHeader>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
            <li>Drag slide handles or use Move Up / Move Down buttons to reorder slides.</li>
            <li>Standard scoring awards up to 1000 pts based on speed; Double awards up to 2000 pts.</li>
            <li>Polls and Classic media slides award 0 points automatically.</li>
          </ul>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

