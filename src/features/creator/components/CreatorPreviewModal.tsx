import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { AnswerTile } from '@/components/eroot/AnswerTile';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import { getErootTheme } from '@shared/constants/themes';
import { sanitizeSlideForPlayer } from '@shared/schemas/sanitizer';
import {
  isMediaSlideType,
  isOpinionSlideType,
  type PuzzleContent,
  type QuizContent,
  type SlideDraft,
  type SliderContent,
  type TypeAnswerContent,
} from '@shared/schemas/slide';

interface CreatorPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizTitle: string;
  themeId: string;
  slides: SlideDraft[];
  initialIndex?: number;
}

export function CreatorPreviewModal({
  open,
  onOpenChange,
  quizTitle,
  themeId,
  slides,
  initialIndex = 0,
}: CreatorPreviewModalProps) {
  const [index, setIndex] = useState(initialIndex);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (open) {
      setIndex(Math.min(initialIndex, Math.max(0, slides.length - 1)));
      setRevealed(false);
    }
  }, [open, initialIndex, slides.length]);

  const slide = slides[index];
  const theme = getErootTheme(themeId);

  if (!slide) return null;

  const sanitized = sanitizeSlideForPlayer(slide);
  const isMedia = isMediaSlideType(slide.type);
  const isOpinion = isOpinionSlideType(slide.type);
  const quizCorrectIds =
    slide.type === 'quiz' || slide.type === 'true_false'
      ? new Set(
          (slide.content as QuizContent).options.filter((o) => o.isCorrect).map((o) => o.id)
        )
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className={cn('p-6 sm:p-8', theme.stageClass, theme.textClass)}>
          <DialogHeader className="mb-4">
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className={theme.textClass}>
                {quizTitle || 'Untitled quiz'} — Preview
              </DialogTitle>
              <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-semibold text-white">
                Slide {index + 1} / {slides.length} · {slide.timeLimit}s
              </span>
            </div>
            <DialogDescription className={theme.subtextClass}>
              Simulated host presentation view (no live game or report is created).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 text-center text-slate-900 shadow-lg">
              <h3 className="font-display text-xl font-bold sm:text-2xl">
                {slide.title.trim() || 'Untitled question'}
              </h3>
              {sanitized.subtitle && (
                <p className="mt-2 text-base text-slate-600">{sanitized.subtitle}</p>
              )}
            </div>

            {slide.mediaUrl && (
              <div className="flex justify-center">
                <img
                  src={slide.mediaUrl}
                  alt="Preview slide visual"
                  className={cn(
                    'max-h-56 rounded-xl bg-white/10 object-contain p-1 transition-all duration-700',
                    slide.mediaReveal && !revealed && 'blur-md scale-95'
                  )}
                />
              </div>
            )}

            {slide.type === 'video' && sanitized.embedUrl && (
              <div className="mx-auto max-w-xl aspect-video overflow-hidden rounded-xl bg-black">
                <iframe
                  src={sanitized.embedUrl}
                  title={slide.title || 'Video preview'}
                  className="h-full w-full"
                  allowFullScreen
                />
              </div>
            )}

            {(slide.type === 'classic' || slide.type === 'title_text') && (
              <div className="rounded-2xl bg-white/95 p-6 text-center text-slate-800 shadow-md">
                <p className="whitespace-pre-line text-base leading-relaxed">
                  {sanitized.body || 'Slide body text...'}
                </p>
              </div>
            )}

            {slide.type === 'bullet_points' && (
              <ul className="mx-auto max-w-xl list-disc space-y-2 rounded-2xl bg-white/95 p-6 pl-10 text-left text-slate-800 shadow-md">
                {(sanitized.bullets ?? []).map((b, i) => (
                  <li key={i} className="text-base font-medium">
                    {b}
                  </li>
                ))}
              </ul>
            )}

            {slide.type === 'quote' && (
              <blockquote className="rounded-2xl bg-white/95 p-6 text-center text-slate-900 shadow-md space-y-2">
                <p className="text-xl italic font-semibold">&ldquo;{sanitized.quote}&rdquo;</p>
                {sanitized.author && (
                  <footer className="text-sm font-medium text-slate-600">
                    — {sanitized.author}
                  </footer>
                )}
              </blockquote>
            )}

            {(slide.type === 'quiz' || slide.type === 'true_false' || slide.type === 'poll') && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {sanitized.options.map((opt, optIdx) => (
                  <AnswerTile
                    key={opt.id}
                    index={optIdx}
                    label={opt.text || `Answer ${optIdx + 1}`}
                    imageUrl={opt.imageUrl}
                    interactive={false}
                    revealed={revealed && quizCorrectIds !== null}
                    isCorrect={quizCorrectIds ? quizCorrectIds.has(opt.id) : undefined}
                  />
                ))}
              </div>
            )}

            {slide.type === 'type_answer' && (
              <div className="rounded-2xl bg-white/95 p-6 text-center text-slate-900 shadow-md">
                {revealed ? (
                  <p className="text-sm font-bold text-emerald-700">
                    Accepted:{' '}
                    {(slide.content as TypeAnswerContent).acceptedAnswers
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                ) : (
                  <p className="text-sm text-slate-600">Players type a short answer (max 20 chars).</p>
                )}
              </div>
            )}

            {slide.type === 'slider' && (
              <div className="rounded-2xl bg-white/95 p-6 text-center text-slate-900 shadow-md">
                <p className="text-sm font-semibold">
                  Range: {sanitized.sliderConfig?.min} – {sanitized.sliderConfig?.max}{' '}
                  {sanitized.sliderConfig?.unit}
                </p>
                {revealed && (
                  <p className="mt-2 text-base font-bold text-emerald-700">
                    Target: {(slide.content as SliderContent).correctValue} (+/-{' '}
                    {(slide.content as SliderContent).tolerance})
                  </p>
                )}
              </div>
            )}

            {slide.type === 'puzzle' && (
              <div className="space-y-2">
                {(revealed
                  ? (slide.content as PuzzleContent).items
                  : sanitized.puzzleItems ?? []
                ).map((it, idx) => (
                  <div
                    key={it.id}
                    className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow"
                  >
                    {idx + 1}. {it.text}
                  </div>
                ))}
              </div>
            )}

            {(slide.type === 'scale' || slide.type === 'nps_scale') && sanitized.scaleConfig && (
              <div className="rounded-2xl bg-white/95 p-6 text-center text-slate-900 shadow-md space-y-2">
                <p className="text-sm font-semibold">
                  Scale {sanitized.scaleConfig.min} to {sanitized.scaleConfig.max}
                </p>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{sanitized.scaleConfig.minLabel}</span>
                  <span>{sanitized.scaleConfig.maxLabel}</span>
                </div>
              </div>
            )}

            {(slide.type === 'word_cloud' || slide.type === 'open_ended') && (
              <div className="rounded-2xl bg-white/95 p-6 text-center text-slate-800 shadow-md">
                <p className="text-sm font-medium">{sanitized.promptHint}</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={index === 0}
                onClick={() => {
                  setIndex((i) => Math.max(0, i - 1));
                  setRevealed(false);
                }}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={index >= slides.length - 1}
                onClick={() => {
                  setIndex((i) => Math.min(slides.length - 1, i + 1));
                  setRevealed(false);
                }}
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            {!isMedia && !isOpinion && (
              <Button
                type="button"
                variant="stage"
                size="sm"
                onClick={() => setRevealed((r) => !r)}
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                {revealed ? 'Hide answer' : 'Reveal answer'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
